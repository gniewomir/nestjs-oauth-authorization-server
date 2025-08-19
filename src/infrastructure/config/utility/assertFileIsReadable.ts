import * as constants from "node:constants";
import * as fs from "node:fs";

export function assertFileIsReadable(filePath: string, message: string) {
  try {
    fs.accessSync(filePath, constants.R_OK);
  } catch (error) {
    throw new Error(message, { cause: error });
  }
}
