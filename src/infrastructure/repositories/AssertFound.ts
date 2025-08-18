import { DatabaseNotFoundException } from "@infrastructure/repositories/DatabaseNotFoundException";

export function AssertFound<T>(
  value: T,
  message?: string,
): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new DatabaseNotFoundException(message || "Not found");
  }
}
