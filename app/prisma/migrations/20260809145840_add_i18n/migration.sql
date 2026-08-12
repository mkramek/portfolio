-- CreateEnum
CREATE TYPE "TranslatableEntity" AS ENUM ('profile', 'role', 'project', 'skillGroup', 'strength', 'testimonial', 'education', 'language', 'section', 'cvSettings');

-- AlterTable
ALTER TABLE "CvSettings" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en';

-- AlterTable
ALTER TABLE "CvSnapshot" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en';

-- CreateTable
CREATE TABLE "Locale" (
    "code" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Locale_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Translation" (
    "entity" "TranslatableEntity" NOT NULL,
    "entityId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Translation_pkey" PRIMARY KEY ("entity","entityId","locale")
);

-- CreateIndex
CREATE INDEX "Translation_locale_idx" ON "Translation"("locale");
