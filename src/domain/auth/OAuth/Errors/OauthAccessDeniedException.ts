import { HttpStatus } from "@nestjs/common";

import {
  OauthException,
  TOauthExceptionConstructorParm,
} from "@domain/auth/OAuth/Errors/OauthException";

export class OauthAccessDeniedException extends OauthException {
  public static ERROR_CODE = "access_denied";
  constructor(params: TOauthExceptionConstructorParm = {}) {
    super({
      errorCode: OauthAccessDeniedException.ERROR_CODE,
      errorDescription: "The resource owner (the user) denied the request.",
      statusCode: HttpStatus.BAD_REQUEST,
      ...params,
    });
  }
}
