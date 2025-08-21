import { HttpStatus } from "@nestjs/common";

import {
  TUserExceptionConstructorParm,
  UserException,
} from "@domain/auth/OAuth/User/Errors/UserException";

export class UserEmailNotFoundException extends UserException {
  constructor(params: TUserExceptionConstructorParm) {
    super({
      ...params,
      errorCode: "unknown-email",
      statusCode: HttpStatus.BAD_REQUEST,
    });
  }
}
