import { Injectable } from "@nestjs/common";

export type EmailSanitizationResult = {
  sanitizedEmail: string;
  originalEmail: string;
  message: string | null;
};

export type EmailSanitizationError =
  | "email_too_short"
  | "email_no_at"
  | "local_invalid_chars"
  | "domain_period_sequence"
  | "domain_period_limits"
  | "domain_no_periods"
  | "domain_no_valid_subs"
  | "domain_has_invalid_subs"
  | "email_not_equal_sanitized";

@Injectable()
export class EmailSanitizerService {
  /**
   * Sanitizes an email address according to WordPress-like validation rules.
   *
   * @param email - The email address to sanitize
   * @returns EmailSanitizationResult with sanitized email or empty string if invalid
   */
  sanitizeEmail(email: string): EmailSanitizationResult {
    const originalEmail = email;

    // Test for the minimum length the email can be
    if (email.length < 6) {
      return {
        sanitizedEmail: "",
        originalEmail,
        message: "email_too_short",
      };
    }

    // Test for an @ character after the first position
    const atIndex = email.indexOf("@", 1);
    if (atIndex === -1) {
      return {
        sanitizedEmail: "",
        originalEmail,
        message: "email_no_at",
      };
    }

    // Split out the local and domain parts
    const [local, domain] = email.split("@", 2);

    /*
     * LOCAL PART
     * Test for invalid characters.
     */
    const sanitizedLocal = local.replace(
      /[^a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]/g,
      "",
    );
    if (sanitizedLocal !== local) {
      return {
        sanitizedEmail: "",
        originalEmail,
        message: "local_invalid_chars",
      };
    }

    /*
     * DOMAIN PART
     * Test for sequences of periods.
     */
    let sanitizedDomain = domain.replace(/\.{2,}/g, "");
    if (sanitizedDomain !== domain) {
      return {
        sanitizedEmail: "",
        originalEmail,
        message: "domain_period_sequence",
      };
    }

    // Test for leading and trailing periods and whitespace
    sanitizedDomain = this.trimAny(sanitizedDomain, ". \t\n\r\0\x0B");
    if (sanitizedDomain !== domain) {
      return {
        sanitizedEmail: "",
        originalEmail,
        message: "domain_period_limits",
      };
    }

    // Split the domain into subs
    const subs = sanitizedDomain.split(".");

    // Assume the domain will have at least two subs
    if (subs.length < 2) {
      return {
        sanitizedEmail: "",
        originalEmail,
        message: "domain_no_periods",
      };
    }

    // Create an array that will contain valid subs
    const validSubs: string[] = [];

    // Loop through each sub
    for (const sub of subs) {
      // Test for leading and trailing hyphens
      let sanitizedSub = this.trimAny(sub, "-");

      // Test for invalid characters
      sanitizedSub = sanitizedSub.replace(/[^a-z0-9-]+/gi, "");

      // If no changes have been made, store as valid sub
      if (sanitizedSub === sub) {
        validSubs.push(sanitizedSub);
      }
    }

    // If there aren't 2 or more valid subs
    if (validSubs.length < 2) {
      return {
        sanitizedEmail: "",
        originalEmail,
        message: "domain_no_valid_subs",
      };
    }

    // Sanitized subs are shorter than found subs
    if (validSubs.length !== subs.length) {
      return {
        sanitizedEmail: "",
        originalEmail,
        message: "domain_has_invalid_subs",
      };
    }

    // Join valid subs into the new domain
    const finalDomain = validSubs.join(".");

    // Put the email back together
    const sanitizedEmail = sanitizedLocal + "@" + finalDomain;

    if (email !== sanitizedEmail) {
      return {
        sanitizedEmail: "",
        originalEmail,
        message: "email_not_equal_sanitized",
      };
    }

    // Congratulations, your email made it!
    return {
      sanitizedEmail,
      originalEmail,
      message: null,
    };
  }

  /**
   * Checks if an email is valid according to the sanitization rules
   *
   * @param email - The email address to validate
   * @returns true if the email is valid, false otherwise
   */
  isValidEmail(email: string): boolean {
    const result = this.sanitizeEmail(email);
    return result.message === null && result.sanitizedEmail !== "";
  }

  /**
   * Gets the sanitized email or throws an error if invalid
   *
   * @param email - The email address to sanitize
   * @returns The sanitized email string
   * @throws Error if the email is invalid
   */
  sanitizeEmailOrThrow(email: string): string {
    const result = this.sanitizeEmail(email);
    if (result.message !== null) {
      throw new Error(`Invalid email: ${result.message}`);
    }
    return result.sanitizedEmail;
  }

  private trimAny(str: string, chars: string) {
    let start = 0;
    let end = str.length;

    while (start < end && chars.indexOf(str[start]) >= 0) ++start;

    while (end > start && chars.indexOf(str[end - 1]) >= 0) --end;

    return start > 0 || end < str.length ? str.substring(start, end) : str;
  }
}
