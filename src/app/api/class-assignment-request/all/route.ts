import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const requests = await prisma.classAssignmentRequest.findMany({
      where: { status: 'pending' },
      include: { student: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ requests });
  } catch (error) {
    console.error('GET /api/class-assignment-request/all error:', error);
    return NextResponse.json({ error: 'Server error', details: error?.message || error }, { status: 500 });
  }
} 