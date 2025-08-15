import { HttpStatus } from "@nestjs/common";

import {
  OauthException,
  TOauthExceptionConstructorParm,
} from "@domain/authentication/OAuth/Errors/OauthException";

export class OauthInvalidCredentialsException extends OauthException {
  constructor(params: TOauthExceptionConstructorParm = {}) {
    super({
      errorCode: "invalid_credentials",
      statusCode: HttpStatus.UNAUTHORIZED,
      errorDescription: "Provided credentials does not match our records.",
      ...params,
    });
  }
}
