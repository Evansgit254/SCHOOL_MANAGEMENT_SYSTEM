import { NextRequest, NextResponse } from 'next/server';
import { createSubject, updateSubject, deleteSubject } from '@/lib/actions.server';
import { initSentry, captureError } from '@/lib/telemetry';
import { rateLimitConsumeAsync, getClientIp } from '@/lib/rateLimit';
import { subjectSchema } from '@/lib/formValidationSchemas';
import { auth } from '@clerk/nextjs/server';
initSentry();

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const ip = getClientIp(req);
    const rl = await rateLimitConsumeAsync(`subjects:POST:${userId || ip}`, { tokensPerInterval: 10, intervalMs: 60_000 });
    if (!rl.allowed) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    const data = subjectSchema.parse(await req.json());
    const result = await createSubject({ success: false, error: false }, data);
    return NextResponse.json(result);
  } catch (error) {
    captureError(error, { route: 'POST /api/subjects' });
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    const ip = getClientIp(req);
    const rl = await rateLimitConsumeAsync(`subjects:PUT:${userId || ip}`, { tokensPerInterval: 10, intervalMs: 60_000 });
    if (!rl.allowed) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    const data = subjectSchema.parse(await req.json());
    const result = await updateSubject({ success: false, error: false }, data);
    return NextResponse.json(result);
  } catch (error) {
    captureError(error, { route: 'PUT /api/subjects' });
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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
    const result = await deleteSubject({ success: false, error: false }, payload!);
    return NextResponse.json(result);
  } catch (error) {
    captureError(error, { route: 'DELETE /api/subjects' });
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
} 