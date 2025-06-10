import TableSearch from '@/components/TableSearch'
import React from 'react'
import Image from 'next/image'
import Pagination from '@/components/Pagination'
import Table from '@/components/Table'
import Link from 'next/link'
import FormModal from '@/components/FormModal'
import { ITEM_PER_PAGE } from "@/lib/settings"
import prisma from "@/lib/prisma"
import { Class, Lesson, Prisma, Subject, Teacher, Exam } from '@prisma/client'
import { auth, currentUser } from '@clerk/nextjs/server'

// Make the page dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type UserRole = "admin" | "teacher" | "student" | "parent";

interface SessionMetadata {
  role?: UserRole;
  classId?: number;
}

type ExamList = Exam & {
  lesson: {
    subject: { name: string };
    class: { name: string };
    teacher: { name: string; surname: string };
  };
};

const baseColumns = [
  {
    header: "Title",
    accessor: "title",
  },
  {
    header: "Subject",
    accessor: "subject",
  },
  {
    header: "Class",
    accessor: "class",
  },
  {
    header: "Teacher",
    accessor: "teacher",
    classname: 'hidden md:table-cell',
  },
  {
    header: "Date",
    accessor: "date",
    classname: 'hidden md:table-cell',
  },
  {
    header: "Time",
    accessor: "time",
    classname: 'hidden md:table-cell',
  },
];

const getColumns = (role?: UserRole) => {
  if (role === "admin" || role === "teacher") {
    return [
      ...baseColumns,
      {
        header: "Actions",
        accessor: "action",
      },
    ];
  }
  return baseColumns;
};

const RenderRow = (item: ExamList, role?: UserRole) => (
  <tr key={item.id} className='border-b border-gray-200 even:bg-slate-50 text:sm hover:bg-lamaPurple'>
    <td className='flex items-center gap-4 p-4'>{item.title}</td>
    <td>{item.lesson.subject.name}</td>
    <td>{item.lesson.class.name}</td>
    <td className='hidden md:table-cell'>{`${item.lesson.teacher.name} ${item.lesson.teacher.surname}`}</td>
    <td className='hidden md:table-cell'>{new Intl.DateTimeFormat("en-US").format(item.startTime)}</td>
    <td className='hidden md:table-cell'>{item.startTime.toLocaleTimeString("en-US", {hour: "2-digit", minute: "2-digit", hour12: false})}</td>
    {(role === "admin" || role === "teacher") && (
      <td>
        <div className='flex item-center gap-2'>
          <FormModal table="exam" type="update" data={item}/>
          <FormModal table="exam" type="delete" id={item.id}/>
        </div>
      </td>
    )}
  </tr>
);

const buildExamQuery = (
  role: UserRole,
  userId: string,
  metadata: SessionMetadata,
  queryParams: { [key: string]: string | undefined }
): Prisma.ExamWhereInput => {
  const query: Prisma.ExamWhereInput = {};
  let lessonQuery: Prisma.LessonWhereInput = {};

  // Add search conditions
  if (queryParams.search) {
    query.OR = [
      { title: { contains: queryParams.search, mode: "insensitive" } },
      { lesson: { subject: { name: { contains: queryParams.search, mode: "insensitive" } } } },
    ];
  }

  // Add class filter
  if (queryParams.classId) {
    lessonQuery.classId = parseInt(queryParams.classId);
  }

  // Add role-based conditions
  switch (role) {
    case "admin":
      // Admin can see all exams
      break;
    case "teacher":
      lessonQuery.teacherId = userId;
      break;
    case "student":
      lessonQuery.class = {
        students: {
          some: {
            id: userId,
          },
        },
      };
      break;
    case "parent":
      lessonQuery.class = {
        students: {
          some: {
            parentId: userId,
          },
        },
      };
      break;
  }

  // Only add lesson conditions if there are any
  if (Object.keys(lessonQuery).length > 0) {
    query.lesson = lessonQuery;
  }

  return query;
};

const ExamListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  try {
    const { page, ...queryParams } = searchParams;
    const p = page ? parseInt(page) : 1;

    // Get user role and current user
    const { userId, sessionClaims } = await auth();
    const user = await currentUser();
    const metadata = sessionClaims?.metadata as SessionMetadata;
    const role = metadata?.role;

    if (!userId || !user) {
      return (
        <div className="flex justify-center items-center h-full">
          <p className="text-red-500">Please sign in to view exams</p>
        </div>
      );
    }

    if (!role) {
      return (
        <div className="flex justify-center items-center h-full">
          <p className="text-red-500">Access denied. No role assigned.</p>
        </div>
      );
    }

    const query = buildExamQuery(role, userId, metadata, queryParams);
    const columns = getColumns(role);

    const [data, count] = await prisma.$transaction([
      prisma.exam.findMany({
        where: query,
        include: {
          lesson: {
            select: {
              subject: { select: { name: true } },
              class: { select: { name: true } },
              teacher: { select: { name: true, surname: true } },
            },
          },
        },
        orderBy: {
          startTime: 'desc',
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
      }),
      prisma.exam.count({ where: query }),
    ]);

    if (!data || data.length === 0) {
      return (
        <div className="bg-white p-4 rounded-lg flex-1 m-4 mt-0">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg semi-bold">All Exams</h1>
            {(role === "admin" || role === "teacher") && (
              <FormModal table="exam" type="create" />
            )}
          </div>
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">No exams found</p>
          </div>
        </div>
      );
    }

    return (
      <div className='bg-white p-4 rounded-lg flex-1 m-4 mt-0'>
        {/* TOP*/}
        <div className='flex justify-between items-center'>
          <h1 className='text-lg semi-bold'>All Exams</h1>
          <div className='flex flex-col md:flex-row items-center gap-4 w-full md:w-auto'>
            <TableSearch />
            <div className='flex items-center gap-4 self-end'>
              <button className='w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow'>
                <Image src='/filter.png' alt='' width={14} height={14} />
              </button>
              <button className='w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow'>
                <Image src='/sort.png' alt='' width={14} height={14} />
              </button>
              {(role === "admin" || role === "teacher") && (
                <FormModal table="exam" type="create"/>
              )}
            </div>
          </div>
        </div>
        {/* LIST */}
        <div>
          <Table columns={columns} renderRow={(item) => RenderRow(item, role)} data={data}/>
        </div>
        {/* PAGINATION */}
        <div>
          <Pagination page={p} count={count} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in ExamListPage:", error);
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500">An error occurred while loading exams</p>
      </div>
    );
  }
};

export default ExamListPage;