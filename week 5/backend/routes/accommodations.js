const express = require('express');
const Accommodation = require('../models/Accommodation');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/accommodations?destination=<id>   - Public
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.destination) filter.destination = req.query.destination;
    if (req.query.type) filter.type = req.query.type;
    const accommodations = await Accommodation.find(filter).sort({ rating: -1 }).lean();
    res.json({ accommodations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load accommodations.' });
  }
});

// GET /api/accommodations/mine  - Provider-only
router.get('/mine', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const accommodations = await Accommodation.find({ provider: req.userId })
      .populate('destination')
      .sort({ createdAt: -1 });
    res.json({ accommodations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load your services.' });
  }
});

// GET /api/accommodations/:id
router.get('/:id', async (req, res) => {
  try {
    const accommodation = await Accommodation.findById(req.params.id).populate('destination');
    if (!accommodation) return res.status(404).json({ message: 'Accommodation not found.' });
    res.json({ accommodation });
  } catch (err) {
    res.status(400).json({ message: 'Invalid accommodation id.' });
  }
});

function normalizeRooms(rooms) {
  if (!Array.isArray(rooms)) return [];
  return rooms
    .map((r) => ({
      name: String(r.name || r.type || 'Room').trim(),
      type: ['single', 'double', 'family', 'suite', 'dorm'].includes(r.type) ? r.type : 'double',
      capacity: Math.max(1, Number(r.capacity) || 2),
      quantity: Math.max(0, Number(r.quantity) || 0),
      pricePerNight: Math.max(0, Number(r.pricePerNight) || 0),
      description: String(r.description || '')
    }))
    .filter((r) => r.quantity > 0 && r.pricePerNight >= 0);
}

// POST /api/accommodations  - Provider-only: create
router.post('/', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const { destination, name, pricePerNight, amenities, type, location, bookingMode, rooms, totalRooms, maxGuests, propertyNote } = req.body;
    if (!destination || !name || pricePerNight === undefined || pricePerNight === null) {
      return res.status(400).json({ message: 'Destination, name and price per night are required.' });
    }
    const price = Number(pricePerNight);
    if (Number.isNaN(price) || price < 0) {
      return res.status(400).json({ message: 'Price per night must be a valid non-negative number.' });
    }
    const mode = bookingMode === 'whole-property' ? 'whole-property' : 'per-room';
    const normalizedRooms = normalizeRooms(rooms);
    const computedTotal =
      totalRooms != null
        ? Number(totalRooms)
        : normalizedRooms.reduce((s, r) => s + (r.quantity || 0), 0) || 1;
    const accommodation = await Accommodation.create({
      destination,
      provider: req.userId,
      name: String(name).trim(),
      location: (location || '').trim(),
      type: type || 'Accommodation',
      bookingMode: mode,
      pricePerNight: price,
      rooms: normalizedRooms,
      totalRooms: Math.max(1, computedTotal || 1),
      maxGuests: Math.max(1, Number(maxGuests) || 4),
      propertyNote: String(propertyNote || ''),
      amenities: Array.isArray(amenities) ? amenities : [],
      status: 'Pending review'
    });
    res.status(201).json({ accommodation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create the service.' });
  }
});

// PATCH /api/accommodations/:id  - Provider-only: update (CRUD)
router.patch('/:id', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const accommodation = await Accommodation.findOne({ _id: req.params.id, provider: req.userId });
    if (!accommodation) return res.status(404).json({ message: 'Service not found or not owned by you.' });

    const { name, pricePerNight, amenities, type, location, status, destination, bookingMode, rooms, totalRooms, maxGuests, propertyNote } = req.body;
    if (name !== undefined) accommodation.name = String(name).trim();
    if (location !== undefined) accommodation.location = String(location).trim();
    if (type !== undefined) accommodation.type = type;
    if (destination !== undefined) accommodation.destination = destination;
    if (amenities !== undefined) accommodation.amenities = Array.isArray(amenities) ? amenities : [];
    if (bookingMode !== undefined) {
      accommodation.bookingMode = bookingMode === 'whole-property' ? 'whole-property' : 'per-room';
    }
    if (rooms !== undefined) {
      accommodation.rooms = normalizeRooms(rooms);
      if (totalRooms === undefined) {
        accommodation.totalRooms = Math.max(1, accommodation.rooms.reduce((s, r) => s + (r.quantity || 0), 0) || 1);
      }
    }
    if (totalRooms !== undefined) accommodation.totalRooms = Math.max(1, Number(totalRooms) || 1);
    if (maxGuests !== undefined) accommodation.maxGuests = Math.max(1, Number(maxGuests) || 1);
    if (propertyNote !== undefined) accommodation.propertyNote = String(propertyNote || '');
    if (pricePerNight !== undefined) {
      const price = Number(pricePerNight);
      if (Number.isNaN(price) || price < 0) {
        return res.status(400).json({ message: 'Price per night must be a valid non-negative number.' });
      }
      accommodation.pricePerNight = price;
    }
    if (status !== undefined) {
      if (!['Verified', 'Pending review'].includes(status)) {
        return res.status(400).json({ message: 'Status must be Verified or Pending review.' });
      }
      accommodation.status = status;
    }

    await accommodation.save();
    const populated = await accommodation.populate('destination');
    res.json({ accommodation: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update the service.' });
  }
});

// DELETE /api/accommodations/:id  - Provider-only: delete (CRUD)
router.delete('/:id', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const accommodation = await Accommodation.findOneAndDelete({
      _id: req.params.id,
      provider: req.userId
    });
    if (!accommodation) return res.status(404).json({ message: 'Service not found or not owned by you.' });
    res.json({ message: 'Service deleted.', id: accommodation._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not delete the service.' });
  }
});

module.exports = router;
