const express = require('express');
const router = express.Router();
const db = require('../models/database');

// Add an asset to a user's watchlist
router.post('/:userId/watchlist/:assetId', (req, res) => {
  try {
    const { userId, assetId } = req.params;

    if (!db.getUserById(userId)) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!db.getAssetById(assetId)) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    if (db.isInWatchlist(userId, assetId)) {
      return res.status(409).json({ error: 'Asset is already in the watchlist' });
    }

    db.addToWatchlist(userId, assetId);
    res.status(201).json({ assets: db.getWatchlist(userId) });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    res.status(500).json({ error: 'Failed to add asset to watchlist' });
  }
});

// Remove an asset from a user's watchlist
router.delete('/:userId/watchlist/:assetId', (req, res) => {
  try {
    const { userId, assetId } = req.params;

    if (!db.getUserById(userId)) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!db.getAssetById(assetId)) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const removed = db.removeFromWatchlist(userId, assetId);
    if (!removed) {
      return res.status(404).json({ error: 'Asset is not in the watchlist' });
    }

    res.json({ assets: db.getWatchlist(userId) });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    res.status(500).json({ error: 'Failed to remove asset from watchlist' });
  }
});

// Get a user's watchlist
router.get('/:userId/watchlist', (req, res) => {
  try {
    const { userId } = req.params;

    if (!db.getUserById(userId)) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ assets: db.getWatchlist(userId) });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

module.exports = router;
