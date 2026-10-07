import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import { User } from '../../src/models/User.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

let server;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await User.deleteMany({ email: 'test@thinkcrm.local' });
  const passwordHash = await bcrypt.hash('password123', 12);
  await User.create({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@thinkcrm.local',
    passwordHash,
    role: 'Staff',
    status: 'active',
  });
});

afterAll(async () => {
  await User.deleteMany({ email: 'test@thinkcrm.local' });
  await mongoose.connection.close();
});

describe('Auth API', () => {
  it('Should login a user with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@thinkcrm.local',
        password: 'password123',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('Should fail to login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@thinkcrm.local',
        password: 'wrongpassword',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
