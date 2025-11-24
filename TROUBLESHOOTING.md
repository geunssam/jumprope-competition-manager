# 트러블슈팅 가이드

## 1. Netlify 배포 시 Firebase 인증 실패 문제

### 증상
- 로컬 환경에서는 정상 작동
- 배포된 사이트에서 로그인 후에도 user가 null로 표시됨
- 브라우저 콘솔에 "❌ User 없음" 메시지 출력
- Firebase 관련 기능이 전혀 작동하지 않음

### 원인
**Vite 환경변수가 Netlify에 설정되지 않음**

- **로컬 개발**: `.env.local` 파일에서 환경변수 자동 로드
  ```
  VITE_FIREBASE_API_KEY=AIzaSy...
  VITE_FIREBASE_AUTH_DOMAIN=jumprope-master-v20.firebaseapp.com
  ...
  ```

- **Netlify 배포**: `.env.local` 파일은 Git에 포함되지 않음 (`.gitignore`에 등록됨)
  - 빌드 시 환경변수가 없어서 `import.meta.env.VITE_FIREBASE_API_KEY` 등이 `undefined`가 됨
  - Firebase 초기화 실패
  - 인증 시스템 전체 작동 불가

### 발견 과정
1. 사용자 보고: "로그인했는데 user가 null"
2. 콘솔 로그 확인: `🔄 대회 초기화 시작, user: null`
3. AuthContext 추적: `onAuthStateChanged` 리스너가 user를 null로 반환
4. Firebase 초기화 확인: 환경변수가 로드되지 않음을 발견

### 해결 방법

#### 1) Netlify CLI로 환경변수 설정
```bash
# 각 환경변수를 하나씩 설정
netlify env:set VITE_FIREBASE_API_KEY "your-api-key"
netlify env:set VITE_FIREBASE_AUTH_DOMAIN "your-project.firebaseapp.com"
netlify env:set VITE_FIREBASE_PROJECT_ID "your-project-id"
netlify env:set VITE_FIREBASE_STORAGE_BUCKET "your-project.firebasestorage.app"
netlify env:set VITE_FIREBASE_MESSAGING_SENDER_ID "your-sender-id"
netlify env:set VITE_FIREBASE_APP_ID "your-app-id"
```

#### 2) Netlify 웹 대시보드로 설정 (대안)
1. https://app.netlify.com 접속
2. 프로젝트 선택
3. Site settings → Environment variables
4. "Add a variable" 클릭하여 각 환경변수 추가

#### 3) 환경변수 설정 후 재배포
```bash
netlify deploy --prod
```

### 예방 방법
새 프로젝트 배포 시 체크리스트:
- [ ] `.env.local` 파일의 모든 환경변수 확인
- [ ] Netlify에 동일한 환경변수 설정
- [ ] 빌드 로그에서 환경변수 로드 확인
- [ ] 배포 후 브라우저 콘솔에서 Firebase Config 로그 확인

### 참고사항
- **환경변수 이름**: Vite는 `VITE_` 접두사가 붙은 변수만 클라이언트에 노출
- **보안**: API Key는 공개되어도 Firebase 보안 규칙으로 보호됨
- **`.gitignore`**: `.env.local` 파일은 절대 Git에 커밋하지 말 것

---

## 2. 타이머와 음원 동기화 문제

### 증상
- 음원 재생 시작
- 타이머 숫자가 음원보다 빠르게 또는 느리게 진행
- 마지막에 1~3초 차이 발생

### 원인 분석

#### 문제 1: setInterval 누적 오차
```javascript
// 잘못된 방법
setInterval(() => {
  setRemainingSeconds(prev => prev - 1);
}, 1000);
```

**문제점:**
- JavaScript의 `setInterval`은 정확히 1000ms마다 실행되지 않음
- 브라우저의 이벤트 루프, 다른 작업의 우선순위 등으로 인해 약간씩 지연
- 예: 1초당 평균 1.02초씩 소요 → 60초 후 1.2초 오차 발생

#### 문제 2: React 리렌더링으로 인한 interval 재생성
```javascript
// 잘못된 방법
useEffect(() => {
  // interval 설정
}, [timerState, remainingSeconds]); // remainingSeconds가 의존성에 포함
```

