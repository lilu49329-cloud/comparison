import { useState } from "react";
import { CountingGame } from "./components/CountingGame";
import { Difficulty, GameMode } from "./types/game";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [mode, setMode] = useState<GameMode>("count");
  const [gameKey, setGameKey] = useState(0);

  const startNewGame = (newDifficulty: Difficulty, newMode: GameMode) => {
    setDifficulty(newDifficulty);
    setMode(newMode);
    setGameKey((prev) => prev + 1);
  };

  return (
    <div className="size-full min-h-screen bg-linear-to-br from-blue-100 via-purple-100 to-pink-100">
      {/* Game Mode Selector */}
      <div className="fixed top-4 right-4 z-50">
        <Card className="p-4 bg-white shadow-lg">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm text-gray-600 mb-2">Chế độ chơi:</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => startNewGame(difficulty, "quiz")}
                  variant={mode === "quiz" ? "default" : "outline"}
                  className="text-sm"
                >
                  Trắc nghiệm
                </Button>
                <Button
                  onClick={() => startNewGame(difficulty, "count")}
                  variant={mode === "count" ? "default" : "outline"}
                  className="text-sm"
                >
                  Đếm số
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Độ khó:</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => startNewGame("easy", mode)}
                  variant={difficulty === "easy" ? "default" : "outline"}
                  className="text-sm"
                >
                  Dễ (1-5)
                </Button>
                <Button
                  onClick={() => startNewGame("med", mode)}
                  variant={difficulty === "med" ? "default" : "outline"}
                  className="text-sm"
                >
                  TB (1-10)
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Game Component */}
      <CountingGame key={gameKey} difficulty={difficulty} mode={mode} />
    </div>
  );
}
