import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, X, Music } from 'lucide-react';

export const CompetitionTimer: React.FC = () => {
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(30);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30);
  const [timerState, setTimerState] = useState<'idle' | 'ready' | 'running' | 'paused' | 'finished'>('idle');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const readyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 총 초 계산
  const totalSeconds = minutes * 60 + seconds;

  // 시간 포맷팅 함수 (MM:SS)
  const formatTime = (totalSecs: number): string => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 분 증가/감소
  const increaseMinute = () => {
    if (timerState === 'idle') {
      setMinutes(prev => Math.min(prev + 1, 99));
    }
  };

  const decreaseMinute = () => {
    if (timerState === 'idle') {
      setMinutes(prev => Math.max(prev - 1, 0));
    }
  };

  // 초 증가/감소
  const increaseSecond = () => {
    if (timerState === 'idle') {
      setSeconds(prev => {
        const newVal = prev + 10;
        if (newVal >= 60) {
          setMinutes(m => Math.min(m + 1, 99));
          return newVal - 60;
        }
        return newVal;
      });
    }
  };

  const decreaseSecond = () => {
    if (timerState === 'idle') {
      setSeconds(prev => {
        const newVal = prev - 10;
        if (newVal < 0 && minutes > 0) {
          setMinutes(m => m - 1);
          return 60 + newVal;
        }
        return Math.max(newVal, 0);
      });
    }
  };

  // 분 직접 입력
  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (timerState === 'idle') {
      const val = parseInt(e.target.value) || 0;
      setMinutes(Math.min(Math.max(val, 0), 99));
    }
  };

  // 초 직접 입력
  const handleSecondChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (timerState === 'idle') {
      const val = parseInt(e.target.value) || 0;
      setSeconds(Math.min(Math.max(val, 0), 59));
    }
  };

  // 음원 재생
  const playAudio = (audioPath: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    audioRef.current = new Audio(audioPath);
    audioRef.current.play().catch(e => console.log('Audio play failed:', e));
  };

  // 음원 정지
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // 30초 음원 프리셋
  const handle30SecPreset = () => {
    setMinutes(0);
    setSeconds(30);
    setRemainingSeconds(30);
    playAudio('/sounds/30sec.mp3');
    setTimerState('ready');
    setIsFullscreen(true);

    // 2초 후 타이머 시작
    readyTimeoutRef.current = setTimeout(() => {
      setTimerState('running');
    }, 2000);
  };

  // 60초 음원 프리셋
  const handle60SecPreset = () => {
    setMinutes(1);
    setSeconds(0);
    setRemainingSeconds(60);
    playAudio('/sounds/60sec.mp3');
    setTimerState('ready');
    setIsFullscreen(true);

    // 2초 후 타이머 시작
    readyTimeoutRef.current = setTimeout(() => {
      setTimerState('running');
    }, 2000);
  };

  // 타이머 일시정지
  const pauseTimer = () => {
    setTimerState('paused');
    stopAudio(); // 음원도 정지
  };

  // 타이머 재개
  const resumeTimer = () => {
    setTimerState('running');
    // 음원은 재개하지 않음 (싱크 어려움)
  };

  // 타이머 리셋
  const resetTimer = () => {
    setTimerState('idle');
    setRemainingSeconds(totalSeconds);
    setIsFullscreen(false);
    stopAudio();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
  };

  // 전체화면 닫기
  const closeFullscreen = () => {
    setIsFullscreen(false);
    if (timerState === 'running' || timerState === 'ready') {
      setTimerState('paused');
      stopAudio();
    }
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
  };

  // remainingSeconds가 totalSeconds와 동기화
  useEffect(() => {
    if (timerState === 'idle') {
      setRemainingSeconds(totalSeconds);
    }
  }, [totalSeconds, timerState]);

  // 카운트다운 로직
  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            // 타이머 종료
            setTimerState('finished');
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }

            // 진동 (모바일)
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }

            // 2초 후 자동으로 컴팩트 모드로 복귀
            setTimeout(() => {
              setIsFullscreen(false);
            }, 2000);

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState]);

  return (
    <>
      {/* 컴팩트 모드 */}
      {!isFullscreen && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 shadow-sm border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">타이머</h3>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            {/* 분 컨트롤 */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600 w-8">분</label>
              <button
                onClick={decreaseMinute}
                className="w-10 h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors text-sm font-medium touch-manipulation active:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={timerState !== 'idle'}
              >
                -1
              </button>
              <input
                type="number"
                value={minutes.toString().padStart(2, '0')}
                onChange={handleMinuteChange}
                className="w-16 h-12 text-center text-lg font-bold border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white touch-manipulation"
                disabled={timerState !== 'idle'}
                min="0"
                max="99"
                inputMode="numeric"
              />
              <button
                onClick={increaseMinute}
                className="w-10 h-12 flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg border border-indigo-300 transition-colors text-sm font-medium touch-manipulation active:bg-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={timerState !== 'idle'}
              >
                +1
              </button>
            </div>

            {/* 초 컨트롤 */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600 w-8">초</label>
              <button
                onClick={decreaseSecond}
                className="w-10 h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors text-xs font-medium touch-manipulation active:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={timerState !== 'idle'}
              >
                -10
              </button>
              <input
                type="number"
                value={seconds.toString().padStart(2, '0')}
                onChange={handleSecondChange}
                className="w-16 h-12 text-center text-lg font-bold border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white touch-manipulation"
                disabled={timerState !== 'idle'}
                min="0"
                max="59"
                inputMode="numeric"
              />
              <button
                onClick={increaseSecond}
                className="w-10 h-12 flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg border border-indigo-300 transition-colors text-xs font-medium touch-manipulation active:bg-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={timerState !== 'idle'}
              >
                +10
              </button>
            </div>

            {/* 음원 프리셋 버튼들 */}
            <div className="flex gap-3 ml-auto">
              <button
                onClick={handle30SecPreset}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:bg-indigo-800"
                disabled={timerState === 'running'}
              >
                <Music className="w-4 h-4" />
                30초 음원
              </button>
              <button
                onClick={handle60SecPreset}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:bg-indigo-800"
                disabled={timerState === 'running'}
              >
                <Music className="w-4 h-4" />
                60초 음원
              </button>
            </div>

            {/* 리셋 버튼 (paused 상태에서만) */}
            {timerState === 'paused' && (
              <button
                onClick={resetTimer}
                className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 touch-manipulation"
              >
                <RotateCcw className="w-4 h-4" />
                리셋
              </button>
            )}
          </div>
        </div>
      )}

      {/* 전체화면 모드 */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center">
          {/* 타이머 디스플레이 */}
          <div
            className={`text-white font-black transition-all ${
              timerState === 'finished'
                ? 'text-red-500 animate-pulse'
                : ''
            }`}
            style={{ fontSize: '20rem', lineHeight: '1' }}
          >
            {formatTime(remainingSeconds)}
          </div>

          {/* 상태 텍스트 */}
          <div className="mt-8 text-white/60 text-xl font-medium">
            {timerState === 'ready' && '준비...'}
            {timerState === 'running' && '진행 중'}
            {timerState === 'paused' && '일시정지'}
            {timerState === 'finished' && '종료!'}
          </div>

          {/* 컨트롤 버튼들 */}
          <div className="mt-16 flex gap-4">
            {(timerState === 'running' || timerState === 'ready') && (
              <button
                onClick={pauseTimer}
                className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-white text-lg font-bold rounded-xl transition-colors flex items-center gap-3 shadow-lg touch-manipulation active:bg-yellow-700"
                disabled={timerState === 'ready'}
              >
                <Pause className="w-6 h-6" />
                일시정지
              </button>
            )}

            {timerState === 'paused' && (
              <button
                onClick={resumeTimer}
                className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white text-lg font-bold rounded-xl transition-colors flex items-center gap-3 shadow-lg touch-manipulation active:bg-green-700"
              >
                <Play className="w-6 h-6" />
                재개
              </button>
            )}

            <button
              onClick={resetTimer}
              className="px-8 py-4 bg-slate-600 hover:bg-slate-700 text-white text-lg font-bold rounded-xl transition-colors flex items-center gap-3 shadow-lg touch-manipulation active:bg-slate-800"
            >
              <RotateCcw className="w-6 h-6" />
              리셋
            </button>

            <button
              onClick={closeFullscreen}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-xl transition-colors flex items-center gap-3 shadow-lg touch-manipulation active:bg-red-800"
            >
              <X className="w-6 h-6" />
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
};
