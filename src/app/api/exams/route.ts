import { NextRequest, NextResponse } from 'next/server';
import { createExam, updateExam, deleteExam } from '@/lib/actions.server';
import { auth } from '@clerk/nextjs/server';
import { initSentry, captureError } from '@/lib/telemetry';
import { rateLimitConsumeAsync, getClientIp } from '@/lib/rateLimit';
import { examSchema } from '@/lib/formValidationSchemas';
initSentry();

// Helper to check if user is teacher or admin
async function isTeacherOrAdmin() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  return role === 'teacher' || role === 'admin';
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const ip = getClientIp(req);
    const rl = await rateLimitConsumeAsync(`exams:POST:${userId || ip}`, { tokensPerInterval: 10, intervalMs: 60_000 });
    if (!rl.allowed) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    const data = examSchema.parse(await req.json());
    const result = await createExam({ success: false, error: false }, data);
    return NextResponse.json(result);
  } catch (error) {
    captureError(error, { route: 'POST /api/exams' });
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isTeacherOrAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    const { userId } = await auth();
    const ip = getClientIp(req);
    const rl = await rateLimitConsumeAsync(`exams:PUT:${userId || ip}`, { tokensPerInterval: 10, intervalMs: 60_000 });
    if (!rl.allowed) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    const data = examSchema.parse(await req.json());
    const result = await updateExam({ success: false, error: false }, data);
    return NextResponse.json(result);
  } catch (error) {
    captureError(error, { route: 'PUT /api/exams' });
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isTeacherOrAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    // Support both JSON and formData
    let payload: FormData | null = null;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const fd = new FormData();
      if (body?.id !== undefined) fd.append('id', String(body.id));
      payload = fd;
    } else {
      payload = await req.formData();
    }
    const result = await deleteExam({ success: false, error: false }, payload!);
    return NextResponse.json(result);
  } catch (error) {
    captureError(error, { route: 'DELETE /api/exams' });
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
} 