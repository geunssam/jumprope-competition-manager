import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

console.log('🔥 Firebase Config:', firebaseConfig);

// 환경변수 체크
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase 환경변수가 로드되지 않았습니다!');
  console.error('환경변수:', {
    apiKey: firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId,
    allEnv: import.meta.env
  });
  throw new Error('Firebase 환경변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
}

const app = initializeApp(firebaseConfig);

// Firestore with Persistent Offline Cache (PWA 오프라인 지원)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
});

export const auth = getAuth(app);

console.log('✅ Firebase initialized with offline persistence');
