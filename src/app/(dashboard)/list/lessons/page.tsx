import TableSearch from '@/components/TableSearch';
import React from 'react';
import Image from 'next/image';
import Pagination from '@/components/Pagination';
import Table from '@/components/Table';
import { ITEM_PER_PAGE } from "@/lib/settings";
import Link from 'next/link';
import FormModal from '@/components/FormModal';
import prisma from "@/lib/prisma";
import { Class, Lesson, Prisma, Subject, Teacher } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";

// Make the page dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type UserRole = "admin" | "teacher" | "student" | "parent";

interface SessionMetadata {
  role?: UserRole;
  classId?: number;
}

type LessonList = Lesson & {
  subject: { name: string };
  class: { name: string };
  teacher: { name: string; surname: string };
};

const baseColumns = [
  {
    header: "Subject Name",
    accessor: "name"
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
];

const getColumns = (role?: UserRole) => {
  if (role === "admin") {
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

const RenderRow = (item: LessonList, role?: UserRole) => (
  <tr key={item.id} className='border-b border-gray-200 even:bg-slate-50 text:sm hover:bg-lamaPurple'>
    <td className='flex items-center gap-4 p-4'>{item.subject.name}</td>
    <td>{item.class.name}</td>
    <td className='hidden md:table-cell'>{`${item.teacher.name} ${item.teacher.surname}`}</td>
    {role === "admin" && (
      <td>
        <div className='flex item-center gap-2'>
          <FormModal table="lesson" type="update" data={item}/>
          <FormModal table="lesson" type="delete" id={item.id}/>
        </div>
      </td>
    )}
  </tr>
);

const buildLessonQuery = (
  role: UserRole,
  userId: string,
  metadata: SessionMetadata,
  queryParams: { [key: string]: string | undefined }
): Prisma.LessonWhereInput => {
  const query: Prisma.LessonWhereInput = {};

  // Add search conditions
  if (queryParams.search) {
    query.OR = [
      { subject: { name: { contains: queryParams.search, mode: "insensitive" } } },
      { teacher: { name: { contains: queryParams.search, mode: "insensitive" } } },
    ];
  }

  // Add class filter
  if (queryParams.classId) {
    query.classId = parseInt(queryParams.classId);
  }

  // Add teacher filter
  if (queryParams.teacherId) {
    query.teacherId = queryParams.teacherId;
  }

  // Add role-based conditions
  switch (role) {
    case "admin":
      // Admin can see all lessons
      break;
    case "teacher":
      query.teacherId = userId;
      break;
    case "student":
      query.class = {
        students: {
          some: {
            id: userId,
          },
        },
      };
      break;
    case "parent":
      query.class = {
        students: {
          some: {
            parentId: userId,
          },
        },
      };
      break;
  }

  return query;
};

const LessonListPage = async ({
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
          <p className="text-red-500">Please sign in to view lessons</p>
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

    const query = buildLessonQuery(role, userId, metadata, queryParams);
    if (role === "teacher") {
      console.log("[Lessons] Teacher Query:", JSON.stringify(query, null, 2));
    }
    const columns = getColumns(role);

    const [data, count] = await prisma.$transaction([
      prisma.lesson.findMany({
        where: query,
        include: {
          subject: { select: { name: true } },
          class: { select: { name: true } },
          teacher: { select: { name: true, surname: true } },
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
      }),
      prisma.lesson.count({ where: query }),
    ]);
    if (role === "teacher") {
      console.log(`[Lessons] Teacher Data Count: ${data.length}`);
    }

    if (!data || data.length === 0) {
      return (
        <div className="bg-white p-4 rounded-lg flex-1 m-4 mt-0">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg semi-bold">All Lessons</h1>
            {role === "admin" && (
              <FormModal table="lesson" type="create" />
            )}
          </div>
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">No lessons found</p>
          </div>
        </div>
      );
    }

    return (
      <div className='bg-white p-4 rounded-lg flex-1 m-4 mt-0'>
        {/* TOP*/}
        <div className='flex justify-between items-center'>
          <h1 className='text-lg semi-bold'>All Lessons</h1>
          <div className='flex flex-col md:flex-row items-center gap-4 w-full md:w-auto'>
            <TableSearch />
            <div className='flex items-center gap-4 self-end'>
              <button className='w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow'>
                <Image src='/filter.png' alt='' width={14} height={14} />
              </button>
              <button className='w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow'>
                <Image src='/sort.png' alt='' width={14} height={14} />
              </button>
              {role === "admin" && (
                <FormModal table="lesson" type="create"/>
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
    console.error("Error in LessonListPage:", error);
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500">An error occurred while loading lessons</p>
      </div>
    );
  }
};

export default LessonListPage;