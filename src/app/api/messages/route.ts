import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { getClientIp, rateLimitConsumeAsync } from '@/lib/rateLimit';
import { initSentry, captureError } from '@/lib/telemetry';
import { getCurrentSchoolId } from '@/lib/tenant';
initSentry();
import { z } from 'zod';

// Send a message
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const ip = getClientIp(req);
    const key = `messages:POST:${userId || ip}`;
    const rl = await rateLimitConsumeAsync(key, { tokensPerInterval: 30, intervalMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } });
    }

    const schema = z.object({
      senderId: z.string().min(1),
      receiverId: z.string().min(1),
      content: z.string().min(1).max(1000),
    });
    const { senderId, receiverId, content } = schema.parse(await req.json());
    
    // Validate input
    if (!senderId || !receiverId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure sender is the authenticated user
    if (senderId !== userId) {
      return NextResponse.json({ error: 'Can only send messages as yourself' }, { status: 403 });
    }

    // Validate content length
    // Length validated by schema

    // Verify receiver exists
    const schoolId = await getCurrentSchoolId();
    const receiver = await prisma.$transaction([
      prisma.admin.findUnique({ where: { id: receiverId, ...(schoolId ? { schoolId } : {}) } }),
      prisma.teacher.findUnique({ where: { id: receiverId, ...(schoolId ? { schoolId } : {}) } }),
      prisma.student.findUnique({ where: { id: receiverId, ...(schoolId ? { schoolId } : {}) } }),
      prisma.parent.findUnique({ where: { id: receiverId, ...(schoolId ? { schoolId } : {}) } }),
    ]);

    const receiverExists = receiver.some(user => user !== null);
    if (!receiverExists) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: { senderId, receiverId, content: content.trim() },
    });
    
    return NextResponse.json({ success: true, message });
  } catch (error) {
    captureError(error, { route: 'POST /api/messages' });
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
}

// Get all messages for a user (inbox)
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');
    
    // Users can only get their own messages
    if (targetUserId && targetUserId !== userId) {
      return NextResponse.json({ error: 'Can only view your own messages' }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit to prevent performance issues
    });
    
    return NextResponse.json(
      { messages },
      { headers: { 'Cache-Control': 'private, max-age=15' } }
    );
  } catch (error) {
    captureError(error, { route: 'GET /api/messages' });
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
} 