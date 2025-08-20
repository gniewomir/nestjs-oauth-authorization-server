import * as assert from "node:assert";

import { Inject, Injectable } from "@nestjs/common";
import { ConfigService as NestConfigService } from "@nestjs/config";
import { plainToInstance } from "class-transformer";
import { ClassConstructor } from "class-transformer/types/interfaces";
import { validate } from "class-validator";
import { cloneDeep } from "lodash";

import { deepFreeze } from "@infrastructure/config/utility";
import { pascalCaseToConstantCase } from "@infrastructure/config/utility/pascalCaseToConstantCase";
import { LoggerInterface, LoggerInterfaceSymbol } from "@infrastructure/logger";

type TValidator<T> = (value: T) => Promise<void>;

type TEnvVariableOptions<T> = {
  allowDefault: boolean;
  description: string;
  envVariableKey?: string;
  allowed?: string[];
  isArray?: boolean;
  arraySeparator?: string;
  arrayTrim?: boolean;
  valueTrim?: boolean;
  validator?: TValidator<T>;
};

type TEnvVariableParserParam<T> = {
  config: string;
  configKey: string;
  envVariableKey: string;
  envVariableValue: string;
  envVariableOptions: TEnvVariableOptions<T>;
};

export type TRegisteredEnvVariable = {
  fromEnv: boolean;
  allowDefault: boolean;
  configKey: string;
  envVariableName: string;
  envVariableValue?: string;
  description?: string;
  configDefaultValue: string;
  configName: string;
  allowed?: string[];
};

export interface EnvironmentProvider {
  get(propertyPath: string | symbol): string | undefined;
}

@Injectable()
export class ConfigService {
  private readonly registry = new Map<string, TRegisteredEnvVariable>();

  constructor(
    @Inject(LoggerInterfaceSymbol)
    private readonly logger: LoggerInterface,
    @Inject(NestConfigService)
    private readonly nestConfigService: EnvironmentProvider,
  ) {
    logger.setContext("ConfigService");
  }

  private parseStringAsBoolean<T>({
    config,
    configKey,
    envVariableKey,
    envVariableValue,
    envVariableOptions,
  }: TEnvVariableParserParam<T>): boolean {
    const notAllowed: (keyof TEnvVariableOptions<T>)[] = [
      "allowed",
      "arraySeparator",
      "arrayTrim",
      "isArray",
    ];
    assert(
      notAllowed.every((opt) => typeof envVariableOptions[opt] === "undefined"),
      `${config}.${configKey}: Options ${notAllowed.join(", ")} are not allowed on boolean field`,
    );
    const acceptedValues = ["true", "TRUE", "false", "FALSE", "1", "0"];
    assert(
      acceptedValues.includes(envVariableValue),
      `${envVariableKey}: Value "${envVariableValue}" in not allowed. Accepted values are ${acceptedValues.join(", ")}`,
    );

    // update list of allowed values
    const registration = this.registry.get(envVariableKey);
    assert(typeof registration !== "undefined");
    this.registry.set(envVariableKey, {
      ...registration,
      allowed: acceptedValues,
    });

    return ["TRUE", "true", "1"].includes(envVariableValue);
  }

  private parseStringAsNumber<T>({
    config,
    configKey,
    envVariableValue,
    envVariableOptions,
  }: TEnvVariableParserParam<T>) {
    const notAllowed: (keyof TEnvVariableOptions<T>)[] = [
      "allowed",
      "arraySeparator",
      "arrayTrim",
      "isArray",
    ];
    assert(
      notAllowed.every((opt) => typeof envVariableOptions[opt] === "undefined"),
      `${config}.${configKey}: Options ${notAllowed.join(", ")} are not allowed on number field`,
    );
    return parseInt(envVariableValue, 10);
  }

