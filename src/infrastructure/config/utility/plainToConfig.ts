import * as assert from "node:assert";

import { plainToInstance } from "class-transformer";
import { ClassConstructor } from "class-transformer/types/interfaces";
import { validate } from "class-validator";

import { deepFreeze } from "@infrastructure/config/utility/deepFreeze";

export const plainToConfig = async <T>(
  parameters: Partial<T>,
  defaults: T,
  configCls: ClassConstructor<T>,
) => {
  const instance = plainToInstance(configCls, {
    ...defaults,
    ...parameters,
  });
  const errors = await validate(instance as object);
  if (errors.length) {
    console.log(errors);
  }
  assert(errors.length === 0, `Errors during config validation`);
  return deepFreeze(instance);
};
