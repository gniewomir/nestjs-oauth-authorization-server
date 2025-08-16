import { NotFoundException } from "@infrastructure/repositories/NotFoundException";

export function AssertFound<T>(
  value: T,
  message?: string,
): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new NotFoundException(message || "Not found");
  }
}
