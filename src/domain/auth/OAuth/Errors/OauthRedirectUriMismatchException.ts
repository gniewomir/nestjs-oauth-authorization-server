import { HttpStatus } from "@nestjs/common";

import {
  OauthException,
  TOauthExceptionConstructorParm,
} from "@domain/auth/OAuth/Errors/OauthException";

export class OauthRedirectUriMismatchException extends OauthException {
  constructor(params: TOauthExceptionConstructorParm = {}) {
    super({
      errorCode: "redirect_uri_mismatch",
      statusCode: HttpStatus.BAD_REQUEST,
      errorDescription:
        "The redirect_uri provided in the request does not match the redirect_uri registered for the client application.",
      ...params,
    });
  }
}
