import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

const keysDir = path.join(__dirname, "..", "keys");
const keyPairs = ["ours-key-es512", "theirs-key-es512"].map((name) => [
  path.join(keysDir, name),
  path.join(keysDir, `${name}.pub`),
]);

// Create keys directory
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

for (const [privatePath, publicPath] of keyPairs) {
  // Generate ECDSA key pair
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "secp521r1",
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "sec1",
      format: "pem",
    },
  });
  fs.writeFileSync(privatePath, privateKey);
  fs.writeFileSync(publicPath, publicKey);
  console.log("Keys generated successfully:");
  console.log(`Private key: ${privatePath}`);
  console.log(`Public key: ${publicPath}`);
}
