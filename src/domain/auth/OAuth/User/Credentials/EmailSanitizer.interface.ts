import { EmailSanitizationResult } from "@infrastructure/security/email";

export interface EmailSanitizerInterface {
  isValidEmail(email: string): boolean;
  sanitizeEmail(email: string): EmailSanitizationResult;
}

export const EmailSanitizerInterfaceSymbol = Symbol.for(
  "EmailSanitizerInterface",
);
