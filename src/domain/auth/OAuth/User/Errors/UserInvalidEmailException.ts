import { HttpStatus } from "@nestjs/common";

import {
  TUserExceptionConstructorParm,
  UserException,
} from "@domain/auth/OAuth/User/Errors/UserException";

export class UserInvalidEmailException extends UserException {
  constructor(params: TUserExceptionConstructorParm) {
    super({
      ...params,
      errorCode: "invalid-email",
      statusCode: HttpStatus.BAD_REQUEST,
    });
  }
}
