import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendar from "@/components/EventCalendar";
import RequestClassAssignmentButton from "@/components/RequestClassAssignmentButton";

export default async function StudentPage() {
  const { userId } = await auth();
  let classId: number | null = null;
  let hasClass = false;
  let pendingRequest = false;

  if (userId) {
    const student = await prisma.student.findFirst({
      where: { OR: [{ id: userId }, { username: userId }] },
      select: { classId: true },
    });
    classId = student?.classId ?? null;
    hasClass = !!classId;
    // Check for pending class assignment request
    const existing = await prisma.classAssignmentRequest.findFirst({
      where: { studentId: userId, status: 'pending' },
    });
    pendingRequest = !!existing;
  }

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="h-full bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Schedule (4A)</h1>
          {!userId ? (
            <div className="text-red-500">You must be logged in to view this page.</div>
          ) : hasClass && classId ? (
            <BigCalendarContainer type="classId" id={classId} />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="text-red-500">You are not assigned to any class.</div>
              <RequestClassAssignmentButton studentId={userId} pending={pendingRequest} />
            </div>
          )}
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <EventCalendar />
      </div>
    </div>
  );
}