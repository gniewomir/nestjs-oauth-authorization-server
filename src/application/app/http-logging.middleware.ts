import { Inject, Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

import { LoggerInterface, LoggerInterfaceSymbol } from "@infrastructure/logger";

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  constructor(
    @Inject(LoggerInterfaceSymbol) private readonly logger: LoggerInterface,
  ) {
    this.logger.setContext("HttpLoggingMiddleware");
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers["user-agent"] || "unknown";

    res.on("finish", () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      this.logger.info({
        message: `${method.toUpperCase()} ${originalUrl.split("?")[0]}`,
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
        ip,
        userAgent,
      });
    });

    next();
  }
}
