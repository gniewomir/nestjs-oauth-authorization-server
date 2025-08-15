import { HttpStatus } from "@nestjs/common";

import {
  OauthException,
  TOauthExceptionConstructorParm,
} from "@domain/authentication/OAuth/Errors/OauthException";

export class OauthInvalidRequestException extends OauthException {
  constructor(params: TOauthExceptionConstructorParm = {}) {
    super({
      errorCode: "invalid_request",
      statusCode: HttpStatus.BAD_REQUEST,
      errorDescription:
        "The request is missing a required parameter, includes an invalid value, or is malformed.",
      ...params,
    });
  }
}
