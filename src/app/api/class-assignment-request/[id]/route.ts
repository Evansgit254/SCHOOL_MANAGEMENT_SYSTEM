import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { action, classId } = await req.json();
  const id = parseInt(params.id, 10);
  if (!id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  if (action === 'approve') {
    if (!classId) {
      return NextResponse.json({ error: 'Missing classId' }, { status: 400 });
    }
    // Find the request to get the studentId
    const reqRecord = await prisma.classAssignmentRequest.findUnique({
      where: { id },
      select: { studentId: true },
    });
    if (!reqRecord) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }
    // Assign the student to the class
    await prisma.student.update({
      where: { id: reqRecord.studentId },
      data: { classId },
    });
    // Mark the request as approved
    await prisma.classAssignmentRequest.update({
      where: { id },
      data: { status: 'approved' },
    });
    return NextResponse.json({ success: true });
  } else {
    await prisma.classAssignmentRequest.update({
      where: { id },
      data: { status: 'rejected' },
    });
    return NextResponse.json({ success: true });
  }
} 