import * as path from "node:path";

type TFormHiddenField = {
  name: string;
  value: string;
};

type TFormField = {
  id: string;
  name: string;
  type: string;
  label: string;
  required: boolean;
  error?: string;
  tip?: string;
};

type TFormAction = {
  name: string;
  value: string;
  class: string;
  id: string;
  text: string;
};

type TInfoBox = {
  title: string;
  items: {
    name: string;
    description: string;
  }[];
};

type THeaderOptions = {
  title: string;
  headerTitle: string;
  headerSubtitle: string;
};

type TFormOptions = {
  form: boolean;
  formTitle: string;
  formAction: string;
  formId: string;
  formHiddenFields: TFormHiddenField[];
  formFields: TFormField[];
  rememberMe: boolean;
  infoBox?: TInfoBox;
  formActions: TFormAction[];
};

type TErrorOptions = {
  error: true;
  errorStatus: number;
  errorName: string;
  errorMessage?: string;
  errorDetails?: string;
};

type TActionOptions = {
  href: string;
  class: string;
  text: string;
};

type TActionsOptions = {
  actions: TActionOptions[];
};

type TLayoutData = THeaderOptions &
  TFormOptions &
  TErrorOptions &
  TActionsOptions;

export class DefaultLayoutBuilder {
  private data: Partial<TLayoutData> = {};

  public getTemplatePath(): string {
    return path.join(__dirname, "default.html");
  }

  public getData(): Partial<TLayoutData> {
    return this.data;
  }

  header(options: THeaderOptions): this {
    this.data = {
      ...this.data,
      ...options,
    };
    return this;
  }

  form(options: Omit<TFormOptions, "form">): this {
    this.data = {
      ...this.data,
      ...options,
      form: true,
    };
    return this;
  }

  error(options: Omit<TErrorOptions, "error">): this {
    this.data = {
      ...this.data,
      ...options,
      error: true,
    };
    return this;
  }

  actions(options: TActionsOptions): this {
    this.data = {
      ...this.data,
      ...options,
      error: true,
    };
    return this;
  }
}
