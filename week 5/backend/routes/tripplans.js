const express = require('express');
const TripPlan = require('../models/TripPlan');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/tripplans - save itinerary
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      travelers,
      budget,
      style,
      days,
      budgetBreakdown
    } = req.body;

    if (!destination) {
      return res.status(400).json({ message: 'Destination is required.' });
    }

    const plan = await TripPlan.create({
      user: req.userId,
      destination: String(destination).trim(),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      travelers: travelers || 1,
      budget: budget || 0,
      style: style || 'Nature',
      days: Array.isArray(days) ? days : [],
      budgetBreakdown: budgetBreakdown || {},
      status: 'Planning'
    });

    res.status(201).json({ plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not save the trip plan.' });
  }
});

// GET /api/tripplans/mine
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const plans = await TripPlan.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json({ plans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load trip plans.' });
  }
});

// GET /api/tripplans/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const plan = await TripPlan.findOne({ _id: req.params.id, user: req.userId });
    if (!plan) return res.status(404).json({ message: 'Trip plan not found.' });
    res.json({ plan });
  } catch (err) {
    res.status(400).json({ message: 'Invalid trip plan id.' });
  }
});

// PATCH /api/tripplans/:id - update status / details
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const plan = await TripPlan.findOne({ _id: req.params.id, user: req.userId });
    if (!plan) return res.status(404).json({ message: 'Trip plan not found.' });

    const { destination, startDate, endDate, travelers, budget, style, days, budgetBreakdown, status } = req.body;
    if (destination !== undefined) plan.destination = String(destination).trim();
    if (startDate !== undefined) plan.startDate = startDate ? new Date(startDate) : undefined;
    if (endDate !== undefined) plan.endDate = endDate ? new Date(endDate) : undefined;
    if (travelers !== undefined) plan.travelers = travelers;
    if (budget !== undefined) plan.budget = budget;
    if (style !== undefined) plan.style = style;
    if (days !== undefined) plan.days = Array.isArray(days) ? days : plan.days;
    if (budgetBreakdown !== undefined) plan.budgetBreakdown = budgetBreakdown;
    if (status !== undefined) {
      if (!['Planning', 'Confirmed', 'Completed'].includes(status)) {
        return res.status(400).json({ message: 'Status must be Planning, Confirmed or Completed.' });
      }
      plan.status = status;
    }

    await plan.save();
    res.json({ plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update the trip plan.' });
  }
});

// DELETE /api/tripplans/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const plan = await TripPlan.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!plan) return res.status(404).json({ message: 'Trip plan not found.' });
    res.json({ message: 'Trip plan deleted.', id: plan._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not delete the trip plan.' });
  }
});

module.exports = router;
