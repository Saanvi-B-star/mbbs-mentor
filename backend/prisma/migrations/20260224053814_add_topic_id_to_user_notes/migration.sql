-- AlterTable
ALTER TABLE "user_notes" ADD COLUMN     "topicId" TEXT;

-- CreateIndex
CREATE INDEX "user_notes_topicId_idx" ON "user_notes"("topicId");

-- AddForeignKey
ALTER TABLE "user_notes" ADD CONSTRAINT "user_notes_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
