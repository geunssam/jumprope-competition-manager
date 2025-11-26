import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, Play, Pause, RotateCcw, X, Music, Calendar } from 'lucide-react';

interface CompetitionTimerProps {
  selectedDate?: string;
  onDateChange?: (date: string) => void;
  showDatePicker?: boolean;
}

// Web Audio API 기반 오디오 매니저 (iOS 호환)
class AudioManager {
  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private currentSource: AudioBufferSourceNode | null = null;
  private isUnlocked = false;
  private loadingPromises: Map<string, Promise<AudioBuffer>> = new Map();

  // AudioContext 초기화
  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // iOS에서 오디오 unlock (첫 사용자 상호작용에서 호출)
  async unlock(): Promise<void> {
    if (this.isUnlocked) return;

    const ctx = this.getContext();

    // suspended 상태면 resume
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // 무음 버퍼 재생으로 완전히 unlock
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);

    this.isUnlocked = true;
    console.log('🔓 Audio unlocked');
  }

  // 오디오 파일 로드 (캐싱)
  async load(url: string): Promise<AudioBuffer> {
    // 이미 로드됨
    if (this.audioBuffers.has(url)) {
      return this.audioBuffers.get(url)!;
    }

    // 로딩 중이면 기존 Promise 반환
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const loadPromise = (async () => {
      const ctx = this.getContext();
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(url, audioBuffer);
      this.loadingPromises.delete(url);
      console.log(`📦 Audio loaded: ${url}`);
      return audioBuffer;
    })();

    this.loadingPromises.set(url, loadPromise);
    return loadPromise;
  }

  // 오디오 재생 (Promise 반환 - 재생 시작 시점 감지 가능)
  async play(url: string): Promise<{ startTime: number }> {
    await this.unlock();

    const ctx = this.getContext();
    const buffer = await this.load(url);

    // 기존 재생 중지
    this.stop();

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const startTime = ctx.currentTime;
    source.start(0);
    this.currentSource = source;

    console.log(`▶️ Audio playing: ${url}`);
    return { startTime };
  }

  // 재생 중지
  stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (e) {
        // 이미 중지됨
      }
      this.currentSource = null;
      console.log('⏹️ Audio stopped');
    }
  }

  // 현재 컨텍스트 시간
  getCurrentTime(): number {
    return this.audioContext?.currentTime || 0;
  }
}

// 싱글톤 인스턴스
const audioManager = new AudioManager();

export const CompetitionTimer: React.FC<CompetitionTimerProps> = ({
  selectedDate,
  onDateChange,
  showDatePicker = true
}) => {
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(30);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30);
  const [timerState, setTimerState] = useState<'idle' | 'ready' | 'running' | 'paused' | 'finished'>('idle');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [audioReady, setAudioReady] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const readyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetEndTimeRef = useRef<number | null>(null);
  const pausedRemainingRef = useRef<number | null>(null);

  // 음원 내 비프음 오프셋 (ms) - 음원 파일 분석 결과
  const BEEP_OFFSET_MS = 1800;

  // iOS/iPadOS 감지
  const isIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );

  // iOS 추가 지연
  const IOS_AUDIO_OUTPUT_DELAY = isIOS ? 300 : 0;

  // 오디오 미리 로드 및 unlock
  useEffect(() => {
    const preloadAudio = async () => {
      try {
        await Promise.all([
          audioManager.load('/sounds/30sec.mp3'),
          audioManager.load('/sounds/60sec.mp3')
        ]);
        setAudioReady(true);
        console.log('✅ All audio preloaded');
      } catch (e) {
        console.error('Audio preload failed:', e);
      }
    };
    preloadAudio();

    return () => {
      audioManager.stop();
    };
  }, []);

  // 첫 터치/클릭에서 오디오 unlock
  useEffect(() => {
    const handleFirstInteraction = async () => {
      await audioManager.unlock();
      // 이벤트 리스너 제거
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('click', handleFirstInteraction);
    };

    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    document.addEventListener('click', handleFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('click', handleFirstInteraction);
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

  // 30초 음원 프리셋
  const handle30SecPreset = useCallback(async () => {
    setMinutes(0);
    setSeconds(30);
    setRemainingSeconds(30);
    setTimerState('ready');
    setIsFullscreen(true);

    try {
      // 먼저 unlock 보장
      await audioManager.unlock();

      // 오디오 재생
      await audioManager.play('/sounds/30sec.mp3');

      // 비프음 시점에 타이머 시작
      const totalDelay = BEEP_OFFSET_MS + IOS_AUDIO_OUTPUT_DELAY;

      readyTimeoutRef.current = setTimeout(() => {
        setTimerState('running');
        targetEndTimeRef.current = Date.now() + 30000;
      }, totalDelay);

    } catch (e) {
      console.error('30sec preset failed:', e);
      // 실패해도 타이머는 시작
      setTimerState('running');
      targetEndTimeRef.current = Date.now() + 30000;
    }
  }, [IOS_AUDIO_OUTPUT_DELAY]);

  // 60초 음원 프리셋
  const handle60SecPreset = useCallback(async () => {
    setMinutes(1);
    setSeconds(0);
    setRemainingSeconds(60);
    setTimerState('ready');
    setIsFullscreen(true);

    try {
      // 먼저 unlock 보장
      await audioManager.unlock();

      // 오디오 재생
      await audioManager.play('/sounds/60sec.mp3');

      // 비프음 시점에 타이머 시작
      const totalDelay = BEEP_OFFSET_MS + IOS_AUDIO_OUTPUT_DELAY;

      readyTimeoutRef.current = setTimeout(() => {
        setTimerState('running');
        targetEndTimeRef.current = Date.now() + 60000;
      }, totalDelay);

    } catch (e) {
      console.error('60sec preset failed:', e);
      // 실패해도 타이머는 시작
      setTimerState('running');
      targetEndTimeRef.current = Date.now() + 60000;
    }
  }, [IOS_AUDIO_OUTPUT_DELAY]);

  // 타이머 일시정지
  const pauseTimer = () => {
    if (targetEndTimeRef.current) {
      const remaining = Math.ceil((targetEndTimeRef.current - Date.now()) / 1000);
      pausedRemainingRef.current = Math.max(0, remaining);
    }
    setTimerState('paused');
    audioManager.stop();
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
    audioManager.stop();
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
      audioManager.stop();
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
      {/* 컴팩트 모드 */}
      {!isFullscreen && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 shadow-sm border border-blue-100">
          <div className={`${showDatePicker ? 'grid grid-cols-10 gap-4' : 'flex'} items-center`}>
            {/* 날짜 선택기 영역 */}
            {showDatePicker && (
              <div className="col-span-2 flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  경기 날짜
                </label>
                <input
                  type="date"
                  value={selectedDate || ''}
                  onChange={(e) => onDateChange?.(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>
            )}

            {/* 타이머 영역 */}
            <div className={`${showDatePicker ? 'col-span-8' : 'flex-1'} flex items-center justify-between gap-4`}>
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
                  disabled={timerState === 'running' || !audioReady}
                >
                  <Music className="w-3 h-3" />
                  30초
                </button>
                <button
                  onClick={handle60SecPreset}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-md disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:bg-indigo-800"
                  disabled={timerState === 'running' || !audioReady}
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
