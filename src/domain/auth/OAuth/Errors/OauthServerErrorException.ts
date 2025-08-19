import { HttpStatus } from "@nestjs/common";

import {
  OauthException,
  TOauthExceptionConstructorParm,
} from "@domain/auth/OAuth/Errors/OauthException";

export class OauthServerErrorException extends OauthException {
  constructor(params: TOauthExceptionConstructorParm = {}) {
    super({
      errorCode: "server_error",
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorDescription: "The server encountered an unexpected condition.",
      ...params,
    });
  }
}
