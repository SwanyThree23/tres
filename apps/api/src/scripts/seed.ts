import { PrismaClient, UserRole, StageStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seed...');

  // ── 1. Create Admins ──────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cylive.com' },
    update: {},
    create: {
      email: 'admin@cylive.com',
      passwordHash: adminPassword,
      username: 'admin',
      displayName: 'System Admin',
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });
  console.log('✅ Admin user created (admin@cylive.com / Admin@123!)');

  // ── 2. Create Creators ────────────────────────────────────────────────────
  const creatorPassword = await bcrypt.hash('Creator@123!', 10);
  const creators = [];
  for (let i = 1; i <= 5; i++) {
    const creator = await prisma.user.upsert({
      where: { email: `creator${i}@cylive.com` },
      update: {},
      create: {
        email: `creator${i}@cylive.com`,
        passwordHash: creatorPassword,
        username: `creator_${i}`,
        displayName: faker.person.fullName(),
        role: UserRole.CREATOR,
        emailVerified: true,
        bio: faker.person.bio(),
        stripeAccountId: `acct_dummy_stripe_${i}`,
        chargesEnabled: true,
      },
    });
    creators.push(creator);
  }
  console.log('✅ 5 Creator accounts generated');

  // ── 3. Create Regular Users (Beta Testers) ────────────────────────────────
  const testerPassword = await bcrypt.hash('Tester@123!', 10);
  const testers = [];
  for (let i = 1; i <= 20; i++) {
    const tester = await prisma.user.upsert({
      where: { email: `tester${i}@cylive.com` },
      update: {},
      create: {
        email: `tester${i}@cylive.com`,
        passwordHash: testerPassword,
        username: `tester_${i}`,
        displayName: faker.person.fullName(),
        role: UserRole.USER,
        emailVerified: true,
      },
    });
    testers.push(tester);
  }
  console.log('✅ 20 Beta Tester accounts generated');

  // ── 4. Create Active Stages for Creators ──────────────────────────────────
  for (const creator of creators) {
    const stage = await prisma.stage.create({
      data: {
        title: faker.lorem.words(3),
        description: faker.lorem.paragraph(),
        status: StageStatus.LIVE,
        isPrivate: false,
        creatorId: creator.id,
      },
    });
    console.log(`🎤 Created LIVE Stage: "${stage.title}" by ${creator.username}`);
  }

  console.log('🌱 Seed complete! System is MULTI-USER READY for BETA.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
