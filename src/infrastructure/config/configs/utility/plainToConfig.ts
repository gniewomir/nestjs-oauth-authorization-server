import { plainToInstance } from "class-transformer";
import { ClassConstructor } from "class-transformer/types/interfaces";

import { configValidator } from "@infrastructure/config/configs/utility/configValidator";
import { deepFreeze } from "@infrastructure/config/configs/utility/deepFreeze";

export const plainToConfig = async <T>(
  parameters: Partial<T>,
  cls: ClassConstructor<T>,
) => {
  const config = plainToInstance(cls, parameters);
  const validated = await configValidator(config, null);

  return deepFreeze(validated);
};
