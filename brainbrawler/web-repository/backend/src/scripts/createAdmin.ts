import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { accountType: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Admin credentials
    const adminEmail = 'admin@brainbrawler.com';
    const adminPassword = 'BrainBrawler2024!';
    const adminUsername = 'admin';

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        passwordHash,
        accountType: 'ADMIN',
        emailVerified: true,
        level: 100,
        xp: 999999
      }
    });

    // Create admin stats
    await prisma.userStats.create({
      data: { 
        userId: adminUser.id,
        totalGames: 0,
        totalWins: 0,
        totalScore: 0,
        averageAccuracy: 100.00,
        averageResponseTime: 1.00
      }
    });

    console.log('🔐 Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 