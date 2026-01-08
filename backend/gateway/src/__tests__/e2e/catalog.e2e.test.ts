import axios from 'axios';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';

describe('GET /api/catalog', () => {
  it('should return courses for unauthenticated user', async () => {
    const response = await axios.get(`${GATEWAY_URL}/api/catalog`);

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('courses');
    expect(Array.isArray(response.data.courses)).toBe(true);

    if (response.data.courses.length > 0) {
      expect(response.data.courses[0]).toHaveProperty('like_count');
      expect(response.data.courses[0]).not.toHaveProperty('is_liked');
    }
  });

  it('should include is_liked for authenticated user', async () => {
    // Create a user
    const registerResponse = await axios.post(`${GATEWAY_URL}/api/auth/register`, {
      email: `catalog-${Date.now()}@example.com`,
      password: 'SecurePass123',
      name: 'Catalog Test'
    });

    const token = registerResponse.data.token;

    // Get catalog with auth
    const response = await axios.get(`${GATEWAY_URL}/api/catalog`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    expect(response.status).toBe(200);
    expect(response.data.courses).toBeDefined();

    if (response.data.courses.length > 0) {
      expect(response.data.courses[0]).toHaveProperty('is_liked');
    }
  });
});
