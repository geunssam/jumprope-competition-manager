# 줄넘기 대회 매니저 v2

학년별 줄넘기 대회를 관리하기 위한 웹 애플리케이션입니다.

## 🎯 주요 기능

### 1. 학년별 사이드바 (1-6학년)
- 왼쪽 고정 사이드바로 학년 선택
- 활성 학년 시각적 표시

### 2. 4개 탭 시스템
각 학년마다 다음 4개의 탭이 제공됩니다:

#### 📋 학급/학생 관리
- 학급 생성 및 삭제
- 학생 명단 일괄 입력 (쉼표로 구분)
- 학급별 학생 현황 조회

#### ⚙️ 경기 종목 선정
- 16개 줄넘기 종목 중 선택
- 개인전 8개 / 짝 종목 3개 / 단체전 5개
- 종목별 참가 인원 설정

#### 📊 경기 기록 입력 (매트릭스 뷰)
- **핵심 기능**: 학급 × 종목 매트릭스 테이블
- 셀 클릭으로 모달 열기
  - **개인전**: 학생별 점수 입력 → 자동 합산
  - **단체전**: 참가 학생 선택 + 팀 점수 입력
- 반별 총점 자동 계산

#### 🏆 경기 결과 종합
- 학급별 순위 표시 (총점 기준)
- 종목별 세부 점수 표시
- 상위 3개 학급 메달 표시

### 3. 전체 설정
- 사이드바 하단 버튼
- 종목 추가/삭제/수정 기능 (추후 구현)

## 🎮 종목 목록

### 개인전 (8개)
- 번갈아뛰기
- 한발뛰기
- 가위바위보
- 앞뒤흔들어뛰기
- 겹뛰기
- 엇갈려뛰기
- 2단뛰기
- 엉덩이치기

### 짝 종목 (3개)
- 번갈아 짝줄넘기
- 함께 짝줄넘기
- 마주보고 짝줄넘기

### 단체전 (5개)
- 긴줄넘기
- 8자 줄넘기
- 8자마라톤
- 단체 줄넘기
- 허들 줄넘기

## 💻 기술 스택

- **React 19** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링 (CDN)
- **lucide-react** - 아이콘
- **localStorage** - 데이터 영속성

## 🚀 시작하기

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```
서버가 http://localhost:3000 에서 실행됩니다.

### 프로덕션 빌드
```bash
npm run build
npm run preview
```

## 📁 프로젝트 구조

```
jumprope-competition-v2/
├── components/
│   ├── Sidebar.tsx              # 1-6학년 사이드바
│   ├── GradeView.tsx            # 학년별 메인 뷰 (4개 탭)
│   ├── MatrixRecordTable.tsx    # 매트릭스 기록 테이블
│   ├── RecordInputModal.tsx     # 기록 입력 모달
│   ├── SettingsView.tsx         # 전체 설정 뷰
│   └── Button.tsx               # 재사용 버튼 컴포넌트
├── types.ts                     # TypeScript 타입 정의
├── constants.ts                 # 종목 데이터
├── App.tsx                      # 최상위 앱 컴포넌트
├── index.tsx                    # 앱 진입점
├── index.html                   # HTML 템플릿
└── package.json                 # 의존성 관리
```

## 🎨 디자인 특징

- **Indigo 컬러 팔레트**: 일관된 브랜드 컬러
- **반응형 디자인**: 데스크톱/태블릿 최적화
- **모달 기반 UX**: 복잡한 입력은 모달로 처리
- **Sticky 헤더**: 스크롤 시에도 항상 보이는 네비게이션
- **자동 계산**: 총점 실시간 업데이트

## 📝 데이터 구조

### Student
```typescript
interface Student {
  id: string;
  name: string;
}
```

### CompetitionEvent
```typescript
interface CompetitionEvent {
  id: string;
  name: string;
  type: 'INDIVIDUAL' | 'TEAM';
  defaultTimeLimit: number;        // 초 단위
  defaultMaxParticipants: number;  // 0 = 전원 참가
  description?: string;
}
```

### ClassTeam
```typescript
interface ClassTeam {
  id: string;
  grade: number;
  name: string;
  students: Student[];
  results: Record<string, ClassResult>;
}
```

### ClassResult
```typescript
interface ClassResult {
  score: number;                      // 총점
  teamParticipantIds?: string[];      // 단체전: 참가자 ID
  studentScores?: Record<string, number>; // 개인전: 학생별 점수
}
```

### GradeConfig
```typescript
interface GradeConfig {
  grade: number;
  events: Record<string, {
    selected: boolean;           // 종목 선택 여부
    targetParticipants: number;  // 목표 참가 인원
  }>;
}
```

## 🔄 상태 관리

- **localStorage 기반**: 브라우저 새로고침 시에도 데이터 유지
- **버전 관리**: 데이터 마이그레이션 지원
- **실시간 업데이트**: 입력 즉시 반영

## 🎯 향후 계획 (Phase 5 - Optional)

1. **Firebase 통합**
   - 실시간 다중 사용자 지원
   - 클라우드 데이터 동기화
   - 사용자 인증

2. **추가 기능**
   - 경기 타이머
   - 통계 차트
   - 인쇄 기능
   - CSV 내보내기

3. **모바일 최적화**
   - 사이드바 토글
   - 터치 제스처
   - PWA 지원

## 📄 라이선스

MIT

---

**개발자**: Claude Code & User
**버전**: 2.0
**마지막 업데이트**: 2025-11-20
