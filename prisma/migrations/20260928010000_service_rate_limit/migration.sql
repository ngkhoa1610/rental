CREATE TABLE "RateLimitBucket" (
  "key" VARCHAR(64) NOT NULL PRIMARY KEY,
  "count" INTEGER NOT NULL DEFAULT 1 CHECK ("count" > 0),
  "expiresAt" TIMESTAMPTZ(3) NOT NULL
);
CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");
