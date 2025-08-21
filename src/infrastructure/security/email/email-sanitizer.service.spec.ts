import { Test, TestingModule } from "@nestjs/testing";

import { EmailSanitizerService } from "./email-sanitizer.service";

describe("EmailSanitizerService", () => {
  let service: EmailSanitizerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailSanitizerService],
    }).compile();

    service = module.get<EmailSanitizerService>(EmailSanitizerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("sanitizeEmail", () => {
    describe("valid emails", () => {
      it("should sanitize a basic valid email", () => {
        const result = service.sanitizeEmail("test@example.com");

        expect(result.sanitizedEmail).toBe("test@example.com");
        expect(result.originalEmail).toBe("test@example.com");
        expect(result.message).toBeNull();
      });

      it("should sanitize email with special characters in local part", () => {
        const result = service.sanitizeEmail(
          "test+tag!#$%&'*+-/=?^_`{|}~@example.com",
        );

        expect(result.sanitizedEmail).toBe(
          "test+tag!#$%&'*+-/=?^_`{|}~@example.com",
        );
        expect(result.message).toBeNull();
      });

      it("should sanitize email with dots in local part", () => {
        const result = service.sanitizeEmail("test.name@example.com");

        expect(result.sanitizedEmail).toBe("test.name@example.com");
        expect(result.message).toBeNull();
      });

      it("should sanitize email with hyphens in domain", () => {
        const result = service.sanitizeEmail("test@my-domain.com");

        expect(result.sanitizedEmail).toBe("test@my-domain.com");
        expect(result.message).toBeNull();
      });

      it("should sanitize email with multiple domain levels", () => {
        const result = service.sanitizeEmail("test@sub.domain.example.com");

        expect(result.sanitizedEmail).toBe("test@sub.domain.example.com");
        expect(result.message).toBeNull();
      });

      it("should sanitize email with numbers in domain", () => {
        const result = service.sanitizeEmail("test@example123.com");

        expect(result.sanitizedEmail).toBe("test@example123.com");
        expect(result.message).toBeNull();
      });

      it("should sanitize email with mixed case", () => {
        const result = service.sanitizeEmail("Test.User@EXAMPLE.COM");

        expect(result.sanitizedEmail).toBe("Test.User@EXAMPLE.COM");
        expect(result.message).toBeNull();
      });
    });

    describe("email too short", () => {
      it("should reject email with length less than 6", () => {
        const result = service.sanitizeEmail("a@b");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("a@b");
        expect(result.message).toBe("email_too_short");
      });

      it("should reject empty string", () => {
        const result = service.sanitizeEmail("");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("");
        expect(result.message).toBe("email_too_short");
      });

      it("should reject single character", () => {
        const result = service.sanitizeEmail("a");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("a");
        expect(result.message).toBe("email_too_short");
      });
    });

    describe("email no at", () => {
      it("should reject email without @ symbol", () => {
        const result = service.sanitizeEmail("testexample.com");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("testexample.com");
        expect(result.message).toBe("email_no_at");
      });

      it("should reject email with @ at the beginning", () => {
        const result = service.sanitizeEmail("@example.com");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("@example.com");
        expect(result.message).toBe("email_no_at");
      });
    });

    describe("local invalid chars", () => {
      it("should reject email with invalid characters in local part", () => {
        const result = service.sanitizeEmail("test space@example.com");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("test space@example.com");
        expect(result.message).toBe("local_invalid_chars");
      });

      it("should reject email with only invalid characters in local part", () => {
        const result = service.sanitizeEmail("   @example.com");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("   @example.com");
        expect(result.message).toBe("local_invalid_chars");
      });

      it("should reject email with special characters not allowed in local part", () => {
        const result = service.sanitizeEmail("test,user@example.com");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("test,user@example.com");
        expect(result.message).toBe("local_invalid_chars");
      });
    });

    describe("domain period sequence", () => {
      it("should reject email with consecutive periods in domain", () => {
        const result = service.sanitizeEmail("test@example..com");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("test@example..com");
        expect(result.message).toBe("domain_period_sequence");
      });

      it("should reject email with multiple consecutive periods", () => {
        const result = service.sanitizeEmail("test@example...com");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("test@example...com");
        expect(result.message).toBe("domain_period_sequence");
      });

      it("should reject email with only periods in domain", () => {
        const result = service.sanitizeEmail("test@....");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("test@....");
        expect(result.message).toBe("domain_period_sequence");
      });
    });

    describe("domain period limits", () => {
      it("should reject email with leading period in domain", () => {
        const result = service.sanitizeEmail("test@.example.com");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("test@.example.com");
        expect(result.message).toBe("domain_period_limits");
      });

      it("should reject email with trailing period in domain", () => {
        const result = service.sanitizeEmail("test@example.com.");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("test@example.com.");
        expect(result.message).toBe("domain_period_limits");
      });

      it("should reject email with only period in domain", () => {
        const result = service.sanitizeEmail("test@.");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("test@.");
        expect(result.message).toBe("domain_period_limits");
      });

      it("should reject email with whitespace around domain", () => {
        const result = service.sanitizeEmail("test@ example.com ");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("test@ example.com ");
        expect(result.message).toBe("domain_period_limits");
      });
    });

    describe("domain no periods", () => {
      it("should reject email with single domain part", () => {
        const result = service.sanitizeEmail("test@example");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("test@example");
        expect(result.message).toBe("domain_no_periods");
      });

      it("should reject email with empty domain parts", () => {
        const result = service.sanitizeEmail("test.test.test@");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("test.test.test@");
        expect(result.message).toBe("domain_no_periods");
      });
    });

    describe("domain no valid subs", () => {
      it("should reject email with invalid characters in domain parts", () => {
        const result = service.sanitizeEmail("test@ex&mple.com");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("test@ex&mple.com");
        expect(result.message).toBe("domain_no_valid_subs");
      });

      it("should reject email with only hyphens in domain parts", () => {
        const result = service.sanitizeEmail("test@---.com");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("test@---.com");
        expect(result.message).toBe("domain_no_valid_subs");
      });

      it("should reject email with empty domain parts after sanitization", () => {
        const result = service.sanitizeEmail("test@&.com");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("test@&.com");
        expect(result.message).toBe("domain_no_valid_subs");
      });
    });

    describe("edge cases and sanitization", () => {
      it("should sanitize email with leading/trailing hyphens in domain parts", () => {
        const result = service.sanitizeEmail("test@-example-.com");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("test@-example-.com");
        expect(result.message).toBe("domain_no_valid_subs");
      });

      it("should sanitize email with mixed valid and invalid characters", () => {
        const result = service.sanitizeEmail("test@ex&mple.com");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("test@ex&mple.com");
        expect(result.message).toBe("domain_no_valid_subs");
      });

      it("should handle email with multiple @ symbols", () => {
        const result = service.sanitizeEmail("test@example@domain.com");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("test@example@domain.com");
        expect(result.message).toBe("domain_no_periods");
      });

      it("should sanitize email with spaces before @", () => {
        const result = service.sanitizeEmail("test @example.com");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("test @example.com");
        expect(result.message).toBe("local_invalid_chars");
      });

      it("should sanitize email with spaces after @", () => {
        const result = service.sanitizeEmail("test@ example.com");

        expect(result.sanitizedEmail).toBe("");
        expect(result.originalEmail).toBe("test@ example.com");
        expect(result.message).toBe("domain_period_limits");
      });

      it("should handle very long but valid email", () => {
        const longLocal = "a".repeat(64);
        const longDomain = "b".repeat(63) + ".com";
        const email = `${longLocal}@${longDomain}`;

        const result = service.sanitizeEmail(email);

        expect(result.sanitizedEmail).toBe(email);
        expect(result.message).toBeNull();
      });
    });
  });

  describe("isValidEmail", () => {
    it("should return true for valid emails", () => {
      expect(service.isValidEmail("test@example.com")).toBe(true);
      expect(service.isValidEmail("user+tag@domain.co.uk")).toBe(true);
      expect(service.isValidEmail("test.name@example.com")).toBe(true);
    });

    it("should return false for invalid emails", () => {
      expect(service.isValidEmail("")).toBe(false);
      expect(service.isValidEmail("invalid")).toBe(false);
      expect(service.isValidEmail("@example.com")).toBe(false);
      expect(service.isValidEmail("test@")).toBe(false);
      expect(service.isValidEmail("test@example..com")).toBe(false);
    });
  });

  describe("sanitizeEmailOrThrow", () => {
    it("should return sanitized email for valid input", () => {
      const result = service.sanitizeEmailOrThrow("test@example.com");
      expect(result).toBe("test@example.com");
    });

    it("should throw error for invalid email", () => {
      expect(() => {
        service.sanitizeEmailOrThrow("invalid");
      }).toThrow("Invalid email: email_no_at");
    });

    it("should throw error for email too short", () => {
      expect(() => {
        service.sanitizeEmailOrThrow("a@b");
      }).toThrow("Invalid email: email_too_short");
    });

    it("should throw error for email with invalid local part", () => {
      expect(() => {
        service.sanitizeEmailOrThrow("test space@example.com");
      }).toThrow("Invalid email: local_invalid_chars");
    });
  });

  describe("comprehensive test cases", () => {
    const validEmails = [
      "simple@example.com",
      "very.common@example.com",
      "disposable.style.email.with+symbol@example.com",
      "other.email-with-hyphen@example.com",
      "fully-qualified-domain@example.com",
      "user.name+tag+sorting@example.com",
      "x@example.com",
      "example-indeed@strange-example.com",
      "example@s.example",
      "test/test@test.com",
      "test@test.test",
      "1234567890123456789012345678901234567890123456789012345678901234+x@example.com",
    ];

    const invalidEmails = [
      "Abc.example.com", // No @ character
      "A@b@c@example.com", // Multiple @ characters
      'a"b(c)d,e:f;g<h>i[j\\k]l@example.com', // Invalid characters
      'just"not"right@example.com', // Quoted strings not allowed
      'this is"not\\allowed@example.com', // Spaces, quotes, and backslashes
      'this\\ still\\"not\\\\allowed@example.com', // Escaped characters
      "i_like_underscore@but_its_not_allow_in _this_part.example.com", // Underscore in domain
      "QA[icon]CHOCOLATE[icon]@test.com", // Square brackets
      "test@example..com", // Consecutive dots
      "test@.example.com", // Leading dot
      "test@example.com.", // Trailing dot
      "test@-example.com", // Leading hyphen
      "test@example-.com", // Trailing hyphen
      "test@example", // No TLD
      "test@", // No domain
      "@example.com", // No local part
      "test@ex@mple.com", // @ in domain
      "test@ex ample.com", // Space in domain
      "test @example.com", // Space before @
      "test@ example.com", // Space after @
      "test@example.com ", // Trailing space
      " test@example.com", // Leading space
      "test@example.com\n", // Newline
      "test@example.com\r", // Carriage return
      "test@example.com\t", // Tab
      "test@example.com\0", // Null byte
      "test@example.com\b", // Backspace
      "test@example.com\f", // Form feed
      "test@example.com\v", // Vertical tab
      "test@example.com\u0000", // Unicode null
      "test@example.com\u0001", // Unicode control
      "test@example.com\u007F", // Unicode delete
      "test@example.com\u0080", // Unicode control
      "test@example.com\u009F", // Unicode control
      "test@example.com\u00A0", // Unicode non-breaking space
      "test@example.com\u2000", // Unicode en quad
      "test@example.com\u2001", // Unicode em quad
      "test@example.com\u2002", // Unicode en space
      "test@example.com\u2003", // Unicode em space
      "test@example.com\u2004", // Unicode three-per-em space
      "test@example.com\u2005", // Unicode four-per-em space
      "test@example.com\u2006", // Unicode six-per-em space
      "test@example.com\u2007", // Unicode figure space
      "test@example.com\u2008", // Unicode punctuation space
      "test@example.com\u2009", // Unicode thin space
      "test@example.com\u200A", // Unicode hair space
      "test@example.com\u2028", // Unicode line separator
      "test@example.com\u2029", // Unicode paragraph separator
      "test@example.com\u202F", // Unicode narrow no-break space
      "test@example.com\u205F", // Unicode medium mathematical space
      "test@example.com\u3000", // Unicode ideographic space
      "test@example.com\uFEFF", // Unicode zero width no-break space
      "test@example.com\uFFFD", // Unicode replacement character
    ];

    it("should handle all valid email examples", () => {
      for (const email of validEmails) {
        const result = service.sanitizeEmail(email);
        expect(result.message).toBeNull();
        expect(result.sanitizedEmail).not.toBe("");
      }
    });

    it("should reject all invalid email examples", () => {
      for (const email of invalidEmails) {
        const result = service.sanitizeEmail(email);
        expect(result.message).not.toBeNull();
        expect(result.sanitizedEmail).toBe("");
      }
    });

    it("should correctly identify valid emails with isValidEmail", () => {
      for (const email of validEmails) {
        expect(service.isValidEmail(email)).toBe(true);
      }
    });

    it("should correctly identify invalid emails with isValidEmail", () => {
      for (const email of invalidEmails) {
        expect(service.isValidEmail(email)).toBe(false);
      }
    });
  });
});
