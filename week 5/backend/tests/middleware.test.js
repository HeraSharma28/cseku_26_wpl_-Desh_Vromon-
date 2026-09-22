process.env.JWT_SECRET = 'test-secret';

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../app');

describe('authentication middleware', () => {
  test('blocks protected profile endpoint without a token', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/log in/i);
  });

  test('blocks protected profile endpoint with an invalid token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/expired/i);
  });

  test('root endpoint confirms the API is running', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toBe('Desh Vromon API is running.');
  });

  test('blocks booking creation without auth', async () => {
    const response = await request(app).post('/api/bookings').send({
      accommodationId: 'x',
      checkIn: '2026-10-01',
      checkOut: '2026-10-03'
    });
    expect(response.status).toBe(401);
  });

  test('blocks provider routes for missing role token', async () => {
    const travelerToken = jwt.sign({ id: 't-1', role: 'traveler' }, process.env.JWT_SECRET);
    const response = await request(app)
      .get('/api/bookings/provider')
      .set('Authorization', `Bearer ${travelerToken}`);
    expect(response.status).toBe(403);
  });
});
