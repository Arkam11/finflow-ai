import request from 'supertest';
import app from '../app';

describe('API Gateway', () => {
  describe('GET /health', () => {
    it('should return gateway health status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBeLessThan(300);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('gateway', 'healthy');
      expect(res.body.data).toHaveProperty('services');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should include all expected services in health check', async () => {
      const res = await request(app).get('/health');
      const { services } = res.body.data;
      expect(services).toHaveProperty('auth');
      expect(services).toHaveProperty('account');
      expect(services).toHaveProperty('transaction');
      expect(services).toHaveProperty('ai');
      expect(services).toHaveProperty('analytics');
      expect(services).toHaveProperty('retail');
    });
  });

  describe('JWT middleware', () => {
    it('should reject requests to protected routes without token', async () => {
      const res = await request(app).get('/accounts/123');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject malformed authorization header', async () => {
      const res = await request(app)
        .get('/transactions')
        .set('Authorization', 'NotBearer badtoken');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid JWT token', async () => {
      const res = await request(app)
        .get('/accounts')
        .set('Authorization', 'Bearer invalid.jwt.token');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid or expired token');
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/unknown-route-xyz');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toBe('Route not found');
    });
  });
});
