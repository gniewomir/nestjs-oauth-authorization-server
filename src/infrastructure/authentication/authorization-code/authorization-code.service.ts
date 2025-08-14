import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";

import { CodeInterface } from "@domain/authentication/OAuth/Authorization/Code/Code.interface";

@Injectable()
export class AuthorizationCodeService implements CodeInterface {
  generateAuthorizationCode(): string {
    const random = randomBytes(32);
    return random.toString("base64url");
  }
}
