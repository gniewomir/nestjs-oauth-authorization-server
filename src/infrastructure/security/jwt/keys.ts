import * as assert from "node:assert";
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
  if (!keyPath.endsWith(".pub")) {
    keyPath = `${keyPath}.pub`;
  }
  keyPath = path.normalize(keyPath);
  return await fs.readFile(keyPath, "utf8");
};

export const assertValidPrivateKey = async (pathString: string) => {
  const key = await createPrivateKey(pathString);
  assert(key.type === "private");
};

export const assertValidPublicKey = async (pathString: string) => {
  const key = await createPublicKey(pathString);
  assert(key.type === "public");
};
