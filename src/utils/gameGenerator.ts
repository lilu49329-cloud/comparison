import {
  Difficulty,
  QuizQuestion,
  CountQuestion,
  QuizQuestionType,
} from "../types/game";

export class GameGenerator {
  /**
   * Generate quiz questions (identify number, before/after)
   */
  static generateQuizQuestions(
    difficulty: Difficulty,
    count: number
  ): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    const questionTypes: QuizQuestionType[] = ["identify", "before", "after"];

    for (let i = 0; i < count; i++) {
      const type =
        questionTypes[Math.floor(Math.random() * questionTypes.length)];
      const question = this.generateQuizQuestion(type, difficulty);
      questions.push(question);
    }

    return questions;
  }

  private static generateQuizQuestion(
    type: QuizQuestionType,
    difficulty: Difficulty
  ): QuizQuestion {
    const maxNumber = difficulty === "easy" ? 5 : 10;

    if (type === "identify") {
      const targetNumber = Math.floor(Math.random() * maxNumber) + 1;
      return {
        type,
        targetNumber,
        question: `Đâu là số ${targetNumber}?`,
        correctAnswer: targetNumber,
        options: this.generateOptions(
          targetNumber,
          maxNumber,
          difficulty === "easy" ? 3 : 4
        ),
      };
    } else if (type === "before") {
      const targetNumber = Math.floor(Math.random() * (maxNumber - 1)) + 2; // 2 to maxNumber
      const correctAnswer = targetNumber - 1;
      return {
        type,
        targetNumber,
        question: `Số nào liền trước số ${targetNumber}?`,
        correctAnswer,
        options: this.generateOptions(
          correctAnswer,
          maxNumber,
          difficulty === "easy" ? 3 : 4
        ),
      };
    } else {
      const targetNumber = Math.floor(Math.random() * (maxNumber - 1)) + 1; // 1 to maxNumber-1
      const correctAnswer = targetNumber + 1;
      return {
        type,
        targetNumber,
        question: `Số nào liền sau số ${targetNumber}?`,
        correctAnswer,
        options: this.generateOptions(
          correctAnswer,
          maxNumber,
          difficulty === "easy" ? 3 : 4
        ),
      };
    }
  }

  /**
   * Generate counting questions (count objects and choose answer)
   */
  static generateCountQuestions(
    difficulty: Difficulty,
    count: number
  ): CountQuestion[] {
    const questions: CountQuestion[] = [];

    for (let i = 0; i < count; i++) {
      const question = this.generateCountQuestion(difficulty);
      questions.push(question);
    }

    return questions;
  }

  private static generateCountQuestion(difficulty: Difficulty): CountQuestion {
    const maxCount = difficulty === "easy" ? 5 : 10;
    const objectCount = Math.floor(Math.random() * maxCount) + 1;

    return {
      objectCount,
      correctAnswer: objectCount,
      options: this.generateOptions(
        objectCount,
        maxCount,
        difficulty === "easy" ? 3 : 4
      ),
    };
  }

  /**
   * Generate unique options including the correct answer
   */
  private static generateOptions(
    correctAnswer: number,
    maxNumber: number,
    optionCount: number
  ): number[] {
    const options = new Set<number>([correctAnswer]);

    while (options.size < optionCount) {
      const randomNum = Math.floor(Math.random() * maxNumber) + 1;
      options.add(randomNum);
    }

    // Shuffle options
    return this.shuffleArray(Array.from(options));
  }

  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get random emoji for objects to count
   */
  static getRandomEmoji(): string {
    const emojis = ["🍎", "⭐", "🎈", "🌸", "🐶", "🎁", "🌈", "🦋", "🍓", "🌺"];
    return emojis[Math.floor(Math.random() * emojis.length)];
  }
}
