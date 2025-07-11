import TableSearch from "@/components/TableSearch";
import React from "react";
import Image from "next/image";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import Link from "next/link";
import FormModal from "@/components/FormModal";
import { ITEM_PER_PAGE } from "@/lib/settings";
import prisma from "@/lib/prisma";
import {
  Class,
  Lesson,
  Prisma,
  Subject,
  Teacher,
  Assignment,
} from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";
// Make the page dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type UserRole = "admin" | "teacher" | "student" | "parent";

type AssignmentList = Assignment & {
  lesson: {
    subject: { name: string };
    class: { name: string };
    teacher: { name: string; surname: string };
  };
};

interface SessionMetadata {
  role?: UserRole;
  classId?: number;
}

const columns = [
  {
    header: "Subject Name",
    accessor: "name",
  },
  {
    header: "Class",
    accessor: "class",
  },
  {
    header: "Teacher",
    accessor: "teacher",
    classname: "hidden md:table-cell",
  },
  {
    header: "Due Date",
    accessor: "dueDate",
    classname: "hidden md:table-cell",
  },
];

const RenderRow = (item: AssignmentList, role?: UserRole) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text:sm hover:bg-lamaPurple"
  >
    <td className="flex items-center gap-4 p-4">{item.lesson.subject.name}</td>
    <td>{item.lesson.class.name}</td>
    <td className="hidden md:table-cell">
      {item.lesson.teacher.name + " " + item.lesson.teacher.surname}
    </td>
    <td className="hidden md:table-cell">
      {new Intl.DateTimeFormat("en-US").format(item.dueDate)}
    </td>
    {(role === "admin" || role === "teacher") && (
      <td>
        <div className="flex item-center gap-2">
          <FormModal table="assignment" type="update" data={item} />
          <FormModal table="assignment" type="delete" id={item.id} />
        </div>
      </td>
    )}
  </tr>
);

const buildAssignmentQuery = (
  role: UserRole,
  userId: string,
  metadata: SessionMetadata,
  queryParams: { [key: string]: string | undefined }
): Prisma.AssignmentWhereInput => {
  const baseQuery: Prisma.AssignmentWhereInput = {
    lesson: {
      AND: [] as Prisma.LessonWhereInput[],
    },
  };

  // Add query params conditions
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (!value) continue;

      switch (key) {
        case "classId":
          (baseQuery.lesson as { AND: Prisma.LessonWhereInput[] }).AND.push({ 
            classId: parseInt(value) 
          });
          break;
        case "teacherId":
          (baseQuery.lesson as { AND: Prisma.LessonWhereInput[] }).AND.push({ 
            teacherId: value 
          });
          break;
        case "search":
          (baseQuery.lesson as { AND: Prisma.LessonWhereInput[] }).AND.push({
            subject: {
              name: {
                contains: value,
                mode: "insensitive",
              },
            },
          });
          break;
      }
    }
  }

  // Add role-based conditions
  switch (role) {
    case "admin":
      // Admin can see all assignments
      break;
    case "teacher":
      (baseQuery.lesson as { AND: Prisma.LessonWhereInput[] }).AND.push({ 
        teacherId: userId 
      });
      break;
    case "student":
      if (metadata.classId) {
        (baseQuery.lesson as { AND: Prisma.LessonWhereInput[] }).AND.push({ 
          classId: metadata.classId 
        });
      }
      break;
    case "parent":
      baseQuery.lesson = {
        AND: (baseQuery.lesson as { AND: Prisma.LessonWhereInput[] }).AND,
        class: {
          students: {
            some: {
              parentId: userId,
            },
          },
        },
      };
      break;
  }

  return baseQuery;
};

const AssignmentListPage = async ({
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
          <p className="text-red-500">Please sign in to view assignments</p>
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

    // Add actions column for admin and teacher
    const tableColumns =
      role === "admin" || role === "teacher"
        ? [...columns, { header: "Actions", accessor: "action" }]
        : columns;

    const query = buildAssignmentQuery(role, userId, metadata, queryParams);
    if (role === "teacher") {
      console.log("[Assignments] Teacher Query:", JSON.stringify(query, null, 2));
    }
    const [data, count] = await prisma.$transaction([
      prisma.assignment.findMany({
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
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
      }),
      prisma.assignment.count({ where: query }),
    ]);
    if (role === "teacher") {
      console.log(`[Assignments] Teacher Data Count: ${data.length}`);
    }

    if (!data || data.length === 0) {
      return (
        <div className="bg-white p-4 rounded-lg flex-1 m-4 mt-0">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg semi-bold">All Assignments</h1>
            {(role === "admin" || role === "teacher") && (
              <FormModal table="assignment" type="create" />
            )}
          </div>
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">No assignments found</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white p-4 rounded-lg flex-1 m-4 mt-0">
        {/* TOP*/}
        <div className="flex justify-between items-center">
          <h1 className="text-lg semi-bold">All Assignments</h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch />
            <div className="flex items-center gap-4 self-end">
              {(role === "admin" || role === "teacher") && (
                <FormModal table="assignment" type="create" />
              )}
            </div>
          </div>
        </div>
        {/* LIST */}
        <div>
          <Table
            columns={tableColumns}
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
    console.error("Error in AssignmentListPage:", error);
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500">
          An error occurred while loading assignments
        </p>
      </div>
    );
  }
};

export default AssignmentListPage;
