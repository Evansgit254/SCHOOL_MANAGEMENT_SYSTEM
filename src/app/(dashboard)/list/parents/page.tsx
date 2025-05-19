import TableSearch from '@/components/TableSearch'
import React from 'react'
import Image from 'next/image'
import Pagination from '@/components/Pagination'
import Table from '@/components/Table'
import { role, parentsData } from '@/lib/data'
import Link from 'next/link'
import FormModal from '@/components/FormModal'
import { ITEM_PER_PAGE } from '@/lib/settings'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { Class, } from '@prisma/client'

type ParentList = Parent & { students: Student[]}

const columns = [
  {
    header:"Info", accessor:"Info"
  },
  {
    header:"Student Names", accessor:"students", classname:'hidden md:table-cell',
  },
  {
    header:"Phone", accessor:"phone", classname:'hidden lg:table-cell', 
  },
  {
    header:"Address", accessor:"address", classname:'hidden lg:table-cell', 
  },


]


const RenderRow = (item:ParentList) => (
  <tr key={item.id} className='border-b border-gray-200 even:bg-slate-50 text:sm hover:bg-lamaPurple'>
    <td className='flex items-center gap-4 p-4'>
      <div className='flex flex-col'>
        <h3 className='font-semibold'>{item.name}</h3>
        <p className='text-xs text-gray-500'>{item?.email}</p>
      </div>
    </td>
    <td className='hiddden md:table-cell'>{item.students.map(student=>student.name).join(",")}</td> 
    <td className='hiddden md:table-cell'>{item.phone}</td>
    <td className='hiddden md:table-cell'>{item.address}</td>
    <td>
      <div className='flex item-center gap-2'>
        {/*<Link href={'/list/teachers/${item.id}'}>
        <button className='w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky'>
          <Image src="/edit.png" alt="" width={16} height={16} />
        </button>
        </Link> */}
        
        {role==="admin" && (
          <>
            <FormModal table="parent" type="update" data={item}/>
            <FormModal table="parent" type="delete" id={item.id}/>
          </>
          //<button className='w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple'>
          //<Image src="/delete.png" alt="" width={16} height={16} />
        //</button>
        
      )}
      </div>
    </td>
  </tr>

    );


const ParentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  //URL PARAMS CONDITIONS
  const query: Prisma.ParentWhereInput = {};

if (queryParams) {
  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined) {  // Ensure value is not undefined
      switch (key) {
        case "search":
          query.name = {contains: value, mode: 'insensitive'};
          break;
        default:
          break;
      }
    }
  }
}

  

  const [data, count] = await prisma.$transaction([
    prisma.parent.findMany({
      where: query,
      include: {
        students: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),

    prisma.parent.count({where: query}),
  ]);

  return (
    <div className='bg-white p-4 rounded-lg flex-1 m-4 mt-0'>
      {/* TOP*/}
      <div className='flex justify-between items-center'>
        <h1 className='hidden md:block text-lg semi-bold'>All Parents</h1>
        <div className='flex flex-col md:flex-row items-center gap-4 w-full md:w-auto '>
          <TableSearch />
          <div className='flex items-center gap-4 self-end'>
            <button className='w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow'>
              <Image src='/filter.png' alt='' width={14} height={14} />
            </button>
            <button className='w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow'>
              <Image src='/sort.png' alt='' width={14} height={14} />
            </button>
            {role==="admin" && (//<button className='w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow'>
              //<Image src='/plus.png' alt='' width={14} height={14} />
            //</button>
            <FormModal table="parent" type="create"/>
            )}
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

export default ParentListPage