  private parseStringAsString<T>({
    config,
    configKey,
    envVariableValue,
    envVariableName,
    envVariableOptions,
  }: {
    config: string;
    envVariableValue: string;
    configKey: string;
    envVariableOptions: TEnvVariableOptions<T>;
    envVariableName: string;
  }): string {
    const notAllowed: (keyof TEnvVariableOptions<T>)[] = [
      "arraySeparator",
      "arrayTrim",
      "isArray",
    ];
    assert(
      notAllowed.every((opt) => typeof envVariableOptions[opt] === "undefined"),
      `${config}.${configKey}: Options ${notAllowed.join(", ")} are not allowed on string field`,
    );
    const acceptedValues = envVariableOptions.allowed;
    assert(
      typeof acceptedValues === "undefined" ||
        acceptedValues.includes(envVariableValue),
      `${envVariableName}: Value "${envVariableValue}" in not allowed. Accepted values are ${acceptedValues?.join(", ")}`,
    );
    return envVariableValue;
  }

  private parseStingAsArrayOfStrings<T>({
    config,
    configKey,
    envVariableValue,
    envVariableName,
    envVariableOptions,
  }: {
    config: string;
    envVariableValue: string;
    configKey: string;
    envVariableOptions: TEnvVariableOptions<T>;
    envVariableName: string;
  }): string[] {
    const required: (keyof TEnvVariableOptions<T>)[] = [
      "arraySeparator",
      "arrayTrim",
      "isArray",
    ];
    assert(
      required.every((opt) => typeof envVariableOptions[opt] !== "undefined"),
      `${config}.${configKey}: All options ${required.join(", ")} are are required on string array field.`,
    );
    assert(typeof envVariableOptions.isArray !== "undefined");
    assert(typeof envVariableOptions.arraySeparator !== "undefined");
    assert(typeof envVariableOptions.arrayTrim !== "undefined");
    return envVariableValue
      .split(envVariableOptions.arraySeparator)
      .map((val) => (envVariableOptions.arrayTrim ? val.trim() : val))
      .map((val) => {
        if (
          typeof envVariableOptions.allowed !== "undefined" &&
          Array.isArray(envVariableOptions.allowed) &&
          envVariableOptions.allowed.length > 0
        ) {
          assert(
            envVariableOptions.allowed.includes(val),
            `${envVariableName}: All options ${required.join(", ")} are are required on string array field.`,
          );
        }
        return val;
      });
  }

  private defaultToString<T>(
    defaultValue: unknown,
    options: TEnvVariableOptions<T>,
  ) {
    if (typeof defaultValue === "number") {
      return defaultValue.toString();
    }
    if (typeof defaultValue === "string") {
      return defaultValue;
    }
    if (typeof defaultValue === "boolean") {
      return defaultValue ? "true" : "false";
    }
    if (
      Array.isArray(defaultValue) &&
      defaultValue.every((opt) => typeof opt === "string")
    ) {
      const separator = options.arraySeparator;
      assert(typeof separator !== "undefined");
      return defaultValue.join(options.arraySeparator);
    }
    throw new Error("Unsupported defaultValue type");
  }

