export interface User {
  id: string;
  username: string;
  email: string;
  accountType: 'FREE' | 'PREMIUM' | 'ADMIN';
  level: number;
  xp: number;
  emailVerified: boolean;
  createdAt: string;
}

export interface QuestionSet {
  id: string;
  name: string;
  description?: string;
  language: 'IT' | 'EN' | 'ES' | 'DE' | 'FR';
  category: string;
  totalQuestions: number;
  isPublic: boolean;
  createdAt: string;
  user?: {
    username: string;
  };
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  explanation?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Game {
  id: string;
  name: string;
  language: 'IT' | 'EN' | 'ES' | 'DE' | 'FR';
  maxPlayers: number;
  questionCount: number;
  timePerQuestion: number;
  isPrivate: boolean;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  host: {
    id: string;
    username: string;
    accountType: string;
  };
  questionSet?: {
    id: string;
    name: string;
    category: string;
  };
  _count?: {
    players: number;
  };
} 