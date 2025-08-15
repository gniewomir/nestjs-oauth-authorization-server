import { HttpStatus } from "@nestjs/common";

import {
  OauthException,
  TOauthExceptionConstructorParm,
} from "@domain/authentication/OAuth/Errors/OauthException";

export class OauthTokenExpiredException extends OauthException {
  constructor(params: TOauthExceptionConstructorParm = {}) {
    super({
      errorCode: "token_expired",
      statusCode: HttpStatus.UNAUTHORIZED,
      errorDescription: "Token is expired.",
      ...params,
    });
  }
}
