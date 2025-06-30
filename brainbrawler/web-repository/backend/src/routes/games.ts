import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Create game (Premium only)
// @ts-ignore
router.post('/create', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Check if user can create games (Premium or Admin)
    if (req.user!.accountType === 'FREE') {
      res.status(403).json({ error: 'Premium account required to create games' });
      return;
    }

    const { 
      name, 
      questionSetId, 
      language = 'IT', 
      maxPlayers = 8, 
      questionCount = 10, 
      timePerQuestion = 15, 
      isPrivate = false, 
      password 
    } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Game name is required' });
      return;
    }

    let passwordHash = null;
    if (isPrivate && password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const game = await prisma.game.create({
      data: {
        hostId: req.user!.id,
        questionSetId,
        name,
        language,
        maxPlayers,
        questionCount,
        timePerQuestion,
        isPrivate,
        passwordHash
      }
    });

    res.status(201).json(game);
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available games
// @ts-ignore
router.get('/available', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const games = await prisma.game.findMany({
      where: {
        status: 'WAITING',
        isPrivate: false
      },
      include: {
        host: {
          select: { id: true, username: true, accountType: true }
        },
        _count: {
          select: { players: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json(games);
  } catch (error) {
    console.error('Get available games error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 