import TableSearch from '@/components/TableSearch'
import React from 'react'
import Image from 'next/image'
import Pagination from '@/components/Pagination'
import Table from '@/components/Table'
import { role } from '@/lib/data'
import FormModal from '@/components/FormModal'
import { ITEM_PER_PAGE } from '@/lib/settings'
import prisma from '@/lib/prisma'
import { Prisma, Subject, Teacher } from '@prisma/client'

type SubjectWithTeachers = Subject & {
  teachers: Teacher[];
};

const columns = [
  {
    header: "Subject Name",
    accessor: "name"
  },
  {
    header: "Teachers",
    accessor: "teachers",
    classname: 'hidden md:table-cell',
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const RenderRow = (item: SubjectWithTeachers) => (
  <tr key={item.id} className='border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-gray-50'>
    <td className='flex items-center gap-4 p-4'>{item.name}</td>
    <td className='hidden md:table-cell'>{item.teachers.map(teacher => teacher.name).join(", ")}</td>
    <td>
      <div className='flex items-center gap-2'>
        {role === "admin" && (
          <>
            <FormModal table="subject" type="update" data={item}/>
            <FormModal table="subject" type="delete" id={item.id}/>
          </>
        )}
      </div>
    </td>
  </tr>
);

const SubjectsListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.SubjectWhereInput = {};

  if (queryParams?.search) {
    query.name = { contains: queryParams.search, mode: 'insensitive' };
  }

  try {
    const [data, count] = await prisma.$transaction([
      prisma.subject.findMany({
        where: query,
        include: {
          teachers: true,
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
        orderBy: {
          name: 'asc'
        }
      }),
      prisma.subject.count({ where: query }),
    ]);

    return (
      <div className='bg-white p-4 rounded-lg flex-1 m-4 mt-0'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='hidden md:block text-lg font-semibold'>All Subjects</h1>
          <div className='flex flex-col md:flex-row items-center gap-4 w-full md:w-auto'>
            <TableSearch />
            <div className='flex items-center gap-4 self-end'>
              {role === "admin" && (
                <FormModal table="subject" type="create"/>
              )}
            </div>
          </div>
        </div>

        <div className='mb-6'>
          <Table columns={columns} renderRow={RenderRow} data={data}/>
        </div>

        <div>
          <Pagination page={p} count={count}/>
        </div>
      </div>
    );
  } catch (error) {
    console.error("[SUBJECTS_LIST_ERROR]", error);
    return (
      <div className='bg-white p-4 rounded-lg flex-1 m-4 mt-0'>
        <div className='text-red-600'>
          Failed to load subjects. Please try again later.
        </div>
      </div>
    );
  }
};

export default SubjectsListPage;