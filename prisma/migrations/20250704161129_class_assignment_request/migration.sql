-- CreateTable
CREATE TABLE "ClassAssignmentRequest" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassAssignmentRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ClassAssignmentRequest" ADD CONSTRAINT "ClassAssignmentRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
