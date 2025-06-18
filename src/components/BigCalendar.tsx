"use client";

import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useState } from 'react';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
}

const BigCalendar = ({ data }: { data: CalendarEvent[] }) => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  // Set min and max times for school hours (8 AM to 9 PM)
  const today = new Date();
  const minTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0, 0);
  const maxTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 21, 0, 0);

  return (
    <Calendar
      localizer={localizer}
      events={data}
      startAccessor="start"
      endAccessor="end"
      views={[Views.WORK_WEEK, Views.DAY]}
      view={view}
      style={{ height: "98%" }}
      onView={handleOnChangeView}
      min={minTime}
      max={maxTime}
    />
  );
};

export default BigCalendar;