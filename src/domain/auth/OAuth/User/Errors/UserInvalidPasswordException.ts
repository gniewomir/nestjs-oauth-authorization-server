import { HttpStatus } from "@nestjs/common";

import {
  TUserExceptionConstructorParm,
  UserException,
} from "@domain/auth/OAuth/User/Errors/UserException";

export class UserInvalidPasswordException extends UserException {
  constructor(params: TUserExceptionConstructorParm) {
    super({
      ...params,
      errorCode: "invalid-password",
      statusCode: HttpStatus.BAD_REQUEST,
    });
  }
}
