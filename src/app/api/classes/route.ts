import { NextRequest, NextResponse } from 'next/server';
import { createClass, updateClass, deleteClass } from '@/lib/actions.server';
import { initSentry, captureError } from '@/lib/telemetry';
import { rateLimitConsumeAsync, getClientIp } from '@/lib/rateLimit';
import { classSchema } from '@/lib/formValidationSchemas';
import { auth } from '@clerk/nextjs/server';
initSentry();

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const ip = getClientIp(req);
    const rl = await rateLimitConsumeAsync(`classes:POST:${userId || ip}`, { tokensPerInterval: 10, intervalMs: 60_000 });
    if (!rl.allowed) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    const data = classSchema.parse(await req.json());
    const result = await createClass({ success: false, error: false }, data);
    return NextResponse.json(result);
  } catch (error) {
    captureError(error, { route: 'POST /api/classes' });
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    const ip = getClientIp(req);
    const rl = await rateLimitConsumeAsync(`classes:PUT:${userId || ip}`, { tokensPerInterval: 10, intervalMs: 60_000 });
    if (!rl.allowed) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    const data = classSchema.parse(await req.json());
    const result = await updateClass({ success: false, error: false }, data);
    return NextResponse.json(result);
  } catch (error) {
    captureError(error, { route: 'PUT /api/classes' });
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const formData = await req.formData();
    const result = await deleteClass({ success: false, error: false }, formData);
    return NextResponse.json(result);
  } catch (error) {
    captureError(error, { route: 'DELETE /api/classes' });
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
} 