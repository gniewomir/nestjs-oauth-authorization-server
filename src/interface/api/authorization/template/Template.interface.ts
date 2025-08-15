export interface TemplateInterface {
  renderTemplate(path: string, data: Record<string, unknown>): Promise<string>;
}

export const TemplateInterfaceSymbol = Symbol.for("TemplateInterface");
