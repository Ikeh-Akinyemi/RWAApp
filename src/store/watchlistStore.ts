import { create } from 'zustand';
import { Asset } from '@/types';

// No auth in scope yet — stand in for the logged-in user, matches the
// seeded backend user (see src/server/models/database.js initializeUsers).
const CURRENT_USER_ID = 'user1';

interface WatchlistState {
  assetIds: Set<string>;
  isLoading: boolean;
  error: string | null;
  fetchWatchlist: () => Promise<void>;
  isFavorite: (assetId: string) => boolean;
  toggleFavorite: (assetId: string) => Promise<void>;
}

const applyWatchlistResponse = (assets: Asset[]) => new Set(assets.map((asset) => asset.id));

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  assetIds: new Set(),
  isLoading: false,
  error: null,

  fetchWatchlist: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/users/${CURRENT_USER_ID}/watchlist`);
      if (!response.ok) throw new Error('Failed to load watchlist');
      const data = await response.json();
      set({ assetIds: applyWatchlistResponse(data.assets) });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  isFavorite: (assetId) => get().assetIds.has(assetId),

  toggleFavorite: async (assetId) => {
    const wasFavorited = get().assetIds.has(assetId);

    // Optimistic update so the UI feels instant; reverted below on failure.
    set((state) => {
      const next = new Set(state.assetIds);
      wasFavorited ? next.delete(assetId) : next.add(assetId);
      return { assetIds: next, error: null };
    });

    try {
      const response = await fetch(`/api/users/${CURRENT_USER_ID}/watchlist/${assetId}`, {
        method: wasFavorited ? 'DELETE' : 'POST',
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to update watchlist');
      }
      const data = await response.json();
      set({ assetIds: applyWatchlistResponse(data.assets) });
    } catch (error) {
      set((state) => {
        const reverted = new Set(state.assetIds);
        wasFavorited ? reverted.add(assetId) : reverted.delete(assetId);
        return { assetIds: reverted, error: (error as Error).message };
      });
    }
  },
}));
