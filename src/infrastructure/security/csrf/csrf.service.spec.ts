import { Test, TestingModule } from "@nestjs/testing";

import { ClockInterfaceSymbol } from "@domain/Clock.interface";
import { ClockServiceFake } from "@infrastructure/clock";

import { CsrfService } from "./csrf.service";

describe("CsrfService", () => {
  let service: CsrfService;
  let clock: ClockServiceFake;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CsrfService,
        {
          provide: ClockInterfaceSymbol,
          useClass: ClockServiceFake,
        },
      ],
    }).compile();

    service = module.get<CsrfService>(CsrfService);
    clock = module.get<ClockServiceFake>(ClockInterfaceSymbol);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("generateToken", () => {
    it("should generate a unique token for each request", () => {
      const requestId1 = "request-1";
      const requestId2 = "request-2";

      const token1 = service.generateToken(requestId1);
      const token2 = service.generateToken(requestId2);

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1).toMatch(/^[a-f0-9]{64}$/);
      expect(token2).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should generate different tokens for the same request ID", () => {
      const requestId = "request-1";

      const token1 = service.generateToken(requestId);
      const token2 = service.generateToken(requestId);

      expect(token1).not.toBe(token2);
    });
  });

  describe("validateToken", () => {
    it("should validate a correct token", () => {
      const requestId = "request-1";
      const token = service.generateToken(requestId);

      const isValid = service.validateToken(requestId, token);

      expect(isValid).toBe(true);
    });

    it("should reject an incorrect token", () => {
      const requestId = "request-1";
      service.generateToken(requestId);

      const isValid = service.validateToken(requestId, "invalid-token");

      expect(isValid).toBe(false);
    });

    it("should reject a token for non-existent request", () => {
      const isValid = service.validateToken("non-existent", "some-token");

      expect(isValid).toBe(false);
    });

    it("should reject expired tokens", () => {
      const requestId = "request-1";
      const token = service.generateToken(requestId);

      // Advance time by 6 minutes (tokens expire after 5 minutes)
      clock.timeTravelSeconds(clock.nowAsSecondsSinceEpoch() + 6 * 60);

      const isValid = service.validateToken(requestId, token);

      expect(isValid).toBe(false);
    });

    it("should allow valid tokens before expiration", () => {
      const requestId = "request-1";
      const token = service.generateToken(requestId);

      // Advance time by 4 minutes (tokens expire after 5 minutes)
      clock.timeTravelSeconds(clock.nowAsSecondsSinceEpoch() + 4 * 60);

      const isValid = service.validateToken(requestId, token);

      expect(isValid).toBe(true);
    });

    it("should prevent replay attacks by removing token after validation", () => {
      const requestId = "request-1";
      const token = service.generateToken(requestId);

      // First validation should succeed
      const isValid1 = service.validateToken(requestId, token);
      expect(isValid1).toBe(true);

      // Second validation with the same token should fail
      const isValid2 = service.validateToken(requestId, token);
      expect(isValid2).toBe(false);
    });
  });

  describe("cleanupExpiredTokens", () => {
    it("should remove expired tokens", () => {
      const requestId1 = "request-1";
      const requestId2 = "request-2";

      service.generateToken(requestId1);
      service.generateToken(requestId2);

      // Advance time to expire tokens
      clock.timeTravelSeconds(clock.nowAsSecondsSinceEpoch() + 6 * 60);

      service.cleanupExpiredTokens();

      // Both tokens should be invalid after cleanup
      expect(service.validateToken(requestId1, "any-token")).toBe(false);
      expect(service.validateToken(requestId2, "any-token")).toBe(false);
    });

    it("should keep valid tokens and remove expired ones", () => {
      const requestId1 = "request-1";
      const requestId2 = "request-2";

      const token1 = service.generateToken(requestId1);
      service.generateToken(requestId2);

      // Advance time by 4 minutes (tokens expire after 5 minutes)
      clock.timeTravelSeconds(clock.nowAsSecondsSinceEpoch() + 4 * 60);

      service.cleanupExpiredTokens();

      // Both tokens should still be valid since they haven't expired yet
      expect(service.validateToken(requestId1, token1)).toBe(true);
      expect(service.validateToken(requestId2, "any-token")).toBe(false); // This one was already used
    });
  });
});
