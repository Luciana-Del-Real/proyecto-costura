-- AlterTable
ALTER TABLE "lesson_comments" ADD COLUMN     "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "lesson_comments" ADD CONSTRAINT "lesson_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "lesson_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
