import TableSearch from '@/components/TableSearch'
import React from 'react'
import Image from 'next/image'
import Pagination from '@/components/Pagination'
import Table from '@/components/Table'
import Link from 'next/link'
import FormModal from '@/components/FormModal'
import { ITEM_PER_PAGE } from '@/lib/settings'
import prisma from '@/lib/prisma'
import { Parent, Prisma, Student } from '@prisma/client'
import { auth, currentUser } from '@clerk/nextjs/server'

// Make the page dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type UserRole = "admin" | "teacher" | "student" | "parent";

interface SessionMetadata {
  role?: UserRole;
  classId?: number;
}

type ParentList = Parent & { 
  students: {
    name: string;
    id: string;
  }[];
};

const baseColumns = [
  {
    header: "Info",
    accessor: "Info"
  },
  {
    header: "Student Names",
    accessor: "students",
    classname: 'hidden md:table-cell',
  },
  {
    header: "Phone",
    accessor: "phone",
    classname: 'hidden lg:table-cell',
  },
  {
    header: "Address",
    accessor: "address",
    classname: 'hidden lg:table-cell',
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

const RenderRow = (item: ParentList, role?: UserRole) => (
  <tr key={item.id} className='border-b border-gray-200 even:bg-slate-50 text:sm hover:bg-lamaPurple'>
    <td className='flex items-center gap-4 p-4'>
      <div className='flex flex-col'>
        <h3 className='font-semibold'>{item.name}</h3>
        <p className='text-xs text-gray-500'>{item?.email}</p>
      </div>
    </td>
    <td className='hidden md:table-cell'>{item.students.map(student => student.name).join(", ")}</td>
    <td className='hidden lg:table-cell'>{item.phone}</td>
    <td className='hidden lg:table-cell'>{item.address}</td>
    {role === "admin" && (
      <td>
        <div className='flex item-center gap-2'>
          <FormModal table="parent" type="update" data={item}/>
          <FormModal table="parent" type="delete" id={item.id}/>
        </div>
      </td>
    )}
  </tr>
);

const buildParentQuery = (
  role: UserRole,
  userId: string,
  metadata: SessionMetadata,
  queryParams: { [key: string]: string | undefined }
): Prisma.ParentWhereInput => {
  const query: Prisma.ParentWhereInput = {};

  // Add search conditions
  if (queryParams.search) {
    query.OR = [
      { name: { contains: queryParams.search, mode: "insensitive" } },
      { email: { contains: queryParams.search, mode: "insensitive" } },
      { phone: { contains: queryParams.search, mode: "insensitive" } },
    ];
  }

  // Add role-based conditions
  switch (role) {
    case "admin":
      // Admin can see all parents
      break;
    case "teacher":
      // Teachers can see parents of students in their classes
      query.students = {
        some: {
          class: {
            lessons: {
              some: {
                teacherId: userId
              }
            }
          }
        }
      };
      break;
    case "parent":
      // Parents can only see their own profile
      query.id = userId;
      break;
    case "student":
      // Students can see their own parent
      query.students = {
        some: {
          id: userId
        }
      };
      break;
  }

  return query;
};

const ParentListPage = async ({
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
          <p className="text-red-500">Please sign in to view parents</p>
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

    const query = buildParentQuery(role, userId, metadata, queryParams);
    if (role === "teacher") {
      console.log("[Parents] Teacher Query:", JSON.stringify(query, null, 2));
    }
    const columns = getColumns(role);

    const [data, count] = await prisma.$transaction([
      prisma.parent.findMany({
        where: query,
        include: {
          students: {
            select: {
              name: true,
              id: true,
            },
          },
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
      }),
      prisma.parent.count({ where: query }),
    ]);
    if (role === "teacher") {
      console.log(`[Parents] Teacher Data Count: ${data.length}`);
    }

    if (!data || data.length === 0) {
      return (
        <div className="bg-white p-4 rounded-lg flex-1 m-4 mt-0">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg semi-bold">All Parents</h1>
            {role === "admin" && (
              <FormModal table="parent" type="create" />
            )}
          </div>
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">No parents found</p>
          </div>
        </div>
      );
    }

    return (
      <div className='bg-white p-4 rounded-lg flex-1 m-4 mt-0'>
        {/* TOP*/}
        <div className='flex justify-between items-center'>
          <h1 className='text-lg semi-bold'>All Parents</h1>
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
                <FormModal table="parent" type="create"/>
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
    console.error("Error in ParentListPage:", error);
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500">An error occurred while loading parents</p>
      </div>
    );
  }
};

export default ParentListPage;