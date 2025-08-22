import { BadRequestException, Controller, Get } from "@nestjs/common";
import { v4 } from "uuid";

import { DefaultLayoutService } from "@infrastructure/template";
import { exceptionAsJsonString } from "@interface/api/utility/exception";

@Controller("dev")
export class DevController {
  constructor(private readonly defaultLayoutService: DefaultLayoutService) {}

  @Get("ok")
  getStatus(): string {
    return "OK";
  }

  @Get("prompt")
  getAuthorizePrompt(): Promise<string> {
    return this.defaultLayoutService.renderPageBuilder(
      this.defaultLayoutService
        .createPageBuilder()
        .header({
          title: "Authorization Required",
          headerTitle: "Authorization Required",
          headerSubtitle:
            'Application "{{clientName}}" is requesting access to your account',
        })
        .form({
          formTitle: "Sign In",
          formId: "authorize",
          formAction: "/dev/prompt",
          formHiddenFields: [
            {
              name: "RequestId",
              value: v4(),
            },
          ],
          formFields: [
            {
              id: "email",
              name: "email",
              type: "email",
              label: "Email Address",
              required: true,
              error: "Email failed validation.",
            },
            {
              id: "password",
              name: "password",
              type: "password",
              label: "Password",
              required: true,
            },
          ],
          rememberMe: true,
          formActions: [
            {
              name: "authorize",
              value: "authorize",
              class: "btn-primary",
              id: "authorizeBtn",
              text: "Authorize",
            },
            {
              name: "deny",
              value: "deny",
              class: "btn-secondary",
              id: "denyBtn",
              text: "Deny",
            },
          ],
        }),
    );
  }

  @Get("register")
  getRegister(): string {
    return "OK";
  }

  @Get("error")
  getError(): Promise<string> {
    return this.defaultLayoutService.renderPageBuilder(
      this.defaultLayoutService
        .createPageBuilder()
        .header({
          title: "Error",
          headerTitle: "Oops! Something went wrong",
          headerSubtitle: "We encountered an unexpected error",
        })
        .error({
          errorMessage: "something something invalid request",
          errorName: "BadRequestException",
          errorStatus: 400,
          errorDetails: exceptionAsJsonString(
            new BadRequestException("something", {
              cause: "something",
              description: "something",
            }),
          ),
        })
        .actions({
          actions: [
            {
              class: "btn-primary",
              href: "https//google.pl",
              text: "Return something",
            },
          ],
        }),
    );
  }

  @Get("success")
  getSuccess(): string {
    return "OK";
  }
}
