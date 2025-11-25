import React, { useState, useEffect, useRef } from 'react';
import { Timer, Music, Play, Pause, RotateCcw, X, TrendingUp } from 'lucide-react';
import { CompetitionEvent, ClassTeam } from '../types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface SessionNavBarProps {
  // 날짜
  selectedDate: Date;
  onDateChange: (date: Date) => void;

  // 학급
  classes: ClassTeam[];
  selectedClassId: string;
  onClassChange: (classId: string) => void;

  // 종목
  events: CompetitionEvent[];
  selectedEventId: string;
  onEventChange: (eventId: string) => void;

  // 세션 정보
  sessionNumber: number;

  // 타이머 콜백 (선택적)
  onTimerComplete?: () => void;
}

export const SessionNavBar: React.FC<SessionNavBarProps> = ({
  selectedDate,
  onDateChange,
  classes,
  selectedClassId,
  onClassChange,
  events,
  selectedEventId,
  onEventChange,
  sessionNumber,
  onTimerComplete
}) => {
  // 타이머 상태
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
  const targetEndTimeRef = useRef<number | null>(null);
  const pausedRemainingRef = useRef<number | null>(null);

  // 음원 내 비프음 오프셋 (ms)
  const BEEP_OFFSET_MS = 1800;

  // iOS/iPadOS 감지
  const isIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );

  const IOS_AUDIO_OUTPUT_DELAY = 500;

  // 오디오 미리 로드
  useEffect(() => {
    audio30Ref.current = new Audio('/sounds/30sec.mp3');
    audio60Ref.current = new Audio('/sounds/60sec.mp3');
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

  const totalSeconds = minutes * 60 + seconds;

  const formatTime = (totalSecs: number): string => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 시간 조절 함수들
  const adjustTime = (delta: number) => {
    if (timerState === 'idle') {
      const newTotal = Math.max(0, Math.min(totalSeconds + delta, 5999));
      setMinutes(Math.floor(newTotal / 60));
      setSeconds(newTotal % 60);
    }
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

    const onPlaying = () => {
      audio.removeEventListener('playing', onPlaying);
      const totalDelay = BEEP_OFFSET_MS + (isIOS ? IOS_AUDIO_OUTPUT_DELAY : 0);

      readyTimeoutRef.current = setTimeout(() => {
        setTimerState('running');
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

    const onPlaying = () => {
      audio.removeEventListener('playing', onPlaying);
      const totalDelay = BEEP_OFFSET_MS + (isIOS ? IOS_AUDIO_OUTPUT_DELAY : 0);

      readyTimeoutRef.current = setTimeout(() => {
        setTimerState('running');
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
    if (targetEndTimeRef.current) {
      const remaining = Math.ceil((targetEndTimeRef.current - Date.now()) / 1000);
      pausedRemainingRef.current = Math.max(0, remaining);
    }
    setTimerState('paused');
    if (audio30Ref.current) audio30Ref.current.pause();
    if (audio60Ref.current) audio60Ref.current.pause();
    stopAudio();
    targetEndTimeRef.current = null;
  };

  // 타이머 재개
  const resumeTimer = () => {
    const remaining = pausedRemainingRef.current ?? remainingSeconds;
    targetEndTimeRef.current = Date.now() + (remaining * 1000);
    pausedRemainingRef.current = null;
    setTimerState('running');
  };

  // 타이머 리셋
  const resetTimer = () => {
    setTimerState('idle');
    setRemainingSeconds(totalSeconds);
    setIsFullscreen(false);
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
      if (targetEndTimeRef.current) {
        const remaining = Math.ceil((targetEndTimeRef.current - Date.now()) / 1000);
        pausedRemainingRef.current = Math.max(0, remaining);
      }
      setTimerState('paused');
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

  // remainingSeconds 동기화
  useEffect(() => {
    if (timerState === 'idle') {
      setRemainingSeconds(totalSeconds);
    }
  }, [totalSeconds, timerState]);

  // 카운트다운 로직
  useEffect(() => {
    if (timerState === 'running') {
      if (targetEndTimeRef.current === null) {
        targetEndTimeRef.current = Date.now() + (remainingSeconds * 1000);
      }

      intervalRef.current = setInterval(() => {
        if (targetEndTimeRef.current === null) return;

        const now = Date.now();
        const remaining = Math.ceil((targetEndTimeRef.current - now) / 1000);

        if (remaining <= 0) {
          setRemainingSeconds(0);
          setTimerState('finished');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          targetEndTimeRef.current = null;

          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }

          onTimerComplete?.();

          setTimeout(() => {
            setIsFullscreen(false);
          }, 2000);
        } else {
          setRemainingSeconds(remaining);
        }
      }, 50);
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
      {/* 컴팩트 네비게이션 바 */}
      {!isFullscreen && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 shadow-sm border border-green-200">
          {/* Desktop: 1줄, Mobile: 2줄 */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* 1줄: 날짜 | 학급 | 종목 | 세션 */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* 날짜 */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">날짜</span>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date: Date | null) => {
                    if (date) onDateChange(date);
                  }}
                  dateFormat="yyyy-MM-dd"
                  className="w-32 px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 cursor-pointer bg-white"
                  calendarClassName="shadow-lg"
                />
              </div>

              {/* 구분선 */}
              <div className="hidden sm:block w-px h-6 bg-slate-300" />

              {/* 학급 */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">학급</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => onClassChange(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                >
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              {/* 구분선 */}
              <div className="hidden sm:block w-px h-6 bg-slate-300" />

              {/* 종목 */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">종목</span>
                <select
                  value={selectedEventId}
                  onChange={(e) => onEventChange(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                >
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.name} ({event.defaultTimeLimit}초)
                    </option>
                  ))}
                </select>
              </div>

              {/* 세션 정보 */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-auto lg:ml-0">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">{sessionNumber}회차</span>
              </div>
            </div>

            {/* 구분선 (Desktop) */}
            <div className="hidden lg:block w-px h-8 bg-slate-300" />

            {/* 2줄: 타이머 컨트롤 */}
            <div className="flex items-center gap-2 lg:ml-auto">
              {/* 타이머 아이콘 */}
              <Timer className="w-4 h-4 text-green-600 flex-shrink-0" />

              {/* -10초 */}
              <button
                onClick={() => adjustTime(-10)}
                className="w-10 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 text-xs font-medium touch-manipulation disabled:opacity-50"
                disabled={timerState !== 'idle'}
              >
                -10초
              </button>

              {/* 시간 표시 */}
              <div className="text-lg font-black text-green-700 px-2 min-w-[52px] text-center">
                {formatTime(totalSeconds)}
              </div>

              {/* +10초 */}
              <button
                onClick={() => adjustTime(10)}
                className="w-10 h-7 flex items-center justify-center bg-green-100 hover:bg-green-200 text-green-700 rounded border border-green-300 text-xs font-medium touch-manipulation disabled:opacity-50"
                disabled={timerState !== 'idle'}
              >
                +10초
              </button>

              {/* 구분선 */}
              <div className="w-px h-6 bg-slate-300 mx-1" />

              {/* 30초 프리셋 */}
              <button
                onClick={handle30SecPreset}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm disabled:opacity-50 touch-manipulation"
                disabled={timerState === 'running'}
              >
                <Music className="w-3 h-3" />
                30초
              </button>

              {/* 60초 프리셋 */}
              <button
                onClick={handle60SecPreset}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm disabled:opacity-50 touch-manipulation"
                disabled={timerState === 'running'}
              >
                <Music className="w-3 h-3" />
                60초
              </button>
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
              timerState === 'finished' ? 'text-red-500 animate-pulse' : ''
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
                className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-white text-lg font-bold rounded-xl flex items-center gap-3 shadow-lg touch-manipulation"
                disabled={timerState === 'ready'}
              >
                <Pause className="w-6 h-6" />
                일시정지
              </button>
            )}

            {timerState === 'paused' && (
              <button
                onClick={resumeTimer}
                className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white text-lg font-bold rounded-xl flex items-center gap-3 shadow-lg touch-manipulation"
              >
                <Play className="w-6 h-6" />
                재개
              </button>
            )}

            <button
              onClick={resetTimer}
              className="px-8 py-4 bg-slate-600 hover:bg-slate-700 text-white text-lg font-bold rounded-xl flex items-center gap-3 shadow-lg touch-manipulation"
            >
              <RotateCcw className="w-6 h-6" />
              리셋
            </button>

            <button
              onClick={closeFullscreen}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-xl flex items-center gap-3 shadow-lg touch-manipulation"
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
