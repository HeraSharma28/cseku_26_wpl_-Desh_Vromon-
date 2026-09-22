process.env.JWT_SECRET = 'test-secret';

jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn()
}));
jest.mock('../models/Destination', () => ({
  find: jest.fn(),
  findById: jest.fn()
}));
jest.mock('../models/Accommodation', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn()
}));
jest.mock('../models/Booking', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn()
}));
jest.mock('../models/TripPlan', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndDelete: jest.fn()
}));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../app');
const Destination = require('../models/Destination');
const Accommodation = require('../models/Accommodation');
const Booking = require('../models/Booking');
const TripPlan = require('../models/TripPlan');

const tokenFor = (role) => jwt.sign({ id: `${role}-1`, role }, process.env.JWT_SECRET);

describe('destination, accommodation, booking and tripplan routes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('lists destinations with query filters', async () => {
    const destinations = [{ _id: 'destination-1', name: 'Sajek Valley', rating: 4.9 }];
    Destination.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(destinations) })
    });

    const response = await request(app).get('/api/destinations?type=hill&season=Winter');

    expect(response.status).toBe(200);
    expect(response.body.destinations[0]).toMatchObject({ name: 'Sajek Valley', isFavorite: false });
    expect(Destination.find).toHaveBeenCalledWith({ type: 'hill', season: 'Winter' });
  });

  test('returns a not-found response for an unknown destination', async () => {
    Destination.findById.mockResolvedValue(null);

    const response = await request(app).get('/api/destinations/unknown-id');

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/i);
  });

  test('lists accommodations publicly', async () => {
    Accommodation.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) })
    });

    const response = await request(app).get('/api/accommodations?destination=destination-1');

    expect(response.status).toBe(200);
    expect(response.body.accommodations).toEqual([]);
    expect(Accommodation.find).toHaveBeenCalledWith({ destination: 'destination-1' });
  });

  test('denies service creation to travelers', async () => {
    const response = await request(app)
      .post('/api/accommodations')
      .set('Authorization', `Bearer ${tokenFor('traveler')}`)
      .send({ destination: 'destination-1', name: 'Test Stay', pricePerNight: 1000 });

    expect(response.status).toBe(403);
    expect(Accommodation.create).not.toHaveBeenCalled();
  });

  test('allows provider to create accommodation', async () => {
    Accommodation.create.mockResolvedValue({
      _id: 'acc-1',
      name: 'Test Stay',
      pricePerNight: 1000,
      provider: 'provider-1'
    });

    const response = await request(app)
      .post('/api/accommodations')
      .set('Authorization', `Bearer ${tokenFor('provider')}`)
      .send({ destination: 'destination-1', name: 'Test Stay', pricePerNight: 1000 });

    expect(response.status).toBe(201);
    expect(Accommodation.create).toHaveBeenCalled();
  });

  test('requires booking fields before querying accommodation', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokenFor('traveler')}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/required/i);
  });

  test('saves a trip plan for authenticated user', async () => {
    TripPlan.create.mockResolvedValue({
      _id: 'plan-1',
      destination: 'Sajek Valley',
      style: 'Nature',
      user: 'traveler-1'
    });

    const response = await request(app)
      .post('/api/tripplans')
      .set('Authorization', `Bearer ${tokenFor('traveler')}`)
      .send({
        destination: 'Sajek Valley',
        style: 'Nature',
        travelers: 2,
        days: [{ dayNumber: 1, items: [{ time: '09:00', title: 'Arrive', description: 'Check in' }] }]
      });

    expect(response.status).toBe(201);
    expect(response.body.plan.destination).toBe('Sajek Valley');
    expect(TripPlan.create).toHaveBeenCalled();
  });

  test('rejects trip plan without destination', async () => {
    const response = await request(app)
      .post('/api/tripplans')
      .set('Authorization', `Bearer ${tokenFor('traveler')}`)
      .send({ style: 'Nature' });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/destination/i);
  });

  test('requires auth to list own trip plans', async () => {
    const response = await request(app).get('/api/tripplans/mine');
    expect(response.status).toBe(401);
  });

  test('lists own trip plans when authenticated', async () => {
    TripPlan.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([{ _id: 'plan-1', destination: 'Sajek Valley' }])
    });

    const response = await request(app)
      .get('/api/tripplans/mine')
      .set('Authorization', `Bearer ${tokenFor('traveler')}`);

    expect(response.status).toBe(200);
    expect(response.body.plans).toHaveLength(1);
  });
});
