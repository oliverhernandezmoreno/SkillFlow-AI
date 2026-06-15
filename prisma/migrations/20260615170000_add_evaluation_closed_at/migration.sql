-- Add a persistent logical close timestamp for evaluations.
ALTER TABLE "evaluations" ADD COLUMN "closed_at" TIMESTAMP(3);

CREATE INDEX "evaluations_closed_at_idx" ON "evaluations"("closed_at");
CREATE INDEX "evaluations_organization_id_closed_at_idx" ON "evaluations"("organization_id", "closed_at");
