import { Injectable } from "@nestjs/common";
import { randomBytes, randomUUID } from "crypto";

import { CodeInterface } from "@domain/auth/OAuth/Authorization/Code/Code.interface";

@Injectable()
export class AuthorizationCodeService implements CodeInterface {
  generateAuthorizationCode(): string {
    // Enhanced entropy with multiple sources
    const random = randomBytes(32);
    const timestamp = Date.now().toString(36);
    const entropy = randomBytes(8).toString("hex");
    const uuid = randomUUID().replace(/-/g, "").substring(0, 16);

    // Create a more unique code
    return `${random.toString("base64url")}.${timestamp}.${entropy}.${uuid}`;
  }
}
