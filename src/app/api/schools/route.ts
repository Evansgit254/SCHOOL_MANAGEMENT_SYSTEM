import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { initSentry, captureError } from '@/lib/telemetry';
initSentry();

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const schools = await prisma.school.findMany({ select: { id: true, name: true } });
    return NextResponse.json({ schools });
  } catch (error) {
    captureError(error, { route: 'GET /api/schools' });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const name = String(body?.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const school = await prisma.school.create({ data: { id: crypto.randomUUID(), name } });
    return NextResponse.json({ school });
  } catch (error) {
    captureError(error, { route: 'POST /api/schools' });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { schoolId } = await req.json();
    if (!schoolId) return NextResponse.json({ error: 'schoolId required' }, { status: 400 });
    const exists = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!exists) return NextResponse.json({ error: 'School not found' }, { status: 404 });
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    await client.users.updateUser(userId, { publicMetadata: { ...user.publicMetadata, schoolId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    captureError(error, { route: 'PATCH /api/schools' });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


