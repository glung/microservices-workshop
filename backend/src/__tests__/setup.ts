import { cleanTestData } from './helpers/testDb';
import { resetUserCounter } from './helpers/testUsers';
import { resetCourseCounter } from './helpers/testCourses';

beforeEach(async () => {
  await cleanTestData();
  resetUserCounter();
  resetCourseCounter();
});
