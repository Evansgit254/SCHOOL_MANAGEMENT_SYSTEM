import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { studentId } = await req.json();
    if (!studentId) {
      return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
    }

    // Check if student exists
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json({ error: 'Student does not exist' }, { status: 400 });
    }

    // Check if a pending request already exists
    const existing = await prisma.classAssignmentRequest.findFirst({
      where: { studentId, status: 'pending' },
    });
    if (existing) {
      return NextResponse.json({ error: 'Request already pending' }, { status: 409 });
    }

    const request = await prisma.classAssignmentRequest.create({
      data: {
        studentId,
        status: 'pending',
      },
    });
    return NextResponse.json({ success: true, request });
  } catch (error) {
    console.error('POST /api/class-assignment-request error:', error);
    return NextResponse.json({ error: 'Server error', details: error?.message || error }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  if (!studentId) return NextResponse.json({ pending: false });
  const existing = await prisma.classAssignmentRequest.findFirst({
    where: { studentId, status: 'pending' },
  });
  return NextResponse.json({ pending: !!existing });
} 