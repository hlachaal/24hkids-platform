-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARENT', 'ADMIN');

-- AlterTable
ALTER TABLE "Parent" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'PARENT',
ALTER COLUMN "password" DROP NOT NULL;
