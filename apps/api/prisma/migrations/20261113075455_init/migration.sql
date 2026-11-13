-- CreateEnum
CREATE TYPE "Ownership" AS ENUM ('RENTAL', 'MANDIR', 'PERSONAL');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('SONY_BODY', 'SONY_LENS', 'SONY_BATTERY', 'CANON_BODY', 'CANON_LENS', 'CANON_BATTERY', 'SD_CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('IN', 'OUT', 'RETIRED');

-- CreateEnum
CREATE TYPE "Team" AS ENUM ('VIDEO', 'PHOTO');

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownership" "Ownership" NOT NULL,
    "type" "ItemType" NOT NULL,
    "status" "ItemStatus" NOT NULL DEFAULT 'IN',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "team" "Team" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkouts" (
    "id" SERIAL NOT NULL,
    "person_id" INTEGER NOT NULL,
    "event_name" TEXT,
    "checked_out_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout_items" (
    "checkout_id" INTEGER NOT NULL,
    "item_id" TEXT NOT NULL,
    "returned_at" TIMESTAMP(3),

    CONSTRAINT "checkout_items_pkey" PRIMARY KEY ("checkout_id","item_id")
);

-- CreateIndex
CREATE INDEX "checkouts_person_id_idx" ON "checkouts"("person_id");

-- CreateIndex
CREATE INDEX "checkout_items_item_id_idx" ON "checkout_items"("item_id");

-- AddForeignKey
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_items" ADD CONSTRAINT "checkout_items_checkout_id_fkey" FOREIGN KEY ("checkout_id") REFERENCES "checkouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_items" ADD CONSTRAINT "checkout_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
