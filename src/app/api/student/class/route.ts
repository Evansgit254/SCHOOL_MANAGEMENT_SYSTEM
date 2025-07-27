import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ classId: null });
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { id: userId },
          { username: userId }
        ]
      },
      select: { classId: true },
    });
    return NextResponse.json({ classId: student?.classId ?? null });
  } catch (error) {
    console.error('GET /api/student/class error:', error);
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
} 