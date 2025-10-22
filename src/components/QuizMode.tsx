import { useState, useEffect } from "react";
import { QuizQuestion } from "../types/game";
import { Button } from "./ui/button";
import { Volume2 } from "lucide-react";

interface QuizModeProps {
  question: QuizQuestion;
  onAnswer: (answer: number) => void;
  questionNumber: number;
  totalQuestions: number;
}

export function QuizMode({
  question,
  onAnswer,
  questionNumber,
  totalQuestions,
}: QuizModeProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [femaleVoice, setFemaleVoice] = useState<SpeechSynthesisVoice | null>(
    null
  );

  // Get female Vietnamese voice
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();

      // Try to find Vietnamese female voice
      let selectedVoice = voices.find(
        (voice) =>
          voice.lang.includes("vi") &&
          voice.name.toLowerCase().includes("female")
      );

      // Fallback: any Vietnamese voice
      if (!selectedVoice) {
        selectedVoice = voices.find((voice) => voice.lang.includes("vi"));
      }

      // Fallback: any female voice
      if (!selectedVoice) {
        selectedVoice = voices.find(
          (voice) =>
            voice.name.toLowerCase().includes("female") ||
            voice.name.toLowerCase().includes("nữ")
        );
      }

      setFemaleVoice(selectedVoice || null);
    };

    loadVoices();

    // Some browsers load voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Auto-play question when it changes
  useEffect(() => {
    setSelectedAnswer(null);
    // Auto-play question after a short delay
    const timer = setTimeout(() => {
      playQuestion();
    }, 500);
    return () => clearTimeout(timer);
  }, [question]);

  const playQuestion = () => {
    // Text-to-speech for the question
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(question.question);
      utterance.lang = "vi-VN";
      utterance.rate = 0.9;
      utterance.pitch = 1.1; // Slightly higher pitch for female voice
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  const playFeedback = (isCorrect: boolean) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const feedbackText = isCorrect
        ? "Đúng rồi! Giỏi quá!"
        : "Chưa đúng! Cố gắng lên!";
      const utterance = new SpeechSynthesisUtterance(feedbackText);
      utterance.lang = "vi-VN";
      utterance.rate = 0.9;
      utterance.pitch = 1.1; // Slightly higher pitch for female voice
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAnswer = (answer: number) => {
    const isCorrect = answer === question.correctAnswer;
    setSelectedAnswer(answer);

    // Play audio feedback
    playFeedback(isCorrect);

    setTimeout(() => {
      onAnswer(answer);
      setSelectedAnswer(null);
    }, 1500);
  };

  const newLocal =
    "flex flex-col items-center gap-4 bg-linear-to-br from-purple-50 to-pink-50 rounded-3xl p-8 shadow-lg border-4 border-white min-h-48 justify-center w-full";
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-gray-600">
          Câu hỏi {questionNumber}/{totalQuestions}
        </p>
        <h2 className="text-blue-600 mt-2">Nghe câu hỏi và chọn đáp án đúng</h2>
      </div>

      {/* Question Display */}
      <div className={newLocal}>
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
