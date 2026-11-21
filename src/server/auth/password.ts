import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const credentialEmail = z.string().trim().toLowerCase().max(254).email();
export const loginPassword = z
  .string()
  .min(1)
  .max(256)
  .refine((value) => Array.from(value).length <= 128);
export const newPassword = loginPassword.refine(
  (value) => Array.from(value).length >= 15,
);

const saltBytes = 16;
const keyBytes = 32;
const hashPattern = /^scrypt-v1:([0-9a-f]{32}):([0-9a-f]{64})$/;
const dummySalt = Buffer.alloc(saltBytes);
const dummyKey = Buffer.alloc(keyBytes);

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      keyBytes,
      { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(saltBytes);
  const key = await deriveKey(newPassword.parse(password), salt);
  return `scrypt-v1:${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string | null | undefined,
): Promise<boolean> {
  const match = storedHash ? hashPattern.exec(storedHash) : null;
  const salt = match ? Buffer.from(match[1], "hex") : dummySalt;
  const expected = match ? Buffer.from(match[2], "hex") : dummyKey;
  const key = await deriveKey(password, salt);
  return timingSafeEqual(key, expected) && match !== null;
}
