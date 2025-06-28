/*
  Warnings:

  - You are about to drop the column `seminarID` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `seminarID` on the `AssessmentLink` table. All the data in the column will be lost.
  - You are about to drop the column `userID` on the `OTP` table. All the data in the column will be lost.
  - You are about to drop the column `seminarID` on the `SeminarAdvisor` table. All the data in the column will be lost.
  - You are about to drop the column `seminarID` on the `SeminarAssessor` table. All the data in the column will be lost.
  - You are about to drop the column `seminarID` on the `SeminarDocument` table. All the data in the column will be lost.
  - You are about to drop the column `coordinatorID` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lecturerID` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `studentID` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[seminarId,lecturerNIP,externalAdvisorId]` on the table `Assessment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[seminarId,externalAdvisorId]` on the table `AssessmentLink` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lecturerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[coordinatorId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `seminarId` to the `Assessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seminarId` to the `AssessmentLink` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `OTP` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seminarId` to the `SeminarAdvisor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seminarId` to the `SeminarAssessor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seminarId` to the `SeminarDocument` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_seminarID_fkey";

-- DropForeignKey
ALTER TABLE "AssessmentLink" DROP CONSTRAINT "AssessmentLink_seminarID_fkey";

-- DropForeignKey
ALTER TABLE "OTP" DROP CONSTRAINT "OTP_userID_fkey";

-- DropForeignKey
ALTER TABLE "SeminarAdvisor" DROP CONSTRAINT "SeminarAdvisor_seminarID_fkey";

-- DropForeignKey
ALTER TABLE "SeminarAssessor" DROP CONSTRAINT "SeminarAssessor_seminarID_fkey";

-- DropForeignKey
ALTER TABLE "SeminarDocument" DROP CONSTRAINT "SeminarDocument_seminarID_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_coordinatorID_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_lecturerID_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_studentID_fkey";

-- DropIndex
DROP INDEX "Assessment_seminarID_lecturerNIP_externalAdvisorId_key";

-- DropIndex
DROP INDEX "AssessmentLink_seminarID_externalAdvisorId_key";

-- DropIndex
DROP INDEX "User_coordinatorID_key";

-- DropIndex
DROP INDEX "User_lecturerID_key";

-- DropIndex
DROP INDEX "User_studentID_key";

-- AlterTable
ALTER TABLE "Assessment" DROP COLUMN "seminarID",
ADD COLUMN     "seminarId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "AssessmentLink" DROP COLUMN "seminarID",
ADD COLUMN     "seminarId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "OTP" DROP COLUMN "userID",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "SeminarAdvisor" DROP COLUMN "seminarID",
ADD COLUMN     "seminarId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "SeminarAssessor" DROP COLUMN "seminarID",
ADD COLUMN     "seminarId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "SeminarDocument" DROP COLUMN "seminarID",
ADD COLUMN     "seminarId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "coordinatorID",
DROP COLUMN "lecturerID",
DROP COLUMN "studentID",
ADD COLUMN     "coordinatorId" INTEGER,
ADD COLUMN     "lecturerId" INTEGER,
ADD COLUMN     "studentId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_seminarId_lecturerNIP_externalAdvisorId_key" ON "Assessment"("seminarId", "lecturerNIP", "externalAdvisorId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentLink_seminarId_externalAdvisorId_key" ON "AssessmentLink"("seminarId", "externalAdvisorId");

-- CreateIndex
CREATE UNIQUE INDEX "User_studentId_key" ON "User"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_lecturerId_key" ON "User"("lecturerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_coordinatorId_key" ON "User"("coordinatorId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "Lecturer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "Coordinator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OTP" ADD CONSTRAINT "OTP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeminarAdvisor" ADD CONSTRAINT "SeminarAdvisor_seminarId_fkey" FOREIGN KEY ("seminarId") REFERENCES "Seminar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeminarAssessor" ADD CONSTRAINT "SeminarAssessor_seminarId_fkey" FOREIGN KEY ("seminarId") REFERENCES "Seminar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeminarDocument" ADD CONSTRAINT "SeminarDocument_seminarId_fkey" FOREIGN KEY ("seminarId") REFERENCES "Seminar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_seminarId_fkey" FOREIGN KEY ("seminarId") REFERENCES "Seminar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentLink" ADD CONSTRAINT "AssessmentLink_seminarId_fkey" FOREIGN KEY ("seminarId") REFERENCES "Seminar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
