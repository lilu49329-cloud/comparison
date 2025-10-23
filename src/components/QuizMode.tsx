import { useState, useEffect, useRef } from "react";
import { QuizQuestion } from "../types/game";
import { Button } from "./ui/button";
import { Volume2 } from "lucide-react";

interface QuizModeProps {
  question: QuizQuestion;
  onAnswer: (answer: number) => void;
  questionNumber: number;
  totalQuestions: number;
}

const FPT_API_KEY = "Y6cOAzkF6ac0DlD4STe1BqAukfwpieDk";
const FPT_VOICE = "thuminh";

export function QuizMode({
  question,
  onAnswer,
  questionNumber,
  totalQuestions,
}: QuizModeProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setSelectedAnswer(null);
    const timer = setTimeout(() => {
      playQuestion();
    }, 500);
    return () => clearTimeout(timer);
  }, [question]);

  const speakWithFPT = async (text: string) => {
    try {
      const response = await fetch("https://api.fpt.ai/hmi/tts/v5", {
        method: "POST",
        headers: {
          "api-key": FPT_API_KEY,
          speed: "",
          voice: FPT_VOICE,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: text,
      });

      const result = await response.json();
      const audioUrl = result?.async; // URL file mp3 trả về

      if (audioUrl) {
        // Dừng nếu đang phát
        if (audioRef.current) {
          audioRef.current.pause();
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play();
      } else {
        console.error("Không lấy được URL âm thanh từ FPT:", result);
      }
    } catch (error) {
      console.error("FPT AI TTS error:", error);
    }
  };

  const playQuestion = () => {
    speakWithFPT(question.question);
  };

  const playFeedback = (isCorrect: boolean) => {
    const feedbackText = isCorrect
      ? "Đúng rồi! Giỏi quá!"
      : "Chưa đúng! Cố gắng lên!";
    speakWithFPT(feedbackText);
  };

  const handleAnswer = (answer: number) => {
    const isCorrect = answer === question.correctAnswer;
    setSelectedAnswer(answer);
    playFeedback(isCorrect);

    setTimeout(() => {
      onAnswer(answer);
      setSelectedAnswer(null);
    }, 1500);
  };

  const containerClass =
    "flex flex-col items-center gap-4 bg-linear-to-br from-purple-50 to-pink-50 rounded-3xl p-8 shadow-lg border-4 border-white min-h-48 justify-center w-full";

  return (
    <div className="quiz-mode flex flex-col items-center gap-8 w-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-gray-600">
          Câu hỏi {questionNumber}/{totalQuestions}
        </p>
        <h2 className="text-blue-600 mt-2">Nghe câu hỏi và chọn đáp án đúng</h2>
      </div>

      {/* Question Display */}
      <div className={containerClass}>
        <Button
          onClick={playQuestion}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full h-20 w-20 flex items-center justify-center shadow-xl"
          aria-label="Phát câu hỏi"
        >
          <Volume2 className="w-10 h-10" />
        </Button>

        <p className="text-center text-gray-700 mt-4">{question.question}</p>
      </div>

      {/* Answer Options */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        {question.options.map((option) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === question.correctAnswer;
          const showFeedback = selectedAnswer !== null;

          return (
            <Button
              key={option}
              onClick={() => handleAnswer(option)}
              disabled={selectedAnswer !== null}
              className={`h-20 text-3xl transition-all duration-300 ${
                showFeedback && isSelected && isCorrect
                  ? "bg-green-500 hover:bg-green-500"
                  : showFeedback && isSelected && !isCorrect
                  ? "bg-red-500 hover:bg-red-500"
                  : "bg-white text-blue-600 border-4 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
              }`}
            >
              {option}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
