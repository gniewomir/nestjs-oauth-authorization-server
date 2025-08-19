import { HttpStatus } from "@nestjs/common";

import {
  OauthException,
  TOauthExceptionConstructorParm,
} from "@domain/auth/OAuth/Errors/OauthException";

export class OauthInvalidRequestException extends OauthException {
  public static readonly DEFAULT_CODE = "invalid_request";
  public static readonly DEFAULT_DESCRIPTION =
    "The request is missing a required parameter, includes an invalid value, or is malformed.";
  constructor(params: TOauthExceptionConstructorParm = {}) {
    super({
      errorCode: OauthInvalidRequestException.DEFAULT_CODE,
      statusCode: HttpStatus.BAD_REQUEST,
      errorDescription: OauthInvalidRequestException.DEFAULT_DESCRIPTION,
      ...params,
    });
  }
}
