import { NextRequest, NextResponse } from 'next/server';
import { createStudent, updateStudent, deleteStudent } from '@/lib/actions.server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await createStudent({ success: false, error: false }, data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/students error:', error);
    return NextResponse.json({ error: 'Server error', details: error?.message || error }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await updateStudent({ success: false, error: false }, data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT /api/students error:', error);
    return NextResponse.json({ error: 'Server error', details: error?.message || error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const formData = await req.formData();
    const result = await deleteStudent({ success: false, error: false }, formData);
    return NextResponse.json(result);
  } catch (error) {
    console.error('DELETE /api/students error:', error);
    return NextResponse.json({ error: 'Server error', details: error?.message || error }, { status: 500 });
  }
} 