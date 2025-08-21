import { HttpStatus } from "@nestjs/common";

export type TUserErrorCode =
  | "invalid-password"
  | "password-too-short"
  | "password-too-long"
  | "password-too-weak"
  | "invalid-email"
  | "user-exists"
  | "unknown-email"
  | "unknown-password";

export type TUserCodesRecord = {
  [K in TUserErrorCode]-?: string;
};

export type TAbstractUserExceptionConstructorParm = {
  errorCode: TUserErrorCode;
  statusCode: HttpStatus;
  cause?: unknown;
  message: string;
};

export type TUserExceptionConstructorParm = Omit<
  TAbstractUserExceptionConstructorParm,
  "statusCode"
> &
  Partial<Pick<TAbstractUserExceptionConstructorParm, "statusCode">>;

export abstract class UserException extends Error {
  public readonly errorCode: TUserErrorCode;
  public readonly statusCode: HttpStatus;
  public readonly message: string;

  protected constructor({
    cause,
    statusCode,
    message,
    errorCode,
  }: TAbstractUserExceptionConstructorParm) {
    super(message, { cause });
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.message = message;
  }
}
