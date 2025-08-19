import * as assert from "node:assert";
import * as constants from "node:constants";
import * as crypto from "node:crypto";
import * as fsAsync from "node:fs/promises";

export const assertFileIsReadable = async (
  filePath: string,
  message: string,
) => {
  try {
    await fsAsync.access(filePath, constants.R_OK);
  } catch (error) {
    throw new Error(message, { cause: error });
  }
};

export const assertValidPrivateKey = async (privateKeyPath: string) => {
  await assertFileIsReadable(
    privateKeyPath,
    `Cannot read private key file ${privateKeyPath}`,
  );
  const privateKeyString = await fsAsync.readFile(privateKeyPath, "utf8");
  const privateKey = crypto.createPrivateKey(privateKeyString);
  assert(
    privateKey.type === "private",
    `File ${privateKeyPath} in not a valid private key!`,
  );
};

export const assertValidPublicKey = async (publicKeyPath: string) => {
  await assertFileIsReadable(
    publicKeyPath,
    `Cannot read public key file ${publicKeyPath}`,
  );
  const publicKeyString = await fsAsync.readFile(publicKeyPath, "utf8");
  const publicKey = crypto.createPublicKey(publicKeyString);
  assert(
    publicKey.type === "public",
    `File ${publicKeyPath} in not a valid public key!`,
  );
};
