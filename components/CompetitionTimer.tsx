import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, X, Music, Calendar } from 'lucide-react';

interface CompetitionTimerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const CompetitionTimer: React.FC<CompetitionTimerProps> = ({
  selectedDate,
  onDateChange
}) => {
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(30);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30);
  const [timerState, setTimerState] = useState<'idle' | 'ready' | 'running' | 'paused' | 'finished'>('idle');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audio30Ref = useRef<HTMLAudioElement | null>(null);
  const audio60Ref = useRef<HTMLAudioElement | null>(null);
  const readyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 종료 시간 기준으로 변경 (더 정확한 카운트다운)
  const targetEndTimeRef = useRef<number | null>(null);
  // 일시정지 시 남은 시간 저장용
  const pausedRemainingRef = useRef<number | null>(null);

  // 음원 내 비프음 오프셋 (ms) - 음원 파일 분석 결과
  const BEEP_OFFSET_MS = 1800; // 음원 시작 후 1.8초에 첫 비프음

  // iOS/iPadOS 감지 (iPadOS는 Mac처럼 보이지만 터치 지원)
  const isIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );

  // iOS 추가 지연 (onplaying 이벤트 → 실제 스피커 출력 사이 지연)
  const IOS_AUDIO_OUTPUT_DELAY = 500; // ms

  // 오디오 미리 로드
  useEffect(() => {
    audio30Ref.current = new Audio('/sounds/30sec.mp3');
    audio60Ref.current = new Audio('/sounds/60sec.mp3');

    // 오디오 프리로드
    audio30Ref.current.preload = 'auto';
    audio60Ref.current.preload = 'auto';

    return () => {
      if (audio30Ref.current) {
        audio30Ref.current.pause();
        audio30Ref.current = null;
      }
      if (audio60Ref.current) {
        audio60Ref.current.pause();
        audio60Ref.current = null;
      }
    };
  }, []);

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
    setTimerState('ready');
    setIsFullscreen(true);

    const audio = audio30Ref.current;
    if (!audio) return;

    audio.currentTime = 0;

    // 실제 오디오 재생 시작 시점 감지 (기기별 지연 자동 처리)
    const onPlaying = () => {
      audio.removeEventListener('playing', onPlaying);

      // 비프음 시점에 타이머 시작 (기본 오프셋 + iOS 추가 지연)
      const totalDelay = BEEP_OFFSET_MS + (isIOS ? IOS_AUDIO_OUTPUT_DELAY : 0);

      readyTimeoutRef.current = setTimeout(() => {
        setTimerState('running');
        // 종료 시간 설정: 현재 시간 + 30초
        targetEndTimeRef.current = Date.now() + 30000;
      }, totalDelay);
    };

    audio.addEventListener('playing', onPlaying);
    audio.play().catch(e => {
      console.log('Audio play failed:', e);
      audio.removeEventListener('playing', onPlaying);
    });
  };

  // 60초 음원 프리셋
  const handle60SecPreset = () => {
    setMinutes(1);
    setSeconds(0);
    setRemainingSeconds(60);
    setTimerState('ready');
    setIsFullscreen(true);

    const audio = audio60Ref.current;
    if (!audio) return;

    audio.currentTime = 0;

    // 실제 오디오 재생 시작 시점 감지 (기기별 지연 자동 처리)
    const onPlaying = () => {
      audio.removeEventListener('playing', onPlaying);

      // 비프음 시점에 타이머 시작 (기본 오프셋 + iOS 추가 지연)
      const totalDelay = BEEP_OFFSET_MS + (isIOS ? IOS_AUDIO_OUTPUT_DELAY : 0);

      readyTimeoutRef.current = setTimeout(() => {
        setTimerState('running');
        // 종료 시간 설정: 현재 시간 + 60초
        targetEndTimeRef.current = Date.now() + 60000;
      }, totalDelay);
    };

    audio.addEventListener('playing', onPlaying);
    audio.play().catch(e => {
      console.log('Audio play failed:', e);
      audio.removeEventListener('playing', onPlaying);
    });
  };

  // 타이머 일시정지
  const pauseTimer = () => {
    // 현재 남은 시간 계산 및 저장
    if (targetEndTimeRef.current) {
      const remaining = Math.ceil((targetEndTimeRef.current - Date.now()) / 1000);
      pausedRemainingRef.current = Math.max(0, remaining);
    }
    setTimerState('paused');
    // 미리 로드된 오디오들도 정지
    if (audio30Ref.current) audio30Ref.current.pause();
    if (audio60Ref.current) audio60Ref.current.pause();
    stopAudio();
    targetEndTimeRef.current = null;
  };

  // 타이머 재개
  const resumeTimer = () => {
    // 저장된 남은 시간으로 새 종료 시간 설정
    const remaining = pausedRemainingRef.current ?? remainingSeconds;
    targetEndTimeRef.current = Date.now() + (remaining * 1000);
    pausedRemainingRef.current = null;
    setTimerState('running');
    // 음원은 재개하지 않음 (싱크 어려움)
  };

  // 타이머 리셋
  const resetTimer = () => {
    setTimerState('idle');
    setRemainingSeconds(totalSeconds);
    setIsFullscreen(false);
    // 미리 로드된 오디오들도 정지
    if (audio30Ref.current) {
      audio30Ref.current.pause();
      audio30Ref.current.currentTime = 0;
    }
    if (audio60Ref.current) {
      audio60Ref.current.pause();
      audio60Ref.current.currentTime = 0;
    }
    stopAudio();
    targetEndTimeRef.current = null;
    pausedRemainingRef.current = null;
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
      // 현재 남은 시간 저장
      if (targetEndTimeRef.current) {
        const remaining = Math.ceil((targetEndTimeRef.current - Date.now()) / 1000);
        pausedRemainingRef.current = Math.max(0, remaining);
      }
      setTimerState('paused');
      // 미리 로드된 오디오들도 정지
      if (audio30Ref.current) audio30Ref.current.pause();
      if (audio60Ref.current) audio60Ref.current.pause();
      stopAudio();
      targetEndTimeRef.current = null;
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

  // 카운트다운 로직 (종료 시간 기준 + Math.ceil로 정확한 1초 간격)
  useEffect(() => {
    if (timerState === 'running') {
      // 음원 프리셋에서 이미 targetEndTime 설정됨
      // 수동 재개인 경우 resumeTimer에서 설정됨
      // 그 외의 경우 (직접 시작) - 현재 remainingSeconds 기준으로 설정
      if (targetEndTimeRef.current === null) {
        targetEndTimeRef.current = Date.now() + (remainingSeconds * 1000);
      }

      intervalRef.current = setInterval(() => {
        if (targetEndTimeRef.current === null) return;

        const now = Date.now();
        // Math.ceil 사용: 29001ms 남음 → 30초 표시, 29000ms 남음 → 29초 표시
        // 이렇게 하면 "30"이 정확히 1초간 표시된 후 "29"로 전환
        const remaining = Math.ceil((targetEndTimeRef.current - now) / 1000);

        if (remaining <= 0) {
          // 타이머 종료
          setRemainingSeconds(0);
          setTimerState('finished');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          targetEndTimeRef.current = null;

          // 진동 (모바일)
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }

          // 2초 후 자동으로 컴팩트 모드로 복귀
          setTimeout(() => {
            setIsFullscreen(false);
          }, 2000);
        } else {
          setRemainingSeconds(remaining);
        }
      }, 50); // 50ms마다 체크하여 더 정확한 전환
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
  }, [timerState]); // remainingSeconds 의존성 제거 - interval 재생성 방지

  return (
    <>
      {/* 컴팩트 모드 */}
      {!isFullscreen && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 shadow-sm border border-blue-100">
          <div className="grid grid-cols-10 gap-4 items-center">
            {/* 날짜 선택기 영역 - 20% (2 cols) */}
            <div className="col-span-2 flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                경기 날짜
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </div>

            {/* 타이머 영역 - 80% (8 cols) */}
            <div className="col-span-8 flex items-center justify-between gap-4">
              {/* 타이머 아이콘과 제목 */}
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900">타이머</h3>
              </div>

            {/* 시간 조절 영역 */}
            <div className="flex items-center gap-1.5">
              {/* -1분 버튼 */}
              <button
                onClick={decreaseMinute}
                className="w-10 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-colors text-xs font-medium touch-manipulation active:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={timerState !== 'idle'}
              >
                -1분
              </button>
              {/* -10초 버튼 */}
              <button
                onClick={decreaseSecond}
                className="w-10 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-colors text-xs font-medium touch-manipulation active:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={timerState !== 'idle'}
              >
                -10초
              </button>
              {/* -1초 버튼 */}
              <button
                onClick={() => {
                  if (timerState === 'idle') {
                    const total = minutes * 60 + seconds;
                    if (total > 0) {
                      const newTotal = total - 1;
                      setMinutes(Math.floor(newTotal / 60));
                      setSeconds(newTotal % 60);
                    }
                  }
                }}
                className="w-10 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-colors text-xs font-medium touch-manipulation active:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={timerState !== 'idle'}
              >
                -1초
              </button>

              {/* 시간 디스플레이 */}
              <div className="text-xl font-black text-indigo-700 px-2">
                {formatTime(totalSeconds)}
              </div>

              {/* +1초 버튼 */}
              <button
                onClick={() => {
                  if (timerState === 'idle') {
                    const total = minutes * 60 + seconds;
                    const newTotal = total + 1;
                    setMinutes(Math.floor(newTotal / 60));
                    setSeconds(newTotal % 60);
                  }
                }}
                className="w-10 h-7 flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded border border-indigo-300 transition-colors text-xs font-medium touch-manipulation active:bg-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={timerState !== 'idle'}
              >
                +1초
              </button>
              {/* +10초 버튼 */}
              <button
                onClick={increaseSecond}
                className="w-10 h-7 flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded border border-indigo-300 transition-colors text-xs font-medium touch-manipulation active:bg-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={timerState !== 'idle'}
              >
                +10초
              </button>
              {/* +1분 버튼 */}
              <button
                onClick={increaseMinute}
                className="w-10 h-7 flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded border border-indigo-300 transition-colors text-xs font-medium touch-manipulation active:bg-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={timerState !== 'idle'}
              >
                +1분
              </button>
            </div>

            {/* 음원 프리셋 버튼들 */}
            <div className="flex gap-2">
              <button
                onClick={handle30SecPreset}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-md disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:bg-indigo-800"
                disabled={timerState === 'running'}
              >
                <Music className="w-3 h-3" />
                30초
              </button>
              <button
                onClick={handle60SecPreset}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-md disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:bg-indigo-800"
                disabled={timerState === 'running'}
              >
                <Music className="w-3 h-3" />
                60초
              </button>
            </div>
            </div>
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
