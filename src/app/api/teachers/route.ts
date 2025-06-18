import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs";

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    const metadata = sessionClaims?.metadata as { role?: string } | undefined;
    const role = metadata?.role;

    if (!userId || !role) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(teachers);
  } catch (error) {
    console.error("[TEACHERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 