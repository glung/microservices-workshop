import { cleanTestData } from "./helpers/testDb";

beforeEach(async () => {
  await cleanTestData();
});
