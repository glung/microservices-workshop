import { testPool } from './testDb';
import { Course, SubscriptionKind } from '../../types/models';

let courseCounter = 0;

export const createTestCourse = async (
  overrides?: {
    name?: string;
    author?: string;
    content?: string;
    kind?: SubscriptionKind;
  }
): Promise<Course> => {
  courseCounter++;

  const name = overrides?.name || `Test Course ${courseCounter}`;
  const author = overrides?.author || `Test Author ${courseCounter}`;
  const content = overrides?.content || `Test content for course ${courseCounter}`;
  const kind = overrides?.kind || 'Free';

  const result = await testPool.query<Course>(
    'INSERT INTO courses (name, author, content, kind) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, author, content, kind]
  );

  return result.rows[0];
};

export const seedTestCourses = async (): Promise<Course[]> => {
  const courses = await Promise.all([
    createTestCourse({ name: 'Free Course 1', kind: 'Free' }),
    createTestCourse({ name: 'Free Course 2', kind: 'Free' }),
    createTestCourse({ name: 'Premium Course 1', kind: 'Max' }),
    createTestCourse({ name: 'Premium Course 2', kind: 'Max' })
  ]);

  return courses;
};

export const resetCourseCounter = (): void => {
  courseCounter = 0;
};
