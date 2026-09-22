const mongoose = require('mongoose');

// A saved personalized itinerary (FR-24 to FR-28)
const tripPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    destination: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    travelers: { type: Number, default: 1 },
    budget: { type: Number, default: 0 },
    style: { type: String, default: 'Nature' },
    days: [
      {
        dayNumber: Number,
        items: [
          {
            time: String,
            title: String,
            description: String
          }
        ]
      }
    ],
    budgetBreakdown: {
      transportation: { type: Number, default: 0 },
      accommodation: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      activities: { type: Number, default: 0 }
    },
    status: { type: String, enum: ['Planning', 'Confirmed', 'Completed'], default: 'Planning' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TripPlan', tripPlanSchema);
