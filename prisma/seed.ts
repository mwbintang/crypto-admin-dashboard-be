import 'dotenv/config';
import { PrismaClient } from 'generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- USERS ---
  await prisma.user.createMany({
    data: [
      { email: 'alice@example.com', name: 'Alice' },
      { email: 'bob@example.com', name: 'Bob' },
      { email: 'charlie@example.com', name: 'Charlie' },
    ],
    skipDuplicates: true,
  });

  // --- FETCH USERS ---
  const [alice, bob, charlie] = await Promise.all([
    prisma.user.findUnique({ where: { email: 'alice@example.com' } }),
    prisma.user.findUnique({ where: { email: 'bob@example.com' } }),
    prisma.user.findUnique({ where: { email: 'charlie@example.com' } }),
  ]);

  if (!alice || !bob || !charlie) {
    throw new Error('❌ Some users were not created correctly');
  }

  // --- WALLETS ---
  await prisma.wallet.upsert({
    where: { userId: alice.id },
    update: { balance: 1000 },
    create: {
      userId: alice.id,
      balance: 1000,
    },
  });

  await prisma.wallet.upsert({
    where: { userId: bob.id },
    update: { balance: 500 },
    create: {
      userId: bob.id,
      balance: 500,
    },
  });

  await prisma.wallet.upsert({
    where: { userId: charlie.id },
    update: { balance: 200 },
    create: {
      userId: charlie.id,
      balance: 200,
    },
  });

  // --- TRANSACTIONS ---
  const aliceWallet = await prisma.wallet.findUnique({ where: { userId: alice.id } });
  const bobWallet = await prisma.wallet.findUnique({ where: { userId: bob.id } });

  if (aliceWallet && bobWallet) {
    await prisma.transaction.createMany({
      data: [
        {
          walletId: aliceWallet.id,
          type: 'deposit',
          amount: 500,
        },
        {
          walletId: bobWallet.id,
          type: 'deposit',
          amount: 200,
        },
        {
          walletId: aliceWallet.id,
          type: 'transfer',
          amount: 150,
          targetUserId: bob.id,
        },
      ],
    });
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
