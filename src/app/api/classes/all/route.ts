import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const classes = await prisma.class.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ classes });
  } catch (error) {
    console.error('GET /api/classes/all error:', error);
    return NextResponse.json({ error: 'Server error', details: error?.message || error }, { status: 500 });
  }
} 