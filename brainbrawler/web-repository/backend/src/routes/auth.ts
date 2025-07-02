import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// In-memory storage for email verification codes (in production use Redis)
const emailVerificationCodes = new Map<string, {
  code: string;
  email: string;
  username: string;
  passwordHash: string;
  accountType: string;
  expiresAt: Date;
}>();

// Generate 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Register - Step 1: Send verification code
router.post('/register', async (req, res): Promise<void> => {
  try {
    const { username, email, password, accountType = 'FREE' } = req.body;

    // Validation
    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      res.status(400).json({ error: 'User with this email or username already exists' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification data
    emailVerificationCodes.set(email, {
      code: verificationCode,
      email,
      username,
      passwordHash,
      accountType,
      expiresAt
    });

    // In production, send email here
    console.log(`📧 Verification code for ${email}: ${verificationCode}`);

    res.status(200).json({
      message: 'Verification code sent to email',
      email,
      // Development only - remove in production
      developmentCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register - Step 2: Verify code and complete registration
router.post('/verify-email', async (req, res): Promise<void> => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ error: 'Email and verification code are required' });
      return;
    }

    // Get verification data
    const verificationData = emailVerificationCodes.get(email);
    if (!verificationData) {
      res.status(400).json({ error: 'Invalid or expired verification code' });
      return;
    }

    // Check expiration
    if (new Date() > verificationData.expiresAt) {
      emailVerificationCodes.delete(email);
      res.status(400).json({ error: 'Verification code expired' });
      return;
    }

    // Check code
    if (verificationData.code !== code) {
      res.status(400).json({ error: 'Invalid verification code' });
      return;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        username: verificationData.username,
        email: verificationData.email,
        passwordHash: verificationData.passwordHash,
        accountType: verificationData.accountType as any,
        emailVerified: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        accountType: true,
        level: true,
        xp: true,
        emailVerified: true
      }
    });

    // Create user stats
    await prisma.userStats.create({
      data: { userId: user.id }
    });

    // Clean up verification data
    emailVerificationCodes.delete(email);

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, accountType: user.accountType },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        accountType: true,
        level: true,
        xp: true,
        emailVerified: true
      }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, accountType: user.accountType },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
// @ts-ignore
router.get('/me', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        email: true,
        accountType: true,
        level: true,
        xp: true,
        emailVerified: true,
        createdAt: true
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all users
// @ts-ignore
router.get('/admin/users', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    if (req.user?.accountType !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        accountType: true,
        level: true,
        xp: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Update user account type
// @ts-ignore
router.patch('/admin/users/:userId', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    if (req.user?.accountType !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { userId } = req.params;
    const { accountType } = req.body;

    if (!['FREE', 'PREMIUM', 'ADMIN'].includes(accountType)) {
      res.status(400).json({ error: 'Invalid account type' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { accountType },
      select: {
        id: true,
        username: true,
        email: true,
        accountType: true,
        level: true,
        xp: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 