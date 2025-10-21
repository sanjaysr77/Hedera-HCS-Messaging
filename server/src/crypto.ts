
import crypto from "crypto";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const algorithm = "aes-256-ctr";
const secretKey = Buffer.from(process.env.SECRET_KEY!, "hex");

export function encryptMessage(message: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(message), cipher.final()]);
  return { iv: iv.toString("hex"), content: encrypted.toString("hex") };
}

export function decryptMessage(hash?: { iv: string; content: string }) {
  if (!hash || !hash.iv || !hash.content) {
    throw new Error("decryptMessage received invalid input: " + JSON.stringify(hash));
  }

  const decipher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(hash.iv, "hex")
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(hash.content, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString();
}
