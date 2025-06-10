import TableSearch from '@/components/TableSearch'
import React from 'react'
import Image from 'next/image'
import Pagination from '@/components/Pagination'
import Table from '@/components/Table'
import Link from 'next/link'
import FormModal from '@/components/FormModal'
import { ITEM_PER_PAGE } from "@/lib/settings";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Event, Class } from '@prisma/client'
import { auth, currentUser } from '@clerk/nextjs/server'

// Make the page dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type UserRole = "admin" | "teacher" | "student" | "parent";

interface SessionMetadata {
  role?: UserRole;
  classId?: number;
}

type EventList = Event & {class: Class};

const baseColumns = [
  {
    header:"Title", accessor:"title",
  },
  {
    header:"Class", accessor:"class",
  },
  {
    header:"Date", accessor:"date",classname:'hidden md:table-cell',
  },
  {
    header:"Start Time", accessor:"startTime",classname:'hidden md:table-cell',
  },
  {
    header:"End Time", accessor:"endTime",classname:'hidden md:table-cell',
  },
]

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

const RenderRow = (item:EventList, role?: UserRole) => (
  <tr key={item.id} className='border-b border-gray-200 even:bg-slate-50 text:sm hover:bg-lamaPurple'>
    <td className='flex items-center gap-4 p-4'>{item.title}</td>
    <td >{item.class?.name || 'School-wide'}</td>
    <td className='hidden md:table-cell'>{new Intl.DateTimeFormat("en-US").format(item.startTime)}</td>
    <td className='hidden md:table-cell'>{item.startTime.toLocaleTimeString("en-US", {hour:"2-digit", minute:"2-digit", hour12:false,} )}</td>
    <td className='hidden md:table-cell'>{item.endTime.toLocaleTimeString("en-US", {hour:"2-digit", minute:"2-digit", hour12:false,} )}</td>
    {role === "admin" && (
      <td>
        <div className='flex item-center gap-2'>
          <FormModal table="event" type="update" data={item}/>
          <FormModal table="event" type="delete" id={item.id}/>
        </div>
      </td>
    )}
  </tr>
);

const buildEventQuery = (
  role: UserRole,
  userId: string,
  queryParams: { [key: string]: string | undefined }
): Prisma.EventWhereInput => {
  const query: Prisma.EventWhereInput = {};

  // Add search conditions
  if (queryParams.search) {
    query.title = {
      contains: queryParams.search,
      mode: "insensitive",
    };
  }

  // Add role-based conditions
  const roleConditions: Record<UserRole, Prisma.ClassWhereInput | null> = {
    admin: null, // Admin can see all events
    teacher: {
      lessons: {
        some: {
          teacherId: userId,
        },
      },
    },
    student: {
      students: {
        some: {
          id: userId,
        },
      },
    },
    parent: {
      students: {
        some: {
          parentId: userId,
        },
      },
    },
  };

  const roleCondition = roleConditions[role];
  if (roleCondition) {
    query.OR = [
      { classId: null }, // School-wide events
      { class: roleCondition }, // Class-specific events based on role
    ];
  }

  return query;
};

const EventListPage = async ({
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
          <p className="text-red-500">Please sign in to view events</p>
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

    const query = buildEventQuery(role, userId, queryParams);
    const columns = getColumns(role);

    const [data, count] = await prisma.$transaction([
      prisma.event.findMany({
        where: query,
        include: {
          class: true,
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
      }),
      prisma.event.count({where: query}),
    ]);

    if (!data || data.length === 0) {
      return (
        <div className="bg-white p-4 rounded-lg flex-1 m-4 mt-0">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg semi-bold">All Events</h1>
            {role === "admin" && <FormModal table="event" type="create" />}
          </div>
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">No events found</p>
          </div>
        </div>
      );
    }

    return (
      <div className='bg-white p-4 rounded-lg flex-1 m-4 mt-0'>
        {/* TOP*/}
        <div className='flex justify-between items-center'>
          <h1 className='text-lg semi-bold'>All Events</h1>
          <div className='flex flex-col md:flex-row items-center gap-4 w-full md:w-auto'>
            <TableSearch />
            <div className='flex items-center gap-4 self-end'>
              {role === "admin" && <FormModal table="event" type="create" />}
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
    console.error("Error in EventListPage:", error);
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500">An error occurred while loading events</p>
      </div>
    );
  }
}

export default EventListPage