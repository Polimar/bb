import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Send friend request
// @ts-ignore
router.post('/request', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { addresseeId } = req.body;
    
    if (!addresseeId) {
      res.status(400).json({ error: 'Addressee ID is required' });
      return;
    }

    if (addresseeId === req.user!.id) {
      res.status(400).json({ error: 'Cannot send friend request to yourself' });
      return;
    }

    // Check if user exists
    const addressee = await prisma.user.findUnique({
      where: { id: addresseeId }
    });

    if (!addressee) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: req.user!.id, addresseeId },
          { requesterId: addresseeId, addresseeId: req.user!.id }
        ]
      }
    });

    if (existingFriendship) {
      res.status(400).json({ error: 'Friendship already exists or pending' });
      return;
    }

    const friendship = await prisma.friendship.create({
      data: {
        requesterId: req.user!.id,
        addresseeId
      },
      include: {
        addressee: {
          select: { id: true, username: true, level: true }
        }
      }
    });

    res.status(201).json(friendship);
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get friend requests
// @ts-ignore
router.get('/requests', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const requests = await prisma.friendship.findMany({
      where: {
        addresseeId: req.user!.id,
        status: 'PENDING'
      },
      include: {
        requester: {
          select: { id: true, username: true, level: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(requests);
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept/Reject friend request
// @ts-ignore
router.patch('/request/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'
    
    if (!action || !['accept', 'reject'].includes(action)) {
      res.status(400).json({ error: 'Action must be "accept" or "reject"' });
      return;
    }

    const friendship = await prisma.friendship.findUnique({
      where: { id: req.params.id }
    });

    if (!friendship || friendship.addresseeId !== req.user!.id) {
      res.status(404).json({ error: 'Friend request not found' });
      return;
    }

    if (action === 'accept') {
      const updatedFriendship = await prisma.friendship.update({
        where: { id: req.params.id },
        data: { status: 'ACCEPTED' },
        include: {
          requester: {
            select: { id: true, username: true, level: true }
          }
        }
      });
      res.json(updatedFriendship);
    } else {
      await prisma.friendship.delete({
        where: { id: req.params.id }
      });
      res.json({ message: 'Friend request rejected' });
    }
  } catch (error) {
    console.error('Handle friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get friends list
// @ts-ignore
router.get('/list', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: req.user!.id, status: 'ACCEPTED' },
          { addresseeId: req.user!.id, status: 'ACCEPTED' }
        ]
      },
      include: {
        requester: {
          select: { id: true, username: true, level: true, accountType: true }
        },
        addressee: {
          select: { id: true, username: true, level: true, accountType: true }
        }
      }
    });

    const friends = friendships.map(f => {
      return f.requesterId === req.user!.id ? f.addressee : f.requester;
    });

    res.json(friends);
  } catch (error) {
    console.error('Get friends list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 