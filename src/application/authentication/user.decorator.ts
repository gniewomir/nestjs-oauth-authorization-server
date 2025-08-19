import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from "@nestjs/common";
import { Request } from "express";

import { Assert } from "@domain/Assert";
import { TokenPayload } from "@domain/auth/OAuth/Token/TokenPayload";

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TokenPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    Assert(
      typeof request.user !== "undefined",
      () =>
        new InternalServerErrorException(
          "Couldn't determine currently authenticated user",
          {
            cause:
              "Authenticated user is undefined. CurrentUser decorator must be used only on authentication middleware protected paths?",
          },
        ),
    );
    return request.user;
  },
);
