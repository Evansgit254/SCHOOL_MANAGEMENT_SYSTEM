import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs";

export async function DELETE(
  req: Request,
  { params }: { params: { subjectId: string } }
) {
  try {
    const { userId, sessionClaims } = await auth();
    const metadata = sessionClaims?.metadata as { role?: string } | undefined;
    const role = metadata?.role;

    if (!userId || !role || role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { subjectId } = params;

    // First, disconnect all teachers from the subject
    await prisma.subject.update({
      where: {
        id: parseInt(subjectId),
      },
      data: {
        teachers: {
          set: [], // Disconnect all teachers
        },
      },
    });

    // Then delete the subject
    await prisma.subject.delete({
      where: {
        id: parseInt(subjectId),
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[SUBJECTS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 