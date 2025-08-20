import { ForbiddenException, Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

import { AuthConfig } from "@infrastructure/config/configs";

@Injectable()
export class AuthorizationMiddleware implements NestMiddleware {
  constructor(private readonly authConfig: AuthConfig) {}

  use(req: Request, res: Response, next: NextFunction): void {
    /**
     * Ref: https://expressjs.com/en/api.html#req.originalUrl
     */
    const path = req.originalUrl.split("?")[0];

    if (this.isPathForbidden(path)) {
      throw new ForbiddenException("Forbidden", {
        cause: `Path "${path}" is configured as forbidden in current environment.`,
      });
    }

    return next();
  }

  private isPathForbidden(path: string): boolean {
    return this.authConfig.forbiddenPaths.some((forbiddenPath) => {
      // Exact match
      if (forbiddenPath === path) {
        return true;
      }
      // Wildcard match (if path ends with *)
      if (forbiddenPath.endsWith("*")) {
        const prefix = forbiddenPath.slice(0, -1);
        return path.startsWith(prefix);
      }
      return false;
    });
  }
}
