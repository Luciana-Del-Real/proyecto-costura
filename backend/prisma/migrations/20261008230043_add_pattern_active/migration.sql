-- Soft-hide: el patrón se oculta del catálogo público (active=false) cuando
-- tiene ventas y el admin intenta eliminarlo; el historial de pagos se conserva.
ALTER TABLE "patterns" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;