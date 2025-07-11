import TableSearch from '@/components/TableSearch'
import React from 'react'
import Image from 'next/image'
import Pagination from '@/components/Pagination'
import Table from '@/components/Table'
import Link from 'next/link'
import FormModal from '@/components/FormModal'
import { ITEM_PER_PAGE } from '@/lib/settings'
import prisma from '@/lib/prisma'
import { Result, Prisma } from '@prisma/client'
import { auth, currentUser } from '@clerk/nextjs/server'

// Make the page dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type UserRole = "admin" | "teacher" | "student" | "parent";

interface SessionMetadata {
  role?: UserRole;
  classId?: number;
}

type ResultList = {
  id: number;
  title: string;
  studentName: string;
  studentSurname: string;
  teacherName: string;
  teacherSurname: string;
  score: number;
  startTime: Date;
  className: string;
  type: "exam" | "assignment";
};

const baseColumns = [
  {
    header: "Title",
    accessor: "title"
  },
  {
    header: "Student",
    accessor: "student",
  },
  {
    header: "Score",
    accessor: "score",
    classname: 'hidden md:table-cell',
  },
  {
    header: "Class",
    accessor: "class",
    classname: 'hidden md:table-cell',
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

const RenderRow = (item: ResultList, role?: UserRole) => (
  <tr key={item.id} className='border-b border-gray-200 even:bg-slate-50 text:sm hover:bg-lamaPurple'>
    <td className='flex items-center gap-4 p-4'>
      <div className='flex flex-col'>
        <span>{item.title}</span>
        <span className='text-xs text-gray-500'>{item.type}</span>
      </div>
    </td>
    <td>{`${item.studentName} ${item.studentSurname}`}</td>
    <td className='hidden md:table-cell'>{item.score}</td>
    <td className='hidden md:table-cell'>{item.className}</td>
    <td className='hidden md:table-cell'>{`${item.teacherName} ${item.teacherSurname}`}</td>
    <td className='hidden md:table-cell'>{new Intl.DateTimeFormat("en-US").format(item.startTime)}</td>
    {(role === "admin" || role === "teacher") && (
      <td>
        <div className='flex item-center gap-2'>
          <FormModal table="result" type="update" data={item}/>
          <FormModal table="result" type="delete" id={item.id}/>
        </div>
      </td>
    )}
  </tr>
);

const buildResultQuery = (
  role: UserRole,
  userId: string,
  metadata: SessionMetadata,
  queryParams: { [key: string]: string | undefined }
): Prisma.ResultWhereInput => {
  const query: Prisma.ResultWhereInput = {};

  // Add search conditions
  if (queryParams.search) {
    query.OR = [
      { exam: { title: { contains: queryParams.search, mode: "insensitive" } } },
      { assignment: { title: { contains: queryParams.search, mode: "insensitive" } } },
      { student: { name: { contains: queryParams.search, mode: "insensitive" } } },
      { student: { surname: { contains: queryParams.search, mode: "insensitive" } } },
    ];
  }

  // Add role-based conditions
  switch (role) {
    case "admin":
      // Admin can see all results
      break;
    case "teacher":
      // Teachers can see results for their classes
      query.OR = [
        {
          exam: {
            lesson: {
              teacherId: userId
            }
          }
        },
        {
          assignment: {
            lesson: {
              teacherId: userId
            }
          }
        }
      ];
      break;
    case "student":
      // Students can only see their own results
      query.studentId = userId;
      break;
    case "parent":
      // Parents can see their children's results
      query.student = {
        parentId: userId
      };
      break;
  }

  return query;
};

const ResultListPage = async ({
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
          <p className="text-red-500">Please sign in to view results</p>
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

    const query = buildResultQuery(role, userId, metadata, queryParams);
    if (role === "teacher") {
      console.log("[Results] Teacher Query:", JSON.stringify(query, null, 2));
    }
    const columns = getColumns(role);

    const [dataRes, count] = await prisma.$transaction([
      prisma.result.findMany({
        where: query,
        include: {
          student: {
            select: { name: true, surname: true }
          },
          exam: {
            include: {
              lesson: {
                select: {
                  class: { select: { name: true } },
                  teacher: { select: { name: true, surname: true } },
                },
              },
            }
          },
          assignment: {
            include: {
              lesson: {
                select: {
                  class: { select: { name: true } },
                  teacher: { select: { name: true, surname: true } },
                },
              },
            }
          }
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
      }),
      prisma.result.count({ where: query }),
    ]);
    if (role === "teacher") {
      console.log(`[Results] Teacher Data Count: ${dataRes.length}`);
    }

    const data = dataRes.map(item => {
      const assessment = item.assignment || item.exam;
      if (!assessment) return null;

      const isExam = "startTime" in assessment;
      return {
        id: item.id,
        title: assessment.title,
        studentName: item.student.name,
        studentSurname: item.student.surname,
        teacherName: assessment.lesson.teacher.name,
        teacherSurname: assessment.lesson.teacher.surname,
        className: assessment.lesson.class.name,
        score: item.score,
        startTime: isExam ? assessment.startTime : assessment.startDate,
        type: isExam ? "exam" as const : "assignment" as const,
      };
    }).filter((item): item is ResultList => item !== null);

    if (!data || data.length === 0) {
      return (
        <div className="bg-white p-4 rounded-lg flex-1 m-4 mt-0">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg semi-bold">All Results</h1>
            {(role === "admin" || role === "teacher") && (
              <FormModal table="result" type="create" />
            )}
          </div>
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">No results found</p>
          </div>
        </div>
      );
    }

    return (
      <div className='bg-white p-4 rounded-lg flex-1 m-4 mt-0'>
        {/* TOP*/}
        <div className='flex justify-between items-center'>
          <h1 className='text-lg semi-bold'>All Results</h1>
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
                <FormModal table="result" type="create"/>
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
    console.error("Error in ResultListPage:", error);
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500">An error occurred while loading results</p>
      </div>
    );
  }
};

export default ResultListPage;