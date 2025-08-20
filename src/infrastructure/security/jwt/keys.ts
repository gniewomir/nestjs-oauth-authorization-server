import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const resolvePrivateKeyPath = (pathString: string): string => {
  let keyPath: string;
  if (path.isAbsolute(pathString)) {
    keyPath = pathString;
  } else {
    keyPath = path.join(
      __dirname,
      ..."../../../..".split("/"),
      ...pathString.split("/"),
    );
  }
  keyPath = path.normalize(keyPath);
  return keyPath;
};

const resolvePublicKeyPath = (pathString: string): string => {
  const keyPath = resolvePrivateKeyPath(pathString);
  return keyPath.endsWith(".pub") ? keyPath : `${keyPath}.pub`;
};

export const createPrivateKey = async (pathString: string) => {
  const file = await fs.readFile(resolvePrivateKeyPath(pathString), "utf8");
  return crypto.createPrivateKey(file);
};

export const createPublicKey = async (pathString: string) => {
  const file = await fs.readFile(resolvePublicKeyPath(pathString), "utf-8");
  return crypto.createPublicKey(file);
};

export const loadPublicKey = async (pathString: string) => {
  return await fs.readFile(resolvePrivateKeyPath(pathString), "utf8");
};

export const loadPrivateKey = async (pathString: string) => {
  return await fs.readFile(resolvePrivateKeyPath(pathString), "utf8");
};
