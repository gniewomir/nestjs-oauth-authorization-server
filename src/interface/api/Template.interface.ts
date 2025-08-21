export interface TemplateInterface {
  renderTemplate({
    path,
    data,
    cacheKey,
  }: {
    path: string;
    data: Record<string, unknown>;
    cacheKey?: string;
  }): Promise<string>;
}

export const TemplateInterfaceSymbol = Symbol.for("TemplateInterface");
