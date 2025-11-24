# 🔧 캐시 문제 해결 가이드

## 문제 상황
Firebase에는 종목 데이터가 있지만 브라우저에서 표시되지 않는 경우 (시크릿 모드에서는 정상 작동)

---

## ✅ 즉시 해결 방법 (사용자용)

### 방법 1: 하드 리프레시 (가장 간단)

**Chrome/Edge (Windows/Mac):**
```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

**Safari (Mac):**
```
1. 개발자 메뉴 활성화: 환경설정 > 고급 > "메뉴 막대에서 개발자용 메뉴 보기" 체크
2. 개발 > 캐시 비우기 (Cmd + Option + E)
3. 새로고침 (Cmd + R)
```

---

### 방법 2: 브라우저 캐시 완전 삭제

**Chrome 기준:**
1. `F12` 또는 `Cmd+Option+I`로 개발자 도구 열기
2. **Network 탭** 선택
3. "Disable cache" 체크박스 선택
4. 새로고침 버튼을 **길게 눌러서** "Empty Cache and Hard Reload" 선택

---

### 방법 3: Application Storage 삭제

**Chrome 기준:**
1. `F12`로 개발자 도구 열기
2. **Application 탭** 선택
3. Storage > **Clear site data** 버튼 클릭
4. 페이지 새로고침

---

### 방법 4: 콘솔 명령어 (고급)

**브라우저 콘솔(F12)에서 실행:**
```javascript
localStorage.clear();
location.reload();
```

---

## 🛠️ 적용된 기술적 해결 방법

### 1. 앱 버전 관리 시스템 (`App.tsx`)

```typescript
// 배포 시마다 버전 증가 → 자동 캐시 클리어
const APP_VERSION = '2.1.0';
```

**작동 방식:**
- 앱 시작 시 저장된 버전과 비교
- 버전이 다르면 자동으로 오래된 캐시 제거
- 중요 데이터(대회 ID, 개인정보 동의)는 보존

**향후 배포 시:**
```typescript
// 버전만 증가시키면 자동 캐시 클리어
const APP_VERSION = '2.2.0'; // 다음 배포
const APP_VERSION = '2.3.0'; // 그 다음 배포
```

---

### 2. 빌드 캐시 버스팅 (`vite.config.ts`)

```typescript
build: {
  rollupOptions: {
    output: {
      // 파일명에 해시 추가
      entryFileNames: `assets/[name].[hash].js`,
      chunkFileNames: `assets/[name].[hash].js`,
      assetFileNames: `assets/[name].[hash].[ext]`
    }
  }
}
```

**효과:**
- 빌드할 때마다 파일명이 변경됨
- 예: `index.CbfixcO0.js` → `index.D2x9K1mL.js`
- 브라우저가 자동으로 새 파일 다운로드

---

### 3. HTTP 캐시 헤더 최적화 (`netlify.toml`)

```toml
# index.html은 절대 캐시 안 함
[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

# JS/CSS는 1년 캐시 (파일명에 해시가 있어서 안전)
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**장점:**
- `index.html`은 항상 최신 버전 가져옴
- JS/CSS는 한 번 다운로드하면 재사용 (빠른 로딩)
- 배포 시 파일명이 바뀌어서 자동으로 갱신됨

---

## 🚀 배포 가이드

### 1. 버전 업데이트
```typescript
// App.tsx에서 버전 증가
const APP_VERSION = '2.2.0'; // 예시
```

### 2. 빌드 및 배포
```bash
npm run build
netlify deploy --prod
```

### 3. 배포 후 확인
- 시크릿 모드에서 테스트
- 일반 모드에서 Shift+F5로 하드 리프레시 후 테스트
- Firebase Console에서 events 컬렉션 확인

---

## 📋 체크리스트

**배포 전:**
- [ ] App.tsx의 APP_VERSION 증가
- [ ] 로컬에서 `npm run build` 성공 확인
- [ ] dist/assets 폴더에 해시 파일명 확인

**배포 후:**
- [ ] Netlify 배포 성공 확인
- [ ] 시크릿 모드에서 정상 작동 확인
- [ ] 일반 모드에서 Shift+F5 후 정상 작동 확인
- [ ] Firebase Console에서 데이터 존재 확인

---

## 🐛 여전히 문제가 발생하면?

### 1. 콘솔 로그 확인
```
F12 > Console 탭 > 다음 메시지 확인:
- "🔄 앱 버전 업데이트 감지"
- "🧹 캐시 클리어 중..."
- "✅ 캐시 클리어 완료"
```

### 2. Network 탭 확인
```
F12 > Network 탭 > 새로고침 > events 관련 요청 확인
- Status: 200 (성공)
- Response에 16개 종목 데이터 있는지 확인
```

### 3. Application 탭 확인
```
F12 > Application > Local Storage > 현재 도메인 선택
- jr_app_version: "2.1.0" 확인
- jr_competition_id: 대회 ID 확인
```

---

## 💡 추가 팁

### 개발 시 캐시 문제 예방
```
1. 개발자 도구 항상 "Disable cache" 체크
2. 시크릿 모드에서 테스트
3. 중요한 변경 후에는 항상 하드 리프레시
```

### 긴급 상황 (사용자에게 안내)
```
주소창에 직접 입력:
javascript:localStorage.clear();location.reload();
```

---

## 📝 변경 이력

- **2024-11-24**: 초기 캐시 관리 시스템 구축 (v2.1.0)
  - 앱 버전 관리 시스템 추가
  - 빌드 캐시 버스팅 설정
  - HTTP 캐시 헤더 최적화
