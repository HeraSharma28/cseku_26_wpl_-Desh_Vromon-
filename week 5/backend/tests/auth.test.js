process.env.JWT_SECRET = 'test-secret';

jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn()
}));

const request = require('supertest');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const app = require('../app');

describe('auth API', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects signup when required fields are missing', async () => {
    const response = await request(app).post('/api/auth/signup').send({ email: 'user@example.com' });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/required/i);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  test('rejects short password', async () => {
    const response = await request(app).post('/api/auth/signup').send({
      name: 'Test',
      email: 'test@example.com',
      password: '123'
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/6 characters/i);
  });

  test('creates a traveler account and returns a token', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockImplementation(async (data) => ({
      ...data,
      _id: 'user-1',
      role: data.role,
      phone: undefined
    }));

    const response = await request(app).post('/api/auth/signup').send({
      name: '  Test User ',
      email: ' TEST@EXAMPLE.COM ',
      password: 'secret123'
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'traveler'
    });
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test User',
        email: 'test@example.com',
        role: 'traveler'
      })
    );
    expect(await bcrypt.compare('secret123', User.create.mock.calls[0][0].password)).toBe(true);
  });

  test('creates a provider account when role is provider', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockImplementation(async (data) => ({
      ...data,
      _id: 'provider-1',
      role: data.role
    }));

    const response = await request(app).post('/api/auth/signup').send({
      name: 'Provider Co',
      email: 'provider@test.com',
      password: 'secret123',
      role: 'provider'
    });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('provider');
  });

  test('rejects duplicate email', async () => {
    User.findOne.mockResolvedValue({ _id: 'existing' });

    const response = await request(app).post('/api/auth/signup').send({
      name: 'Test User',
      email: 'user@example.com',
      password: 'secret123'
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/already exists/i);
  });

  test('logs in with a valid password', async () => {
    const password = await bcrypt.hash('secret123', 10);
    User.findOne.mockResolvedValue({
      _id: 'user-1',
      name: 'Test User',
      email: 'user@example.com',
      password,
      role: 'traveler'
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'USER@EXAMPLE.COM', password: 'secret123' });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user.email).toBe('user@example.com');
  });

  test('returns unauthorized for wrong password', async () => {
    const password = await bcrypt.hash('secret123', 10);
    User.findOne.mockResolvedValue({
      _id: 'user-1',
      email: 'user@example.com',
      password,
      role: 'traveler'
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'wrongpass' });

    expect(response.status).toBe(401);
  });

  test('returns unauthorized for a user without a password hash', async () => {
    User.findOne.mockResolvedValue({
      _id: 'legacy-user',
      email: 'user@example.com',
      role: 'traveler'
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'secret123' });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/invalid email or password/i);
  });
});
