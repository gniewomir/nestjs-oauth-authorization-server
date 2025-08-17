import { HttpStatus } from "@nestjs/common";

import {
  OauthException,
  TOauthExceptionConstructorParm,
} from "@domain/authentication/OAuth/Errors/OauthException";

export class OauthAccessDeniedException extends OauthException {
  constructor(params: TOauthExceptionConstructorParm = {}) {
    super({
      errorCode: "access_denied",
      errorDescription: "The resource owner (the user) denied the request.",
      statusCode: HttpStatus.BAD_REQUEST,
      ...params,
    });
  }
}
