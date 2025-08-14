import { Test } from "@nestjs/testing";
import { DataSource } from "typeorm";

import { ConfigModule } from "@infrastructure/config";
import { DatabaseModule } from "@infrastructure/database";

import {
  initializeTransactionalTestContext,
  rollbackTransaction,
  startTransaction,
} from "./transactional-test-context";

/**
 * Global setup for transactional tests
 *
 * This file sets up the database connection and transactional context
 * that will be used across all tests. It ensures each test runs in isolation
 * by starting a transaction before each test and rolling it back after.
 */

let dataSource: DataSource;

/**
 * Setup transactional testing for the entire test suite
 * This should be called once before all tests
 */
export async function setupTransactionalTesting(): Promise<void> {
  // Create a test module with database configuration
  const moduleRef = await Test.createTestingModule({
    imports: [ConfigModule, DatabaseModule],
  }).compile();

  // Get the DataSource from the module
  dataSource = moduleRef.get<DataSource>(DataSource);

  // Ensure the database is connected
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  // Initialize the transactional test context
  initializeTransactionalTestContext(dataSource);
}

/**
 * Cleanup transactional testing resources
 * This should be called once after all tests
 */
export async function teardownTransactionalTesting(): Promise<void> {
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
  }
}

// Global hooks that will apply to all tests
// These are automatically registered when this file is imported
beforeEach(async () => {
  await startTransaction();
});

afterEach(async () => {
  await rollbackTransaction();
});
