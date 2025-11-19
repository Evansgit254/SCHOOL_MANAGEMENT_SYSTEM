import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getClientIp, rateLimitConsumeAsync } from '@/lib/rateLimit';
import { initSentry, captureError } from '@/lib/telemetry';
import { getCurrentSchoolId } from '@/lib/tenant';
initSentry();

// Helper to check if user is teacher or admin
async function isTeacherOrAdmin() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  return role === 'teacher' || role === 'admin';
}

export async function POST(req: NextRequest) {
  // Rate limit by user or IP
  const { userId } = await auth();
  const ip = getClientIp(req);
  const key = `assignments:POST:${userId || ip}`;
  const rl = await rateLimitConsumeAsync(key, { tokensPerInterval: 20, intervalMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } });
  }
  if (!(await isTeacherOrAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    const schema = z.object({
      title: z.string().min(1),
      startDate: z.coerce.date().optional(),
      dueDate: z.coerce.date(),
      lessonId: z.coerce.number(),
    });
    const { title, startDate, dueDate, lessonId } = schema.parse(await req.json());
    const schoolId = await getCurrentSchoolId();
    const assignment = await prisma.assignment.create({
      data: {
        title,
        startDate: startDate ?? new Date(),
        dueDate,
        lessonId,
        ...(schoolId ? { schoolId } : {}),
      },
    });
    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    captureError(error, { route: 'POST /api/assignments' });
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isTeacherOrAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    const { id, title, startDate, dueDate, lessonId } = await req.json();
    if (!id || !title || !dueDate || !lessonId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const assignment = await prisma.assignment.update({
      where: { id: Number(id) },
      data: {
        title,
        startDate: startDate ? new Date(startDate) : new Date(),
        dueDate: new Date(dueDate),
        lessonId: Number(lessonId),
      },
    });
    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    captureError(error, { route: 'PUT /api/assignments' });
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
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
    captureError(error, { route: 'DELETE /api/assignments' });
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
} 