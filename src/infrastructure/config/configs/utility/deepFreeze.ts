export const deepFreeze = <T extends Record<keyof T, unknown>>(obj: T) => {
  Object.keys(obj).forEach((prop) => {
    if (
      typeof obj[prop as keyof T] === "object" &&
      !Object.isFrozen(obj[prop as keyof T])
    ) {
      deepFreeze(obj[prop as keyof T]);
    }
  });
  return Object.freeze(obj);
};
