const express = require('express');
const Booking = require('../models/Booking');
const Accommodation = require('../models/Accommodation');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

function calcNights(checkIn, checkOut) {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  return Math.max(1, Math.round((outDate - inDate) / (1000 * 60 * 60 * 24)));
}

function resolveRoomPricing(accommodation, { roomType, roomsBooked, bookingWhole, singleCount, doubleCount }) {
  const mode = accommodation.bookingMode || 'per-room';
  if (mode === 'whole-property' || bookingWhole) {
    const parts = (accommodation.rooms || []).map((r) => `${r.quantity}× ${r.name || r.type}`);
    return {
      bookingMode: 'whole-property',
      roomsBooked: accommodation.totalRooms || 1,
      singleCount: 0,
      doubleCount: 0,
      roomType: 'whole',
      roomLabel: parts.length ? parts.join(', ') : 'Entire property',
      pricePerNight: accommodation.pricePerNight
    };
  }

  const rooms = accommodation.rooms || [];
  const single = rooms.find((r) => r.type === 'single');
  const dbl = rooms.find((r) => r.type === 'double');
  let sQty = Math.min(Math.max(0, Number(singleCount) || 0), single ? single.quantity || 0 : 0);
  let dQty = Math.min(Math.max(0, Number(doubleCount) || 0), dbl ? dbl.quantity || 0 : 0);

  // fallback if client sent only roomType/roomsBooked
  if (sQty + dQty < 1) {
    if (roomType === 'single' && single) sQty = Math.min(Math.max(1, Number(roomsBooked) || 1), single.quantity || 1);
    else if (dbl) dQty = Math.min(Math.max(1, Number(roomsBooked) || 1), dbl.quantity || 1);
    else if (single) sQty = Math.min(Math.max(1, Number(roomsBooked) || 1), single.quantity || 1);
  }

  const sPrice = single ? single.pricePerNight * sQty : 0;
  const dPrice = dbl ? dbl.pricePerNight * dQty : 0;
  const labelParts = [];
  if (sQty) labelParts.push(`${sQty}× Single`);
  if (dQty) labelParts.push(`${dQty}× Double`);

  return {
    bookingMode: 'per-room',
    roomsBooked: sQty + dQty,
    singleCount: sQty,
    doubleCount: dQty,
    roomType: dQty && sQty ? 'mixed' : dQty ? 'double' : 'single',
    roomLabel: labelParts.join(' + ') || 'Room',
    pricePerNight: sPrice + dPrice
  };
}

// POST /api/bookings
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      accommodationId,
      checkIn,
      checkOut,
      guests,
      roomType,
      roomsBooked,
      singleCount,
      doubleCount,
      bookingWhole,
      paymentMethod,
      transactionId
    } = req.body;

    if (!accommodationId || !checkIn || !checkOut) {
      return res.status(400).json({ message: 'Accommodation, check-in and check-out dates are required.' });
    }
    const accommodation = await Accommodation.findById(accommodationId);
    if (!accommodation) return res.status(404).json({ message: 'Accommodation not found.' });

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (Number.isNaN(inDate.getTime()) || Number.isNaN(outDate.getTime())) {
      return res.status(400).json({ message: 'Invalid check-in or check-out date.' });
    }
    if (outDate <= inDate) {
      return res.status(400).json({ message: 'Check-out must be after check-in.' });
    }

    const nights = calcNights(checkIn, checkOut);
    const pricing = resolveRoomPricing(accommodation, { roomType, roomsBooked, bookingWhole, singleCount, doubleCount });
    const roomNightsTotal = pricing.pricePerNight * nights;
    const serviceFee = Math.round(roomNightsTotal * 0.045);
    const totalAmount = roomNightsTotal + serviceFee;

    // Dummy payment verification: accept if transactionId looks valid (6+ chars)
    const method = ['bKash', 'Nagad', 'Card'].includes(paymentMethod) ? paymentMethod : 'None';
    let paymentStatus = 'Pending';
    let txn = (transactionId || '').trim();
    if (method !== 'None') {
      if (txn.length >= 6) {
        paymentStatus = 'Verified';
      } else {
        return res.status(400).json({
          message: 'Invalid transaction ID. Enter the 6+ character ID from your payment app (demo: BKASH123456).'
        });
      }
    }

    const booking = await Booking.create({
      traveler: req.userId,
      accommodation: accommodation._id,
      checkIn: inDate,
      checkOut: outDate,
      guests: guests || 1,
      nights,
      roomsBooked: pricing.roomsBooked,
      singleCount: pricing.singleCount || 0,
      doubleCount: pricing.doubleCount || 0,
      roomType: pricing.roomType,
      roomLabel: pricing.roomLabel,
      bookingMode: pricing.bookingMode,
      pricePerNight: pricing.pricePerNight,
      serviceFee,
      totalAmount,
      status: paymentStatus === 'Verified' ? 'Confirmed' : 'Pending',
      payment: {
        method,
        status: paymentStatus,
        transactionId: txn,
        paidAt: paymentStatus === 'Verified' ? new Date() : undefined
      }
    });

    const populated = await booking.populate({ path: 'accommodation', populate: { path: 'destination' } });
    res.status(201).json({ booking: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create the booking.' });
  }
});

