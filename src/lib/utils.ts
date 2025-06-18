interface Lesson {
  title: string;
  start: Date;
  end: Date;
}

const currentWorkWeek = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();

  const startOfWeek = new Date(today);

  if (dayOfWeek === 0) {
    startOfWeek.setDate(today.getDate() + 1); // If today is Sunday, set start of week to Monday
  } else if (dayOfWeek === 6) {
    startOfWeek.setDate(today.getDate() + 2); // If today is Saturday, set start of week to Monday
  } else {
    startOfWeek.setDate(today.getDate() - dayOfWeek + 1); // Set start of week to Monday
  }
  startOfWeek.setHours(0, 0, 0, 0); // Set time to midnight

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 4); // Set end of week to Friday
  endOfWeek.setHours(23, 59, 59, 999); // Set time to end of day

  return {
    startOfWeek,
    endOfWeek
  };
};

export const adjustSccheduleToCurrentWeek = (lessons: Lesson[]): Lesson[] => {
  const { startOfWeek, endOfWeek } = currentWorkWeek();

  return lessons.map(lesson => {
    const lessonDayOfWeek = lesson.start.getDay();
    
    const dayFromMonday = lessonDayOfWeek === 0 ? 6 : lessonDayOfWeek - 1;
    const adjustedStartDate = new Date(startOfWeek);

    adjustedStartDate.setDate(startOfWeek.getDate() + dayFromMonday);
    adjustedStartDate.setHours(
      lesson.start.getHours(), 
      lesson.start.getMinutes(), 
      lesson.start.getSeconds()
    );

    const adjustedEndDate = new Date(adjustedStartDate);
    adjustedEndDate.setHours(
      lesson.end.getHours(), 
      lesson.end.getMinutes(), 
      lesson.end.getSeconds()
    );

    return {
      title: lesson.title,
      start: adjustedStartDate,
      end: adjustedEndDate
    };
  });
};