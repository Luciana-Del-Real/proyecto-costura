-- CreateTable
CREATE TABLE "patterns" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "nivel" TEXT NOT NULL DEFAULT 'Principiante',
    "categoria" TEXT NOT NULL DEFAULT '',
    "imagen" TEXT,
    "archivo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patterns_pkey" PRIMARY KEY ("id")
);
