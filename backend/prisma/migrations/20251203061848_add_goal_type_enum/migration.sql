-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('EXAM_PREPARATION', 'CONCEPT_MASTERY', 'CLINICAL_SKILLS', 'QUICK_REVISION', 'INTERNSHIP_READINESS', 'CASE_BASED_LEARNING');

-- CreateTable
CREATE TABLE "student_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goals" "GoalType"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_goals_userId_key" ON "student_goals"("userId");

-- CreateIndex
CREATE INDEX "student_goals_userId_idx" ON "student_goals"("userId");

-- AddForeignKey
ALTER TABLE "student_goals" ADD CONSTRAINT "student_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
