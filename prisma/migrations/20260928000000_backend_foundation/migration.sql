-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SessionScope" AS ENUM ('customer', 'admin');

-- CreateEnum
CREATE TYPE "StaffPermission" AS ENUM ('orders:manage', 'payments:write', 'catalog:manage', 'availability:manage', 'customers:read', 'content:manage', 'reviews:moderate', 'staff:manage');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('pending', 'confirmed', 'renting', 'returned', 'completed', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "ChangeKind" AS ENUM ('dates', 'cancel');

-- CreateEnum
CREATE TYPE "ChangeStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('collection', 'refund');

-- CreateEnum
CREATE TYPE "ContentKind" AS ENUM ('collection', 'lookbook');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMPTZ(3),
    "image" TEXT,
    "phone" VARCHAR(20) NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(3) NOT NULL,
    "scope" "SessionScope" NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(3) NOT NULL
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "userId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "permissions" "StaffPermission"[] DEFAULT ARRAY[]::"StaffPermission"[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "collection" VARCHAR(100) NOT NULL,
    "occasions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "price" INTEGER NOT NULL,
    "rentalDays" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalQuote" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "pickupDate" DATE NOT NULL,
    "returnDate" DATE NOT NULL,
    "total" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'VND',
    "policyLabel" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteLine" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productSlug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "available" INTEGER NOT NULL,

    CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalOrder" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "contactName" VARCHAR(100) NOT NULL,
    "contactPhone" VARCHAR(20) NOT NULL,
    "pickupDate" DATE NOT NULL,
    "returnDate" DATE NOT NULL,
    "total" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'VND',
    "notes" VARCHAR(1000) NOT NULL DEFAULT '',
    "status" "RentalStatus" NOT NULL DEFAULT 'pending',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RentalOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productSlug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "available" INTEGER NOT NULL,

    CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderChange" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "kind" "ChangeKind" NOT NULL,
    "pickupDate" DATE NOT NULL,
    "returnDate" DATE NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "status" "ChangeStatus" NOT NULL DEFAULT 'pending',
    "decisionNote" VARCHAR(1000),
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryBlock" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "pickupDate" DATE NOT NULL,
    "returnDate" DATE NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "createdById" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEntry" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "kind" "PaymentKind" NOT NULL,
    "amount" INTEGER NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" VARCHAR(1000) NOT NULL,

    CONSTRAINT "PaymentEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialContent" (
    "id" TEXT NOT NULL,
    "kind" "ContentKind" NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "body" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "EditorialContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentProduct" (
    "contentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ContentProduct_pkey" PRIMARY KEY ("contentId","productId")
);

-- CreateTable
CREATE TABLE "CustomerReview" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "story" VARCHAR(2000) NOT NULL,
    "consentToPublish" BOOLEAN NOT NULL DEFAULT false,
    "moderation" "ModerationStatus" NOT NULL DEFAULT 'pending',
    "moderationNote" VARCHAR(1000) NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CustomerReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewMedia" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ReviewMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "scope" "SessionScope" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "orderId" TEXT,
    "action" TEXT NOT NULL,
    "note" VARCHAR(1000) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "scope" "SessionScope" NOT NULL,
    "operation" VARCHAR(100) NOT NULL,
    "key" VARCHAR(128) NOT NULL,
    "fingerprint" CHAR(64) NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_scope_idx" ON "Session"("userId", "scope");

-- CreateIndex
CREATE INDEX "Session_expires_idx" ON "Session"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_visibility_category_idx" ON "Product"("visibility", "category");

-- CreateIndex
CREATE UNIQUE INDEX "ProductImage_productId_position_key" ON "ProductImage"("productId", "position");

-- CreateIndex
CREATE INDEX "RentalQuote_expiresAt_idx" ON "RentalQuote"("expiresAt");

-- CreateIndex
CREATE INDEX "RentalQuote_userId_createdAt_idx" ON "RentalQuote"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "QuoteLine_productId_idx" ON "QuoteLine"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteLine_quoteId_productId_key" ON "QuoteLine"("quoteId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalOrder_quoteId_key" ON "RentalOrder"("quoteId");

-- CreateIndex
CREATE INDEX "RentalOrder_customerId_createdAt_idx" ON "RentalOrder"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "RentalOrder_status_pickupDate_returnDate_idx" ON "RentalOrder"("status", "pickupDate", "returnDate");

-- CreateIndex
CREATE UNIQUE INDEX "RentalOrder_id_customerId_key" ON "RentalOrder"("id", "customerId");

-- CreateIndex
CREATE INDEX "OrderLine_productId_orderId_idx" ON "OrderLine"("productId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderLine_orderId_productId_key" ON "OrderLine"("orderId", "productId");

-- CreateIndex
CREATE INDEX "OrderChange_orderId_status_idx" ON "OrderChange"("orderId", "status");

-- CreateIndex
CREATE INDEX "InventoryBlock_productId_pickupDate_returnDate_idx" ON "InventoryBlock"("productId", "pickupDate", "returnDate");

-- CreateIndex
CREATE INDEX "PaymentEntry_orderId_occurredAt_idx" ON "PaymentEntry"("orderId", "occurredAt");

-- CreateIndex
CREATE INDEX "PaymentEntry_actorId_idx" ON "PaymentEntry"("actorId");

-- CreateIndex
CREATE INDEX "EditorialContent_kind_visibility_idx" ON "EditorialContent"("kind", "visibility");

-- CreateIndex
CREATE INDEX "ContentProduct_productId_idx" ON "ContentProduct"("productId");

-- CreateIndex
CREATE INDEX "CustomerReview_moderation_consentToPublish_idx" ON "CustomerReview"("moderation", "consentToPublish");

-- CreateIndex
CREATE INDEX "CustomerReview_customerId_idx" ON "CustomerReview"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerReview_orderId_customerId_key" ON "CustomerReview"("orderId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewMedia_reviewId_position_key" ON "ReviewMedia"("reviewId", "position");

-- CreateIndex
CREATE INDEX "AuditEvent_entity_entityId_createdAt_idx" ON "AuditEvent"("entity", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_orderId_createdAt_idx" ON "AuditEvent"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_idx" ON "AuditEvent"("actorId");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_actorId_scope_operation_key_key" ON "IdempotencyRecord"("actorId", "scope", "operation", "key");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalQuote" ADD CONSTRAINT "RentalQuote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "RentalQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalOrder" ADD CONSTRAINT "RentalOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalOrder" ADD CONSTRAINT "RentalOrder_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "RentalQuote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RentalOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderChange" ADD CONSTRAINT "OrderChange_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RentalOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBlock" ADD CONSTRAINT "InventoryBlock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBlock" ADD CONSTRAINT "InventoryBlock_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEntry" ADD CONSTRAINT "PaymentEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RentalOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEntry" ADD CONSTRAINT "PaymentEntry_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentProduct" ADD CONSTRAINT "ContentProduct_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "EditorialContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentProduct" ADD CONSTRAINT "ContentProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReview" ADD CONSTRAINT "CustomerReview_orderId_customerId_fkey" FOREIGN KEY ("orderId", "customerId") REFERENCES "RentalOrder"("id", "customerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReview" ADD CONSTRAINT "CustomerReview_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewMedia" ADD CONSTRAINT "ReviewMedia_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "CustomerReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RentalOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "IdempotencyRecord_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Business invariants Prisma schema syntax cannot express. Keep these in migrations.
ALTER TABLE "Product" ADD CONSTRAINT "product_numbers" CHECK ("quantity" >= 0 AND "price" > 0 AND "rentalDays" > 0 AND "version" > 0);
ALTER TABLE "ProductImage" ADD CONSTRAINT "product_image_position" CHECK ("position" >= 0);
ALTER TABLE "RentalQuote" ADD CONSTRAINT "quote_dates_money" CHECK ("returnDate" >= "pickupDate" AND "total" >= 0 AND "currency" = 'VND' AND "expiresAt" > "createdAt");
ALTER TABLE "QuoteLine" ADD CONSTRAINT "quote_line_numbers" CHECK ("quantity" > 0 AND "amount" >= 0 AND "available" >= 0);
ALTER TABLE "RentalOrder" ADD CONSTRAINT "order_dates_money" CHECK ("returnDate" >= "pickupDate" AND "total" >= 0 AND "currency" = 'VND' AND "version" > 0);
ALTER TABLE "OrderLine" ADD CONSTRAINT "order_line_numbers" CHECK ("quantity" > 0 AND "amount" >= 0 AND "available" >= 0);
ALTER TABLE "OrderChange" ADD CONSTRAINT "change_dates" CHECK ("returnDate" >= "pickupDate");
CREATE UNIQUE INDEX "one_pending_change_per_order" ON "OrderChange" ("orderId") WHERE "status" = 'pending';
ALTER TABLE "InventoryBlock" ADD CONSTRAINT "block_dates_numbers" CHECK ("returnDate" >= "pickupDate" AND "quantity" > 0 AND "version" > 0);
ALTER TABLE "PaymentEntry" ADD CONSTRAINT "payment_positive" CHECK ("amount" > 0);
ALTER TABLE "CustomerReview" ADD CONSTRAINT "review_rating_consent" CHECK ("rating" BETWEEN 1 AND 5 AND "version" > 0 AND ("moderation" <> 'approved' OR "consentToPublish"));
ALTER TABLE "StaffProfile" ADD CONSTRAINT "staff_version" CHECK ("version" > 0);
ALTER TABLE "EditorialContent" ADD CONSTRAINT "content_version" CHECK ("version" > 0);
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "idempotency_expiry" CHECK ("expiresAt" > "createdAt");

-- Ledger and audit are append-only. Correct mistakes using a compensating transaction.
CREATE FUNCTION rental_reject_history_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Rental ledger and audit history are append-only' USING ERRCODE = '23514';
END;
$$;
CREATE TRIGGER payment_append_only BEFORE UPDATE OR DELETE ON "PaymentEntry" FOR EACH ROW EXECUTE FUNCTION rental_reject_history_change();
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE ON "AuditEvent" FOR EACH ROW EXECUTE FUNCTION rental_reject_history_change();

ALTER TABLE "OrderChange" ADD CONSTRAINT "OrderChange_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
