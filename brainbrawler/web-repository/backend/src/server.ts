import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import questionSetRoutes from './routes/questionSets';
import friendRoutes from './routes/friends';
import gameRoutes from './routes/games';

const app = express();
const prisma = new PrismaClient();
const PORT = parseInt(process.env.PORT || '3000', 10);

async function main() {
  // Middleware
  app.use(helmet());
  app.use(cors({
    origin: ['http://localhost:3001', 'http://10.40.10.180:3001', 'https://brainbrawler.com'],
    credentials: true
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/question-sets', questionSetRoutes);
  app.use('/api/friends', friendRoutes);
  app.use('/api/games', gameRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Error handling
  app.use((err: any, req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  });

  try {
    await prisma.$connect();
    console.log('🔗 Database connection successful.');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 BrainBrawler Backend running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Remote access: http://10.40.10.180:${PORT}/health`);
      console.log(`🎮 API Base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to the database', error);
    process.exit(1);
  }
}

main();

export default app; 