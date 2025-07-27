import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// Send a message
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { senderId, receiverId, content } = await req.json();
    
    // Validate input
    if (!senderId || !receiverId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure sender is the authenticated user
    if (senderId !== userId) {
      return NextResponse.json({ error: 'Can only send messages as yourself' }, { status: 403 });
    }

    // Validate content length
    if (content.trim().length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Message too long (max 1000 characters)' }, { status: 400 });
    }

    // Verify receiver exists
    const receiver = await prisma.$transaction([
      prisma.admin.findUnique({ where: { id: receiverId } }),
      prisma.teacher.findUnique({ where: { id: receiverId } }),
      prisma.student.findUnique({ where: { id: receiverId } }),
      prisma.parent.findUnique({ where: { id: receiverId } }),
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
    console.error('POST /api/messages error:', error);
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
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('GET /api/messages error:', error);
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
} 