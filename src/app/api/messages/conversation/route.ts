import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { initSentry, captureError } from '@/lib/telemetry';
initSentry();

// Get conversation between two users
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const user1 = searchParams.get('user1');
    const user2 = searchParams.get('user2');
    if (!user1 || !user2) return NextResponse.json({ error: 'Missing user1 or user2' }, { status: 400 });
    // Ensure the requester is a participant in the conversation
    if (userId !== user1 && userId !== user2) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user1, receiverId: user2 },
          { senderId: user2, receiverId: user1 },
        ],
      },
      orderBy: { timestamp: 'asc' },
    });
    return NextResponse.json(
      { messages },
      { headers: { 'Cache-Control': 'private, max-age=5' } }
    );
  } catch (error) {
    captureError(error, { route: 'GET /api/messages/conversation' });
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
} 