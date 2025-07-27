import TableSearch from "@/components/TableSearch";
import React from "react";
import Image from "next/image";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import Link from "next/link";
import FormModal from "@/components/FormModal";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma, Student } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth, currentUser } from '@clerk/nextjs/server';
import FormContainer from "@/components/FormContainer";

// Make the page dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type UserRole = "admin" | "teacher" | "student" | "parent";

interface SessionMetadata {
  role?: UserRole;
  classId?: number;
}

type StudentList = Student & {
  class: {
    name: string;
    id: number;
  };
};

const baseColumns = [
  {
    header: "Info",
    accessor: "Info",
  },
  {
    header: "Student ID",
    accessor: "studentId",
    classname: "hidden md:table-cell",
  },
  {
    header: "Grade",
    accessor: "grade",
    classname: "hidden md:table-cell",
  },
  {
    header: "Phone",
    accessor: "phone",
    classname: "hidden lg:table-cell",
  },
  {
    header: "Address",
    accessor: "address",
    classname: "hidden lg:table-cell",
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

const RenderRow = (item: StudentList, role?: UserRole) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text:sm hover:bg-lamaPurple"
  >
    <td className="flex items-center gap-4 p-4">
      <Image
        src={item.img || "/noAvatar.png"}
        alt=""
        width={40}
        height={40}
        className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
      />
      <div className="flex flex-col">
        <h3 className="font-semibold">{item.name}</h3>
        <p className="text-xs text-gray-500">{item.class.name}</p>
      </div>
    </td>
    <td className="hidden md:table-cell">{item.username}</td>
    <td className="hidden md:table-cell">{item.class.name[0]}</td>
    <td className="hidden md:table-cell">{item.phone}</td>
    <td className="hidden md:table-cell">{item.address}</td>
    {role === "admin" && (
      <td>
        <div className="flex item-center gap-2">
          <Link href={`/list/students/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
          <FormContainer table="student" type="delete" id={item.id} />
        </div>
      </td>
    )}
  </tr>
);

const buildStudentQuery = (
  role: UserRole,
  userId: string,
  metadata: SessionMetadata,
  queryParams: { [key: string]: string | undefined }
): Prisma.StudentWhereInput => {
  const query: Prisma.StudentWhereInput = {};

  // Add search conditions
  if (queryParams.search) {
    query.OR = [
      { name: { contains: queryParams.search, mode: "insensitive" } },
      { surname: { contains: queryParams.search, mode: "insensitive" } },
      { username: { contains: queryParams.search, mode: "insensitive" } },
      { email: { contains: queryParams.search, mode: "insensitive" } },
    ];
  }

  // Add teacher filter
  if (queryParams.teacherId) {
    query.class = {
      lessons: {
        some: {
          teacherId: queryParams.teacherId,
        },
      },
    };
  }

  // Add role-based conditions
  switch (role) {
    case "admin":
      // Admin can see all students
      break;
    case "teacher":
      // Teachers can see students in their classes
      query.class = {
        lessons: {
          some: {
            teacherId: userId,
          },
        },
      };
      break;
    case "parent":
      // Parents can only see their children
      query.parentId = userId;
      break;
    case "student":
      // Students can only see themselves and their classmates
      query.OR = [
        { id: userId },
        { classId: metadata.classId },
      ];
      break;
  }

  return query;
};

const StudentListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  try {
    const params = await searchParams;
    const { page, ...queryParams } = params;
    const p = page ? parseInt(page) : 1;

    // Get user role and current user
    const { userId, sessionClaims } = await auth();
    const user = await currentUser();
    const metadata = sessionClaims?.metadata as SessionMetadata;
    const role = metadata?.role;

    if (!userId || !user) {
      return (
        <div className="flex justify-center items-center h-full">
          <p className="text-red-500">Please sign in to view students</p>
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

    const query = buildStudentQuery(role, userId, metadata, queryParams);
    const columns = getColumns(role);

    const [data, count] = await prisma.$transaction([
      prisma.student.findMany({
        where: query,
        include: {
          class: {
            select: {
              name: true,
              id: true,
            },
          },
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
      }),
      prisma.student.count({ where: query }),
    ]);

    if (!data || data.length === 0) {
      return (
        <div className="bg-white p-4 rounded-lg flex-1 m-4 mt-0">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg semi-bold">All Students</h1>
            {role === "admin" && (
              <FormContainer table="student" type="create" />
            )}
          </div>
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">No students found</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white p-4 rounded-lg flex-1 m-4 mt-0">
        {/* TOP*/}
        <div className="flex justify-between items-center">
          <h1 className="text-lg semi-bold">All Students</h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch />
            <div className="flex items-center gap-4 self-end">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <Image src="/sort.png" alt="" width={14} height={14} />
              </button>
              {role === "admin" && (
                <FormModal table="student" type="create" />
              )}
            </div>
          </div>
        </div>
        {/* LIST */}
        <div>
          <Table columns={columns} renderRow={(item) => RenderRow(item, role)} data={data} />
        </div>
        {/* PAGINATION */}
        <div>
          <Pagination page={p} count={count} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in StudentListPage:", error);
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500">An error occurred while loading students</p>
      </div>
    );
  }
};

export default StudentListPage;
