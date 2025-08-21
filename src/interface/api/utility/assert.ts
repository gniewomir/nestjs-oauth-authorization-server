export function assert(
  condition: boolean,
  exceptionFactory: () => Error,
): asserts condition {
  if (condition) {
    return;
  }
  throw exceptionFactory();
}
