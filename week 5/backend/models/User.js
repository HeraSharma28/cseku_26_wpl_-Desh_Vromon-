const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash, never plain text
    role: { type: String, enum: ['traveler', 'provider', 'admin'], default: 'traveler' },
    phone: { type: String, trim: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    emailVerified: { type: Boolean, default: false },
    otpCode: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Destination' }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
