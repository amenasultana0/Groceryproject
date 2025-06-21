const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Utility to read the JSON
const seasonalDataPath = path.join(__dirname, '../data/seasonalItems.json');

router.get('/', (req, res) => {
  const region = req.query.region;
  const season = req.query.season;

  if (!region || !season) {
    return res.status(400).json({ error: 'Region and season are required' });
  }

  fs.readFile(seasonalDataPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read seasonalItems.json:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    const items = JSON.parse(data);
    const filtered = items.filter(
      item =>
        item.regionTags.includes(region) &&
        item.seasonTags.includes(season)
    );

    res.json(filtered);
  });
});

module.exports = router;