import TableSearch from '@/components/TableSearch'
import React from 'react'
import Image from 'next/image'
import Pagination from '@/components/Pagination'
import Table from '@/components/Table'
import { role, teachersData } from '@/lib/data'
import Link from 'next/link'

type Teacher = {
  id:number;
  teacherId:string;
  name:string;
  email?:string;
  photo:string;
  subjects:string[];
  classes:string[];
  address:string;
  phone:number;
}

const columns = [
  {
    header:"Info", accessor:"Info"
  },
  {
    header:"Teacher ID", accessor:"teacherId", classname:'hidden md:table-cell',
  },
  {
    header:"Subjects", accessor:"subjects", classname:'hidden md:table-cell', 
  },
  {
    header:"Classes", accessor:"classes", classname:'hidden md:table-cell', 
  },
  {
    header:"Phone", accessor:"phone", classname:'hidden lg:table-cell', 
  },
  {
    header:"Address", accessor:"address", classname:'hidden lg:table-cell', 
  },
  {
    header:"Actions", accessor:"action"
  },


]

const TeacherListPage = () => {

  const RenderRow = (item:Teacher) => (
    <tr key={item.id}>
      <td>
        <Image src={item.photo} alt="" width={40} height={40} className='md:hidden xl:block w-10 h-10 rounded-full object-cover' />
        <div className='flex flex-col'>
          <h3 className='font-semibold'>{item.name}</h3>
          <p className='text-xs text-gray-500'>{item?.email}</p>
        </div>
      </td>
      <td className='hiddden md:table-cell'>{item.teacherId}</td>
      <td className='hiddden md:table-cell'>{item.subjects.join(",")}</td>
      <td className='hiddden md:table-cell'>{item.classes.join(",")}</td>
      <td className='hiddden md:table-cell'>{item.phone}</td>
      <td className='hiddden md:table-cell'>{item.address}</td>
      <td>
        <div className='flex item-center gap-2'>
          <Link href={'/list/teachers/${item.id}'}>
          <button className='w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky'>
            <Image src="/view.png" alt="" width={16} height={16} />
          </button>
          </Link>
          {role==="admin" && (
            <button className='w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple'>
            <Image src="/delete.png" alt="" width={16} height={16} />
          </button>
        )}
        </div>
      </td>
    </tr>

      );

  return (
    <div className='bg-white p-4 rounded-lg flex-1 m-4 mt-0'>
      {/* TOP*/}
      <div className='flex justify-between items-center'>
        <h1 className='hidden md:block text-lg semi-bold'>All Teachers</h1>
        <div className='flex flex-col md:flex-row items-center gap-4 w-full md:w-auto '>
          <TableSearch />
          <div className='flex items-center gap-4 self-end'>
            <button className='w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow'>
              <Image src='/filter.png' alt='' width={14} height={14} />
            </button>
            <button className='w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow'>
              <Image src='/sort.png' alt='' width={14} height={14} />
            </button>
            <button className='w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow'>
              <Image src='/plus.png' alt='' width={14} height={14} />
            </button>
          </div>
        </div>
      </div>
      {/* LIST */}
      <div>
        <Table columns={columns} renderRow={RenderRow} data={teachersData}/>
      </div>
      {/* PAGINATION */}
      <div>
        <Pagination />
      </div>
    </div>
  )
}

export default TeacherListPage