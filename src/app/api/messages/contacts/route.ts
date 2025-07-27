import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { ContactUser } from '@/lib/types';

export async function GET() {
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

    let contacts: ContactUser[] = [];

    switch (role) {
      case 'admin':
        // Admin can message all users
        const [teachers, students, parents] = await Promise.all([
          prisma.teacher.findMany({
            select: {
              id: true,
              username: true,
              name: true,
              surname: true,
              img: true,
            },
            orderBy: { name: 'asc' },
          }),
          prisma.student.findMany({
            select: {
              id: true,
              username: true,
              name: true,
              surname: true,
              img: true,
              class: {
                select: { name: true },
              },
            },
            orderBy: { name: 'asc' },
          }),
          prisma.parent.findMany({
            select: {
              id: true,
              username: true,
              name: true,
              surname: true,
            },
            orderBy: { name: 'asc' },
          }),
        ]);

        contacts = [
          ...teachers.map(t => ({ ...t, type: 'teacher' as const, displayName: `${t.name} ${t.surname} (Teacher)` })),
          ...students.map(s => ({ ...s, type: 'student' as const, displayName: `${s.name} ${s.surname} (${s.class.name})` })),
          ...parents.map(p => ({ ...p, type: 'parent' as const, displayName: `${p.name} ${p.surname} (Parent)` })),
        ];
        break;
      case 'teacher': {
        // Broader access: all students, parents, and teachers (except self)
        const [students, parents, teachers] = await Promise.all([
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
        contacts = [
          ...students.map(s => ({ ...s, type: 'student' as const, displayName: `${s.name} ${s.surname} (${s.class.name})` })),
          ...parents.map(p => ({ ...p, type: 'parent' as const, displayName: `${p.name} ${p.surname} (Parent)` })),
          ...teachers.map(t => ({ ...t, type: 'teacher' as const, displayName: `${t.name} ${t.surname} (Teacher)` })),
        ];
        break;
      }
      case 'student':
        // Students can message their teachers, classmates, and their parent
        const studentData = await prisma.student.findUnique({
          where: { id: userId },
          include: {
            class: {
              include: {
                lessons: {
                  include: {
                    teacher: {
                      select: {
                        id: true,
                        username: true,
                        name: true,
                        surname: true,
                        img: true,
                      },
                    },
                  },
                },
                students: {
                  where: { id: { not: userId } },
                  select: {
                    id: true,
                    username: true,
                    name: true,
                    surname: true,
                    img: true,
                  },
                },
              },
            },
            parent: {
              select: {
                id: true,
                username: true,
                name: true,
                surname: true,
              },
            },
          },
        });

        if (studentData) {
          const teacherIds = new Set<string>();
          studentData.class.lessons.forEach(lesson => {
            teacherIds.add(lesson.teacher.id);
          });

          const teachers = await prisma.teacher.findMany({
            where: { id: { in: Array.from(teacherIds) } },
            select: {
              id: true,
              username: true,
              name: true,
              surname: true,
              img: true,
            },
          });

          contacts = [
            ...teachers.map(t => ({ ...t, type: 'teacher' as const, displayName: `${t.name} ${t.surname} (Teacher)` })),
            ...studentData.class.students.map(s => ({ ...s, type: 'student' as const, displayName: `${s.name} ${s.surname} (Classmate)` })),
          ];
          if(studentData.parent){
            contacts.push({ ...studentData.parent, type: 'parent' as const, displayName: `${studentData.parent.name} ${studentData.parent.surname} (Parent)` })
          }
        }
        break;

      case 'parent':
        // Parents can message their children's teachers and their children
        const parentData = await prisma.parent.findUnique({
          where: { id: userId },
          include: {
            students: {
              include: {
                class: {
                  include: {
                    lessons: {
                      include: {
                        teacher: {
                          select: {
                            id: true,
                            username: true,
                            name: true,
                            surname: true,
                            img: true,
                          },
                        },
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

          const teachers = await prisma.teacher.findMany({
            where: { id: { in: Array.from(teacherIds) } },
            select: {
              id: true,
              username: true,
              name: true,
              surname: true,
              img: true,
            },
          });

          contacts = [
            ...teachers.map(t => ({ ...t, type: 'teacher' as const, displayName: `${t.name} ${t.surname} (Teacher)` })),
            ...parentData.students.map(s => ({ ...s, type: 'student' as const, displayName: `${s.name} ${s.surname} (Child)` })),
          ];
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('GET /api/messages/contacts error:', error);
    return NextResponse.json({ error: 'Server error', details: (error as Error)?.message || error }, { status: 500 });
  }
} 