const express = require('express');
const Destination = require('../models/Destination');
const User = require('../models/User');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/destinations?type=hill&season=Winter&q=sajek&maxPrice=10000&duration=3-5
router.get('/', optionalAuth, async (req, res) => {
  try {
    const filter = {};
    const { type, season, q, maxPrice, duration, division } = req.query;

    if (type) {
      const types = String(type).split(',').map((t) => t.trim()).filter(Boolean);
      if (types.length === 1) filter.type = types[0];
      else if (types.length > 1) filter.type = { $in: types };
    }

    if (season) {
      filter.$or = [{ season }, { seasons: season }];
    }

    if (division) filter.division = new RegExp(division, 'i');

    if (maxPrice) {
      const n = Number(maxPrice);
      if (!Number.isNaN(n)) filter.priceFrom = { $lte: n };
    }

    if (duration) {
      // 1-2 | 3-5 | 7+
      if (duration === '1-2') {
        filter.durationMin = { $lte: 2 };
      } else if (duration === '3-5') {
        filter.durationMax = { $gte: 3 };
        filter.durationMin = { $lte: 5 };
      } else if (duration === '7+' || duration === 'week') {
        filter.durationMax = { $gte: 7 };
      }
    }

    if (q && String(q).trim()) {
      const rx = new RegExp(String(q).trim(), 'i');
      filter.$and = (filter.$and || []).concat([
        {
          $or: [
            { name: rx },
            { location: rx },
            { district: rx },
            { division: rx },
            { description: rx }
          ]
        }
      ]);
    }

    const destinations = await Destination.find(filter).sort({ rating: -1 }).lean();

    let favoriteIds = [];
    if (req.userId) {
      const me = await User.findById(req.userId).select('favorites');
      favoriteIds = (me?.favorites || []).map((id) => id.toString());
    }
    const withFavorite = destinations.map((d) => ({
      ...d,
      isFavorite: favoriteIds.includes(d._id.toString())
    }));
    res.json({ destinations: withFavorite, total: withFavorite.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load destinations.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) return res.status(404).json({ message: 'Destination not found.' });
    res.json({ destination });
  } catch (err) {
    res.status(400).json({ message: 'Invalid destination id.' });
  }
});

router.post('/:id/favorite', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const id = req.params.id;
    const already = user.favorites.some((f) => f.toString() === id);
    if (already) {
      user.favorites = user.favorites.filter((f) => f.toString() !== id);
    } else {
      user.favorites.push(id);
    }
    await user.save();
    res.json({ isFavorite: !already });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update favorites.' });
  }
});

module.exports = router;
