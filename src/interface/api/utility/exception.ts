import * as assert from "node:assert";

export const exceptionAsJsonString = (exception: unknown) => {
  assert(exception instanceof Error);

  // @ts-expect-error format stack in more readable way, without overthinking it
  exception.stack =
    typeof exception.stack === "string"
      ? exception.stack.split("\n").map((str) => str.trim())
      : exception.stack;
  return JSON.stringify(exception, Object.getOwnPropertyNames(exception), 2);
};
