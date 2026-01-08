import request from 'supertest';
import { createTestApp } from '../helpers/testApp';
import { createTestUser } from '../helpers/testUsers';
import { seedTestCourses } from '../helpers/testCourses';
import { testPool } from '../helpers/testDb';

const app = createTestApp();

describe('GET /api/catalog', () => {
  it('should return all courses for unauthenticated user', async () => {
    await seedTestCourses();

    const response = await request(app)
      .get('/api/catalog')
      .expect(200);

    expect(response.body.courses).toHaveLength(4);
    expect(response.body.courses[0]).toHaveProperty('like_count');
    expect(response.body.courses[0]).not.toHaveProperty('is_liked');
  });

  it('should include is_liked for authenticated user', async () => {
    const courses = await seedTestCourses();
    const user = await createTestUser();

    await testPool.query(
      'INSERT INTO likes (user_id, course_id) VALUES ($1, $2)',
      [user.id, courses[0].id]
    );

    const response = await request(app)
      .get('/api/catalog')
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);

    expect(response.body.courses).toHaveLength(4);

    const likedCourse = response.body.courses.find((c: any) => c.id === courses[0].id);
    expect(likedCourse.is_liked).toBe(true);

    const notLikedCourse = response.body.courses.find((c: any) => c.id === courses[1].id);
    expect(notLikedCourse.is_liked).toBe(false);
  });

  it('should show correct like counts', async () => {
    const courses = await seedTestCourses();
    const user1 = await createTestUser({ email: 'user1@test.com' });
    const user2 = await createTestUser({ email: 'user2@test.com' });

    await testPool.query(
      'INSERT INTO likes (user_id, course_id) VALUES ($1, $2), ($3, $4)',
      [user1.id, courses[0].id, user2.id, courses[0].id]
    );

    const response = await request(app)
      .get('/api/catalog')
      .expect(200);

    const course = response.body.courses.find((c: any) => c.id === courses[0].id);
    expect(parseInt(course.like_count)).toBe(2);
  });

  it('should return empty array when no courses exist', async () => {
    const response = await request(app)
      .get('/api/catalog')
      .expect(200);

    expect(response.body.courses).toEqual([]);
  });
});
