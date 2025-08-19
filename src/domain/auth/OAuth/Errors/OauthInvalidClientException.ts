import { HttpStatus } from "@nestjs/common";

import {
  OauthException,
  TOauthExceptionConstructorParm,
} from "@domain/auth/OAuth/Errors/OauthException";

export class OauthInvalidClientException extends OauthException {
  constructor(params: TOauthExceptionConstructorParm = {}) {
    super({
      errorCode: "invalid_client",
      statusCode: HttpStatus.BAD_REQUEST,
      errorDescription: "Unrecognized client ID.",
      ...params,
    });
  }
}
