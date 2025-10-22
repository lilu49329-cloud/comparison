import { GameEvent } from "../types/game";

/**
 * Mock API service for sending game events
 * In production, replace this with actual API calls to your backend
 */
class GameApiService {
  private apiEndpoint = "/api/game-events"; // Replace with actual endpoint

  async sendEvent(event: GameEvent): Promise<void> {
    try {
      // Mock API call - replace with actual fetch to your backend
      console.log("📤 Sending event to server:", event);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 100));

      // In production, uncomment and configure:
      /*
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers if needed
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Event sent successfully:', data);
      */

      console.log("✅ Event logged (mock)");
    } catch (error) {
      console.error("❌ Failed to send event:", error);
      // Don't throw - we don't want to break the game if logging fails
    }
  }

  async sendGameStart(difficulty: string, mode: string): Promise<void> {
    const event: GameEvent = {
      eventType: "game_start",
      timestamp: Date.now(),
      skill: "count_1_10",
      difficulty: difficulty as "easy" | "med",
      data: { mode: mode as "quiz" | "count" },
    };
    await this.sendEvent(event);
  }

  async sendQuestionAnswer(
    difficulty: string,
    mode: string,
    questionIndex: number,
    userAnswer: number,
    correctAnswer: number,
    timeSpent: number
  ): Promise<void> {
    const event: GameEvent = {
      eventType: "question_answer",
      timestamp: Date.now(),
      skill: "count_1_10",
      difficulty: difficulty as "easy" | "med",
      data: {
        mode: mode as "quiz" | "count",
        questionIndex,
        userAnswer,
        correctAnswer,
        isCorrect: userAnswer === correctAnswer,
        timeSpent,
      },
    };
    await this.sendEvent(event);
  }

  async sendGameEnd(
    difficulty: string,
    mode: string,
    score: number,
    totalQuestions: number,
    totalTime: number
  ): Promise<void> {
    const event: GameEvent = {
      eventType: "game_end",
      timestamp: Date.now(),
      skill: "count_1_10",
      difficulty: difficulty as "easy" | "med",
      data: {
        mode: mode as "quiz" | "count",
        score,
        totalQuestions,
        timeSpent: totalTime,
      },
    };
    await this.sendEvent(event);
  }
}

export const gameApi = new GameApiService();
