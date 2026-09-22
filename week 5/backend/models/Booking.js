const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    traveler: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accommodation: { type: mongoose.Schema.Types.ObjectId, ref: 'Accommodation', required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, default: 1 },
    nights: { type: Number, required: true },
    roomsBooked: { type: Number, default: 1 },
    singleCount: { type: Number, default: 0 },
    doubleCount: { type: Number, default: 0 },
    roomType: { type: String, default: 'double' },
    roomLabel: { type: String, default: '' },
    bookingMode: { type: String, enum: ['per-room', 'whole-property'], default: 'per-room' },
    pricePerNight: { type: Number, required: true },
    serviceFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Pending' },
    payment: {
      method: { type: String, enum: ['bKash', 'Nagad', 'Card', 'None'], default: 'None' },
      status: { type: String, enum: ['Pending', 'Verified', 'Failed'], default: 'Pending' },
      transactionId: { type: String, default: '' },
      paidAt: { type: Date }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
