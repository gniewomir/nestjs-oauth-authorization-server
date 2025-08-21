import { HttpStatus } from "@nestjs/common";

import {
  TUserExceptionConstructorParm,
  UserException,
} from "@domain/auth/OAuth/User/Errors/UserException";

export class UserEmailFoundException extends UserException {
  constructor(params: TUserExceptionConstructorParm) {
    super({
      ...params,
      errorCode: "user-exists",
      statusCode: HttpStatus.BAD_REQUEST,
    });
  }
}
