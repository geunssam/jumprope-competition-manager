# 줄넘기 대회 매니저 - 전체화면 + PWA 구현 계획

## 🎯 목표

1. **전체화면 기능**: 점수 입력 서브탭에서 진정한 브라우저 전체화면 구현
2. **PWA 변환**: 데스크톱/태블릿에서 앱으로 설치 가능하도록 변환

## ⚠️ 핵심 원칙

**기존 기능과 UI는 절대 변경하지 않음**
- 기존 컴포넌트의 레이아웃, 스타일, 색상, 위치 변경 금지
- 기존 기능의 동작 방식 수정 금지
- 오직 **새로운 기능 추가**만 허용
- 사용자 경험에 영향을 주지 않는 방식으로만 작업

---

## 📊 현재 상태

### 전체화면 기능
- ✅ CSS 기반 부분 전체화면 구현됨 (CompetitionTimer)
- ❌ 브라우저 Fullscreen API 미사용 (주소창/탭 여전히 표시)
- ❌ ESC 키 미지원
- ❌ 화면 회전 잠금 없음

### PWA 준비도: 25%
- ✅ HTTPS 환경 (Firebase + Netlify)
- ✅ 반응형 디자인
- ✅ localStorage 캐싱 시스템
- ❌ manifest.json 없음
- ❌ Service Worker 없음
- ❌ 앱 아이콘 없음
- ⚠️ Firebase 오프라인 지원 미설정

---

## 🛠️ 구현 계획

---

## **PART A: 전체화면 기능** (2-3시간)

### 수정 대상 파일
**단 1개 파일만 수정**: `components/CompetitionTimer.tsx`

### A-1. 새로운 Import 추가

```typescript
import { Maximize2, Minimize2 } from 'lucide-react';
```

### A-2. 새로운 State 및 Ref 추가

```typescript
// 기존 코드에 추가
const fullscreenContainerRef = useRef<HTMLDivElement>(null);
const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
```

### A-3. 전체화면 함수 추가

```typescript
// 브라우저 전체화면 진입
const enterBrowserFullscreen = async () => {
  if (fullscreenContainerRef.current && !document.fullscreenElement) {
    try {
      await fullscreenContainerRef.current.requestFullscreen();
      setIsBrowserFullscreen(true);
      await lockScreenOrientation(); // 화면 회전 잠금
    } catch (err) {
      console.error('전체화면 진입 실패:', err);
    }
  }
};

// 브라우저 전체화면 종료
const exitBrowserFullscreen = async () => {
  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen();
      setIsBrowserFullscreen(false);
      unlockScreenOrientation(); // 회전 잠금 해제
    } catch (err) {
      console.error('전체화면 종료 실패:', err);
    }
  }
};

// 전체화면 토글
const toggleBrowserFullscreen = () => {
  if (isBrowserFullscreen) {
    exitBrowserFullscreen();
  } else {
    enterBrowserFullscreen();
  }
};
```

### A-4. 화면 회전 잠금 함수 추가 (모바일/태블릿)

```typescript
// 화면 회전 잠금 (가로 모드)
const lockScreenOrientation = async () => {
  try {
    if (screen.orientation?.lock) {
      await screen.orientation.lock('landscape');
      console.log('화면 회전 잠금 활성화 (가로 모드)');
    }
  } catch (err) {
    console.warn('화면 회전 잠금 실패 (미지원 환경):', err);
  }
};

// 화면 회전 잠금 해제
const unlockScreenOrientation = () => {
  try {
    if (screen.orientation?.unlock) {
      screen.orientation.unlock();
      console.log('화면 회전 잠금 해제');
    }
  } catch (err) {
    console.warn('화면 회전 잠금 해제 실패:', err);
  }
};
```

### A-5. ESC 키 지원 추가

```typescript
// fullscreenchange 이벤트 리스너 추가
useEffect(() => {
  const handleFullscreenChange = () => {
    const isCurrentlyFullscreen = !!document.fullscreenElement;
    setIsBrowserFullscreen(isCurrentlyFullscreen);

    // ESC로 전체화면 종료 시 CSS 전체화면도 함께 종료
    if (!isCurrentlyFullscreen && isFullscreen) {
      setIsFullscreen(false);
      if (isRunning) {
        setIsRunning(false); // 타이머 일시정지
      }
    }
  };

  document.addEventListener('fullscreenchange', handleFullscreenChange);
  return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
}, [isFullscreen, isRunning]);
```

