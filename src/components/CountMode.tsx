import { useState, useEffect } from "react";
import { CountQuestion } from "../types/game";
import { GameGenerator } from "../utils/gameGenerator";
import { Button } from "./ui/button";
import { motion } from "motion/react";

interface CountModeProps {
  question: CountQuestion;
  onAnswer: (answer: number) => void;
  questionNumber: number;
  totalQuestions: number;
}

export function CountMode({
  question,
  onAnswer,
  questionNumber,
  totalQuestions,
}: CountModeProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [emoji] = useState(() => GameGenerator.getRandomEmoji());
  const [objectPositions, setObjectPositions] = useState<
    Array<{ x: number; y: number; rotation: number }>
  >([]);
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

  useEffect(() => {
    // Generate random positions for objects
    const positions = [];
    for (let i = 0; i < question.objectCount; i++) {
      positions.push({
        x: Math.random() * 80 + 10, // 10% to 90%
        y: Math.random() * 70 + 10, // 10% to 80%
        rotation: Math.random() * 40 - 20, // -20deg to 20deg
      });
    }
    setObjectPositions(positions);
    setSelectedAnswer(null);

    // Auto-play instruction after a short delay
    const timer = setTimeout(() => {
      playInstruction();
    }, 800);
    return () => clearTimeout(timer);
  }, [question.objectCount]);

  const playInstruction = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const instructionText = "Bé ơi, ở đây có bao nhiêu đồ vật thế nhỉ";
      const utterance = new SpeechSynthesisUtterance(instructionText);
      utterance.lang = "vi-VN";
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
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
      utterance.pitch = 1.1;
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

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-gray-600">
          Câu hỏi {questionNumber}/{totalQuestions}
        </p>
        <h2 className="text-blue-600 mt-2">Đếm số vật và chọn đáp án đúng</h2>
      </div>

      {/* Objects Display Area */}
      <div className="relative w-full h-96 bg-linear-to-br from-blue-50 to-purple-50 rounded-3xl shadow-lg border-4 border-white overflow-hidden">
        {objectPositions.map((pos, index) => (
          <motion.div
            key={index}
            className="absolute"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: `translate(-50%, -50%) rotate(${pos.rotation}deg)`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: index * 0.1,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
          >
            <span className="text-6xl drop-shadow-lg">{emoji}</span>
          </motion.div>
        ))}
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
