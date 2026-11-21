ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- Auth.js persisted raw session tokens. Credentials sessions store token digests.
DELETE FROM "Session";
