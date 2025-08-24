import { IntentEnum, TScopesDescription } from "@domain/auth/OAuth";
import { DefaultLayoutBuilder } from "@infrastructure/template/layouts/page-default";
import {
  isEmailErrorCode,
  isPasswordErrorCode,
  userErrorCodeToMessage,
} from "@interface/api/utility";

export const authorizePage = (
  {
    title,
    clientName,
    requestId,
    csrfToken,
    error,
    sanitizedEmail,
    allowRememberMe,
    requestedScopes,
  }: {
    title: string;
    clientName: string;
    requestId: string;
    csrfToken: string;
    error?: string;
    sanitizedEmail?: string;
    allowRememberMe: boolean;
    requestedScopes: TScopesDescription;
  },
  builder: DefaultLayoutBuilder,
) => {
  return builder
    .header({
      title: `Authorization Required | ${title}`,
      headerTitle: "Authorization Required",
      headerSubtitle: `Application "${clientName}" is requesting access to your account`,
    })
    .form({
      formTitle: "Sign In",
      formId: "authorize",
      formAction: `/oauth/prompt`,
      formHiddenFields: [
        {
          name: "request_id",
          value: requestId,
        },
        {
          name: "intent",
          value: IntentEnum.AUTHORIZE_EXISTING_USER,
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
          required: false,
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
          required: false,
          error: isPasswordErrorCode(error)
            ? userErrorCodeToMessage(error)
            : undefined,
        },
      ],
      rememberMe: allowRememberMe,
      infoBox: {
        title: "Permissions",
        items: requestedScopes.map(({ humanName, description }) => ({
          name: humanName,
          description,
        })),
      },
      formActions: [
        {
          name: "choice",
          value: "authorize",
          class: "btn-primary",
          id: "authorizeBtn",
          text: "Authorize",
        },
        {
          name: "choice",
          value: "deny",
          class: "btn-secondary",
          id: "denyBtn",
          text: "Deny",
        },
      ],
    });
};
