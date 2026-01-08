import request from 'supertest';
import { createTestApp } from '../helpers/testApp';

const app = createTestApp();

describe('GET /health', () => {
  it('should return healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toEqual({
      status: 'healthy',
      service: 'monolith'
    });
  });
});

describe('GET /metrics', () => {
  it('should return metrics in prometheus format', async () => {
    const response = await request(app)
      .get('/metrics')
      .expect(200);

    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text).toBeTruthy();
  });
});
