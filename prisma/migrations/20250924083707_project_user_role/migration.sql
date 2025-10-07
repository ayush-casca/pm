/*
  Warnings:

  - Added the required column `role` to the `ProjectUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ProjectUser" ADD COLUMN     "role" TEXT NOT NULL;
