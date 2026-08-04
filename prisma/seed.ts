import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Tạo user demo
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@taskflow.app' },
    update: {},
    create: {
      email: 'demo@taskflow.app',
      passwordHash: hashedPassword,
      displayName: 'Demo User',
    },
  });

  // Tạo project demo
  const project = await prisma.project.upsert({
    where: { id: 'demo-project-1' },
    update: {},
    create: {
      id: 'demo-project-1',
      name: 'Dự án Portfolio',
      description: 'Xây dựng portfolio cá nhân để apply intern',
      color: '#3B82F6',
      userId: user.id,
    },
  });

  // Tạo labels
  const labels = await Promise.all([
    prisma.label.upsert({
      where: { id: 'label-1' },
      update: {},
      create: { id: 'label-1', name: 'Bug', color: '#EF4444' },
    }),
    prisma.label.upsert({
      where: { id: 'label-2' },
      update: {},
      create: { id: 'label-2', name: 'Feature', color: '#22C55E' },
    }),
    prisma.label.upsert({
      where: { id: 'label-3' },
      update: {},
      create: { id: 'label-3', name: 'UI/UX', color: '#A855F7' },
    }),
  ]);

  // Tạo tasks demo
  await Promise.all([
    prisma.task.create({
      data: {
        title: 'Setup project structure',
        description: 'Tạo folder structure cho backend và frontend',
        status: 'DONE',
        priority: 'HIGH',
        position: 0,
        userId: user.id,
        projectId: project.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Implement Authentication',
        description: 'JWT login/register với refresh token',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        position: 1,
        userId: user.id,
        projectId: project.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Build Kanban Board',
        description: 'Drag & drop task giữa các cột',
        status: 'TODO',
        priority: 'MEDIUM',
        position: 2,
        userId: user.id,
        projectId: project.id,
      },
    }),
  ]);

  // Tạo notes demo
  await prisma.note.create({
    data: {
      title: 'Tech Stack Notes',
      content:
        '<p>Frontend: Next.js 14 + Tailwind + shadcn/ui</p><p>Backend: NestJS + Prisma + PostgreSQL</p>',
      isPinned: true,
      userId: user.id,
      projectId: project.id,
    },
  });

  console.log('✅ Seed completed!');
  console.log(`   User: ${user.email} / password: password123`);
  console.log(`   Project: ${project.name}`);
  console.log(`   Labels: ${labels.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
