import { NextRequest, NextResponse } from 'next/server';
import { createTeacher, updateTeacher, deleteTeacher } from '@/lib/actions.server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await createTeacher({ success: false, error: false }, data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/teachers error:', error);
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await updateTeacher({ success: false, error: false }, data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT /api/teachers error:', error);
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const formData = await req.formData();
    const result = await deleteTeacher({ success: false, error: false }, formData);
    return NextResponse.json(result);
  } catch (error) {
    console.error('DELETE /api/teachers error:', error);
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
} 