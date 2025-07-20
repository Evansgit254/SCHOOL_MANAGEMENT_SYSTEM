import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// Helper to check if user is teacher or admin
async function isTeacherOrAdmin() {
  const { sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role;
  return role === 'teacher' || role === 'admin';
}

export async function POST(req: NextRequest) {
  if (!(await isTeacherOrAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    const { title, description, startDate, dueDate, lessonId } = await req.json();
    if (!title || !dueDate || !lessonId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const assignment = await prisma.assignment.create({
      data: {
        title,
        description: description || '',
        startDate: startDate ? new Date(startDate) : new Date(),
        dueDate: new Date(dueDate),
        lessonId: Number(lessonId),
      },
    });
    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error('POST /api/assignments error:', error);
    return NextResponse.json({ error: 'Server error', details: error?.message || error }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isTeacherOrAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    const { id, title, description, startDate, dueDate, lessonId } = await req.json();
    if (!id || !title || !dueDate || !lessonId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const assignment = await prisma.assignment.update({
      where: { id: Number(id) },
      data: {
        title,
        description: description || '',
        startDate: startDate ? new Date(startDate) : new Date(),
        dueDate: new Date(dueDate),
        lessonId: Number(lessonId),
      },
    });
    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error('PUT /api/assignments error:', error);
    return NextResponse.json({ error: 'Server error', details: error?.message || error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isTeacherOrAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing assignment id' }, { status: 400 });
    }
    await prisma.assignment.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/assignments error:', error);
    return NextResponse.json({ error: 'Server error', details: error?.message || error }, { status: 500 });
  }
} 