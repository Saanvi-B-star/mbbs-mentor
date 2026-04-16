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

-- CreateTable
CREATE TABLE "llm_chats" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "question" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_index" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "nodeType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_index_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_goals_userId_key" ON "student_goals"("userId");

-- CreateIndex
CREATE INDEX "student_goals_userId_idx" ON "student_goals"("userId");

-- CreateIndex
CREATE INDEX "llm_chats_userId_idx" ON "llm_chats"("userId");

-- CreateIndex
CREATE INDEX "llm_chats_createdAt_idx" ON "llm_chats"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "rag_index_nodeId_key" ON "rag_index"("nodeId");

-- CreateIndex
CREATE INDEX "rag_index_nodeType_idx" ON "rag_index"("nodeType");

-- CreateIndex
CREATE INDEX "rag_index_parentId_idx" ON "rag_index"("parentId");

-- AddForeignKey
ALTER TABLE "student_goals" ADD CONSTRAINT "student_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
