import { DefaultLayoutBuilder } from "@infrastructure/template/layouts/page-default";

export const choicePage = (
  {
    title,
    clientName,
    accessDeniedUrl,
    authorizeUrl,
    registerUrl,
  }: {
    title: string;
    clientName: string;
    accessDeniedUrl: string;
    authorizeUrl: string;
    registerUrl: string;
  },
  builder: DefaultLayoutBuilder,
) => {
  return builder
    .header({
      title: `Action Required | ${title}`,
      headerTitle: "Action Required",
      headerSubtitle: `Application "${clientName}" is requesting access to your account`,
    })
    .nextSteps({
      nextSteps: [
        {
          text: "Authorize, if you already have an account",
        },
        {
          text: "Register, if you don't",
        },
        {
          text: "Return, if you don't know how you ended on this page",
        },
      ],
    })
    .actions({
      actions: [
        {
          href: authorizeUrl,
          class: "btn-primary",
          text: "Authorize",
        },
        {
          href: registerUrl,
          class: "btn-primary",
          text: "Register",
        },
        {
          href: accessDeniedUrl,
          class: "btn-secondary",
          text: "Return",
        },
      ],
    });
};
