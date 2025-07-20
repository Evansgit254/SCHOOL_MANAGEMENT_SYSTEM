import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metadata = sessionClaims?.metadata as { role?: string };
    const role = metadata?.role;

    if (!role) {
      return NextResponse.json({ error: 'No role assigned' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    let users: any[] = [];

    switch (role) {
      case 'admin':
        // Admin can search all users
        const [teachers, students, parents] = await Promise.all([
          prisma.teacher.findMany({
            where: {
              OR: [
                { username: { contains: query, mode: 'insensitive' } },
                { name: { contains: query, mode: 'insensitive' } },
                { surname: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: {
              id: true,
              username: true,
              name: true,
              surname: true,
              img: true,
            },
            take: 10,
          }),
          prisma.student.findMany({
            where: {
              OR: [
                { username: { contains: query, mode: 'insensitive' } },
                { name: { contains: query, mode: 'insensitive' } },
                { surname: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: {
              id: true,
              username: true,
              name: true,
              surname: true,
              img: true,
              class: { select: { name: true } },
            },
            take: 10,
          }),
          prisma.parent.findMany({
            where: {
              OR: [
                { username: { contains: query, mode: 'insensitive' } },
                { name: { contains: query, mode: 'insensitive' } },
                { surname: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: {
              id: true,
              username: true,
              name: true,
              surname: true,
            },
            take: 10,
          }),
        ]);

        users = [
          ...teachers.map(t => ({ ...t, type: 'teacher', displayName: `${t.name} ${t.surname} (Teacher)` })),
          ...students.map(s => ({ ...s, type: 'student', displayName: `${s.name} ${s.surname} (${s.class.name})` })),
          ...parents.map(p => ({ ...p, type: 'parent', displayName: `${p.name} ${p.surname} (Parent)` })),
        ];
        break;
      case 'teacher': {
        // Broader access: all students, parents, and teachers (except self)
        const [studentsRaw, parents, teachers] = await Promise.all([
          prisma.student.findMany({
            select: {
              id: true,
              username: true,
              name: true,
              surname: true,
              img: true,
              class: { select: { name: true } },
            },
          }),
          prisma.parent.findMany({
            select: {
              id: true,
              username: true,
              name: true,
              surname: true,
            },
          }),
          prisma.teacher.findMany({
            where: { id: { not: userId } },
            select: {
              id: true,
              username: true,
              name: true,
              surname: true,
              img: true,
            },
          }),
        ]);
        // Now filter students by search query
        const students = studentsRaw.filter(s =>
          s.username.toLowerCase().includes(query.toLowerCase()) ||
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.surname.toLowerCase().includes(query.toLowerCase())
        );
        const filteredParents = parents.filter(p =>
          p.username.toLowerCase().includes(query.toLowerCase()) ||
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.surname.toLowerCase().includes(query.toLowerCase())
        );
        const filteredTeachers = teachers.filter(t =>
          t.username.toLowerCase().includes(query.toLowerCase()) ||
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.surname.toLowerCase().includes(query.toLowerCase())
        );
        users = [
          ...students.map(s => ({ ...s, type: 'student', displayName: `${s.name} ${s.surname} (${s.class.name})` })),
          ...filteredParents.map(p => ({ ...p, type: 'parent', displayName: `${p.name} ${p.surname} (Parent)` })),
          ...filteredTeachers.map(t => ({ ...t, type: 'teacher', displayName: `${t.name} ${t.surname} (Teacher)` })),
        ];
        break;
      }
      case 'student':
        // Students can search their teachers, classmates, and their parent
        const studentData = await prisma.student.findUnique({
          where: { id: userId },
          include: {
            class: {
              include: {
                lessons: {
                  include: {
                    teacher: true,
                  },
                },
                students: {
                  where: { id: { not: userId } },
                },
              },
            },
            parent: true,
          },
        });

        if (studentData) {
          const teacherIds = new Set<string>();
          studentData.class.lessons.forEach(lesson => {
            teacherIds.add(lesson.teacher.id);
          });

          const [teachers, classmates] = await Promise.all([
            prisma.teacher.findMany({
              where: {
                id: { in: Array.from(teacherIds) },
                OR: [
                  { username: { contains: query, mode: 'insensitive' } },
                  { name: { contains: query, mode: 'insensitive' } },
                  { surname: { contains: query, mode: 'insensitive' } },
                ],
              },
              select: {
                id: true,
                username: true,
                name: true,
                surname: true,
                img: true,
              },
              take: 10,
            }),
            prisma.student.findMany({
              where: {
                id: { in: studentData.class.students.map(s => s.id) },
                OR: [
                  { username: { contains: query, mode: 'insensitive' } },
                  { name: { contains: query, mode: 'insensitive' } },
                  { surname: { contains: query, mode: 'insensitive' } },
                ],
              },
              select: {
                id: true,
                username: true,
                name: true,
                surname: true,
                img: true,
              },
              take: 10,
            }),
          ]);

          users = [
            ...teachers.map(t => ({ ...t, type: 'teacher', displayName: `${t.name} ${t.surname} (Teacher)` })),
            ...classmates.map(s => ({ ...s, type: 'student', displayName: `${s.name} ${s.surname} (Classmate)` })),
          ];

          // Add parent if query matches
          if (
            studentData.parent.username.toLowerCase().includes(query.toLowerCase()) ||
            studentData.parent.name.toLowerCase().includes(query.toLowerCase()) ||
            studentData.parent.surname.toLowerCase().includes(query.toLowerCase())
          ) {
            users.push({
              ...studentData.parent,
              type: 'parent',
              displayName: `${studentData.parent.name} ${studentData.parent.surname} (Parent)`,
            });
          }
        }
        break;

      case 'parent':
        // Parents can search their children's teachers and their children
        const parentData = await prisma.parent.findUnique({
          where: { id: userId },
          include: {
            students: {
              include: {
                class: {
                  include: {
                    lessons: {
                      include: {
                        teacher: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (parentData) {
          const teacherIds = new Set<string>();
          parentData.students.forEach(student => {
            student.class.lessons.forEach(lesson => {
              teacherIds.add(lesson.teacher.id);
            });
          });

          const [teachers, children] = await Promise.all([
            prisma.teacher.findMany({
              where: {
                id: { in: Array.from(teacherIds) },
                OR: [
                  { username: { contains: query, mode: 'insensitive' } },
                  { name: { contains: query, mode: 'insensitive' } },
                  { surname: { contains: query, mode: 'insensitive' } },
                ],
              },
              select: {
                id: true,
                username: true,
                name: true,
                surname: true,
                img: true,
              },
              take: 10,
            }),
            prisma.student.findMany({
              where: {
                id: { in: parentData.students.map(s => s.id) },
                OR: [
                  { username: { contains: query, mode: 'insensitive' } },
                  { name: { contains: query, mode: 'insensitive' } },
                  { surname: { contains: query, mode: 'insensitive' } },
                ],
              },
              select: {
                id: true,
                username: true,
                name: true,
                surname: true,
                img: true,
              },
              take: 10,
            }),
          ]);

          users = [
            ...teachers.map(t => ({ ...t, type: 'teacher', displayName: `${t.name} ${t.surname} (Teacher)` })),
            ...children.map(s => ({ ...s, type: 'student', displayName: `${s.name} ${s.surname} (Child)` })),
          ];
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('GET /api/messages/search-users error:', error);
    return NextResponse.json({ error: 'Server error', details: error?.message || error }, { status: 500 });
  }
} 