/*
  Warnings:

  - You are about to drop the column `pmId` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `pmStatus` on the `Ticket` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Ticket" DROP CONSTRAINT "Ticket_pmId_fkey";

-- AlterTable
ALTER TABLE "public"."Ticket" DROP COLUMN "pmId",
DROP COLUMN "pmStatus",
ADD COLUMN     "creatorId" TEXT,
ADD COLUMN     "creatorStatus" TEXT,
ADD COLUMN     "isManualCreated" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "public"."Ticket" ADD CONSTRAINT "Ticket_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
