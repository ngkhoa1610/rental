import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
before(async () => {
  await db.exec(
    await readFile(
      new URL(
        "../../prisma/migrations/20260928000000_backend_foundation/migration.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(`
    INSERT INTO "User" (id,name,email,"updatedAt") VALUES ('customer','Customer','customer@test.invalid',now()),('other','Other','other@test.invalid',now()),('staff','Staff','staff@test.invalid',now());
    INSERT INTO "StaffProfile" ("userId",permissions,"updatedAt") VALUES ('staff',ARRAY['orders:manage']::"StaffPermission"[],now());
    INSERT INTO "Product" (id,slug,name,description,category,collection,price,"rentalDays",quantity,"updatedAt") VALUES ('p','muse','Muse','Fixture','Dresses','Occasion',280000,3,2,now());
    INSERT INTO "RentalQuote" (id,"pickupDate","returnDate",total,"policyLabel","policyVersion","expiresAt") VALUES ('q','2030-01-01','2030-01-01',280000,'Fixture only','test',now()+interval '1 hour');
    INSERT INTO "RentalOrder" (id,"customerId","quoteId","contactName","contactPhone","pickupDate","returnDate",total,"updatedAt") VALUES ('o','customer','q','Snapshot','0900000000','2030-01-01','2030-01-01',280000,now());
  `);
});
after(() => db.close());
const checkViolation = (e: unknown) =>
  typeof e === "object" &&
  e !== null &&
  "code" in e &&
  ["23514", "23503", "23505"].includes(String(e.code));

test("PostgreSQL migration applies on an empty database and keeps pending order independent of payment", async () => {
  const { rows } = await db.query<{ status: string }>(
    `SELECT status FROM "RentalOrder" WHERE id='o'`,
  );
  assert.equal(rows[0].status, "pending");
  assert.equal((await db.query(`SELECT * FROM "PaymentEntry"`)).rows.length, 0);
  const tables = await db.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname='public'`,
  );
  assert.ok(tables.rows.some((t) => t.tablename === "Session"));
  assert.ok(!tables.rows.some((t) => /variant/i.test(t.tablename)));
});
test("SQL rejects negative money/stock and reversed dates; same-day is valid", async () => {
  for (const sql of [
    `UPDATE "Product" SET quantity=-1 WHERE id='p'`,
    `UPDATE "Product" SET price=0 WHERE id='p'`,
    `UPDATE "RentalOrder" SET total=-1 WHERE id='o'`,
    `UPDATE "RentalOrder" SET "returnDate"='2029-12-31' WHERE id='o'`,
  ])
    await assert.rejects(db.exec(sql), checkViolation);
  await db.exec(
    `UPDATE "RentalOrder" SET "returnDate"='2030-01-02' WHERE id='o'`,
  );
});
test("SQL protects quote reuse, owner relationships and one pending change", async () => {
  await assert.rejects(
    db.exec(
      `INSERT INTO "RentalOrder" (id,"customerId","quoteId","contactName","contactPhone","pickupDate","returnDate",total,"updatedAt") VALUES ('duplicate','other','q','Other','0911111111','2030-01-01','2030-01-02',280000,now())`,
    ),
    checkViolation,
  );
  await db.exec(
    `INSERT INTO "OrderChange" (id,"orderId",kind,"pickupDate","returnDate",reason) VALUES ('c','o','dates','2030-01-01','2030-01-02','test')`,
  );
  await assert.rejects(
    db.exec(
      `INSERT INTO "OrderChange" (id,"orderId",kind,"pickupDate","returnDate",reason) VALUES ('c2','o','cancel','2030-01-01','2030-01-02','test')`,
    ),
    checkViolation,
  );
  await assert.rejects(
    db.exec(
      `INSERT INTO "CustomerReview" (id,"orderId","customerId",rating,story,"updatedAt") VALUES ('foreign','o','other',5,'Invalid owner',now())`,
    ),
    checkViolation,
  );
});
test("review consent/rating checks and append-only ledger/audit survive direct SQL", async () => {
  await db.exec(
    `INSERT INTO "CustomerReview" (id,"orderId","customerId",rating,story,"updatedAt") VALUES ('r','o','customer',5,'Fixture',now())`,
  );
  await assert.rejects(
    db.exec(`UPDATE "CustomerReview" SET moderation='approved' WHERE id='r'`),
    checkViolation,
  );
  await assert.rejects(
    db.exec(`UPDATE "CustomerReview" SET rating=6 WHERE id='r'`),
    checkViolation,
  );
  await db.exec(
    `UPDATE "CustomerReview" SET "consentToPublish"=true,moderation='approved' WHERE id='r'`,
  );
  await db.exec(
    `INSERT INTO "PaymentEntry" (id,"orderId","actorId",kind,amount,"occurredAt",note) VALUES ('pay','o','staff','collection',280000,now(),'Cash fixture')`,
  );
  await assert.rejects(
    db.exec(`DELETE FROM "PaymentEntry" WHERE id='pay'`),
    checkViolation,
  );
  await assert.rejects(
    db.exec(`UPDATE "PaymentEntry" SET amount=1 WHERE id='pay'`),
    checkViolation,
  );
  await db.exec(
    `INSERT INTO "AuditEvent" (id,"actorId",scope,entity,"entityId","orderId",action,note) VALUES ('a','staff','admin','order','o','o','collection','Fixture')`,
  );
  await assert.rejects(
    db.exec(`UPDATE "AuditEvent" SET note='Hide change' WHERE id='a'`),
    checkViolation,
  );
  const { rows } = await db.query<{ status: string }>(
    `SELECT status FROM "RentalOrder" WHERE id='o'`,
  );
  assert.equal(rows[0].status, "pending");
});
test("idempotency is unique within actor/scope/operation and sessions carry scope", async () => {
  const sql = `INSERT INTO "IdempotencyRecord" (id,"actorId",scope,operation,key,fingerprint,response,"expiresAt") VALUES ($1,'customer','customer','orders.create','key',$2,'{}',now()+interval '1 day')`;
  await db.query(sql, ["i", "a".repeat(64)]);
  await assert.rejects(db.query(sql, ["i2", "b".repeat(64)]), checkViolation);
  await db.exec(
    `INSERT INTO "Session" (id,"sessionToken","userId",expires,scope) VALUES ('s','token','customer',now()+interval '1 day','customer')`,
  );
  assert.equal(
    (
      await db.query(
        `SELECT * FROM "Session" WHERE "sessionToken"='token' AND scope='admin'`,
      )
    ).rows.length,
    0,
  );
});
