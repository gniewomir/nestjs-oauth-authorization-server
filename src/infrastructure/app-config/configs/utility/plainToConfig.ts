import { plainToInstance } from "class-transformer";
import { configValidator } from "@infrastructure/app-config/configs/utility/configValidator";
import { deepFreeze } from "@infrastructure/app-config/configs/utility/deepFreeze";
import { ClassConstructor } from "class-transformer/types/interfaces";

export const plainToConfig = async <T>(
  parameters: Partial<T>,
  cls: ClassConstructor<T>,
) => {
  const config = plainToInstance(cls, parameters);
  const validated = await configValidator(config, null);

  return deepFreeze(validated);
};
