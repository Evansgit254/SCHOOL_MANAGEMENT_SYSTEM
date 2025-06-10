import TableSearch from "@/components/TableSearch";
import React from "react";
import Image from "next/image";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import Link from "next/link";
import FormModal from "@/components/FormModal";
import { ITEM_PER_PAGE } from "@/lib/settings";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Class, Teacher } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";

// Make the page dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type UserRole = "admin" | "teacher" | "student" | "parent";

interface SessionMetadata {
  role?: UserRole;
  classId?: number;
}

type ClassList = Class & { supervisor: Teacher };

const baseColumns = [
  {
    header: "Class Name",
    accessor: "name",
  },
  {
    header: "Capacity",
    accessor: "capacity",
    classname: "hidden md:table-cell",
  },
  {
    header: "Grade",
    accessor: "grade",
    classname: "hidden md:table-cell",
  },
  {
    header: "Supervisor",
    accessor: "supervisor",
    classname: "hidden md:table-cell",
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

const RenderRow = (item: ClassList, role?: UserRole) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text:sm hover:bg-lamaPurple"
  >
    <td className="flex items-center gap-4 p-4">{item.name}</td>
    <td className="hidden md:table-cell">{item.capacity}</td>
    <td className="hidden md:table-cell">{item.name[0]}</td>
    <td className="hidden md:table-cell">
      {item.supervisor.name + " " + item.supervisor.surname}
    </td>
    {role === "admin" && (
      <td>
        <div className="flex item-center gap-2">
          <FormModal table="class" type="update" data={item} />
          <FormModal table="class" type="delete" id={item.id} />
        </div>
      </td>
    )}
  </tr>
);

const buildClassQuery = (
  queryParams: { [key: string]: string | undefined }
): Prisma.ClassWhereInput => {
  const query: Prisma.ClassWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (!value) continue;

      switch (key) {
        case "supervisorId":
          query.supervisorId = value;
          break;
        case "search":
          query.name = { contains: value, mode: "insensitive" };
          break;
      }
    }
  }

  return query;
};

const ClassListPage = async ({
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
          <p className="text-red-500">Please sign in to view classes</p>
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

    const query = buildClassQuery(queryParams);

    const [data, count] = await prisma.$transaction([
      prisma.class.findMany({
        where: query,
        include: {
          supervisor: true,
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
      }),
      prisma.class.count({ where: query }),
    ]);

    if (!data || data.length === 0) {
      return (
        <div className="bg-white p-4 rounded-lg flex-1 m-4 mt-0">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg semi-bold">All Classes</h1>
            {role === "admin" && <FormModal table="class" type="create" />}
          </div>
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">No classes found</p>
          </div>
        </div>
      );
    }

    const columns = getColumns(role);

    return (
      <div className="bg-white p-4 rounded-lg flex-1 m-4 mt-0">
        {/* TOP*/}
        <div className="flex justify-between items-center">
          <h1 className="text-lg semi-bold">All Classes</h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch />
            <div className="flex items-center gap-4 self-end">
              {role === "admin" && <FormModal table="class" type="create" />}
            </div>
          </div>
        </div>
        {/* LIST */}
        <div>
          <Table
            columns={columns}
            renderRow={(item) => RenderRow(item, role)}
            data={data}
          />
        </div>
        {/* PAGINATION */}
        <div>
          <Pagination page={p} count={count} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in ClassListPage:", error);
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500">An error occurred while loading classes</p>
      </div>
    );
  }
};

export default ClassListPage;
