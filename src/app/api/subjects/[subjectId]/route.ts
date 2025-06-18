import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs";

export async function PUT(
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

    const body = await req.json();
    const { name, teacherIds } = body;
    const { subjectId } = params;

    if (!name || !teacherIds || !Array.isArray(teacherIds)) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const subject = await prisma.subject.update({
      where: {
        id: parseInt(subjectId),
      },
      data: {
        name,
        teachers: {
          set: [], // First disconnect all teachers
          connect: teacherIds.map((id: string) => ({ id })), // Then connect the new ones
        },
      },
      include: {
        teachers: true,
      },
    });

    return NextResponse.json(subject);
  } catch (error) {
    console.error("[SUBJECTS_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 