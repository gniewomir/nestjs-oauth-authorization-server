import { HttpStatus } from "@nestjs/common";

import {
  TUserExceptionConstructorParm,
  UserException,
} from "@domain/auth/OAuth/User/Errors/UserException";

export class UserPasswordMismatchException extends UserException {
  constructor(params: TUserExceptionConstructorParm) {
    super({
      ...params,
      errorCode: "unknown-password",
      statusCode: HttpStatus.BAD_REQUEST,
    });
  }
}
