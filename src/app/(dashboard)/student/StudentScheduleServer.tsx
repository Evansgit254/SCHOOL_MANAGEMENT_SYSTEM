// 'use server';
import BigCalendarContainer from '@/components/BigCalendarContainer';
import React from 'react';

const StudentScheduleServer = async ({ classId }: { classId: number }) => {
  // You could fetch additional data here if needed
  return <BigCalendarContainer type="classId" id={classId} />;
};

export default StudentScheduleServer; 