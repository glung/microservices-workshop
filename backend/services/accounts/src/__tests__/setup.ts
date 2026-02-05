import { cleanTestData } from "./helpers/testDb";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://courseuser:coursepass@localhost:5432/coursedb_test";

beforeEach(async () => {
  await cleanTestData();
});
