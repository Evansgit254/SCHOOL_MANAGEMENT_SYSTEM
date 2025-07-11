import AdminClientPage from './AdminClientPage';
import EventCalendarContainer from '@/components/EventCalenderContainer';
import Announcements from '@/components/Announcements';
import UserCard from '@/components/UserCard';
import CountChartContainer from '@/components/CountChartContainer';
import AttendanceChartContainer from '@/components/AttendanceChartContainer';

export default function AdminPage({ searchParams }) {
  return (
    <div className='p-4 flex gap-4 flex-col md:flex-row'>
      {/* LEFT: Server-rendered cards and charts, then client logic */}
      <div className='w-full lg:w-2/3 flex flex-col gap-8'>
        <div className='flex gap-4 flex-col lg:flex-row flex-wrap'>
          <UserCard type='admin'/>
          <UserCard type='student'/>
          <UserCard type='teacher'/>
          <UserCard type='parent'/>
        </div>
        <div className='flex gap-4 flex-col lg:flex-row '>
          <div className='w-full lg:w-1/3 h-[450px]'>
            <CountChartContainer />
          </div>
          <div className='w-full lg:w-2/3 h-[450px]'>
            <AttendanceChartContainer />
          </div>
        </div>
        <AdminClientPage />
      </div>
      {/* RIGHT: Server-only components */}
      <div className='w-full lg:w-1/3 flex flex-col gap-8 '>
        <EventCalendarContainer searchParams={searchParams} />
        <Announcements />
      </div>
    </div>
  );
}
