import { useState, useEffect, useCallback } from "react";
import { Difficulty, GameMode, GameStats } from "../types/game";
import { GameGenerator } from "../utils/gameGenerator";
import { gameApi } from "../services/gameApi";
import { QuizMode } from "./QuizMode";
import { CountMode } from "./CountMode";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Card } from "./ui/card";
import { Trophy, Timer, Target, RotateCcw } from "lucide-react";

interface CountingGameProps {
  difficulty?: Difficulty;
  mode?: GameMode;
}

export function CountingGame({
  difficulty = "easy",
  mode = "count",
}: CountingGameProps) {
  const [gameState, setGameState] = useState<"menu" | "playing" | "results">(
    "menu"
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    startTime: 0,
  });
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer effect
  useEffect(() => {
    if (gameState === "playing") {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - stats.startTime);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [gameState, stats.startTime]);

  const startGame = useCallback(async () => {
    // Generate questions based on mode
    const totalQuestions = difficulty === "easy" ? 5 : 8;
    const generatedQuestions =
      mode === "quiz"
        ? GameGenerator.generateQuizQuestions(difficulty, totalQuestions)
        : GameGenerator.generateCountQuestions(difficulty, totalQuestions);

    setQuestions(generatedQuestions);
    setCurrentQuestionIndex(0);
    setStats({
      score: 0,
      correctAnswers: 0,
      totalQuestions: generatedQuestions.length,
      startTime: Date.now(),
    });
    setQuestionStartTime(Date.now());
    setElapsedTime(0);
    setGameState("playing");

    // Send game start event
    await gameApi.sendGameStart(difficulty, mode);
  }, [difficulty, mode]);

  const handleAnswer = useCallback(
    async (answer: number) => {
      const currentQuestion = questions[currentQuestionIndex];
      const correctAnswer = currentQuestion.correctAnswer;
      const isCorrect = answer === correctAnswer;
      const timeSpent = Date.now() - questionStartTime;

      // Update stats
      const newStats = {
        ...stats,
        score: isCorrect ? stats.score + 10 : stats.score,
        correctAnswers: isCorrect
          ? stats.correctAnswers + 1
          : stats.correctAnswers,
      };
      setStats(newStats);

      // Send question answer event
      await gameApi.sendQuestionAnswer(
        difficulty,
        mode,
        currentQuestionIndex,
        answer,
        correctAnswer,
        timeSpent
      );

      // Move to next question or end game
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setQuestionStartTime(Date.now());
      } else {
        // Game ended
        const totalTime = Date.now() - stats.startTime;
        await gameApi.sendGameEnd(
          difficulty,
          mode,
          newStats.score,
          newStats.totalQuestions,
          totalTime
        );
        setStats({ ...newStats, endTime: Date.now() });
        setGameState("results");
      }
    },
    [
      currentQuestionIndex,
      questions,
      stats,
      questionStartTime,
      difficulty,
      mode,
    ]
  );

  const resetGame = () => {
    setGameState("menu");
    setCurrentQuestionIndex(0);
    setQuestions([]);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Menu Screen
  if (gameState === "menu") {
    return (
      <div className="flex flex-col items-center justify-center gap-8 p-8 min-h-screen bg-linear-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="text-center">
          <h1 className="text-blue-600 mb-4">🎮 Trò chơi đếm số 1-10</h1>
          <p className="text-gray-700 text-xl">
            {mode === "quiz"
              ? "Nghe câu hỏi và chọn đáp án đúng"
              : "Đếm số vật và chọn đáp án đúng"}
          </p>
        </div>

        <Card className="p-10 bg-white shadow-xl max-w-lg w-2">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
              <Target className="w-8 h-8 text-blue-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm text-gray-600">Chế độ</span>
                <span className="text-gray-800 text-xl">
                  {mode === "quiz" ? "Trắc nghiệm" : "Đếm số"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-xl">
              <Trophy className="w-8 h-8 text-yellow-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm text-gray-600">Độ khó</span>
                <span className="text-gray-800 text-xl">
                  {difficulty === "easy" ? "Dễ (1-5)" : "Trung bình (1-10)"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
              <Timer className="w-8 h-8 text-green-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm text-gray-600">Số câu hỏi</span>
                <span className="text-gray-800 text-xl">
                  {difficulty === "easy" ? "5 câu" : "8 câu"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Button
          onClick={startGame}
          className="bg-blue-500 hover:bg-blue-600 text-white px-12 py-6 text-xl rounded-2xl shadow-lg"
        >
          Bắt đầu chơi! 🚀
        </Button>
      </div>
    );
  }

  // Results Screen
  if (gameState === "results") {
    const accuracy =
      stats.totalQuestions > 0
        ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
        : 0;
    const totalTime = stats.endTime ? stats.endTime - stats.startTime : 0;

    return (
      <div className="flex flex-col items-center justify-center gap-8 p-8 min-h-screen bg-linear-to-br from-blue-100 via-purple-100 to-pink-100">
        <h1 className="text-blue-600">🎉 Hoàn thành!</h1>

        <Card className="p-8 bg-white shadow-xl w-full max-w-md">
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {accuracy >= 80 ? "🌟" : accuracy >= 60 ? "⭐" : "💪"}
              </div>
              <h2 className="text-gray-800 mb-2">Kết quả của bạn</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Điểm số:</span>
                <span className="text-blue-600">{stats.score} điểm</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <span className="text-gray-700">Đúng:</span>
                <span className="text-green-600">
                  {stats.correctAnswers}/{stats.totalQuestions}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                <span className="text-gray-700">Độ chính xác:</span>
                <span className="text-purple-600">{accuracy}%</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                <span className="text-gray-700">Thời gian:</span>
                <span className="text-orange-600">{formatTime(totalTime)}</span>
              </div>
            </div>
          </div>
        </Card>

        <Button
          onClick={resetGame}
          className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-lg flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Chơi lại
        </Button>
      </div>
    );
  }

  // Playing Screen
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / stats.totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-100 via-purple-100 to-pink-100 py-8">
      {/* Header with progress */}
      <div className="max-w-4xl mx-auto mb-6 px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span className="text-gray-700">Điểm: {stats.score}</span>
          </div>
          <div className="flex items-center gap-3">
            <Timer className="w-6 h-6 text-blue-500" />
            <span className="text-gray-700">{formatTime(elapsedTime)}</span>
          </div>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Question */}
      {mode === "quiz" ? (
        <QuizMode
          question={currentQuestion}
          onAnswer={handleAnswer}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={stats.totalQuestions}
        />
      ) : (
        <CountMode
          question={currentQuestion}
          onAnswer={handleAnswer}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={stats.totalQuestions}
        />
      )}
    </div>
  );
}
