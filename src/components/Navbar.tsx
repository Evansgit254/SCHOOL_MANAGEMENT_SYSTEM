import React from 'react';
import Image from 'next/image';
import { currentUser } from '@clerk/nextjs/server';
import NavbarUser from './NavbarUser';

const Navbar = async () => {
  const user = await currentUser();

  const plainUser = user ? {
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.publicMetadata.role as string,
  } : null;

  return (
    <div className='flex items-center justify-between p-4'>
      {/* SERACH BAR */}
      <div className='hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2'>
        <Image src='/search.png' alt='' width={14} height={14} />
        <input type='text' placeholder='Search...' className='w-[200px] p-2 bg-transparent outline-none' />
      </div>
      {/* ICONS AND USER */}
      <div className='flex items-center gap-6 justify-end w-full'>
        <div className='bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer'>
          <Image src="/message.png" alt='' width={20} height={20} />
        </div>
        <div className='bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative'>
          <Image src="/announcement.png" alt='' width={20} height={20} />
          <div className='absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs'>1</div>
        </div>
        <NavbarUser user={plainUser} />
      </div>
    </div>
  );
};

export default Navbar;