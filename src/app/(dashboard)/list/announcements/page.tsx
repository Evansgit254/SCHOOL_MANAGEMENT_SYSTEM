import TableSearch from "@/components/TableSearch";
import React from "react";
import Image from "next/image";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import FormModal from "@/components/FormModal";
import { ITEM_PER_PAGE } from "@/lib/settings";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Announcement, Class } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

// Make the page dynamic
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

type AnnouncementList = Announcement & { class: Class };

const columns = [
  {
    header: "Title",
    accessor: "title",
  },
  {
    header: "Class",
    accessor: "class",
  },
  {
    header: "Date",
    accessor: "date",
    classname: "hidden md:table-cell",
  },
];

const RenderRow = (item: AnnouncementList, role?: string) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text:sm hover:bg-lamaPurple"
  >
    <td className="flex items-center gap-4 p-4">{item.title}</td>
    <td>{item.class.name}</td>
    <td className="hidden md:table-cell">
      {new Intl.DateTimeFormat("en-US").format(item.date)}
    </td>
    {role === "admin" && (
      <td>
        <div className="flex item-center gap-2">
          <FormModal table="announcement" type="update" data={item} />
          <FormModal table="announcement" type="delete" id={item.id} />
        </div>
      </td>
    )}
  </tr>
);

const AnnouncementListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Get user role
  const { userId, sessionClaims } = await auth();
  const metadata = sessionClaims?.metadata as { role?: string } | undefined;
  const role = metadata?.role;

  if (!userId) {
    return null; // Handle unauthenticated state
  }

  // Add actions column for admin
  const tableColumns = role === "admin" 
    ? [...columns, { header: "Actions", accessor: "action" }] 
    : columns;

  //URL PARAMS CONDITIONS
  const query: Prisma.AnnouncementWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.title = {
              contains: value,
              mode: "insensitive",
            };
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.announcement.findMany({
      where: query,
      include: {
        class: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.announcement.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-lg flex-1 m-4 mt-0">
      {/* TOP*/}
      <div className="flex justify-between items-center">
        <h1 className="hidden md:block text-lg semi-bold">All Announcements</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto ">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormModal table="announcement" type="create" />}
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
};

export default AnnouncementListPage;
