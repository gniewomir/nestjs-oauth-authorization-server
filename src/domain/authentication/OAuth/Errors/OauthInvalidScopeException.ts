import { HttpStatus } from "@nestjs/common";

import {
  OauthException,
  TOauthExceptionConstructorParm,
} from "@domain/authentication/OAuth/Errors/OauthException";

export class OauthInvalidScopeException extends OauthException {
  constructor(params: TOauthExceptionConstructorParm = {}) {
    super({
      errorCode: "invalid_scope",
      statusCode: HttpStatus.BAD_REQUEST,
      errorDescription:
        "The requested scope is invalid, unknown, or malformed.",
      ...params,
    });
  }
}
