-- AlterEnum
ALTER TYPE "EmployeeStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "department" DROP NOT NULL,
ALTER COLUMN "designation" DROP NOT NULL;
