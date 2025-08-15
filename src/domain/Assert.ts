export function Assert(
  condition: boolean,
  message?: string | Error | (() => Error),
): asserts condition {
  if (condition) {
    return;
  }
  if (typeof message === "function") {
    throw message();
  }
  if (message instanceof Error) {
    throw message;
  }
  throw new Error(message || "Invalid assertion");
}
