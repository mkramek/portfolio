-- CreateEnum
CREATE TYPE "RoleDepth" AS ENUM ('simple', 'extended', 'advanced');

-- CreateEnum
CREATE TYPE "ThemeMode" AS ENUM ('light', 'dark');

-- CreateEnum
CREATE TYPE "ThemeAccent" AS ENUM ('teal', 'amber', 'lime', 'violet');

-- CreateEnum
CREATE TYPE "HeroVariant" AS ENUM ('monolith', 'terminal', 'ledger');

-- CreateEnum
CREATE TYPE "TimelineVariant" AS ENUM ('rail', 'ledger', 'cards');

-- CreateEnum
CREATE TYPE "ProjectVariant" AS ENUM ('index', 'window', 'plain');

-- CreateEnum
CREATE TYPE "AdminVariant" AS ENUM ('split', 'stacked');

-- CreateEnum
CREATE TYPE "SectionId" AS ENUM ('hero', 'strengths', 'experience', 'projects', 'skills', 'testimonials', 'contact');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "name" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tagline" TEXT,
    "summary" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "location" TEXT,
    "linkedin" TEXT,
    "github" TEXT,
    "availability" TEXT,
    "heroStats" JSONB,
    "ledgerRows" JSONB,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "depth" "RoleDepth" NOT NULL,
    "oneLiner" TEXT NOT NULL,
    "bullets" JSONB NOT NULL,
    "metrics" JSONB NOT NULL,
    "stack" JSONB NOT NULL,
    "caseStudy" JSONB NOT NULL,
    "includeInCv" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "blurb" TEXT NOT NULL,
    "stack" JSONB NOT NULL,
    "link" TEXT,
    "includeInCv" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillGroup" (
    "id" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "SkillGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "includeInCv" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Strength" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Strength_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "degree" TEXT NOT NULL,
    "detail" TEXT NOT NULL,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" "SectionId" NOT NULL,
    "label" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "mode" "ThemeMode" NOT NULL,
    "accent" "ThemeAccent" NOT NULL,
    "hero" "HeroVariant" NOT NULL,
    "timeline" "TimelineVariant" NOT NULL,
    "project" "ProjectVariant" NOT NULL,
    "admin" "AdminVariant" NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CvSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "includeSkills" BOOLEAN NOT NULL,
    "includeProjects" BOOLEAN NOT NULL,
    "includeTestimonials" BOOLEAN NOT NULL,
    "includeEducation" BOOLEAN NOT NULL,
    "includeLanguages" BOOLEAN NOT NULL,

    CONSTRAINT "CvSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CvSnapshot" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,

    CONSTRAINT "CvSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetupState" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "isComplete" BOOLEAN NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SetupState_pkey" PRIMARY KEY ("id")
);
