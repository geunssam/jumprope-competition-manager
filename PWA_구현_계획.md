# 줄넘기 대회 매니저 - PWA 구현 계획

## 목표
웹앱을 PWA(Progressive Web App)로 만들어 모바일/데스크톱에서 설치 가능하게 하고, 오프라인에서도 기본 기능 사용 가능하도록 구현

## 사용자 요구사항
- **오프라인 기능**: 필요함 (인터넷 없이도 기본 기능 사용)
- **앱 아이콘**: 직접 제공 예정

---

## 구현 전략: vite-plugin-pwa + Firebase Offline Persistence

### 역할 분리
| 영역 | 담당 | 설명 |
|------|------|------|
| **정적 에셋** | Service Worker | HTML, CSS, JS, 폰트, 아이콘 |
| **동적 데이터** | Firebase SDK | Firestore 문서, 실시간 쿼리 |

> Firebase/Firestore 요청은 Service Worker가 가로채지 않음 - Firestore SDK가 IndexedDB로 자체 관리

---

## 수정할 파일 목록

### 1. 패키지 설치
```bash
npm install -D vite-plugin-pwa
```

### 2. `/lib/firebase.ts` - Firestore 오프라인 지속성 활성화

**변경 내용:**
- `getFirestore()` → `initializeFirestore()` + `persistentLocalCache()` 변경
- 다중 탭 지원 추가

```typescript
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
});
```

### 3. `/vite.config.ts` - PWA 플러그인 추가

**추가할 설정:**
- `VitePWA` 플러그인 import
- manifest 설정 (앱 이름, 색상, 아이콘)
- Workbox 캐싱 전략 설정

**캐싱 전략:**
| 리소스 | 전략 | 이유 |
|--------|------|------|
| Google Fonts | CacheFirst | 거의 변경 없음 (1년 캐시) |
| Tailwind CDN | StaleWhileRevalidate | 빠른 로딩 + 백그라운드 업데이트 |
| Static Assets | CacheFirst | 해시로 버전 관리됨 |
| Firebase API | 개입 안 함 | SDK가 자체 관리 |

### 4. `/index.html` - PWA 메타 태그 추가

```html
<!-- PWA Meta Tags -->
<meta name="theme-color" content="#4f46e5">
<meta name="description" content="초등학교 줄넘기 대회 기록 관리 앱">

<!-- iOS Safari PWA Support -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="줄넘기대회">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">

<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/icons/favicon.ico">
```

### 5. `/public/icons/` - 아이콘 폴더 (새로 생성)

**필요한 아이콘 파일:** (사용자 제공)
| 파일명 | 크기 | 용도 |
|--------|------|------|
| `icon-192x192.png` | 192x192px | Android/Chrome (필수) |
| `icon-512x512.png` | 512x512px | 스플래시/PWA (필수) |
| `apple-touch-icon.png` | 180x180px | iOS 홈 화면 |
| `favicon.ico` | 32x32px | 브라우저 탭 |

### 6. `/netlify.toml` - 캐시 헤더 추가

```toml
# PWA Manifest
[[headers]]
  for = "/manifest.webmanifest"
  [headers.values]
    Content-Type = "application/manifest+json"
    Cache-Control = "public, max-age=0, must-revalidate"

# Service Worker
[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

### 7. `/utils/offlineStatus.ts` - 온라인 상태 훅 (새로 생성)

```typescript
import { useState, useEffect } from 'react';

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

### 8. `/components/OfflineIndicator.tsx` - 오프라인 상태 UI (새로 생성)

오프라인 상태일 때 화면 하단에 표시되는 인디케이터

```tsx
import { useOnlineStatus } from '../utils/offlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2
                    bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg">
      <WifiOff size={18} />
      <span className="text-sm font-medium">오프라인 모드</span>
    </div>
  );
};
```

### 9. `/App.tsx` - OfflineIndicator 통합

App 컴포넌트에 `<OfflineIndicator />` 추가

---

## 오프라인에서 작동하는/안 하는 기능

### 작동함
- 이전에 로드한 종목/학급 정보 보기
- 기록 입력 (로컬 저장 → 온라인 시 동기화)
- 점수 계산 (클라이언트 로직)

### 작동 안 함
- 첫 로그인 (인증 필요)
- 처음 보는 데이터 조회
- 새 대회 생성 (서버 ID 필요)

---

## 구현 순서

1. **패키지 설치**: `npm install -D vite-plugin-pwa`
2. **Firebase 오프라인 설정**: `/lib/firebase.ts` 수정
3. **PWA 플러그인 설정**: `/vite.config.ts` 수정
4. **메타 태그 추가**: `/index.html` 수정
5. **아이콘 배치**: `/public/icons/` 폴더에 아이콘 파일 추가
6. **Netlify 설정**: `/netlify.toml` 캐시 헤더 추가
7. **오프라인 상태 훅 생성**: `/utils/offlineStatus.ts`
8. **오프라인 인디케이터 컴포넌트 생성**: `/components/OfflineIndicator.tsx`
9. **App에 인디케이터 통합**: `/App.tsx` 수정
10. **빌드 및 테스트**: Lighthouse PWA 감사
11. **배포**: Netlify deploy

---

## 테스트 체크리스트

- [ ] Chrome DevTools > Application > Manifest 확인
- [ ] Chrome DevTools > Application > Service Workers 확인
- [ ] Lighthouse PWA 감사 통과
- [ ] 오프라인 모드에서 기본 UI 표시 확인
- [ ] 모바일에서 "홈 화면에 추가" 동작 확인
