import { useState, useEffect, useCallback, useRef } from "react";
import { Challenge } from "@/game/gameData";
import { motion, AnimatePresence } from "framer-motion";
import {
  playChallengeWinSound,
  playChallengeLoseSound,
  playButtonClick,
  playAttackStart,
} from "@/game/sounds";

interface ChallengeModalProps {
  challenge: Challenge;
  onComplete: (result: {
    won: boolean;
    responseTimeMs: number;
    selectedAnswer: number | null;
  }) => void;
  onClose: () => void;
}

export function ChallengeModal({
  challenge,
  onComplete,
  onClose,
}: ChallengeModalProps) {
  const [timeLeft, setTimeLeft] = useState(challenge.timeLimit);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<"win" | "lose" | null>(null);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    playAttackStart();
  }, []);

  useEffect(() => {
    if (result) return;
    if (timeLeft <= 0) {
      setResponseTimeMs(
        Math.min(Date.now() - startedAt.current, challenge.timeLimit * 1000),
      );
      setResult("lose");
      playChallengeLoseSound();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, result, challenge.timeLimit]);

  const handleSelect = useCallback(
    (idx: number) => {
      if (selected !== null || result) return;
      setSelected(idx);
      setResponseTimeMs(
        Math.min(Date.now() - startedAt.current, challenge.timeLimit * 1000),
      );
      playButtonClick();
      const won = idx === challenge.correctAnswer;
      setResult(won ? "win" : "lose");
      if (won) playChallengeWinSound();
      else playChallengeLoseSound();
    },
    [selected, result, challenge.correctAnswer, challenge.timeLimit],
  );

  const categoryEmoji =
    {
      Science: "🧪",
      History: "📜",
      Geography: "🗺️",
      Technology: "💻",
      Logic: "🔢",
      "Pop culture": "🎬",
      Math: "➗",
      Riddle: "🗝️",
      Pattern: "🧩",
      "Quick-thinking": "⚡",
      "General Knowledge": "🧠",
    }[challenge.category] ?? "🧠";
  const categoryLabel = challenge.category ?? "Trivia";

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={result ? onClose : undefined}
      />
      <motion.div
        className="relative w-full max-w-sm bg-surface rounded-2xl border border-border p-5 shadow-raised"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{categoryEmoji}</span>
            <span className="font-display text-sm text-muted-foreground">
              {categoryLabel}
            </span>
          </div>
          <div
            className={`font-display text-lg font-bold ${timeLeft <= 5 ? "text-accent" : "text-gold"}`}
          >
            {timeLeft}s
          </div>
        </div>

        {/* Timer bar */}
        <div className="w-full h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-gold rounded-full"
            initial={{ width: "100%" }}
            animate={{ width: `${(timeLeft / challenge.timeLimit) * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>

        {/* Question */}
        <p className="font-display text-foreground text-lg font-bold mb-5 leading-snug">
          {challenge.question}
        </p>

        {/* Options */}
        <div className="space-y-2.5">
          {challenge.options.map((opt, idx) => {
            let optClass = "bg-muted border-border text-foreground";
            if (result && idx === challenge.correctAnswer) {
              optClass = "bg-cedar/20 border-cedar text-cedar";
            } else if (
              result &&
              selected === idx &&
              idx !== challenge.correctAnswer
            ) {
              optClass = "bg-accent/20 border-accent text-accent";
            } else if (selected === idx) {
              optClass = "bg-gold/20 border-gold text-gold";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={result !== null}
                className={`w-full text-left px-4 py-3 rounded-xl border font-body text-sm transition-all active:scale-[0.98] ${optClass}`}
              >
                <span className="font-bold mr-2 text-muted-foreground">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              className="mt-5 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {result === "win" ? (
                <div>
                  <div className="text-3xl mb-1">🎉</div>
                  <p className="font-display text-cedar font-bold text-lg">
                    Correct!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    +🪙 {challenge.reward}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {challenge.explanation}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-3xl mb-1">😤</div>
                  <p className="font-display text-accent font-bold text-lg">
                    Wrong!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Answer: {challenge.options[challenge.correctAnswer]}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {challenge.explanation}
                  </p>
                </div>
              )}
              <button
                onClick={() => {
                  const ms =
                    responseTimeMs ??
                    Math.min(
                      Date.now() - startedAt.current,
                      challenge.timeLimit * 1000,
                    );
                  onComplete({
                    won: result === "win",
                    responseTimeMs: ms,
                    selectedAnswer: selected,
                  });
                  onClose();
                }}
                className="mt-3 px-6 py-2 rounded-lg bg-gradient-gold text-primary-foreground font-display font-bold text-sm active:scale-95 transition-transform"
              >
                Continue
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