### A-6. UI 버튼 추가

**위치**: 음원 프리셋 버튼(30초/60초) 그룹 옆

```typescript
{/* 전체화면 버튼 - 기존 버튼 그룹 옆에 추가 */}
<button
  onClick={toggleBrowserFullscreen}
  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-md touch-manipulation active:bg-purple-800"
  aria-label="전체화면 모드 전환"
  title="전체화면 (F11 또는 클릭)"
>
  <Maximize2 className="w-4 h-4" />
  <span>전체화면</span>
</button>
```

**전체화면 모드 종료 버튼 텍스트만 수정**:
```typescript
{/* 기존 닫기 버튼의 텍스트만 수정 */}
<button
  onClick={() => {
    exitBrowserFullscreen();
    setIsFullscreen(false);
  }}
  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-base font-bold rounded-xl shadow-2xl transition-all hover:scale-105"
  aria-label="전체화면 종료"
>
  <Minimize2 className="w-5 h-5" />
  <span>전체화면 종료 (ESC)</span>
</button>
```

### A-7. 컨테이너에 ref 추가

```typescript
// 전체화면 컨테이너에 ref 추가 (기존 div에 ref만 추가)
<div ref={fullscreenContainerRef} className="기존클래스들...">
  {/* 기존 내용 */}
</div>
```

---

## **PART B: PWA 변환** (6-9시간)

### B-1. PWA 기본 설정 (2-3시간)

#### 1) vite-plugin-pwa 설치

```bash
npm install -D vite-plugin-pwa
```

#### 2) 앱 아이콘 제작

**필요한 크기**: 72x72, 96x96, 128x128, 192x192, 256x256, 512x512, 512x512(maskable)

**저장 위치**: `public/icons/`

```
public/
├── icons/          # 🆕 신규 폴더
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-192.png
│   ├── icon-256.png
│   ├── icon-512.png
│   └── icon-maskable-512.png
└── sounds/         # 기존
    ├── 30sec.mp3
    └── 60sec.mp3
```

**디자인 가이드**:
- 색상: Indigo 계열 (#4f46e5)
- 심볼: 줄넘기 🦘 + 숫자/트로피
- 단순하고 명확한 실루엣

#### 3) vite.config.ts 수정

**파일**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['sounds/*.mp3', 'icons/*.png'],

      manifest: {
        name: '줄넘기 대회 매니저',
        short_name: '줄넘기',
        description: '학년별 줄넘기 대회 점수 기록 및 관리 시스템',
        start_url: '/',
        display: 'standalone',
        orientation: 'landscape-primary',
        theme_color: '#4f46e5',
        background_color: '#f8fafc',

        icons: [
          {
            src: '/icons/icon-72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/icons/icon-96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/icons/icon-128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-256.png',
            sizes: '256x256',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,mp3,png,svg,ico}'],

        runtimeCaching: [
          // Tailwind CSS CDN
          {
            urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tailwind-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1년
              }
            }
          },

          // Firebase API
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-cache',
              networkTimeoutSeconds: 3
            }
          },

          // 소리 파일
          {
            urlPattern: /\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30일
              }
            }
          }
        ]
      },

      devOptions: {
        enabled: true // 개발 중에도 PWA 테스트 가능
      }
    })
  ]
});
```

#### 4) index.html에 PWA meta 태그 추가

**파일**: `index.html`

**`<head>` 안에 추가**:

```html
<!-- PWA 메타 태그 -->
<meta name="theme-color" content="#4f46e5">
<meta name="description" content="학년별 줄넘기 대회 점수 기록 및 관리 시스템">

<!-- iOS Safari -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="줄넘기">
<link rel="apple-touch-icon" href="/icons/icon-192.png">

<!-- Android Chrome -->
<link rel="manifest" href="/manifest.webmanifest">
```

### B-2. Firebase 오프라인 지원 (1-2시간)

**파일**: `lib/firebase.ts`

**기존 코드 뒤에 추가**:

```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore';

