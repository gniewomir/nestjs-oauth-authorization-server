import { DefaultLayoutBuilder } from "@infrastructure/template/layouts/page-default";

export const errorPage = (
  {
    title,
    errorName,
    errorStatus,
    returnUrl,
  }: {
    title: string;
    errorStatus: number;
    errorName: string;
    returnUrl: string;
  },
  builder: DefaultLayoutBuilder,
) => {
  return builder
    .header({
      title: `Error | ${title}`,
      headerTitle: "Oops! Something went wrong",
      headerSubtitle: "We encountered an unexpected error",
    })
    .error({
      errorMessage: "Error has been logged - we will look into it",
      errorName,
      errorStatus,
    })
    .actions({
      actions: returnUrl
        ? [
            {
              class: "btn-primary",
              href: returnUrl,
              text: "Return",
            },
          ]
        : [],
    });
};
