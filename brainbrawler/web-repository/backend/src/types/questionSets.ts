export interface QuestionSetJSON {
  questionSet: {
    name: string;
    description: string;
    language: 'IT' | 'EN' | 'ES' | 'DE' | 'FR';
    category: string;
  };
  questions: Array<{
    text: string;
    options: [string, string, string, string]; // Exactly 4 options
    correctAnswer: 0 | 1 | 2 | 3; // Index of correct option
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    explanation?: string;
  }>;
}

// Example JSON format for bulk upload
export const EXAMPLE_QUESTION_SET: QuestionSetJSON = {
  questionSet: {
    name: "Quiz Conoscenza Generale",
    description: "Un quiz completo che copre vari argomenti",
    language: "IT",
    category: "Generale"
  },
  questions: [
    {
      text: "Qual è la capitale della Francia?",
      options: ["Londra", "Berlino", "Parigi", "Madrid"],
      correctAnswer: 2,
      difficulty: "EASY",
      explanation: "Parigi è stata la capitale della Francia dal 987 d.C."
    },
    {
      text: "Chi ha scritto 'La Divina Commedia'?",
      options: ["Petrarca", "Dante Alighieri", "Boccaccio", "Machiavelli"],
      correctAnswer: 1,
      difficulty: "MEDIUM",
      explanation: "Dante Alighieri scrisse la Divina Commedia tra il 1306 e il 1321."
    }
  ]
}; 