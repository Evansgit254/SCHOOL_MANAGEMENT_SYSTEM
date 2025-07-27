import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: NextRequest, context: any) {
  try {
    const id = parseInt(context.params.id, 10);
    if (!id) return NextResponse.json({ error: 'Invalid message id' }, { status: 400 });
    const message = await prisma.message.update({
      where: { id },
      data: { read: true },
    });
    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('PATCH /api/messages/[id]/read error:', error);
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
} 