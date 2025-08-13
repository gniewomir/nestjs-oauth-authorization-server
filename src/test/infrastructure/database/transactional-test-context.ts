import { DataSource } from "typeorm";
import { TransactionalTestContext } from "typeorm-transactional-tests";

/**
 * Global transactional test context for database isolation in tests
 *
 * This setup ensures that each test runs in its own transaction that is
 * rolled back after the test completes, providing test isolation without
 * the overhead of truncating or deleting tables.
 */
let transactionalContext: TransactionalTestContext;
let dataSource: DataSource;

/**
 * Initialize the transactional test context with a DataSource
 * This should be called once in test setup files
 */
export function initializeTransactionalTestContext(
  connection: DataSource,
): void {
  dataSource = connection;
  transactionalContext = new TransactionalTestContext(connection);
}

/**
 * Start a new transaction for the current test
 * This should be called in beforeEach hooks
 */
export async function startTransaction(): Promise<void> {
  if (!transactionalContext) {
    throw new Error(
      "Transactional test context not initialized. Call initializeTransactionalTestContext first.",
    );
  }
  await transactionalContext.start();
}

/**
 * Rollback the current transaction
 * This should be called in afterEach hooks
 */
export async function rollbackTransaction(): Promise<void> {
  if (!transactionalContext) {
    throw new Error(
      "Transactional test context not initialized. Call initializeTransactionalTestContext first.",
    );
  }
  await transactionalContext.finish();
}

/**
 * Get the current DataSource instance
 * Useful for tests that need direct database access
 */
export function getDataSource(): DataSource {
  if (!dataSource) {
    throw new Error(
      "DataSource not initialized. Call initializeTransactionalTestContext first.",
    );
  }
  return dataSource;
}

/**
 * Get the current transactional context
 * Useful for advanced test scenarios
 */
export function getTransactionalContext(): TransactionalTestContext {
  if (!transactionalContext) {
    throw new Error(
      "Transactional test context not initialized. Call initializeTransactionalTestContext first.",
    );
  }
  return transactionalContext;
}
