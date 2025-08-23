import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

import { CsrfService } from "./csrf.service";

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  constructor(private readonly csrfService: CsrfService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Only protect POST requests to OAuth prompt endpoint
    if (req.method === "POST" && req.path === "/oauth/prompt") {
      const body = req.body as Record<string, unknown>;
      const requestId =
        typeof body.request_id === "string" ? body.request_id : undefined;
      const csrfToken = typeof body._csrf === "string" ? body._csrf : undefined;

      if (!requestId || !csrfToken) {
        throw new BadRequestException("Missing CSRF token or request ID");
      }

      if (!this.csrfService.validateToken(requestId, csrfToken)) {
        throw new BadRequestException("Invalid CSRF token");
      }
    }

    next();
  }
}
