const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const destinationRoutes = require('./routes/destinations');
const accommodationRoutes = require('./routes/accommodations');
const bookingRoutes = require('./routes/bookings');
const serviceRoutes = require('./routes/services');
const tripPlanRoutes = require('./routes/tripplans');
const sprintRoutes = require('./routes/sprint');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/accommodations', accommodationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/tripplans', tripPlanRoutes);
app.use('/api/sprint', sprintRoutes);

app.get('/', (req, res) => {
  res.send('Desh Vromon API is running.');
});

module.exports = app;
