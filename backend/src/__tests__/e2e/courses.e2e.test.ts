import request from 'supertest';
import { createTestApp } from '../helpers/testApp';
import { createTestUser } from '../helpers/testUsers';
import { createTestCourse } from '../helpers/testCourses';

const app = createTestApp();

describe('GET /api/courses/:id', () => {
  it('should allow free user to view free course content', async () => {
    const freeUser = await createTestUser({ subscriptionKind: 'Free' });
    const freeCourse = await createTestCourse({ kind: 'Free', content: 'Free content' });

    const response = await request(app)
      .get(`/api/courses/${freeCourse.id}`)
      .set('Authorization', `Bearer ${freeUser.token}`)
      .expect(200);

    expect(response.body.course.content).toBe('Free content');
    expect(response.body.course.requires_subscription).toBeUndefined();
  });

  it('should NOT show max course content to free user', async () => {
    const freeUser = await createTestUser({ subscriptionKind: 'Free' });
    const maxCourse = await createTestCourse({ kind: 'Max', content: 'Premium content' });

    const response = await request(app)
      .get(`/api/courses/${maxCourse.id}`)
      .set('Authorization', `Bearer ${freeUser.token}`)
      .expect(200);

    expect(response.body.course.content).toBeUndefined();
    expect(response.body.course.requires_subscription).toBe(true);
  });

  it('should show max course content to max user', async () => {
    const maxUser = await createTestUser({ subscriptionKind: 'Max' });
    const maxCourse = await createTestCourse({ kind: 'Max', content: 'Premium content' });

    const response = await request(app)
      .get(`/api/courses/${maxCourse.id}`)
      .set('Authorization', `Bearer ${maxUser.token}`)
      .expect(200);

    expect(response.body.course.content).toBe('Premium content');
    expect(response.body.course.requires_subscription).toBeUndefined();
  });

  it('should return 404 for non-existent course', async () => {
    const user = await createTestUser();

    await request(app)
      .get('/api/courses/99999')
      .set('Authorization', `Bearer ${user.token}`)
      .expect(404);
  });

  it('should allow unauthenticated user to view free course', async () => {
    const freeCourse = await createTestCourse({ kind: 'Free', content: 'Free content' });

    const response = await request(app)
      .get(`/api/courses/${freeCourse.id}`)
      .expect(200);

    expect(response.body.course.content).toBe('Free content');
  });

  it('should NOT show max course content to unauthenticated user', async () => {
    const maxCourse = await createTestCourse({ kind: 'Max', content: 'Premium content' });

    const response = await request(app)
      .get(`/api/courses/${maxCourse.id}`)
      .expect(200);

    expect(response.body.course.content).toBeUndefined();
    expect(response.body.course.requires_subscription).toBe(true);
  });
});

describe('POST /api/courses/:id/like', () => {
  it('should allow authenticated user to like a course', async () => {
    const user = await createTestUser();
    const course = await createTestCourse();

    const response = await request(app)
      .post(`/api/courses/${course.id}/like`)
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  it('should be idempotent (liking twice works)', async () => {
    const user = await createTestUser();
    const course = await createTestCourse();

    await request(app)
      .post(`/api/courses/${course.id}/like`)
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);

    await request(app)
      .post(`/api/courses/${course.id}/like`)
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);
  });

  it('should require authentication', async () => {
    const course = await createTestCourse();

    await request(app)
      .post(`/api/courses/${course.id}/like`)
      .expect(401);
  });
});

describe('DELETE /api/courses/:id/like', () => {
  it('should allow user to unlike a course', async () => {
    const user = await createTestUser();
    const course = await createTestCourse();

    await request(app)
      .post(`/api/courses/${course.id}/like`)
      .set('Authorization', `Bearer ${user.token}`);

    const response = await request(app)
      .delete(`/api/courses/${course.id}/like`)
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  it('should be idempotent (unliking twice works)', async () => {
    const user = await createTestUser();
    const course = await createTestCourse();

    await request(app)
      .delete(`/api/courses/${course.id}/like`)
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);

    await request(app)
      .delete(`/api/courses/${course.id}/like`)
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);
  });

  it('should require authentication', async () => {
    const course = await createTestCourse();

    await request(app)
      .delete(`/api/courses/${course.id}/like`)
      .expect(401);
  });
});
