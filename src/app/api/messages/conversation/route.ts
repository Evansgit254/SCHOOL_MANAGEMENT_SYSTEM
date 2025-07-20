import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get conversation between two users
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user1 = searchParams.get('user1');
    const user2 = searchParams.get('user2');
    if (!user1 || !user2) return NextResponse.json({ error: 'Missing user1 or user2' }, { status: 400 });
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user1, receiverId: user2 },
          { senderId: user2, receiverId: user1 },
        ],
      },
      orderBy: { timestamp: 'asc' },
    });
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('GET /api/messages/conversation error:', error);
    return NextResponse.json({ error: 'Server error', details: error?.message || error }, { status: 500 });
  }
} 