export function Assert(
  condition: boolean,
  message?: string,
): asserts condition {
  if (!condition) {
    throw new Error(message || "Failed assertion");
  }
}
