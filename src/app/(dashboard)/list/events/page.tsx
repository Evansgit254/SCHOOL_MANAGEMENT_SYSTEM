import TableSearch from '@/components/TableSearch'
import React from 'react'
import Image from 'next/image'
import Pagination from '@/components/Pagination'
import Table from '@/components/Table'
import { role, eventsData } from '@/lib/data'
import Link from 'next/link'
import FormModal from '@/components/FormModal'
import { ITEM_PER_PAGE } from "@/lib/settings";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Event, Class } from '@prisma/client'


type EventList = Event & {class: Class};

const columns = [
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
  {
    header:"Actions", accessor:"action", 
  },
]

const RenderRow = (item:EventList) => (
  <tr key={item.id} className='border-b border-gray-200 even:bg-slate-50 text:sm hover:bg-lamaPurple'>
    <td className='flex items-center gap-4 p-4'>{item.title}</td>
    <td >{item.class.name}</td>
    <td className='hidden md:table-cell'>{new Intl.DateTimeFormat("en-US").format(item.startTime)}</td>
    <td className='hidden md:table-cell'>{item.startTime.toLocaleTimeString("en-US", {hour:"2-digit", minute:"2-digit", hour12:false,} )}</td>
    <td className='hidden md:table-cell'>{item.endTime.toLocaleTimeString("en-US", {hour:"2-digit", minute:"2-digit", hour12:false,} )}</td>
    <td>
      <div className='flex item-center gap-2'>
        {/* <Link href={'/list/teachers/${item.id}'}>
        <button className='w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky'>
          <Image src="/edit.png" alt="" width={16} height={16} />
        </button>
        </Link> */}
        {role==="admin" && (
          //<button className='w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple'>
          //<Image src="/delete.png" alt="" width={16} height={16} />
        //</button>
        <>
            <FormModal table="event" type="update" data={item}/>
            <FormModal table="event" type="delete" id={item.id}/>
          </>
      )}
      </div>
    </td>
  </tr>

    );

const EventListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  //URL PARAMS CONDITIONS
  const query: Prisma.EventWhereInput = {};

if (queryParams) {
  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined) {  // Ensure value is not undefined
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

  return (
    <div className='bg-white p-4 rounded-lg flex-1 m-4 mt-0'>
      {/* TOP*/}
      <div className='flex justify-between items-center'>
        <h1 className='hidden md:block text-lg semi-bold'>All Events</h1>
        <div className='flex flex-col md:flex-row items-center gap-4 w-full md:w-auto '>
          <TableSearch />
          <div className='flex items-center gap-4 self-end'>
            <button className='w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow'>
              <Image src='/filter.png' alt='' width={14} height={14} />
            </button>
            <button className='w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow'>
              <Image src='/sort.png' alt='' width={14} height={14} />
            </button>
            {role==="admin" && //<button className='w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow'>
              //<Image src='/plus.png' alt='' width={14} height={14} />
            //</button>
            <FormModal table="event" type="create"/>
            }
          </div>
        </div>
      </div>
      {/* LIST */}
      <div>
        <Table columns={columns} renderRow={RenderRow} data={data}/>
      </div>
      {/* PAGINATION */}
      <div>
        <Pagination page={p} count={count} />
      </div>
    </div>
  )
}

export default EventListPage