import React from 'react'
import Announcements from '@/components/Announcements'
import BigCalendar from '@/components/BigCalendar'
import BigCalendarContainer from '@/components/BigCalendarContainer'
import { auth } from '@clerk/nextjs/server';

const TeacherPage = async () => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return (
        <div className='p-4 flex flex-1 gap-4 flex-col xl:flex-row'>
          <div className='w-full'>
            <div className='bg-white h-full rounded-md p-4'>
              <h1 className='text-xl font-semibold text-red-500'>Authentication Error</h1>
              <p className='text-gray-600'>Please sign in to view your teacher dashboard.</p>
            </div>
          </div>
        </div>
      );
    }

    // This page is for teachers to view their schedule and announcements
    return (
      <div className='p-4 flex flex-1 gap-4 flex-col xl:flex-row'>
        {/*LEFT SIDE*/}
        <div className='w-full xl:w-2/3'>
          <div className='bg-white h-full rounded-md p-4'>
            <h1 className='text-xl font-semibold mb-4'>Schedule</h1>
            <BigCalendarContainer type="teacherId" id={userId}/>
          </div>
        </div>
        {/*RIGHT SIDE*/}
        <div className='w-full xl:w-1/3 flex flex-col gap-8'>
          <Announcements />
        </div> 
      </div>
    );
  } catch (error) {
    console.error('Error in TeacherPage:', error);
    return (
      <div className='p-4 flex flex-1 gap-4 flex-col xl:flex-row'>
        <div className='w-full'>
          <div className='bg-white h-full rounded-md p-4'>
            <h1 className='text-xl font-semibold text-red-500'>Error</h1>
            <p className='text-gray-600'>Something went wrong. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }
}

export default TeacherPage