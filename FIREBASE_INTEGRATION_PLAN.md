# 줄넘기 대회 매니저 Firebase 연동 및 Netlify 배포 계획

## 📋 요구사항 요약
- **사용 시나리오**: 단일 교사가 태블릿으로 점수 입력
- **인증 방식**: Google 계정 로그인
- **개발 방식**: 새 브랜치(firebase-integration)에서 재설계 후 병합
- **실시간 동기화**: 여러 기기에서 동시에 대회 현황 보기

---

## 🎯 Phase 1: 프로젝트 기본 설정 (30분)

### 1.1 새 브랜치 생성 및 의존성 설치
```bash
git checkout -b firebase-integration
npm install firebase
```

### 1.2 .gitignore 파일 생성
```gitignore
node_modules/
.env
.env.local
.env.*.local
dist/
.DS_Store
.firebase/
```

### 1.3 환경변수 파일 생성
`.env.local` 파일 생성하여 Firebase 설정 값 입력:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GEMINI_API_KEY=... (기존값)
```

---

## 🔥 Phase 2: Firebase 초기화 및 인증 구현 (1시간)

### 2.1 Firebase 설정 파일 생성
**새 파일**: `lib/firebase.ts`
- Firebase 앱 초기화
- Firestore 인스턴스 내보내기
- Auth 인스턴스 내보내기

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

### 2.2 인증 컨텍스트 생성
**새 파일**: `contexts/AuthContext.tsx`
- Google OAuth 로그인/로그아웃 함수
- 현재 사용자 상태 관리
- 로딩 상태 관리

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### 2.3 로그인 페이지 생성
**새 파일**: `components/LoginPage.tsx`
- Google 로그인 버튼
- 로고 및 앱 설명
- 로딩 상태 표시

```typescript
import React from 'react';
import { Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-block bg-indigo-600 p-4 rounded-full mb-4">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">줄넘기 대회 매니저</h1>
          <p className="text-slate-600">학급별 경기 기록을 관리하고 실시간으로 공유하세요</p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-all"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google 계정으로 로그인
        </button>

        <p className="text-xs text-slate-500 text-center mt-6">
          로그인하면 여러 기기에서 대회 현황을 실시간으로 확인할 수 있습니다
        </p>
      </div>
    </div>
  );
};
```

### 2.4 App.tsx 수정
- AuthContext로 앱 전체 감싸기
- 로그인되지 않은 경우 LoginPage 표시

```typescript
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // 기존 앱 UI
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* 기존 코드... */}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
```

---

## 💾 Phase 3: Firestore 데이터 구조 및 서비스 레이어 (2시간)

### 3.1 Firestore 컬렉션 구조
```
competitions/
  {competitionId}/
    - name: string
    - createdBy: userId
    - createdAt: timestamp
    - status: 'active' | 'completed'

events/
  {eventId}/
    - competitionId: string
    - name, type, timeLimit 등

classes/
  {classId}/
    - competitionId: string
    - grade: number
    - name: string
    - students: array
    - results: map
    - totalScore: number
    - updatedAt: timestamp

gradeConfigs/
  {competitionId}_{grade}/
    - competitionId: string
    - grade: number
    - eventSettings: map
```

### 3.2 Firebase 서비스 레이어 생성
**새 파일**: `services/firestore.ts`

```typescript
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ClassTeam, CompetitionEvent, GradeConfig } from '../types';

// === 대회 관리 ===
export const createCompetition = async (userId: string, name: string): Promise<string> => {
  const compRef = doc(collection(db, 'competitions'));
  await setDoc(compRef, {
    name,
    createdBy: userId,
    createdAt: serverTimestamp(),
    status: 'active'
  });
  return compRef.id;
};

