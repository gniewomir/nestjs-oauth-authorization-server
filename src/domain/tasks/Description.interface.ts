export interface DescriptionInterface {
  sanitize(text: string): string;
}

export const DescriptionInterfaceSymbol = Symbol.for("DescriptionInterface");
