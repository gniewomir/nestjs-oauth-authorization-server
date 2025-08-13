import {
  setupTransactionalTesting,
  teardownTransactionalTesting,
} from "@test/infrastructure/database/setup-transactional-tests";

/**
 * Jest setup file for E2E tests with transactional testing
 *
 * This file is automatically executed by Jest before running E2E tests.
 * It sets up the transactional testing environment for database isolation
 * in end-to-end test scenarios.
 */

// Global setup - runs once before all E2E tests
beforeAll(async () => {
  await setupTransactionalTesting();
}, 30000); // 30 second timeout for database setup

// Global teardown - runs once after all E2E tests
afterAll(async () => {
  await teardownTransactionalTesting();
}, 10000); // 10 second timeout for cleanup
