import * as assert from "node:assert";

import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

import { TokenPayload } from "@domain/authentication/OAuth/Token/TokenPayload";
import { AppConfig, AuthConfig } from "@infrastructure/config/configs";

import { AuthenticationService } from "./authentication.service";

@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly authConfig: AuthConfig,
    private readonly appConfig: AppConfig,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    assert(
      req.protocol === "https" || this.appConfig.nodeEnv !== "production",
      "Only https protocol is allowed in production environment.",
    );

    /**
     * Ref: https://expressjs.com/en/api.html#req.originalUrl
     */
    const path = req.originalUrl.split("?")[0];

    if (this.isPathUnprotected(path)) {
      return next();
    }

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException(
        "Missing or invalid Authorization header",
      );
    }
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      // Attach the token payload to the request for use in controllers
      (req as Request & { user: TokenPayload }).user =
        await this.authenticationService.authenticate(token);

      next();
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired token", {
        cause: error,
      });
    }
  }

  private isPathUnprotected(path: string): boolean {
    return this.authConfig.authUnprotectedPaths.some((unprotectedPath) => {
      // Exact match
      if (unprotectedPath === path) {
        return true;
      }
      // Wildcard match (if path ends with *)
      if (unprotectedPath.endsWith("*")) {
        const prefix = unprotectedPath.slice(0, -1);
        return path.startsWith(prefix);
      }
      return false;
    });
  }
}

// Type augmentation to add user property to Request
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
