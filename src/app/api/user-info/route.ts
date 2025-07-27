import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    // Try to find user in all tables
    const [admin, teacher, student, parent] = await Promise.all([
      prisma.admin.findUnique({ where: { id: userId } }),
      prisma.teacher.findUnique({ where: { id: userId } }),
      prisma.student.findUnique({ where: { id: userId } }),
      prisma.parent.findUnique({ where: { id: userId } }),
    ]);

    const user = admin || teacher || student || parent;
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine user type and format response
    let userType = '';
    let displayName = '';
    
    if (admin) {
      userType = 'admin';
      displayName = `${admin.username} (Admin)`;
    } else if (teacher) {
      userType = 'teacher';
      displayName = `${teacher.name} ${teacher.surname} (Teacher)`;
    } else if (student) {
      userType = 'student';
      displayName = `${student.name} ${student.surname} (Student)`;
    } else if (parent) {
      userType = 'parent';
      displayName = `${parent.name} ${parent.surname} (Parent)`;
    }

    return NextResponse.json({
      id: user.id,
      username: 'username' in user ? user.username : '',
      name: 'name' in user ? user.name : '',
      surname: 'surname' in user ? user.surname : '',
      img: 'img' in user ? user.img : '',
      type: userType,
      displayName: displayName,
    });
  } catch (error) {
    console.error('GET /api/user-info error:', error);
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
} 