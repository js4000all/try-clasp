import { generateKeyPairSync, createSign, createVerify } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const outputDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

mkdirSync(outputDir, { recursive: true });

// 1. RSA 2048-bit 鍵ペア生成
const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicExponent: 0x10001,
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

// 2. 検証対象メッセージ
const message = "Hello from GAS!";

// 3. SHA-256 + RSA PKCS#1 v1.5 署名
const signer = createSign("RSA-SHA256");
signer.update(message, "utf8");
signer.end();

const signature = signer.sign(privateKey);

// 4. Node.js 側で自己検証
const verifier = createVerify("RSA-SHA256");
verifier.update(message, "utf8");
verifier.end();

if (!verifier.verify(publicKey, signature)) {
  throw new Error("Signature verification failed");
}

// 5. テストデータを保存
writeFileSync(join(outputDir, "public.pem"), publicKey);
writeFileSync(join(outputDir, "private.pem"), privateKey);
writeFileSync(join(outputDir, "message.txt"), message);
writeFileSync(
  join(outputDir, "signature.base64"),
  signature.toString("base64"),
);

console.log("RSA test fixtures generated:");
console.log(`Directory: ${outputDir}`);
console.log(`Message: ${message}`);
console.log(`Signature (Base64): ${signature.toString("base64")}`);
console.log("Local signature verification: OK");