**문제점:**
- `remainingSeconds`가 변경될 때마다 useEffect 재실행
- interval이 매 초마다 재생성됨
- 타이밍이 불안정해짐

#### 문제 3: Ready 카운트다운 시간 미처리
```javascript
// 1차 수정 (잘못됨)
const handle60SecPreset = () => {
  playAudio('/sounds/60sec.mp3');  // 음원 시작
  startTimeRef.current = Date.now(); // 이 시점 기록
  setTimeout(() => {
    setTimerState('running');  // 2초 후 running
  }, 2000);
};

// running 상태에서 경과 시간 계산
const elapsed = (Date.now() - startTime) / 1000; // 2초 경과됨
const remaining = 60 - 2 = 58; // 58초부터 시작! (잘못됨)
```

**문제점:**
- 음원은 "Ready, Set, Go!" 2초 동안 카운트다운 안내만 함
- 실제 60초 카운트는 "Go!" 이후부터 시작해야 함
- 하지만 타이머는 음원 시작 시점부터 시간을 빼버려서 58초부터 시작

### 해결 방법

#### 1) 절대 시간 기반 카운트다운 (setInterval 오차 제거)
```javascript
// 올바른 방법
useEffect(() => {
  if (timerState === 'running') {
    // running 상태로 전환될 때 시작 시간 기록
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
      targetDurationRef.current = remainingSeconds;
    }

    intervalRef.current = setInterval(() => {
      // 절대 시간 기반 계산
      const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, targetDurationRef.current - elapsedSeconds);

      setRemainingSeconds(remaining);
    }, 100); // 100ms마다 체크하여 더 정확한 표시
  }
}, [timerState]); // remainingSeconds 제거!
```

**개선점:**
- 실제 경과 시간(`Date.now()`)을 기준으로 계산
- 누적 오차 없음
- 100ms 간격으로 체크하여 부드러운 표시

#### 2) Ready 카운트다운과 타이머 시작 분리
```javascript
const handle60SecPreset = () => {
  setRemainingSeconds(60);
  playAudio('/sounds/60sec.mp3');
  setTimerState('ready');

  // 2초 후에 running으로 전환하면서 startTime 기록
  setTimeout(() => {
    setTimerState('running');
    startTimeRef.current = Date.now(); // 이 시점부터 60초 카운트
    targetDurationRef.current = 60;
  }, 2000);
};
```

**개선점:**
- "Ready, Set, Go!" 2초는 타이머 카운트에 포함 안 됨
- `running` 상태로 전환될 때 시작 시간 기록
- 정확히 60초부터 카운트다운 시작

### 타임라인 비교

#### 문제가 있던 버전:
```
0초: 버튼 클릭 → startTime 기록 → 음원 시작 → "Ready"
1초: "Set" → 경과 1초
2초: "Go!" → running 전환 → 경과 2초 → 화면: 58초 (60-2)
3초: 경과 3초 → 화면: 57초
...
60초: 경과 60초 → 화면: 0초 (음원은 아직 2초 남음!)
```

#### 수정된 버전:
```
0초: 버튼 클릭 → 음원 시작 → "Ready" → 화면: 60초
1초: "Set" → 화면: 60초
2초: "Go!" → running 전환 → startTime 기록 → 화면: 60초
3초: 경과 1초 → 화면: 59초
4초: 경과 2초 → 화면: 58초
...
62초: 경과 60초 → 화면: 0초 (음원도 정확히 종료!)
```

### 검증 방법
1. 60초 버튼 클릭
2. "Ready, Set, Go!" 카운트다운 확인 (2초)
3. "Go!" 직후 화면이 60초인지 확인
4. 스톱워치로 실제 시간 측정
5. 0초 도달 시 음원도 함께 종료되는지 확인

### 핵심 교훈
- **절대 시간 기준**: `setInterval` 횟수가 아닌 실제 경과 시간으로 계산
- **의존성 최소화**: useEffect 의존성 배열에서 자주 변경되는 값 제거
- **타이밍 명확화**: 준비 시간과 실제 카운트다운 시간을 명확히 구분

---

## 작성 일자
2025-11-24

## 관련 커밋
- `fix: netlify 배포 설정 수정 및 학급 삭제 에러 핸들링 개선` (95f68c4)
- `fix: 타이머 정확도 수정 및 학급 생성/삭제 즉시 반영 개선` (633e7fd)
