CREATE TABLE "MediaAsset" ("id" TEXT PRIMARY KEY,"ownerId" TEXT NOT NULL,"orderId" TEXT,"purpose" TEXT NOT NULL DEFAULT 'review',"mimeType" TEXT NOT NULL DEFAULT 'image/webp',"data" BYTEA NOT NULL,"byteLength" INTEGER NOT NULL,"createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "media_owner_fk" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT,
CONSTRAINT "media_order_fk" FOREIGN KEY ("orderId","ownerId") REFERENCES "RentalOrder"("id","customerId") ON DELETE RESTRICT,
CONSTRAINT "media_payload" CHECK ("mimeType"='image/webp' AND "byteLength">0 AND "byteLength"<=2097152 AND "byteLength"=octet_length("data")),
CONSTRAINT "media_purpose" CHECK (("purpose"='review' AND "orderId" IS NOT NULL) OR ("purpose"='product' AND "orderId" IS NULL)));
CREATE INDEX "MediaAsset_ownerId_orderId_idx" ON "MediaAsset"("ownerId","orderId");
CREATE UNIQUE INDEX "ReviewMedia_storageKey_key" ON "ReviewMedia"("storageKey");
ALTER TABLE "ReviewMedia" ADD CONSTRAINT "ReviewMedia_storageKey_fkey" FOREIGN KEY ("storageKey") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT;
