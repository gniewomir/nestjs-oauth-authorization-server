import {
  setupTransactionalTesting,
  teardownTransactionalTesting,
} from "./infrastructure/database/setup-transactional-tests";

/**
 * Jest setup file for unit tests with transactional testing
 *
 * This file is automatically executed by Jest before running tests.
 * It sets up the transactional testing environment for database isolation.
 */

// Global setup - runs once before all tests
beforeAll(async () => {
  await setupTransactionalTesting();
}, 2000);

// Global teardown - runs once after all tests
afterAll(async () => {
  await teardownTransactionalTesting();
}, 2000);
