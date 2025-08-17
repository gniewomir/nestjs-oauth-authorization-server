import { HttpStatus } from "@nestjs/common";

import {
  OauthException,
  TOauthExceptionConstructorParm,
} from "@domain/authentication/OAuth/Errors/OauthException";

export class OauthUnsupportedGrantTypeException extends OauthException {
  constructor(params: TOauthExceptionConstructorParm = {}) {
    super({
      errorCode: "unsupported_grant_type",
      statusCode: HttpStatus.BAD_REQUEST,
      errorDescription:
        "The authorization server does not support the requested grant_type.",
      ...params,
    });
  }
}
