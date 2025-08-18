import { ConfigService } from "@nestjs/config";
import { plainToInstance } from "class-transformer";
import { ClassConstructor } from "class-transformer/types/interfaces";
import { cloneDeep } from "lodash";

import { Assert } from "@domain/Assert";
import {
  configValidator,
  deepFreeze,
} from "@infrastructure/config/utility/index";
import { pascalCaseToConstantCase } from "@infrastructure/config/utility/pascalCaseToConstantCase";
import { LoggerInterface } from "@infrastructure/logger/logger.interface";

export type TConfigurationVariable = {
  fromEnv: boolean;
  allowDefault: boolean;
  configKey: string;
  envKey: string;
  type: "string" | "number" | "boolean";
  description?: string;
  defaultValue?: unknown;
  configName: string;
  allowed?: string[];
};
const registry: TConfigurationVariable[] = [];
const register = (configurationVariable: TConfigurationVariable) => {
  registry.push(configurationVariable);
};
export const inspectRegistry = () => {
  return deepFreeze(registry);
};

export const provide = async <T>(
  envVarsPrefix: string,
  configName: string,
  config: ClassConstructor<T>,
  logger: LoggerInterface,
  nestConfigService: ConfigService,
  input: Partial<
    Record<
      keyof T,
      {
        allowDefault: boolean;
        description: string;
        envKey?: string;
        allowed?: string[];
      }
    >
  >,
  defaults: Record<keyof T, unknown>,
): Promise<T> => {
  const result = cloneDeep(defaults);
  for (const [key, defaultValue] of Object.entries(defaults) as [
    keyof T extends string ? keyof T : never,
    unknown,
  ][]) {
    if (!input[key]) {
      continue;
    }
    const envName = input[key].envKey
      ? input[key].envKey
      : pascalCaseToConstantCase(
          envVarsPrefix.toLowerCase() + key[0].toUpperCase() + key.slice(1),
        );
    if (typeof defaultValue === "string") {
      const envValue = nestConfigService.get<string>(envName);
      if (envValue) {
        result[key] = envValue;
      }
      Assert(
        typeof envValue === "string" || input[key].allowDefault,
        `${envName} is required`,
      );
      register({
        configName,
        configKey: key,
        type: "string",
        defaultValue,
        description: input[key].description,
        envKey: envName,
        fromEnv: typeof envValue !== "undefined",
        allowDefault: input[key].allowDefault,
        allowed: input[key].allowed,
      });
    }
    if (typeof defaultValue === "number") {
      const envString = nestConfigService.get<string>(envName);
      const envValue = envString ? parseInt(envString || "", 10) : undefined;
      if (envValue) {
        result[key] = envValue;
      }
      Assert(
        typeof envValue === "number" || input[key].allowDefault,
        `${envName} is required`,
      );
      register({
        configName,
        configKey: key,
        type: "number",
        defaultValue,
        description: input[key].description,
        envKey: envName,
        fromEnv: typeof envValue !== "undefined",
        allowDefault: input[key].allowDefault,
        allowed: input[key].allowed,
      });
    }
    if (typeof defaultValue === "boolean") {
      const accepted = ["true", "false", "0", "1"];
      const envString = nestConfigService.get<string>(envName);
      const envValue = envString ? (envString || "").toLowerCase() : undefined;
      if (envValue) {
        Assert(accepted.includes(envValue));
        result[key] = ["true", "1"].includes(envValue);
      }
      Assert(
        typeof envValue === "string" || input[key].allowDefault,
        `${envName} is required`,
      );
      register({
        configName,
        configKey: key,
        type: "string",
        defaultValue,
        description: input[key].description,
        envKey: envName,
        fromEnv: typeof envValue !== "undefined",
        allowDefault: input[key].allowDefault,
        allowed: input[key].allowed,
      });
    }
  }
  return deepFreeze(
    await configValidator(plainToInstance(config, result), logger),
  );
};