// 기존 Firebase 초기화 코드...
const db = getFirestore(app);

// 🆕 Firestore 오프라인 지원 활성화
enableIndexedDbPersistence(db)
  .then(() => {
    console.log('✅ Firestore 오프라인 지원 활성화');
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ 여러 탭에서 동시 접근 - 오프라인 지원 제한됨');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ 브라우저가 오프라인을 지원하지 않음');
    } else {
      console.error('❌ 오프라인 지원 활성화 실패:', err);
    }
  });

export { auth, db };
```

### B-3. 오프라인 폴백 페이지 생성 (30분)

**새 파일**: `public/offline.html`

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>오프라인 - 줄넘기 대회 매니저</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
      max-width: 500px;
    }
    .icon {
      font-size: 5rem;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    p {
      font-size: 1.1rem;
      line-height: 1.6;
      opacity: 0.9;
    }
    .retry-btn {
      margin-top: 2rem;
      padding: 1rem 2rem;
      font-size: 1.1rem;
      font-weight: bold;
      background: white;
      color: #667eea;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .retry-btn:hover {
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🦘📶</div>
    <h1>인터넷 연결이 끊겼어요</h1>
    <p>
      줄넘기 대회 매니저는 인터넷 연결이 필요합니다.<br>
      연결이 복구되면 자동으로 동기화됩니다.
    </p>
    <p style="font-size: 0.9rem; margin-top: 1.5rem;">
      💡 이전에 본 기록은 캐시에서 계속 확인할 수 있어요.
    </p>
    <button class="retry-btn" onclick="window.location.reload()">
      다시 시도
    </button>
  </div>
</body>
</html>
```

### B-4. 설치 프롬프트 추가 (선택, 1-2시간)

**새 파일**: `components/PWAInstallPrompt.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ PWA 설치됨');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-white rounded-2xl shadow-2xl p-6 border-2 border-indigo-100 z-50 animate-slide-up">
      <button
        onClick={() => setShowPrompt(false)}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">🦘</span>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            앱으로 설치하기
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            홈 화면에 추가하고 더 빠르게 접속하세요!
          </p>

          <button
            onClick={handleInstall}
            className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            <Download className="w-5 h-5" />
            지금 설치하기
          </button>
        </div>
      </div>
    </div>
  );
};
```

**App.tsx에 추가**:

```typescript
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

function App() {
  return (
    <>
      {/* 기존 컴포넌트들 */}
      <PWAInstallPrompt /> {/* 🆕 추가 */}
    </>
  );
}
```

### B-5. 업데이트 알림 추가 (선택, 1시간)

**새 파일**: `components/PWAUpdatePrompt.tsx`

```typescript
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const PWAUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-2xl p-4 z-50 flex items-center gap-4">
      <RefreshCw className="w-6 h-6 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-bold">새 버전이 있어요!</p>
        <p className="text-sm opacity-90">새로고침하면 최신 기능을 사용할 수 있어요.</p>
      </div>
      <button
        onClick={() => updateServiceWorker(true)}
        className="px-6 py-2 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors"
      >
        새로고침
      </button>
    </div>
  );
};
```

**App.tsx에 추가**:

```typescript
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';

function App() {
  return (
    <>
      {/* 기존 컴포넌트들 */}
      <PWAInstallPrompt />
      <PWAUpdatePrompt /> {/* 🆕 추가 */}
    </>
  );
}
```

### B-6. Netlify 설정 업데이트 (선택)

**파일**: `netlify.toml`

**기존 설정 유지하고 아래 내용 추가**:

