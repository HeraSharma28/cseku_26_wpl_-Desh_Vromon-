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
  findOne: jest.fn(),
  findOneAndDelete: jest.fn(),
  create: jest.fn()
}));
jest.mock('../models/Booking', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn()
}));
jest.mock('../models/Service', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndDelete: jest.fn(),
  create: jest.fn()
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
const Accommodation = require('../models/Accommodation');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const TripPlan = require('../models/TripPlan');

const tokenFor = (role, id = `${role}-1`) => jwt.sign({ id, role }, process.env.JWT_SECRET);

describe('Week 5-6 CRUD operations', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('Accommodation PATCH / DELETE', () => {
    test('provider can update own accommodation', async () => {
      const doc = {
        _id: 'acc-1',
        provider: 'provider-1',
        name: 'Old Name',
        pricePerNight: 1000,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: 'acc-1',
          name: 'New Name',
          pricePerNight: 1500
        })
      };
      Accommodation.findOne.mockResolvedValue(doc);

      const response = await request(app)
        .patch('/api/accommodations/acc-1')
        .set('Authorization', `Bearer ${tokenFor('provider')}`)
        .send({ name: 'New Name', pricePerNight: 1500 });

      expect(response.status).toBe(200);
      expect(doc.name).toBe('New Name');
      expect(doc.pricePerNight).toBe(1500);
      expect(doc.save).toHaveBeenCalled();
    });

    test('traveler cannot update accommodation', async () => {
      const response = await request(app)
        .patch('/api/accommodations/acc-1')
        .set('Authorization', `Bearer ${tokenFor('traveler')}`)
        .send({ name: 'Hack' });

      expect(response.status).toBe(403);
    });

    test('provider can delete own accommodation', async () => {
      Accommodation.findOneAndDelete.mockResolvedValue({ _id: 'acc-1' });

      const response = await request(app)
        .delete('/api/accommodations/acc-1')
        .set('Authorization', `Bearer ${tokenFor('provider')}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/deleted/i);
    });

    test('delete returns 404 when not found', async () => {
      Accommodation.findOneAndDelete.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/accommodations/missing')
        .set('Authorization', `Bearer ${tokenFor('provider')}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Service DELETE', () => {
    test('provider can delete own service', async () => {
      Service.findOneAndDelete.mockResolvedValue({ _id: 'svc-1' });

      const response = await request(app)
        .delete('/api/services/svc-1')
        .set('Authorization', `Bearer ${tokenFor('provider')}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('svc-1');
    });
  });

  describe('Booking cancel (traveler)', () => {
    test('traveler can cancel own booking', async () => {
      const booking = {
        _id: 'bk-1',
        traveler: 'traveler-1',
        status: 'Pending',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: 'bk-1',
          status: 'Cancelled'
        })
      };
      Booking.findById.mockResolvedValue(booking);

      const response = await request(app)
        .patch('/api/bookings/bk-1/cancel')
        .set('Authorization', `Bearer ${tokenFor('traveler')}`);

      expect(response.status).toBe(200);
      expect(booking.status).toBe('Cancelled');
    });

    test('cannot cancel another users booking', async () => {
      Booking.findById.mockResolvedValue({
        _id: 'bk-1',
        traveler: 'other-user',
        status: 'Pending'
      });

      const response = await request(app)
        .patch('/api/bookings/bk-1/cancel')
        .set('Authorization', `Bearer ${tokenFor('traveler')}`);

      expect(response.status).toBe(403);
    });
  });

  describe('TripPlan PATCH', () => {
    test('user can update trip plan status', async () => {
      const plan = {
        _id: 'plan-1',
        user: 'traveler-1',
        status: 'Planning',
        save: jest.fn().mockResolvedValue(true)
      };
      TripPlan.findOne.mockResolvedValue(plan);

      const response = await request(app)
        .patch('/api/tripplans/plan-1')
        .set('Authorization', `Bearer ${tokenFor('traveler')}`)
        .send({ status: 'Confirmed' });

      expect(response.status).toBe(200);
      expect(plan.status).toBe('Confirmed');
    });

    test('rejects invalid trip plan status', async () => {
      const plan = {
        _id: 'plan-1',
        user: 'traveler-1',
        status: 'Planning',
        save: jest.fn()
      };
      TripPlan.findOne.mockResolvedValue(plan);

      const response = await request(app)
        .patch('/api/tripplans/plan-1')
        .set('Authorization', `Bearer ${tokenFor('traveler')}`)
        .send({ status: 'InvalidStatus' });

      expect(response.status).toBe(400);
    });
  });
});
