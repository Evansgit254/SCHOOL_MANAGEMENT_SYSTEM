import React from 'react'
import prisma from '@/lib/prisma'
import BigCalendar from './BigCalendar';
import { adjustSccheduleToCurrentWeek } from '@/lib/utils';

interface BigCalendarContainerProps {
  type: "teacherId" | "classId";
  id: string | number;
}

const BigCalendarContainer = async ({ type, id }: BigCalendarContainerProps) => {
  try {
    const dataRes = await prisma.lesson.findMany({
      where: {
        ...(type === "teacherId" ? { teacherId: id as string } : { classId: id as number }),
      },
      include: {
        subject: {
          select: {
            name: true,
          },
        },
        teacher: {
          select: {
            name: true,
            surname: true,
          },
        },
      },
    });

    const data = dataRes.map(lesson => ({
      title: `${lesson.subject.name} - ${lesson.teacher.name} ${lesson.teacher.surname}`,
      start: lesson.startTime,
      end: lesson.endTime,
    }));

    // Adjust the calendarEvents to match the data format
    const schedule = adjustSccheduleToCurrentWeek(data);

    return (
      <div className="w-full h-full">
        <BigCalendar data={schedule} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-red-500">Error loading calendar data</p>
      </div>
    );
  }
};

export default BigCalendarContainer;