export const getMyCompetitions = async (userId: string) => {
  const q = query(collection(db, 'competitions'), where('createdBy', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// === 종목 관리 ===
export const createEvent = async (competitionId: string, event: CompetitionEvent) => {
  await setDoc(doc(db, 'events', event.id), {
    ...event,
    competitionId
  });
};

export const getEvents = async (competitionId: string): Promise<CompetitionEvent[]> => {
  const q = query(collection(db, 'events'), where('competitionId', '==', competitionId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as CompetitionEvent);
};

export const subscribeToEvents = (
  competitionId: string,
  callback: (events: CompetitionEvent[]) => void
): Unsubscribe => {
  const q = query(collection(db, 'events'), where('competitionId', '==', competitionId));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => doc.data() as CompetitionEvent);
    callback(events);
  });
};

// === 학급 관리 ===
export const createClass = async (competitionId: string, classData: ClassTeam) => {
  await setDoc(doc(db, 'classes', classData.id), {
    ...classData,
    competitionId,
    totalScore: 0,
    updatedAt: serverTimestamp()
  });
};

export const updateClass = async (classId: string, updates: Partial<ClassTeam>) => {
  await updateDoc(doc(db, 'classes', classId), {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const deleteClass = async (classId: string) => {
  await deleteDoc(doc(db, 'classes', classId));
};

export const getGradeClasses = async (
  competitionId: string,
  grade: number
): Promise<ClassTeam[]> => {
  const q = query(
    collection(db, 'classes'),
    where('competitionId', '==', competitionId),
    where('grade', '==', grade)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as ClassTeam);
};

export const subscribeToGradeClasses = (
  competitionId: string,
  grade: number,
  callback: (classes: ClassTeam[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, 'classes'),
    where('competitionId', '==', competitionId),
    where('grade', '==', grade)
  );
  return onSnapshot(q, (snapshot) => {
    const classes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ClassTeam));
    callback(classes);
  });
};

export const updateClassResults = async (
  classId: string,
  results: ClassTeam['results']
) => {
  // 총점 계산
  const totalScore = Object.values(results).reduce((sum, result) => sum + result.score, 0);

  await updateDoc(doc(db, 'classes', classId), {
    results,
    totalScore,
    updatedAt: serverTimestamp()
  });
};

// === 학년 설정 관리 ===
export const updateGradeConfig = async (
  competitionId: string,
  config: GradeConfig
) => {
  const configId = `${competitionId}_${config.grade}`;
  await setDoc(doc(db, 'gradeConfigs', configId), {
    ...config,
    competitionId
  });
};

export const getGradeConfig = async (
  competitionId: string,
  grade: number
): Promise<GradeConfig | null> => {
  const configId = `${competitionId}_${grade}`;
  const snapshot = await getDoc(doc(db, 'gradeConfigs', configId));
  return snapshot.exists() ? snapshot.data() as GradeConfig : null;
};

// === 일괄 작업 ===
export const batchUpdateClasses = async (classes: ClassTeam[]) => {
  const batch = writeBatch(db);

  classes.forEach(cls => {
    const ref = doc(db, 'classes', cls.id);
    batch.set(ref, {
      ...cls,
      updatedAt: serverTimestamp()
    }, { merge: true });
  });

  await batch.commit();
};
```

### 3.3 localStorage → Firestore 마이그레이션 유틸
**새 파일**: `utils/migration.ts`

```typescript
import { writeBatch, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createCompetition } from '../services/firestore';
import { ClassTeam, CompetitionEvent, GradeConfig } from '../types';

export const migrateLocalStorageToFirestore = async (userId: string): Promise<string> => {
  // localStorage 데이터 읽기
  const localEvents = JSON.parse(localStorage.getItem('jr_events') || '[]') as CompetitionEvent[];
  const localClasses = JSON.parse(localStorage.getItem('jr_classes') || '[]') as ClassTeam[];
  const localConfigs = JSON.parse(localStorage.getItem('jr_grade_configs_v2') || '[]') as GradeConfig[];

  // 대회 생성
  const competitionId = await createCompetition(userId, '줄넘기 대회');

  // Firestore 일괄 작업
  const batch = writeBatch(db);

  // 종목 저장
  localEvents.forEach(event => {
    const eventRef = doc(db, 'events', event.id);
    batch.set(eventRef, { ...event, competitionId });
  });

  // 학급 저장
  localClasses.forEach(cls => {
    const totalScore = Object.values(cls.results).reduce((sum, result) => sum + result.score, 0);
    const clsRef = doc(db, 'classes', cls.id);
    batch.set(clsRef, {
      ...cls,
      competitionId,
      totalScore
    });
  });

  // 학년 설정 저장
  localConfigs.forEach(config => {
    const configRef = doc(db, 'gradeConfigs', `${competitionId}_${config.grade}`);
    batch.set(configRef, { ...config, competitionId });
  });

  await batch.commit();

  // 마이그레이션 완료 표시
  localStorage.setItem('jr_migrated_to_firebase', 'true');
  localStorage.setItem('jr_competition_id', competitionId);

  return competitionId;
};

export const hasMigratedData = (): boolean => {
  return localStorage.getItem('jr_migrated_to_firebase') === 'true';
};

export const hasLocalStorageData = (): boolean => {
  const events = localStorage.getItem('jr_events');
  const classes = localStorage.getItem('jr_classes');
  return !!(events && classes);
};
```

---

## 🔄 Phase 4: App.tsx 리팩토링 및 실시간 동기화 (2시간)

### 4.1 App.tsx 대폭 수정

```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import {
  subscribeToEvents,
  subscribeToGradeClasses,
  getMyCompetitions,
  createCompetition,
  getGradeConfig,
  updateGradeConfig,
  batchUpdateClasses
} from './services/firestore';
import {
  migrateLocalStorageToFirestore,
  hasLocalStorageData,
  hasMigratedData
} from './utils/migration';
import { CompetitionEvent, ClassTeam, GradeConfig, ViewMode } from './types';
import { INITIAL_EVENTS } from './constants';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  // 대회 상태
  const [currentCompetitionId, setCurrentCompetitionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 상태
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [classes, setClasses] = useState<ClassTeam[]>([]);
  const [gradeConfigs, setGradeConfigs] = useState<GradeConfig[]>([]);

  // UI 상태
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.GRADE);
  const [currentGrade, setCurrentGrade] = useState<number>(1);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // 1. 대회 초기화
  useEffect(() => {
    if (!user) return;

    const initCompetition = async () => {
      try {
        setLoading(true);

        // 마이그레이션 확인
        if (!hasMigratedData() && hasLocalStorageData()) {
          if (confirm('기존 데이터를 클라우드로 이전하시겠습니까?')) {
            const compId = await migrateLocalStorageToFirestore(user.uid);
            setCurrentCompetitionId(compId);
            setLoading(false);
            return;
          }
        }

        // 기존 대회 조회
        const savedCompId = localStorage.getItem('jr_competition_id');
        if (savedCompId) {
          setCurrentCompetitionId(savedCompId);
        } else {
          const comps = await getMyCompetitions(user.uid);
          if (comps.length > 0) {
            setCurrentCompetitionId(comps[0].id);
            localStorage.setItem('jr_competition_id', comps[0].id);
          } else {
            // 새 대회 생성 및 초기 종목 추가
            const newCompId = await createCompetition(user.uid, '줄넘기 대회');

            // 초기 종목 추가
            const { writeBatch, doc } = await import('firebase/firestore');
            const { db } = await import('./lib/firebase');
            const batch = writeBatch(db);
            INITIAL_EVENTS.forEach(event => {
              const eventRef = doc(db, 'events', event.id);
              batch.set(eventRef, { ...event, competitionId: newCompId });
            });
            await batch.commit();

            setCurrentCompetitionId(newCompId);
            localStorage.setItem('jr_competition_id', newCompId);
          }
        }
      } catch (err) {
        console.error('Competition init error:', err);
        setError('대회 초기화 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    initCompetition();
  }, [user]);

  // 2. 종목 실시간 구독
  useEffect(() => {
    if (!currentCompetitionId) return;

    const unsubscribe = subscribeToEvents(currentCompetitionId, (updatedEvents) => {
      setEvents(updatedEvents);
    });

    return () => unsubscribe();
  }, [currentCompetitionId]);

  // 3. 학급 실시간 구독 (학년별)
  useEffect(() => {
    if (!currentCompetitionId || currentView !== ViewMode.GRADE) return;

    const unsubscribe = subscribeToGradeClasses(
      currentCompetitionId,
      currentGrade,
      (updatedClasses) => {
        setClasses(updatedClasses);
      }
    );

    return () => unsubscribe();
  }, [currentCompetitionId, currentGrade, currentView]);

  // 4. 학년 설정 로드
  useEffect(() => {
    if (!currentCompetitionId) return;

    const loadConfigs = async () => {
      const configs: GradeConfig[] = [];
      for (let grade = 1; grade <= 6; grade++) {
        const config = await getGradeConfig(currentCompetitionId, grade);
        configs.push(config || { grade, events: {} });
      }
      setGradeConfigs(configs);
    };

    loadConfigs();
  }, [currentCompetitionId]);

  // 핸들러
  const handleSelectGrade = (grade: number) => {
    setCurrentGrade(grade);
    setCurrentView(ViewMode.GRADE);
  };

  const handleSelectSettings = () => {
    setCurrentView(ViewMode.SETTINGS);
  };

  const handleUpdateGradeConfig = async (newConfig: GradeConfig) => {
    if (!currentCompetitionId) return;
    await updateGradeConfig(currentCompetitionId, newConfig);
    setGradeConfigs(prev => prev.map(c => c.grade === newConfig.grade ? newConfig : c));
  };

  const handleUpdateClasses = async (updatedClasses: ClassTeam[]) => {
    await batchUpdateClasses(updatedClasses);
    // 실시간 리스너가 자동으로 업데이트
  };

  // 로딩 화면
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 화면
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  const currentGradeConfig = gradeConfigs.find(c => c.grade === currentGrade) || {
    grade: currentGrade,
    events: {}
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* 기존 UI 코드... */}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
```

### 4.2 GradeView.tsx 수정
- `onUpdateClasses` props로 Firestore 업데이트 함수 전달
- 학급 생성/수정/삭제 시 Firestore 함수 호출

### 4.3 MatrixRecordTable.tsx 수정
- 점수 변경 시 즉시 Firestore 업데이트
- Optimistic UI 업데이트 적용

---

## 🔒 Phase 5: Firestore 보안 규칙 (30분)

### 5.1 firestore.rules 파일 생성

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 인증된 사용자만 읽기/쓰기 가능
    match /competitions/{compId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.createdBy;
    }

    match /events/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /classes/{classId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /gradeConfigs/{configId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### 5.2 Firebase Console에서 규칙 배포
1. Firebase Console → Firestore Database → Rules
2. 위 규칙 복사/붙여넣기
3. "게시" 버튼 클릭

---

## 🧪 Phase 6: 테스트 및 디버깅 (1시간)

### 6.1 로컬 테스트 체크리스트
- [ ] Google 로그인 작동
- [ ] 대회 자동 생성/로드
- [ ] 학급 생성 및 학생 추가
- [ ] 경기 기록 입력
- [ ] 실시간 동기화 확인 (여러 탭)
- [ ] 로그아웃 후 재로그인 시 데이터 유지

### 6.2 에러 처리 확인
- [ ] 네트워크 오류 시 UI 표시
- [ ] 로딩 상태 표시
- [ ] 권한 오류 처리
- [ ] Firestore 쿼리 실패 시 처리

---

## 🚀 Phase 7: Netlify 배포 설정 (30분)

### 7.1 netlify.toml 파일 생성

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
```

### 7.2 Netlify 환경변수 설정
Netlify Dashboard → Site settings → Environment variables에 추가:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_GEMINI_API_KEY`

### 7.3 Firebase Authorized Domains 설정
Firebase Console → Authentication → Settings → Authorized domains
- Netlify 도메인 추가: `your-app.netlify.app`
- 커스텀 도메인이 있다면 추가

### 7.4 배포 명령어

```bash
# 로컬 빌드 테스트
npm run build

# Netlify CLI로 수동 배포
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod

# 또는 GitHub 연동으로 자동 배포
# (GitHub에 push하면 자동 빌드/배포)
```

---

## 🔀 Phase 8: 메인 브랜치 병합 (30분)

### 8.1 최종 테스트
- [ ] 모든 기능 작동 확인
- [ ] 성능 테스트 (대량 데이터)
- [ ] 모바일 반응형 확인
- [ ] 여러 기기에서 실시간 동기화 테스트

### 8.2 병합 및 배포

```bash
# 변경사항 커밋
git add -A
git commit -m "feat: Firebase 연동 및 실시간 동기화 구현

- Google OAuth 로그인 추가
- Firestore 데이터베이스 연동
- 실시간 동기화 구현
- localStorage → Firestore 마이그레이션
- Netlify 배포 설정"

# 메인 브랜치로 병합
git checkout main
git merge firebase-integration

# 원격 저장소에 푸시
git push origin main

# Netlify에 자동 배포됨
```

### 8.3 배포 후 확인사항
- [ ] Netlify 빌드 성공 확인
- [ ] 프로덕션 URL 접속 테스트
- [ ] Google 로그인 작동 확인
- [ ] 실시간 동기화 작동 확인

---

## 📦 최종 파일 구조

```
jumprope-competition-manager/
├── lib/
│   ├── firebase.ts              ✨ 새 파일
│   └── (기존 파일들...)
├── services/
│   └── firestore.ts             ✨ 새 파일
├── contexts/
│   └── AuthContext.tsx          ✨ 새 파일
├── components/
│   ├── LoginPage.tsx            ✨ 새 파일
│   ├── App.tsx                  🔄 대폭 수정
│   ├── GradeView.tsx            🔄 수정
│   ├── MatrixRecordTable.tsx    🔄 수정
│   └── (기타 파일들...)
├── utils/
│   └── migration.ts             ✨ 새 파일
├── .env.local                    ✨ 새 파일 (gitignore)
├── .gitignore                    ✨ 새 파일
├── netlify.toml                  ✨ 새 파일
├── firestore.rules               ✨ 새 파일
├── FIREBASE_INTEGRATION_PLAN.md  ✨ 이 파일
└── (기존 파일들...)
```

---

## ⏱️ 예상 소요 시간

| Phase | 작업 | 예상 시간 |
|-------|------|----------|
| 1 | 프로젝트 기본 설정 | 30분 |
| 2 | Firebase 초기화 및 인증 | 1시간 |
| 3 | Firestore 서비스 레이어 | 2시간 |
| 4 | App 리팩토링 및 실시간 동기화 | 2시간 |
| 5 | 보안 규칙 | 30분 |
| 6 | 테스트 및 디버깅 | 1시간 |
| 7 | Netlify 배포 설정 | 30분 |
| 8 | 병합 및 최종 확인 | 30분 |
| **총계** | | **약 8시간** |

---

## 💰 예상 비용

### Firebase 무료 플랜 (Spark):
- ✅ Firestore: 50,000 읽기/일, 20,000 쓰기/일
- ✅ Auth: 무제한 Google OAuth
- ✅ 1GB 저장공간
- ✅ 10GB/월 네트워크 아웃바운드

### Netlify 무료 플랜:
- ✅ 100GB 대역폭/월
- ✅ 300분 빌드시간/월
- ✅ 자동 HTTPS
- ✅ 자동 배포

→ **완전 무료로 운영 가능!**

---

## 🎉 완료 후 기능

✅ Google 계정으로 로그인
✅ 여러 기기에서 동시에 대회 현황 보기 (실시간)
✅ 한 곳에서 점수 입력하면 다른 화면에 즉시 반영
✅ 인터넷 연결만 되면 어디서나 접속 가능
✅ 데이터 자동 백업 (Firestore 클라우드)
✅ Netlify 자동 배포 (GitHub push 시)
✅ HTTPS 보안 연결
✅ 모바일/태블릿 최적화

---

## 🔧 트러블슈팅

### 문제 1: Firebase 인증 팝업이 차단됨
**해결**: 브라우저 팝업 차단 해제 안내 UI 추가

### 문제 2: Netlify 빌드 실패
**해결**: 환경변수 확인, `netlify.toml` 설정 확인

### 문제 3: 실시간 동기화가 느림
**해결**: Firestore 인덱스 생성, 쿼리 최적화

### 문제 4: 로그인 후 빈 화면
**해결**: Firebase Authorized Domains에 도메인 추가 확인

---

## 📝 참고 자료

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Firestore 데이터 모델링](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Netlify 배포 가이드](https://docs.netlify.com/)
- [Vite 환경변수](https://vitejs.dev/guide/env-and-mode.html)

---

**작성일**: 2025-11-22
**버전**: 1.0
**상태**: 계획 수립 완료
