import { Module } from "@nestjs/common";

import { EmailSanitizerInterfaceSymbol } from "@domain/auth/OAuth/User/Credentials/EmailSanitizer.interface";

import { EmailSanitizerService } from "./email-sanitizer.service";

@Module({
  providers: [
    {
      provide: EmailSanitizerInterfaceSymbol,
      useClass: EmailSanitizerService,
    },
  ],
  exports: [EmailSanitizerInterfaceSymbol],
})
export class EmailSanitizerModule {}
