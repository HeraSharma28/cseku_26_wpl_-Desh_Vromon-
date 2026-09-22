const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['single', 'double', 'family', 'suite', 'dorm'], default: 'double' },
    capacity: { type: Number, default: 2 },
    quantity: { type: Number, default: 1 },
    pricePerNight: { type: Number, required: true },
    description: { type: String, default: '' }
  },
  { _id: false }
);

const accommodationSchema = new mongoose.Schema(
  {
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    location: { type: String, default: '' },
    type: { type: String, enum: ['Accommodation', 'Activity', 'Transportation'], default: 'Accommodation' },
    // per-room = book individual rooms; whole-property = entire resort/cottage must be booked
    bookingMode: { type: String, enum: ['per-room', 'whole-property'], default: 'per-room' },
    pricePerNight: { type: Number, required: true }, // base / whole-property price
    rooms: [roomSchema],
    totalRooms: { type: Number, default: 1 },
    maxGuests: { type: Number, default: 4 },
    amenities: [{ type: String }],
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    status: { type: String, enum: ['Verified', 'Pending review'], default: 'Pending review' },
    propertyNote: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Accommodation', accommodationSchema);
