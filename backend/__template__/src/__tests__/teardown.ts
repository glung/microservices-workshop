import { closeTestDatabase } from "./helpers/testDb";

export default async () => {
  await closeTestDatabase();
};