```toml
[[headers]]
  for = "/manifest.webmanifest"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    Content-Type = "application/manifest+json"

[[headers]]
  for = "/icons/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

## 📋 구현 순서 (권장)

### Phase 1: 전체화면 기능 (우선)
**소요 시간**: 2-3시간

1. `CompetitionTimer.tsx` 수정
   - 브라우저 Fullscreen API 통합
   - ESC 키 지원
   - 화면 회전 잠금
   - UI 버튼 추가

2. 로컬 테스트
3. Git 커밋 + Netlify 배포

---

### Phase 2: PWA 기본 설정 (우선)
**소요 시간**: 2-3시간

1. `vite-plugin-pwa` 설치
2. 앱 아이콘 7종 제작
3. `vite.config.ts` PWA 플러그인 추가
4. `index.html` meta 태그 추가
5. 빌드 및 테스트
6. Git 커밋 + Netlify 배포

---

### Phase 3: 오프라인 지원 (중간)
**소요 시간**: 1-2시간

1. Firebase Persistence 활성화
2. `offline.html` 페이지 제작
3. 오프라인 테스트
4. Git 커밋 + Netlify 배포

---

### Phase 4: UX 고도화 (선택)
**소요 시간**: 1-2시간

1. `PWAInstallPrompt` 컴포넌트 추가
2. `PWAUpdatePrompt` 컴포넌트 추가
3. `App.tsx`에 통합
4. Git 커밋 + Netlify 배포

---

## ✅ 예상 결과

### 전체화면 기능
- ✅ 타이머 영역에 "전체화면" 버튼 표시
- ✅ 클릭 시 주소창/탭/북마크 모두 사라짐
- ✅ ESC 키 또는 "전체화면 종료" 버튼으로 복귀
- ✅ 모바일/태블릿에서 가로 모드 고정
- ✅ 기존 UI/기능은 그대로 유지

### PWA 기능
- ✅ 브라우저 주소창에 "설치" 아이콘 표시
- ✅ 홈 화면에 앱 추가 가능
- ✅ 앱처럼 독립 실행
- ✅ 오프라인에서도 기본 기능 동작
- ✅ 스플래시 스크린 표시
- ✅ 새 버전 자동 업데이트
- ✅ 기존 웹앱 기능 100% 유지

---

## ⚠️ 주의사항

1. **기존 코드 절대 변경 금지**
   - 레이아웃, 스타일, 색상, 위치 변경 불가
   - 기능 동작 방식 수정 불가
   - 오직 새로운 기능만 추가

2. **수정 파일 목록**
   - 전체화면: `components/CompetitionTimer.tsx` (버튼 추가만)
   - PWA: 신규 파일 생성 + 설정 파일만 수정

3. **신규 파일 목록**
   - `public/icons/*.png` (7개)
   - `public/offline.html`
   - `components/PWAInstallPrompt.tsx` (선택)
   - `components/PWAUpdatePrompt.tsx` (선택)

4. **설정 파일 수정 목록**
   - `vite.config.ts` (PWA 플러그인 추가)
   - `index.html` (meta 태그 추가)
   - `lib/firebase.ts` (persistence 추가)
   - `netlify.toml` (캐시 헤더 추가, 선택)
   - `App.tsx` (PWA 컴포넌트 추가, 선택)

---

## 📊 최종 타임라인

| Phase | 기능 | 소요 시간 | 우선순위 |
|-------|------|----------|---------|
| Phase 1 | 전체화면 기능 | 2-3시간 | ⭐⭐⭐ 높음 |
| Phase 2 | PWA 기본 설정 | 2-3시간 | ⭐⭐⭐ 높음 |
| Phase 3 | 오프라인 지원 | 1-2시간 | ⭐⭐ 중간 |
| Phase 4 | UX 고도화 | 1-2시간 | ⭐ 선택 |

**총 예상 시간**: 6-10시간 (모든 Phase 포함)
**최소 구성 (Phase 1-2)**: 4-6시간

---

## 🎓 용어 설명

- **Fullscreen API**: 브라우저의 모든 UI를 숨기고 웹 페이지를 화면 전체에 표시하는 브라우저 기능

- **Screen Orientation Lock**: 스마트폰/태블릿의 화면 회전을 고정하는 기능

- **PWA (Progressive Web App)**: 웹사이트를 스마트폰 앱처럼 설치하고 사용할 수 있게 만드는 기술

- **Service Worker**: 웹페이지 뒤에서 돌아가며 오프라인 동작을 도와주는 프로그램

- **Manifest**: 앱의 이름, 아이콘, 화면 방향 등을 담은 정보 파일

- **IndexedDB Persistence**: 브라우저에 데이터를 저장하는 큰 저장소

---

**작성일**: 2025-11-24
**프로젝트**: 줄넘기 대회 매니저
**버전**: 1.0
