'use client';

import { UserButton } from '@clerk/nextjs';

interface NavbarUserProps {
  user: {
    firstName: string | null;
    lastName: string | null;
    role: string;
  } | null;
}

const NavbarUser = ({ user }: NavbarUserProps) => {
  return (
    <>
      <div className='flex flex-col'>
        <span className='text-xs leading-3 font-medium'>
          {user?.firstName} {user?.lastName}
        </span>
        {user?.role && <span className='text-[10px] text-right text-gray-500'>{user.role}</span>}
      </div>
      <UserButton afterSignOutUrl='/' />
    </>
  );
};

export default NavbarUser; 