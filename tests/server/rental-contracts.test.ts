import assert from "node:assert/strict";
import { test } from "node:test";
import { Prisma, type PrismaClient } from "../../src/generated/prisma/client";
import { mapOrder, mapQuote, mapStaff } from "../../src/server/rental/mappers";
import type {
  OrderRecord,
  QuoteRecord,
  StaffRecord,
} from "../../src/server/rental/models";
import { createRentalReadRepository } from "../../src/server/rental/prisma-repository";
import { serializable, lockProducts } from "../../src/server/db/transaction";

const day = new Date("2030-01-01T00:00:00Z");
test("order mapper preserves snapshots and computes offline ledger without exposing unrelated fields", () => {
  const record = {
    id: "o",
    customerId: "u",
    contactName: "Snapshot",
    contactPhone: "0900000000",
    pickupDate: day,
    returnDate: day,
    total: 280000,
    notes: "size advice",
    status: "pending",
    version: 1,
    createdAt: day,
    lines: [],
    changes: [],
    audits: [],
    payments: [
      {
        id: "p",
        kind: "collection",
        amount: 100000,
        occurredAt: day,
        actorId: "staff",
        note: "Cash",
      },
    ],
    secret: "must not leak",
  } as unknown as OrderRecord;
  const dto = mapOrder(record);
  assert.equal(dto.contact.name, "Snapshot");
  assert.equal(dto.pickupDate, "2030-01-01");
  assert.equal(dto.status, "pending");
  assert.equal(dto.payment.remaining, 180000);
  assert.equal(dto.payment.status, "partial");
  assert.ok(!("secret" in dto));
  assert.throws(() =>
    mapOrder({
      ...record,
      payments: [{ ...record.payments[0], kind: "refund" }],
    }),
  );
});
test("quote and staff mapper return explicit DTOs with correct permission names", () => {
  const quote = {
    id: "q",
    pickupDate: day,
    returnDate: day,
    total: 1,
    currency: "VND",
    policyLabel: "Fixture",
    expiresAt: day,
    lines: [],
    policyVersion: "internal",
  } as unknown as QuoteRecord;
  assert.ok(!("policyVersion" in mapQuote(quote)));
  assert.throws(() => mapQuote({ ...quote, currency: "USD" }));
  const staff = {
    userId: "u",
    active: true,
    version: 2,
    permissions: ["payments_write"],
    user: {
      name: "Staff",
      phone: "090",
      active: true,
      email: "private@test.invalid",
    },
  } as unknown as StaffRecord;
  assert.deepEqual(mapStaff(staff).permissions, ["payments:write"]);
  assert.ok(!("email" in mapStaff(staff)));
});
test("repository puts owner and publication conditions in SQL query and matches approved held statuses", async () => {
  const calls: unknown[] = [];
  const db = {
    product: {
      findFirst: async (args: unknown) => {
        calls.push(args);
        return null;
      },
    },
    rentalOrder: {
      findFirst: async (args: unknown) => {
        calls.push(args);
        return null;
      },
    },
    orderLine: {
      findMany: async (args: unknown) => {
        calls.push(args);
        return [];
      },
    },
    inventoryBlock: {
      findMany: async (args: unknown) => {
        calls.push(args);
        return [];
      },
    },
  } as unknown as PrismaClient;
  const repository = createRentalReadRepository(db);
  await repository.findCustomerOrder("o", "u");
  assert.deepEqual((calls[0] as { where: unknown }).where, {
    id: "o",
    customerId: "u",
  });
  await repository.findPublishedProduct("muse");
  assert.deepEqual((calls[1] as { where: unknown }).where, {
    slug: "muse",
    visibility: "published",
  });
  await repository.allocations(["p"], { pickupDate: day, returnDate: day });
  const where = (calls[2] as { where: { order: { status: unknown } } }).where;
  assert.deepEqual(where.order.status, { in: ["confirmed", "renting"] });
});
test("serializable retry reruns only transient transactions; row locks parameterize product IDs", async () => {
  let attempts = 0;
  const db = {
    $transaction: async (
      work: (tx: unknown) => Promise<unknown>,
      options: unknown,
    ) => {
      assert.equal(
        (options as { isolationLevel: string }).isolationLevel,
        "Serializable",
      );
      if (++attempts < 3)
        throw new Prisma.PrismaClientKnownRequestError("retry", {
          code: "P2034",
          clientVersion: "7.9.1",
        });
      return work({});
    },
  } as unknown as PrismaClient;
  assert.equal(await serializable(db, async () => "committed"), "committed");
  assert.equal(attempts, 3);
  const permanent = {
    $transaction: async () => {
      throw new Error("invalid");
    },
  } as unknown as PrismaClient;
  await assert.rejects(
    serializable(permanent, async () => "bad"),
    /invalid/,
  );
  let values: unknown[] = [];
  const tx = {
    $queryRaw: async (query: { values: unknown[]; sql: string }) => {
      values = query.values;
      assert.ok(!query.sql.includes("DROP"));
    },
  } as unknown as Prisma.TransactionClient;
  await lockProducts(tx, ["z", "a'; DROP TABLE Product; --", "z"]);
  assert.deepEqual(values, ["a'; DROP TABLE Product; --", "z"]);
});
