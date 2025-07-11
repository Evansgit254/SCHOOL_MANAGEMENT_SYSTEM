import { Day, PrismaClient, UserSex } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // ADMIN
  await prisma.admin.create({
    data: {
      id: "admin1",
      username: "admin1",
    },
  });
  await prisma.admin.create({
    data: {
      id: "admin2",
      username: "admin2",
    },
  });

  // GRADE
  for (let i = 1; i <= 6; i++) {
    await prisma.grade.create({
      data: {
        level: i,
      },
    });
  }

  // CLASS
  for (let i = 1; i <= 6; i++) {
    await prisma.class.create({
      data: {
        name: `${i}A`, 
        gradeId: i, 
        capacity: Math.floor(Math.random() * (20 - 15 + 1)) + 15,
      },
    });
  }

  // SUBJECT
  const subjectData = [
    { name: "Mathematics" },
    { name: "Science" },
    { name: "English" },
    { name: "History" },
    { name: "Geography" },
    { name: "Physics" },
    { name: "Chemistry" },
    { name: "Biology" },
    { name: "Computer Science" },
    { name: "Art" },
  ];

  for (const subject of subjectData) {
    await prisma.subject.create({ data: subject });
  }

  // TEACHER
  for (let i = 1; i <= 15; i++) {
    await prisma.teacher.create({
      data: {
        id: `teacher${i}`, // Unique ID for the teacher
        username: `teacher${i}`,
        name: `TName${i}`,
        surname: `TSurname${i}`,
        email: `teacher${i}@example.com`,
        phone: `123-456-789${i}`,
        address: `Address${i}`,
        bloodType: "A+",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        subjects: { connect: [{ id: (i % 10) + 1 }] }, 
        classes: { connect: [{ id: (i % 6) + 1 }] }, 
        birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 30)),
      },
    });
  }

  // SPECIAL: Seed a teacher with the actual Clerk user ID
  const clerkTeacherId = "user_2xifHDbalU3rU22ulgbOf7gN3m";
  await prisma.teacher.create({
    data: {
      id: clerkTeacherId,
      username: "clerkteacher",
      name: "Clerk",
      surname: "Teacher",
      email: "clerkteacher@example.com",
      phone: "123-456-7890",
      address: "Clerk Address",
      bloodType: "A+",
      sex: "MALE",
      birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 30)),
      subjects: { connect: [{ id: 1 }] },
      classes: { connect: [{ id: 1 }] },
    },
  });

  // Create a lesson for this teacher
  const clerkLesson = await prisma.lesson.create({
    data: {
      name: "Clerk's Math Lesson",
      day: "MONDAY",
      startTime: new Date(new Date().setHours(9, 0, 0, 0)),
      endTime: new Date(new Date().setHours(10, 0, 0, 0)),
      subjectId: 1,
      classId: 1,
      teacherId: clerkTeacherId,
    },
  });

  // Create an assignment for this lesson
  await prisma.assignment.create({
    data: {
      title: "Clerk's Assignment",
      startDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      lessonId: clerkLesson.id,
    },
  });

  // LESSON
  for (let i = 1; i <= 30; i++) {
    await prisma.lesson.create({
      data: {
        name: `Lesson${i}`, 
        day: Day[
          Object.keys(Day)[
            Math.floor(Math.random() * Object.keys(Day).length)
          ] as keyof typeof Day
        ], 
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)), 
        endTime: new Date(new Date().setHours(new Date().getHours() + 3)), 
        subjectId: (i % 10) + 1, 
        classId: (i % 6) + 1, 
        teacherId: `teacher${(i % 15) + 1}`, 
      },
    });
  }

  // PARENT
  for (let i = 1; i <= 25; i++) {
    await prisma.parent.create({
      data: {
        id: `parentId${i}`,
        username: `parentId${i}`,
        name: `PName ${i}`,
        surname: `PSurname ${i}`,
        email: `parent${i}@example.com`,
        phone: `123-456-789${i}`,
        address: `Address${i}`,
      },
    });
  }

  // STUDENT
  for (let i = 1; i <= 50; i++) {
    await prisma.student.create({
      data: {
        id: `student${i}`, 
        username: `student${i}`, 
        name: `SName${i}`,
        surname: `SSurname ${i}`,
        email: `student${i}@example.com`,
        phone: `987-654-321${i}`,
        address: `Address${i}`,
        bloodType: "O-",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        parentId: `parentId${Math.ceil(i / 2) % 25 || 25}`, 
        gradeId: (i % 6) + 1, 
        classId: (i % 6) + 1, 
        birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 10)),
      },
    });
  }

  // EXAM
  for (let i = 1; i <= 10; i++) {
    await prisma.exam.create({
      data: {
        title: `Exam ${i}`, 
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)), 
        endTime: new Date(new Date().setHours(new Date().getHours() + 2)), 
        lessonId: (i % 30) + 1, 
      },
    });
  }

  // ASSIGNMENT
  for (let i = 1; i <= 10; i++) {
    await prisma.assignment.create({
      data: {
        title: `Assignment ${i}`, 
        startDate: new Date(new Date().setHours(new Date().getHours() + 1)), 
        dueDate: new Date(new Date().setDate(new Date().getDate() + 1)), 
        lessonId: (i % 30) + 1, 
      },
    });
  }

  // RESULT
  for (let i = 1; i <= 10; i++) {
    await prisma.result.create({
      data: {
        score: 90, 
        studentId: `student${i}`, 
        ...(i <= 5 ? { examId: i } : { assignmentId: i - 5 }), 
      },
    });
  }

  // ATTENDANCE
  for (let i = 1; i <= 10; i++) {
    await prisma.attendance.create({
      data: {
        date: new Date(), 
        present: true, 
        studentId: `student${i}`, 
        lessonId: (i % 30) + 1, 
      },
    });
  }

  // EVENT
  for (let i = 1; i <= 5; i++) {
    await prisma.event.create({
      data: {
        title: `Event ${i}`, 
        description: `Description for Event ${i}`, 
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)), 
        endTime: new Date(new Date().setHours(new Date().getHours() + 2)), 
        classId: (i % 5) + 1, 
      },
    });
  }

  // ANNOUNCEMENT
  for (let i = 1; i <= 5; i++) {
    await prisma.announcement.create({
      data: {
        title: `Announcement ${i}`, 
        description: `Description for Announcement ${i}`, 
        date: new Date(), 
        classId: (i % 5) + 1, 
      },
    });
  }

  // Add parents for the students
  for (let i = 1; i <= 5; i++) {
    await prisma.parent.create({
      data: {
        id: `clerkparent${i}`,
        username: `clerkparent${i}`,
        name: `ClerkParent${i}`,
        surname: `ParentSurname${i}`,
        email: `clerkparent${i}@example.com`,
        phone: `555-000-CLERK${i}`,
        address: `ParentAddress${i}`,
      },
    });
  }

  // Add students to the teacher's class (classId: 1)
  for (let i = 1; i <= 5; i++) {
    await prisma.student.create({
      data: {
        id: `clerkstudent${i}`,
        username: `clerkstudent${i}`,
        name: `ClerkStudent${i}`,
        surname: `StudentSurname${i}`,
        email: `clerkstudent${i}@example.com`,
        phone: `555-000-CLERK-STU${i}`,
        address: `Address${i}`,
        bloodType: "O-",
        sex: i % 2 === 0 ? "MALE" : "FEMALE",
        parentId: `clerkparent${i}`,
        gradeId: 1,
        classId: 1,
        birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 10)),
      },
    });
  }

  // Add results for the students (examId: 1)
  for (let i = 1; i <= 5; i++) {
    await prisma.result.create({
      data: {
        score: 80 + i,
        studentId: `clerkstudent${i}`,
        examId: 1, // Use the exam you created for the teacher's lesson
      },
    });
  }

  // Add an event for the class
  await prisma.event.create({
    data: {
      title: "Clerk's Class Event",
      description: "Special event for the teacher's class",
      startTime: new Date(),
      endTime: new Date(new Date().setHours(new Date().getHours() + 2)),
      classId: 1,
    },
  });

  // Add a specific Clerk parent and student for login mapping/testing
  const clerkParentId = 'user_clerkparent_test';
  const clerkStudentId = 'user_clerkstudent_test';
  await prisma.parent.create({
    data: {
      id: clerkParentId,
      username: clerkParentId,
      name: 'ClerkTestParent',
      surname: 'Parent',
      email: 'clerkparent_test@example.com',
      phone: '555-CLERK-PARENT',
      address: 'Clerk Parent Address',
    },
  });
  await prisma.student.create({
    data: {
      id: clerkStudentId,
      username: clerkStudentId,
      name: 'ClerkTestStudent',
      surname: 'Student',
      email: 'clerkstudent_test@example.com',
      phone: '555-CLERK-STUDENT',
      address: 'Clerk Student Address',
      bloodType: 'O+',
      sex: 'MALE',
      parentId: clerkParentId,
      gradeId: 1,
      classId: 1,
      birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 10)),
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });