const mongoose = require('mongoose');

// A service listed by a Tourism Service Provider (accommodation, transport or activity) - FR-41 to FR-45
const serviceSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination' },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['accommodation', 'transport', 'activity'], default: 'accommodation' },
    price: { type: Number, required: true },       // price per night / per booking
    amenities: [{ type: String }],
    location: { type: String, default: '' },
    status: { type: String, enum: ['Verified', 'Pending review'], default: 'Pending review' },
    rating: { type: Number, default: 4.5 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
