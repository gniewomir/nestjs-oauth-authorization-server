import { HttpStatus } from "@nestjs/common";

import {
  OauthException,
  TOauthExceptionConstructorParm,
} from "@domain/authentication/OAuth/Errors/OauthException";

export class OauthInvalidCredentialsException extends OauthException {
  public static readonly DEFAULT_CODE = "invalid_credentials";
  public static readonly DEFAULT_DESCRIPTION =
    "Provided credentials does not match our records.";
  constructor(params: TOauthExceptionConstructorParm = {}) {
    super({
      errorCode: OauthInvalidCredentialsException.DEFAULT_CODE,
      statusCode: HttpStatus.UNAUTHORIZED,
      errorDescription: OauthInvalidCredentialsException.DEFAULT_DESCRIPTION,
      ...params,
    });
  }
}
