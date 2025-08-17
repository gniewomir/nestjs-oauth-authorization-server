import { HttpStatus } from "@nestjs/common";

export type TAbstractOauthExceptionConstructorParm = {
  errorCode: string;
  errorDescription: string;
  errorUri?: string;
  state?: string;
  statusCode: HttpStatus;
  cause?: unknown;
  developerMessage?: string;
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
  public readonly developerMessage: string;

  public get message() {
    return this.errorDescription || "Hidden for security reasons";
  }

  constructor({
    errorDescription,
    cause,
    errorCode,
    errorUri,
    state,
    statusCode,
    developerMessage,
  }: TAbstractOauthExceptionConstructorParm) {
    super(developerMessage || errorDescription, { cause });
    this.developerMessage = developerMessage || errorDescription;
    this.errorCode = errorCode;
    this.errorDescription = errorDescription;
    this.errorUri = errorUri;
    this.statusCode = statusCode;
    this.state = state;
  }
}
