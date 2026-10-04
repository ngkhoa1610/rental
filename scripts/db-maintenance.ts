import "dotenv/config";
import { getDatabase } from "../src/server/db/client";
async function main() {
  const db = getDatabase();
  try {
    const now = new Date();
    const buckets = await db.rateLimitBucket.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
      sessions = await db.session.deleteMany({
        where: { expires: { lt: now } },
      }),
      tokens = await db.verificationToken.deleteMany({
        where: { expires: { lt: now } },
      });
    console.log(
      JSON.stringify({
        expiredRateBuckets: buckets.count,
        expiredSessions: sessions.count,
        expiredVerificationTokens: tokens.count,
      }),
    );
  } finally {
    await db.$disconnect();
  }
}
void main().catch(() => {
  console.error("Maintenance failed. Check server configuration.");
  process.exitCode = 1;
});
