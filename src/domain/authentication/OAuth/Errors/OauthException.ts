import { HttpStatus } from "@nestjs/common";

export type TAbstractOauthExceptionConstructorParm = {
  errorCode: string;
  errorDescription: string;
  errorUri?: string;
  state?: string;
  statusCode: HttpStatus;
  cause?: unknown;
  message?: string;
};

export type TOauthExceptionConstructorParm = Omit<
  TAbstractOauthExceptionConstructorParm,
  "errorCode" | "errorDescription" | "statusCode"
> &
  Partial<
    Pick<
      TAbstractOauthExceptionConstructorParm,
      "errorDescription" | "statusCode"
    >
  >;

export abstract class OauthException extends Error {
  public readonly errorCode: string;
  public readonly errorDescription: string;
  public readonly errorUri?: string;
  public readonly state?: string;
  public readonly statusCode: HttpStatus;
  public readonly message: string;

  constructor({
    errorDescription,
    cause,
    errorCode,
    errorUri,
    state,
    statusCode,
    message,
  }: TAbstractOauthExceptionConstructorParm) {
    super(message || errorDescription, { cause });
    this.message = message || errorDescription;
    this.errorCode = errorCode;
    this.errorDescription = errorDescription;
    this.errorUri = errorUri;
    this.statusCode = statusCode;
    this.state = state;
  }
}
