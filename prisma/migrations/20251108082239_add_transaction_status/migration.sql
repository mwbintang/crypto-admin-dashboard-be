-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'SUCCESS';
