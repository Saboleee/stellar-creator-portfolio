import { useCallback, useEffect, useRef, useState } from 'react';
import { FocusSession } from '../types';

export type FocusPhase = 'focus' | 'short-break' | 'long-break';

export const PHASE_DURATION: Record<FocusPhase, number> = {
  focus: 25 * 60,
  'short-break': 5 * 60,
  'long-break': 15 * 60,
};

interface UseFocusTimerReturn {
  phase: FocusPhase;
  timeLeft: number;
  isRunning: boolean;
  pomodoroCount: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setPhase: (phase: FocusPhase) => void;
}

export function useFocusTimer(
  onSessionComplete: (session: FocusSession) => void,
): UseFocusTimerReturn {
  const [phase, setPhaseState] = useState<FocusPhase>('focus');
  const [timeLeft, setTimeLeft] = useState(PHASE_DURATION.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  const phaseRef = useRef(phase);
  const pomodoroCountRef = useRef(pomodoroCount);
  phaseRef.current = phase;
  pomodoroCountRef.current = pomodoroCount;

  const sessionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isRunning) return;

    sessionStartRef.current = Date.now();

    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);

          const currentPhase = phaseRef.current;
          const count = pomodoroCountRef.current;

          const durationSeconds = PHASE_DURATION[currentPhase];
          const session: FocusSession = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            bountyId: null,
            phase: currentPhase,
            durationSeconds,
            completedAt: new Date().toISOString(),
          };
          onSessionComplete(session);

          // Advance phase
          let nextPhase: FocusPhase;
          let nextPomodoroCount = count;

          if (currentPhase === 'focus') {
            nextPomodoroCount = count + 1;
            nextPhase = nextPomodoroCount % 4 === 0 ? 'long-break' : 'short-break';
            setPomodoroCount(nextPomodoroCount);
            pomodoroCountRef.current = nextPomodoroCount;
          } else {
            nextPhase = 'focus';
          }

          setPhaseState(nextPhase);
          phaseRef.current = nextPhase;
          setIsRunning(false);
          return PHASE_DURATION[nextPhase];
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning, onSessionComplete]);

  const start = useCallback(() => {
    sessionStartRef.current = Date.now();
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(PHASE_DURATION[phaseRef.current]);
  }, []);

  const setPhase = useCallback((p: FocusPhase) => {
    setIsRunning(false);
    setPhaseState(p);
    phaseRef.current = p;
    setTimeLeft(PHASE_DURATION[p]);
  }, []);

  return { phase, timeLeft, isRunning, pomodoroCount, start, pause, reset, setPhase };
}
