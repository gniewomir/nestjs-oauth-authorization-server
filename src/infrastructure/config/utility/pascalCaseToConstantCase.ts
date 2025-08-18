const isUpper = (char: string): boolean => {
  return char.toUpperCase() === char;
};

export const pascalCaseToConstantCase = (input: string) => {
  let result = "";
  for (const char of input) {
    result += isUpper(char) ? ` ${char}` : char.toUpperCase();
  }
  result = result.trim();
  result = result.replaceAll(" ", "_");
  return result;
};
