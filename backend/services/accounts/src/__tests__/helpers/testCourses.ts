import { testPool } from "./testDb";

export type SubscriptionKind = "Free" | "Max";

export interface CourseRow {
  id: number;
  name: string;
  author: string;
  content: string;
  kind: SubscriptionKind;
  created_at: Date;
}

let courseCounter = 0;

export const createTestCourse = async (
  overrides?: {
    name?: string;
    author?: string;
    content?: string;
    kind?: SubscriptionKind;
  },
): Promise<CourseRow> => {
  courseCounter++;

  const name = overrides?.name || `Test Course ${courseCounter}`;
  const author = overrides?.author || `Test Author ${courseCounter}`;
  const content = overrides?.content || `Test content for course ${courseCounter}`;
  const kind = overrides?.kind || "Free";

  const result = await testPool.query<CourseRow>(
    "INSERT INTO courses (name, author, content, kind) VALUES ($1, $2, $3, $4) RETURNING *",
    [name, author, content, kind],
  );

  return result.rows[0]!;
};

export const resetCourseCounter = (): void => {
  courseCounter = 0;
};
