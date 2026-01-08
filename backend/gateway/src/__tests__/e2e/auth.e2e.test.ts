import axios from 'axios';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';

describe('POST /api/auth/register', () => {
  it('should create user with Free subscription by default', async () => {
    const response = await axios.post(`${GATEWAY_URL}/api/auth/register`, {
      email: `newuser-${Date.now()}@example.com`,
      password: 'SecurePass123',
      name: 'New User'
    });

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      user: {
        email: expect.stringContaining('@example.com'),
        name: 'New User',
        subscription_kind: 'Free'
      },
      token: expect.any(String)
    });
  });

  it('should create user with Max subscription when specified', async () => {
    const response = await axios.post(`${GATEWAY_URL}/api/auth/register`, {
      email: `maxuser-${Date.now()}@example.com`,
      password: 'SecurePass123',
      name: 'Max User',
      subscriptionKind: 'Max'
    });

    expect(response.status).toBe(200);
    expect(response.data.user.subscription_kind).toBe('Max');
  });

  it('should fail with duplicate email', async () => {
    const email = `duplicate-${Date.now()}@example.com`;

    await axios.post(`${GATEWAY_URL}/api/auth/register`, {
      email,
      password: 'SecurePass123',
      name: 'First User'
    });

    try {
      await axios.post(`${GATEWAY_URL}/api/auth/register`, {
        email,
        password: 'SecurePass123',
        name: 'Second User'
      });
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.response.status).toBe(400);
      expect(error.response.data).toHaveProperty('error');
    }
  });
});

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const email = `logintest-${Date.now()}@example.com`;

    await axios.post(`${GATEWAY_URL}/api/auth/register`, {
      email,
      password: 'SecurePass123',
      name: 'Login Test'
    });

    const response = await axios.post(`${GATEWAY_URL}/api/auth/login`, {
      email,
      password: 'SecurePass123'
    });

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      user: {
        email,
        name: 'Login Test'
      },
      token: expect.any(String)
    });
  });

  it('should fail with invalid email', async () => {
    try {
      await axios.post(`${GATEWAY_URL}/api/auth/login`, {
        email: 'nonexistent@example.com',
        password: 'SomePassword'
      });
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.response.status).toBe(401);
      expect(error.response.data.error).toBe('Invalid credentials');
    }
  });

  it('should fail with invalid password', async () => {
    const email = `wrongpass-${Date.now()}@example.com`;

    await axios.post(`${GATEWAY_URL}/api/auth/register`, {
      email,
      password: 'CorrectPass123',
      name: 'User'
    });

    try {
      await axios.post(`${GATEWAY_URL}/api/auth/login`, {
        email,
        password: 'WrongPassword'
      });
      fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.response.status).toBe(401);
      expect(error.response.data.error).toBe('Invalid credentials');
    }
  });
});
