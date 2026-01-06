import fs from "fs";
import path from "path";
import crypto from "crypto";

const KEY_PATH = path.join(process.cwd(), "secret.key");

// Ensure data directory exists
// if (!fs.existsSync(DATA_DIR)) {
//   fs.mkdirSync(DATA_DIR, { recursive: true });
// }

function getSecretKey(): Buffer {
  if (fs.existsSync(KEY_PATH)) {
    const keyHex = fs.readFileSync(KEY_PATH, "utf-8");
    return Buffer.from(keyHex, "hex");
  }

  // Generate a new 32-byte key (AES-256)
  const key = crypto.randomBytes(32);
  fs.writeFileSync(KEY_PATH, key.toString("hex"));
  return key;
}

const ALGORITHM = "aes-256-cbc";

export function encrypt(text: string): string {
  const key = getSecretKey();
  const iv = crypto.randomBytes(16); // IV length for AES is 16 bytes
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return IV + Encrypted text as a single string (iv:encrypted)
  return `${iv.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted text format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];
  const key = getSecretKey();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
