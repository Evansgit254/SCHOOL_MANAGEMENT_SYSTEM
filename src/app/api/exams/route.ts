import { NextRequest, NextResponse } from 'next/server';
import { createExam, updateExam, deleteExam } from '@/lib/actions.server';
import { auth } from '@clerk/nextjs/server';

// Helper to check if user is teacher or admin
async function isTeacherOrAdmin() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  return role === 'teacher' || role === 'admin';
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await createExam({ success: false, error: false }, data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/exams error:', error);
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isTeacherOrAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    const data = await req.json();
    const result = await updateExam({ success: false, error: false }, data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT /api/exams error:', error);
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isTeacherOrAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    const formData = await req.formData();
    const result = await deleteExam({ success: false, error: false }, formData);
    return NextResponse.json(result);
  } catch (error) {
    console.error('DELETE /api/exams error:', error);
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
} 