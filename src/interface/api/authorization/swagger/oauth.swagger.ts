import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

export const OAUTH_SWAGGER_TAGS = {
  OAUTH2: "OAuth2 Authorization",
} as const;

export const OAUTH_SWAGGER_OPERATIONS = {
  AUTHORIZE: {
    summary: "OAuth2 Authorization Endpoint",
    description: "Initiates OAuth2 Authorization Code flow with PKCE",
  },
  PROMPT: {
    summary: "OAuth2 Authorization Prompt",
    description: "Handles user authentication and consent for OAuth2 flow",
  },
  TOKEN: {
    summary: "OAuth2 Token Endpoint",
    description:
      "Exchanges authorization code for tokens or refreshes access tokens",
  },
} as const;

export const OAUTH_SWAGGER_RESPONSES = {
  NOT_IMPLEMENTED: {
    status: 501,
    description: "Not implemented",
  },
  BAD_REQUEST: {
    status: 400,
    description: "Bad request - invalid parameters",
  },
  UNAUTHORIZED: {
    status: 401,
    description: "Unauthorized - invalid credentials",
  },
} as const;
