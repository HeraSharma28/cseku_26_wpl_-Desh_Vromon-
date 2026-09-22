const express = require('express');
const Service = require('../models/Service');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/services - public
router.get('/', async (req, res) => {
  try {
    const { type, destination } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (destination) filter.destination = destination;
    const services = await Service.find(filter).populate('provider', 'name').sort({ createdAt: -1 });
    res.json({ services });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load services.' });
  }
});

// GET /api/services/mine - provider's own services
router.get('/mine', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const services = await Service.find({ provider: req.userId }).sort({ createdAt: -1 });
    res.json({ services });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load your services.' });
  }
});

// POST /api/services - provider creates
router.post('/', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const { name, type, price, amenities, location, destination } = req.body;
    if (!name || price === undefined || price === null) {
      return res.status(400).json({ message: 'Name and price are required.' });
    }
    const priceNum = Number(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ message: 'Price must be a valid non-negative number.' });
    }
    const service = await Service.create({
      provider: req.userId,
      name: String(name).trim(),
      type: type || 'accommodation',
      price: priceNum,
      amenities: amenities || [],
      location: location || '',
      destination: destination || undefined
    });
    res.status(201).json({ service });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create the service.' });
  }
});

// PATCH /api/services/:id - provider updates
router.patch('/:id', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, provider: req.userId });
    if (!service) return res.status(404).json({ message: 'Service not found.' });
    const { name, price, amenities, location, status, type, destination } = req.body;
    if (name !== undefined) service.name = String(name).trim();
    if (price !== undefined) {
      const priceNum = Number(price);
      if (Number.isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ message: 'Price must be a valid non-negative number.' });
      }
      service.price = priceNum;
    }
    if (amenities !== undefined) service.amenities = amenities;
    if (location !== undefined) service.location = location;
    if (type !== undefined) service.type = type;
    if (destination !== undefined) service.destination = destination;
    if (status !== undefined) {
      if (!['Verified', 'Pending review'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status.' });
      }
      service.status = status;
    }
    await service.save();
    res.json({ service });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update the service.' });
  }
});

// DELETE /api/services/:id - provider deletes
router.delete('/:id', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const service = await Service.findOneAndDelete({ _id: req.params.id, provider: req.userId });
    if (!service) return res.status(404).json({ message: 'Service not found.' });
    res.json({ message: 'Service deleted.', id: service._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not delete the service.' });
  }
});

module.exports = router;
