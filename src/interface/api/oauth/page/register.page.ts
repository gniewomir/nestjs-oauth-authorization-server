import { IntentEnum } from "@domain/auth/OAuth";
import { DefaultLayoutBuilder } from "@infrastructure/template/layouts/page-default";
import {
  isEmailErrorCode,
  isPasswordErrorCode,
  userErrorCodeToMessage,
} from "@interface/api/utility";

export const registerPage = (
  {
    title,
    requestId,
    csrfToken,
    error,
    sanitizedEmail,
  }: {
    title: string;
    requestId: string;
    csrfToken: string;
    error?: string;
    sanitizedEmail?: string;
  },
  builder: DefaultLayoutBuilder,
) => {
  return builder
    .header({
      title: `User Registration | ${title}`,
      headerTitle: "Create Account",
      headerSubtitle: `Gain access to our services`,
    })
    .form({
      formAction: `/oauth/prompt`,
      formTitle: "Register",
      formId: "authorize",
      formHiddenFields: [
        {
          name: "request_id",
          value: requestId,
        },
        {
          name: "intent",
          value: IntentEnum.AUTHORIZE_NEW_USER,
        },
        {
          name: "_csrf",
          value: csrfToken,
        },
      ],
      formFields: [
        {
          id: "email",
          name: "email",
          type: "email",
          label: "Email Address",
          required: true,
          error: isEmailErrorCode(error)
            ? userErrorCodeToMessage(error)
            : undefined,
          value: sanitizedEmail ? sanitizedEmail : undefined,
        },
        {
          id: "password",
          name: "password",
          type: "password",
          label: "Password",
          required: true,
          error: isPasswordErrorCode(error)
            ? userErrorCodeToMessage(error)
            : undefined,
        },
      ],
      infoBox: {
        title: "Account Information",
        items: [
          {
            name: "•",
            description: "Your email will be used for account verification",
          },
          {
            name: "•",
            description:
              "Password must have 12 or more characters - and half needs to be unique",
          },
          {
            name: "•",
            description: "You can update your information later",
          },
        ],
      },
      formActions: [
        {
          name: "action",
          value: "create",
          class: "btn-primary",
          id: "createBtn",
          text: "Create Account",
        },
      ],
    });
};