  private handleConfigurationEntry = <KT extends keyof T, T>({
    configName,
    configKey,
    configDefault,
    envPrefix,
    envVariableOptions,
  }: {
    configName: string;
    configKey: (KT extends string ? keyof T : never) & string;
    configDefault: T[KT];
    envVariableOptions: TEnvVariableOptions<T>;
    envPrefix: string;
  }): T[KT] => {
    // if no options where specified for config key - we do not fetch it from env - return default
    if (typeof envVariableOptions === "undefined") {
      return configDefault;
    }

    const envVariableName =
      typeof envVariableOptions.envVariableKey !== "undefined"
        ? envVariableOptions.envVariableKey
        : this.createEnvVariableName({
            key: configKey,
            prefix: envPrefix,
          });
    let envVariableValue = this.nestConfigService.get(envVariableName);
    envVariableValue =
      typeof envVariableOptions.valueTrim === "undefined" ||
      envVariableOptions.valueTrim
        ? envVariableValue?.trim()
        : envVariableValue;
    // we treat empty string as no value
    envVariableValue = envVariableValue === "" ? undefined : envVariableValue;

    // register env variable, so we can later generate env file
    this.registry.set(envVariableName, {
      envVariableValue,
      configName: configName,
      configKey: configKey,
      configDefaultValue: this.defaultToString(
        configDefault,
        envVariableOptions,
      ),
      description: envVariableOptions?.description,
      envVariableName,
      fromEnv: typeof envVariableValue !== "undefined",
      allowDefault:
        typeof envVariableOptions?.allowDefault === "undefined"
          ? true
          : envVariableOptions.allowDefault,
      allowed: envVariableOptions?.allowed,
    });

    // if using default is disallowed, we expect to get value from environment
    assert(
      envVariableOptions.allowDefault ||
        typeof envVariableValue !== "undefined",
      `${envVariableName} have to be present in the environment.`,
    );

    // if there is no value in environment - return default
    if (typeof envVariableValue === "undefined") {
      return configDefault;
    }

    // if we are still here, test type of default value, to determine how to handle environment variable
    if (typeof configDefault === "boolean") {
      return this.parseStringAsBoolean({
        config: configName,
        envVariableValue,
        configKey,
        envVariableOptions,
        envVariableKey: envVariableName,
      }) as T[KT];
    }

    // if we are still here, test type of default value, to determine how to handle environment variable
    if (typeof configDefault === "number") {
      return this.parseStringAsNumber({
        config: configName,
        envVariableValue,
        configKey,
        envVariableOptions,
        envVariableKey: envVariableName,
      }) as T[KT];
    }

    // if we are still here, test type of default value, to determine how to handle environment variable
    if (typeof configDefault === "string") {
      return this.parseStringAsString({
        config: configName,
        envVariableValue,
        configKey,
        envVariableOptions,
        envVariableName,
      }) as T[KT];
    }

    // if we are still here, test type of default value, to determine how to handle environment variable
    if (Array.isArray(configDefault)) {
      return this.parseStingAsArrayOfStrings({
        config: configName,
        envVariableValue,
        configKey,
        envVariableOptions,
        envVariableName,
      }) as T[KT];
    }

    throw new Error("Unhandled default value type");
  };

  async provide<T>({
    envVariablesPrefix,
    configName,
    options,
    defaults,
    configCls,
  }: {
    configCls: ClassConstructor<T>;
    envVariablesPrefix: string;
    configName: string;
    options: Partial<Record<keyof T, TEnvVariableOptions<T>>>;
    defaults: T;
  }): Promise<T> {
    const result: T = cloneDeep(defaults);

    let configKey: keyof T;
    for (configKey in result) {
      assert(typeof configKey === "string", "configKey must be a string");
      const keyOptions = options[configKey];

      // it was not specified how to handle environment variable - therefore stick to default
      if (typeof keyOptions === "undefined") {
        continue;
      }

      result[configKey] = this.handleConfigurationEntry({
        configName,
        configKey,
        configDefault: cloneDeep(defaults[configKey]),
        envVariableOptions: keyOptions,
        envPrefix: envVariablesPrefix,
      });
    }

    const instance = plainToInstance(configCls, result);
    const errors = await validate(instance as object);
    for (const error of errors) {
      this.logger.error(error.toString());
    }
    assert(errors.length === 0, `Errors during config validation`);
    const frozen = deepFreeze(instance);

    // run validators
    let optionsKey: keyof T;
    for (optionsKey in result) {
      assert(typeof optionsKey === "string", "configKey must be a string");
      const keyOptions = options[optionsKey];
      if (typeof keyOptions?.validator === "function") {
        await keyOptions.validator(frozen);
      }
    }

    return frozen;
  }

  public registered() {
    return deepFreeze(Array.from(this.registry.values()));
  }

  private createEnvVariableName({
    key,
    prefix,
  }: {
    key: string;
    prefix: string;
  }): string {
    return pascalCaseToConstantCase(
      prefix.toLowerCase() + key[0].toUpperCase() + key.slice(1),
    );
  }
}
