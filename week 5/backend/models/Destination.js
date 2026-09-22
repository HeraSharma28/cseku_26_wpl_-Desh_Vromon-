const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true },
    district: { type: String, default: '' },
    division: { type: String, default: '' },
    type: {
      type: String,
      enum: ['hill', 'beach', 'wildlife', 'tea-garden', 'historical', 'cultural'],
      default: 'hill'
    },
    season: { type: String, default: 'Winter' },
    seasons: [{ type: String }],
    priceFrom: { type: Number, required: true },
    durationMin: { type: Number, default: 1 },
    durationMax: { type: Number, default: 3 },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    description: { type: String, default: '' },
    highlights: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Destination', destinationSchema);
