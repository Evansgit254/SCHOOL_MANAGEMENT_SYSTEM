import React from "react";
import Image from "next/image";
import { Prisma, Announcement, Class } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import FormModal from "@/components/FormModal";
import { ITEM_PER_PAGE } from "@/lib/settings";
import prisma from "@/lib/prisma";

// SSR Config
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type AnnouncementWithClass = Announcement & { class: Class | null };

const columns = [
  { header: "Title", accessor: "title" },
  { header: "Class", accessor: "class" },
  { header: "Date", accessor: "date", classname: "hidden md:table-cell" },
];

const AnnouncementListPage = async ({ 
  searchParams 
}: { 
  searchParams: Promise<Record<string, string | string[] | undefined>> 
}) => {
  const params = await searchParams;
  const pageParam = params["page"];
  const page = Number(
    Array.isArray(pageParam) ? pageParam[0] : pageParam || 1
  );

  const queryParams: Record<string, string> = {};
  for (const key in params) {
    const value = params[key];
    queryParams[key] = Array.isArray(value) ? value[0] : value ?? "";
  }

  const { userId, sessionClaims } = await auth();
  const metadata = sessionClaims?.metadata as { role?: string } | undefined;
  const role = metadata?.role;

  if (!userId) return null;

  const tableColumns =
    role === "admin"
      ? [...columns, { header: "Actions", accessor: "action" }]
      : columns;

  const query: Prisma.AnnouncementWhereInput = {};
  if (queryParams.search) {
    query.title = {
      contains: queryParams.search,
      mode: "insensitive",
    };
  }

  const [announcements, count] = await prisma.$transaction([
    prisma.announcement.findMany({
      where: query,
      include: { class: true },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (page - 1),
      orderBy: { date: "desc" },
    }),
    prisma.announcement.count({ where: query }),
  ]);

  const renderRow = (item: AnnouncementWithClass) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurple"
    >
      <td className="flex items-center gap-4 p-4">{item.title}</td>
      <td>{item.class?.name ?? "N/A"}</td>
      <td className="hidden md:table-cell">
        {item.date
          ? new Intl.DateTimeFormat("en-US").format(new Date(item.date))
          : "No date"}
      </td>
      {role === "admin" && (
        <td>
          <div className="flex items-center gap-2">
            <FormModal table="announcement" type="update" data={item} />
            <FormModal table="announcement" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-lg flex-1 m-4 mt-0">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="hidden md:block text-lg font-semibold">All Announcements</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="Filter" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="Sort" width={14} height={14} />
            </button>
            {role === "admin" && (
              <FormModal table="announcement" type="create" />
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <Table columns={tableColumns} renderRow={renderRow} data={announcements} />

      {/* Pagination */}
      <Pagination page={page} count={count} />
    </div>
  );
};

export default AnnouncementListPage;
