import * as assert from "node:assert";

import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { clientMother, userMother } from "@test/domain/authentication";
import * as supertest from "supertest";
import { App } from "supertest/types";

import { AppModule } from "@application/app";
import {
  ClientInterfaceSymbol,
  PasswordInterfaceSymbol,
  TClientConstructorParam,
  TUserConstructorParam,
  UsersInterfaceSymbol,
} from "@domain/auth/OAuth";
import {
  ClientDomainRepository,
  UserDomainRepository,
} from "@infrastructure/repositories/domain";
import { PasswordService } from "@infrastructure/security/password";
import { PKCEServiceFake } from "@infrastructure/security/pkce";

export class OauthE2eTestContext {
  private constructor(private readonly app: INestApplication<App>) {}

  public static async create() {
    const app = (
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile()
    ).createNestApplication<INestApplication<App>>();
    await app.listen(0);
    return new OauthE2eTestContext(app);
  }

  public async teardown() {
    return this.app.close();
  }

  public getApp(): INestApplication<App> {
    return this.app;
  }

  public async createClient(params: Partial<TClientConstructorParam>) {
    const clients = this.app.get<ClientDomainRepository>(ClientInterfaceSymbol);
    await clients.persist(clientMother(params));
  }

  public async createUser(
    params: Partial<Omit<TUserConstructorParam, "password">> & {
      plaintextPassword: string;
    },
  ) {
    const users = this.app.get<UserDomainRepository>(UsersInterfaceSymbol);
    const passwords = this.app.get<PasswordService>(PasswordInterfaceSymbol);
    const { plaintextPassword, ...rest } = params;
    const hashedPassword =
      await passwords.hashPlaintextPassword(plaintextPassword);
    await users.persist(userMother({ ...rest, password: hashedPassword }));
  }

  public createState() {
    return `state-${Date.now()}-${Math.random()}`;
  }

  public createPKCECodeChallenge() {
    const generator = new PKCEServiceFake();
    const verifier = generator.generateCodeVerifier();
    const challenge = generator.generateChallenge(verifier);
    return {
      verifier,
      challenge,
    };
  }

  static extractRequestIdFromUrl(url: string): string {
    return OauthE2eTestContext.extractParamFromUrl(url, "request_id");
  }

  static extractIntentFromUrl(url: string): string {
    return OauthE2eTestContext.extractParamFromUrl(url, "intent");
  }

  static extractCodeFromUrl(url: string): string {
    return OauthE2eTestContext.extractParamFromUrl(url, "code");
  }

  static extractStateFromUrl(url: string): string {
    return OauthE2eTestContext.extractParamFromUrl(url, "state");
  }

  static extractParamFromUrl(url: string, paramName: string): string {
    const [, query] = url.split("?");
    const queryParams = query.split("&");
    const param = queryParams.find((val) => val.startsWith(`${paramName}=`));
    assert(param !== undefined);
    return param.slice(param.indexOf("=") + 1);
  }

  static extractCSRFToken(res: supertest.Response): string {
    const match = res.text.match(/name="_csrf" value="([^"]+)"/);
    assert(match && typeof match[1] === "string");
    return match[1];
  }

  static assertIsAuthorizationForm(res: supertest.Response) {
    expect(res.text).toContain("Authorization Required");
    expect(res.text).toContain("Sign In");
    expect(res.text).toContain('id="authorize"');
  }
}
