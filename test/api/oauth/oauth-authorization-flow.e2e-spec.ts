import { HttpStatus } from "@nestjs/common";
import { defaultTestClientScopesMother } from "@test/domain/authentication/ScopeValueImmutableSet.mother";
import * as request from "supertest";

import {
  CodeChallengeMethodsEnum,
  EmailValue,
  IntentEnum,
  RedirectUriValue,
} from "@domain/auth/OAuth";
import { IdentityValue } from "@domain/IdentityValue";
import { AuthorizeRequestDto } from "@interface/api/oauth/dto";

import { OauthE2eTestContext } from "./oauth-e2e.test-context";

describe("OAuth2 Authorization Code Flow (e2e)", () => {
  let context: OauthE2eTestContext;

  beforeAll(async () => {
    context = await OauthE2eTestContext.create();
  });

  afterAll(async () => {
    await context.teardown();
  });

  describe("Complete Authorization Code Flow", () => {
    it("should complete full OAuth2 Authorization Code flow with PKCE for existing user", async () => {
      const clientId = IdentityValue.create();
      const scope = defaultTestClientScopesMother();
      const redirectUri = RedirectUriValue.create(
        "https://client.com/callback",
        "production",
      );
      await context.createClient({
        id: clientId,
        scope,
        redirectUri,
      });
      const userId = IdentityValue.create();
      const userEmail = EmailValue.fromString(`${userId.toString()}@gmail.com`);
      const userPlaintextPassword = userId.toString();
      await context.createUser({
        identity: userId,
        plaintextPassword: userPlaintextPassword,
        email: userEmail,
      });
      const state = context.createState();
      const { challenge, verifier } = context.createPKCECodeChallenge();

      // Step 1: Authorization Request
      const createAuthorizationRequestResponse = await request(
        context.getApp().getHttpServer(),
      )
        .get("/oauth/authorize/")
        .query({
          client_id: clientId.toString(),
          response_type: "code",
          scope: scope.toString(),
          redirect_uri: redirectUri.toString(),
          state: state,
          code_challenge: challenge.toString(),
          code_challenge_method: CodeChallengeMethodsEnum.S256,
          intent: IntentEnum.AUTHORIZE_EXISTING_USER,
        } satisfies AuthorizeRequestDto)
        .expect(HttpStatus.TEMPORARY_REDIRECT);

      expect(createAuthorizationRequestResponse.headers.location).toContain(
        "/oauth/prompt",
      );
      const requestId = OauthE2eTestContext.extractRequestIdFromUrl(
        createAuthorizationRequestResponse.headers.location,
      );
      const intent = OauthE2eTestContext.extractIntentFromUrl(
        createAuthorizationRequestResponse.headers.location,
      );

      // Step 2: Get Authorization Prompt
      const getAuthorizationPromptResponse = await request(
        context.getApp().getHttpServer(),
      )
        .get(createAuthorizationRequestResponse.headers.location)
        .expect(HttpStatus.OK);

      OauthE2eTestContext.expectIsAuthorizationForm(
        getAuthorizationPromptResponse,
      );
      const csrfToken = OauthE2eTestContext.extractCSRFToken(
        getAuthorizationPromptResponse,
      );

      // Step 3: Submit Authorization Prompt (with valid credentials)
      const postAuthorizationPromptResponse = await request(
        context.getApp().getHttpServer(),
      )
        .post("/oauth/prompt")
        .set("Content-Type", "application/x-www-form-urlencoded")
        .send({
          request_id: requestId,
          intent,
          _csrf: csrfToken,
          email: userEmail.toString(),
          password: userPlaintextPassword,
          choice: "authorize",
          remember_me: false,
        })
        .expect(HttpStatus.FOUND); // Redirect with authorization code

      const code = OauthE2eTestContext.extractCodeFromUrl(
        postAuthorizationPromptResponse.headers.location,
      );

      expect(postAuthorizationPromptResponse.headers.location).toContain(
        redirectUri.toString(),
      );
      expect(
        OauthE2eTestContext.extractStateFromUrl(
          postAuthorizationPromptResponse.headers.location,
        ),
      ).toBe(state);

      // Step 4: Exchange Authorization Code for Tokens
      const tokenResponse = await request(context.getApp().getHttpServer())
        .post("/oauth/token")
        .set("Content-Type", "application/x-www-form-urlencoded")
        .send({
          grant_type: "authorization_code",
          client_id: clientId.toString(),
          code,
          code_verifier: verifier,
          redirect_uri: redirectUri.toString(),
        })
        .expect(201);

      expect(tokenResponse.body).toMatchObject({
        token_type: "Bearer",
        id_token: expect.any(String) as unknown as string,
        access_token: expect.any(String) as unknown as string,
        refresh_token: expect.any(String) as unknown as string,
        scope: scope.toString(),
      });
    });

    it("should complete full OAuth2 Authorization Code flow with PKCE for new user", async () => {
      const clientId = IdentityValue.create();
      const scope = defaultTestClientScopesMother();
      const redirectUri = RedirectUriValue.create(
        "https://client.com/callback",
        "production",
      );
      await context.createClient({
        id: clientId,
        scope,
        redirectUri,
      });
      const newUserEmail = EmailValue.fromString("newuser@example.com");
      const newUserPlaintextPassword = IdentityValue.create().toString();
      const state = context.createState();
      const { challenge, verifier } = context.createPKCECodeChallenge();

      // Step 1: Authorization Request for new user
      const createAuthorizationRequestResponse = await request(
        context.getApp().getHttpServer(),
      )
        .get("/oauth/authorize/")
        .query({
          client_id: clientId.toString(),
          response_type: "code",
          scope: scope.toString(),
          redirect_uri: redirectUri.toString(),
          state: state,
          code_challenge: challenge.toString(),
          code_challenge_method: CodeChallengeMethodsEnum.S256,
          intent: IntentEnum.AUTHORIZE_NEW_USER,
        } satisfies AuthorizeRequestDto)
        .expect(HttpStatus.TEMPORARY_REDIRECT);

      expect(createAuthorizationRequestResponse.headers.location).toContain(
        "/oauth/prompt",
      );
      const requestId = OauthE2eTestContext.extractRequestIdFromUrl(
        createAuthorizationRequestResponse.headers.location,
      );
      const intent = OauthE2eTestContext.extractIntentFromUrl(
        createAuthorizationRequestResponse.headers.location,
      );

      // Step 2: Get Registration Prompt
      const getRegistrationPromptResponse = await request(
        context.getApp().getHttpServer(),
      )
        .get(createAuthorizationRequestResponse.headers.location)
        .expect(HttpStatus.OK);

      OauthE2eTestContext.expectIsRegistrationForm(
        getRegistrationPromptResponse,
      );

      const csrfToken = OauthE2eTestContext.extractCSRFToken(
        getRegistrationPromptResponse,
      );

      // Step 3: Submit Registration
      const postRegistrationResponse = await request(
        context.getApp().getHttpServer(),
      )
        .post("/oauth/prompt")
        .set("Content-Type", "application/x-www-form-urlencoded")
        .send({
          request_id: requestId,
          intent,
          _csrf: csrfToken,
          email: newUserEmail.toString(),
          password: newUserPlaintextPassword,
          action: "create",
        })
        .expect(HttpStatus.FOUND);

      // Should redirect back to prompt for authorization
      expect(postRegistrationResponse.headers.location).toContain(
        "/oauth/prompt",
      );
      expect(postRegistrationResponse.headers.location).toContain(
        "intent=" + IntentEnum.AUTHORIZE_NEW_USER,
      );

      // Step 4: Continue with authorization flow after registration
      const getAuthorizationPromptResponse = await request(
        context.getApp().getHttpServer(),
      )
        .get("/oauth/prompt")
        .query({
          request_id: requestId,
          intent: IntentEnum.AUTHORIZE_EXISTING_USER,
        })
        .expect(HttpStatus.OK);

      OauthE2eTestContext.expectIsAuthorizationForm(
        getAuthorizationPromptResponse,
      );
      const authCsrfToken = OauthE2eTestContext.extractCSRFToken(
        getAuthorizationPromptResponse,
      );

      // Step 5: Submit Authorization for newly registered user
      const postAuthorizationPromptResponse = await request(
        context.getApp().getHttpServer(),
      )
        .post("/oauth/prompt")
        .set("Content-Type", "application/x-www-form-urlencoded")
        .send({
          request_id: requestId,
          intent: IntentEnum.AUTHORIZE_EXISTING_USER,
          _csrf: authCsrfToken,
          email: newUserEmail.toString(),
          password: newUserPlaintextPassword,
          choice: "authorize",
          remember_me: false,
        })
        .expect(HttpStatus.FOUND);

      const code = OauthE2eTestContext.extractCodeFromUrl(
        postAuthorizationPromptResponse.headers.location,
      );

      expect(postAuthorizationPromptResponse.headers.location).toContain(
        redirectUri.toString(),
      );
      expect(
        OauthE2eTestContext.extractStateFromUrl(
          postAuthorizationPromptResponse.headers.location,
        ),
      ).toBe(state);

      // Step 6: Exchange Authorization Code for Tokens
      const tokenResponse = await request(context.getApp().getHttpServer())
        .post("/oauth/token")
        .set("Content-Type", "application/x-www-form-urlencoded")
        .send({
          grant_type: "authorization_code",
          client_id: clientId.toString(),
          code,
          code_verifier: verifier,
          redirect_uri: redirectUri.toString(),
        })
        .expect(201);

      expect(tokenResponse.body).toMatchObject({
        token_type: "Bearer",
        id_token: expect.any(String) as unknown as string,
        access_token: expect.any(String) as unknown as string,
        refresh_token: expect.any(String) as unknown as string,
        scope: scope.toString(),
      });
    });
  });
});
