-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "revoked_at" TIMESTAMP(3),
ADD COLUMN     "revoked_reason" TEXT;

-- CreateIndex
CREATE INDEX "certificates_revoked_at_idx" ON "certificates"("revoked_at");