// POST /api/bookings/verify-payment — dummy verification helper
router.post('/verify-payment', requireAuth, async (req, res) => {
  try {
    const { method, transactionId, amount } = req.body;
    const txn = (transactionId || '').trim().toUpperCase();
    if (!method || !['bKash', 'Nagad', 'Card'].includes(method)) {
      return res.status(400).json({ message: 'Select a payment method: bKash, Nagad or Card.' });
    }
    if (txn.length < 6) {
      return res.status(400).json({
        verified: false,
        message: 'Transaction ID must be at least 6 characters. Demo examples: BKASH123456, NAGAD987654, CARD456789'
      });
    }
    // Dummy rule: reject IDs ending with 000 as "failed"
    if (txn.endsWith('000')) {
      return res.json({
        verified: false,
        message: 'Payment not found for this transaction ID. Please try again.'
      });
    }
    res.json({
      verified: true,
      message: 'Payment verified successfully (demo).',
      receipt: {
        method,
        transactionId: txn,
        amount: amount || 0,
        verifiedAt: new Date().toISOString(),
        reference: 'DV-' + txn.slice(-6)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Verification service unavailable.' });
  }
});

router.get('/mine', requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ traveler: req.userId })
      .populate({ path: 'accommodation', populate: { path: 'destination' } })
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load bookings.' });
  }
});

router.get('/provider', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const myAccommodations = await Accommodation.find({ provider: req.userId }).select('_id');
    const ids = myAccommodations.map((a) => a._id);
    const bookings = await Booking.find({ accommodation: { $in: ids } })
      .populate('accommodation')
      .populate('traveler', 'name email')
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load provider bookings.' });
  }
});

router.patch('/:id/status', requireAuth, requireRole('provider'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Confirmed', 'Cancelled', 'Pending'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Pending, Confirmed or Cancelled.' });
    }
    const booking = await Booking.findById(req.params.id).populate('accommodation');
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (String(booking.accommodation.provider) !== req.userId) {
      return res.status(403).json({ message: 'This booking does not belong to one of your services.' });
    }
    booking.status = status;
    await booking.save();
    res.json({ booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update the booking.' });
  }
});

router.patch('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (String(booking.traveler) !== req.userId) {
      return res.status(403).json({ message: 'You can only cancel your own bookings.' });
    }
    if (booking.status === 'Cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled.' });
    }
    booking.status = 'Cancelled';
    await booking.save();
    const populated = await booking.populate({ path: 'accommodation', populate: { path: 'destination' } });
    res.json({ booking: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not cancel the booking.' });
  }
});

module.exports = router;
