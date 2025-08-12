import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";

@Injectable()
export class AuthorizationCodeService {
  generateAuthorizationCode(): string {
    const random = randomBytes(32);
    return random.toString("base64url");
  }
}
