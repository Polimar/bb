import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requirePremium, AuthRequest } from '../middleware/auth';
import { QuestionSetJSON } from '../types/questionSets';

const router = express.Router();
const prisma = new PrismaClient();

// Bulk upload question set from JSON
// @ts-ignore
router.post('/bulk-upload', authenticateToken, requirePremium, async (req: AuthRequest, res) => {
  try {
    const jsonData: QuestionSetJSON = req.body;
    
    // Validate JSON structure
    if (!jsonData.questionSet || !jsonData.questions || !Array.isArray(jsonData.questions)) {
      res.status(400).json({ error: 'Invalid JSON format' });
      return;
    }

    if (jsonData.questions.length < 5 || jsonData.questions.length > 1000) {
      res.status(400).json({ error: 'Question set must have between 5-1000 questions' });
      return;
    }

    // Validate each question
    for (const q of jsonData.questions) {
      if (!q.text || !q.options || q.options.length !== 4 || typeof q.correctAnswer !== 'number') {
        res.status(400).json({ error: 'Invalid question format' });
        return;
      }
      if (q.correctAnswer < 0 || q.correctAnswer > 3) {
        res.status(400).json({ error: 'correctAnswer must be 0, 1, 2, or 3' });
        return;
      }
    }

    // Create question set
    const questionSet = await prisma.questionSet.create({
      data: {
        userId: req.user!.id,
        name: jsonData.questionSet.name,
        description: jsonData.questionSet.description,
        language: jsonData.questionSet.language,
        category: jsonData.questionSet.category,
        totalQuestions: jsonData.questions.length
      }
    });

    // Create questions
    const questions = await prisma.question.createMany({
      data: jsonData.questions.map(q => ({
        questionSetId: questionSet.id,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty,
        explanation: q.explanation
      }))
    });

    res.status(201).json({
      questionSet,
      questionsCreated: questions.count
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's question sets
// @ts-ignore
router.get('/my-sets', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const questionSets = await prisma.questionSet.findMany({
      where: { userId: req.user!.id },
      include: {
        _count: {
          select: { questions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(questionSets);
  } catch (error) {
    console.error('Get question sets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get public question sets
router.get('/public', async (req, res) => {
  try {
    const questionSets = await prisma.questionSet.findMany({
      where: { isPublic: true },
      include: {
        user: {
          select: { username: true }
        },
        _count: {
          select: { questions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(questionSets);
  } catch (error) {
    console.error('Get public question sets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get question set details with questions (for game setup)
// @ts-ignore
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const questionSet = await prisma.questionSet.findUnique({
      where: { id: req.params.id },
      include: {
        questions: {
          select: {
            id: true,
            text: true,
            options: true,
            correctAnswer: true,
            difficulty: true,
            explanation: true
          }
        },
        user: {
          select: { username: true }
        }
      }
    });

    if (!questionSet) {
      res.status(404).json({ error: 'Question set not found' });
      return;
    }

    // Check access permissions
    if (!questionSet.isPublic && questionSet.userId !== req.user!.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json(questionSet);
  } catch (error) {
    console.error('Get question set error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 