import { HttpStatus } from "@nestjs/common";

import {
  OauthException,
  TOauthExceptionConstructorParm,
} from "@domain/auth/OAuth/Errors/OauthException";

export class OauthInvalidTokenException extends OauthException {
  constructor(params: TOauthExceptionConstructorParm = {}) {
    super({
      errorCode: "invalid_token",
      statusCode: HttpStatus.UNAUTHORIZED,
      errorDescription: "Token is invalid.",
      ...params,
    });
  }
}
