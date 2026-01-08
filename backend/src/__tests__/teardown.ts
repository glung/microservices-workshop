import { closeTestDatabase } from './helpers/testDb';

module.exports = async () => {
  await closeTestDatabase();
};
