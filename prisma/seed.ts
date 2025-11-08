import 'dotenv/config';
import { PrismaClient } from 'generated/prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear old data first
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();

  // Create users with hashed passwords
  const users = await Promise.all([
    createUser('alice', 'alice@example.com', 'password123'),
    createUser('bob', 'bob@example.com', 'password123'),
    createUser('charlie', 'charlie@example.com', 'password123'),
  ]);

  // Create wallets
  const wallets = await Promise.all(
    users.map((user, i) =>
      prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 1000 * (i + 1), // 1000, 2000, 3000
        },
      }),
    ),
  );

  // Create transactions
  await prisma.transaction.createMany({
    data: [
      {
        walletId: wallets[0].id,
        type: 'deposit',
        amount: 500,
      },
      {
        walletId: wallets[1].id,
        type: 'transfer',
        amount: 300,
        targetUserId: users[0].id,
      },
      {
        walletId: wallets[2].id,
        type: 'deposit',
        amount: 1000,
      },
    ],
  });

  console.log('✅ Seeding completed successfully!');
}

// Helper function to create a user with hashed password
async function createUser(username: string, email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      username,
      password: hashedPassword,
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
