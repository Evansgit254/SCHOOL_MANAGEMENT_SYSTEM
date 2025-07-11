const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lessons = await prisma.lesson.findMany({
    orderBy: { id: 'asc' },
  });

  const baseDate = new Date('2025-06-19T08:00:00.000Z');

  for (let i = 0; i < lessons.length; i++) {
    const start = new Date(baseDate);
    start.setHours(8 + i, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    await prisma.lesson.update({
      where: { id: lessons[i].id },
      data: {
        startTime: start,
        endTime: end,
      },
    });
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });