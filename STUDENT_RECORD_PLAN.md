# 학생 연습 기록 조회 시스템 구축 계획

## 📋 구현 목표
jumprope-competition-manager에 학생들의 성장 기록을 시각화하는 **종합 기록 조회 시스템** 구축

---

## 🎯 Phase 1: 핵심 컴포넌트 생성

### 1. StudentRecordModal.tsx (종합 기록 모달)
**위치**: `components/StudentRecordModal.tsx`

**기능**:
- 학생의 모든 연습 기록 표시
- 누적 통계 카드 (총 연습 횟수, 평균 점수, 최고 기록, 최근 기록)
- 종목별 기록 차트 (Recharts 라인 차트)
- 날짜별 기록 테이블 (정렬 기능)

**UI 구조**:
```
┌─────────────────────────────────────────┐
│ 👤 [학생명]의 연습 기록          [X]   │
├─────────────────────────────────────────┤
│ 📊 누적 통계 (4칸 그리드)              │
│ ┌────┬────┬────┬────┐                 │
│ │총횟수│평균│최고│최근│                 │
│ └────┴────┴────┴────┘                 │
├─────────────────────────────────────────┤
│ 📈 점수 추이 차트 (종목별 탭)          │
│ [1분]  [30초]  [더블더치]              │
│ (Recharts 라인 차트)                   │
├─────────────────────────────────────────┤
│ 📋 기록 목록                           │
│ [정렬: 최신순▼]                        │
│ ┌──────┬─────┬─────┬─────┐          │
│ │날짜  │종목 │점수 │세션 │          │
│ │2025-01-20│1분│150│2회차│          │
│ └──────┴─────┴─────┴─────┘          │
└─────────────────────────────────────────┘
```

### 2. Firestore 쿼리 함수 추가
**파일**: `services/firestore.ts`

**새 함수들**:
```typescript
// 학생의 모든 연습 기록 조회
getStudentPracticeRecords(competitionId, gradeId, studentId)

// 학생의 종목별 통계 계산
getStudentStatsByEvent(competitionId, gradeId, studentId, eventId)

// 학생의 전체 누적 통계
getStudentTotalStats(competitionId, gradeId, studentId)
```

---

## 🎯 Phase 2: UI 연결 포인트 추가

### 1. PracticeModeView.tsx 수정
**학생 카드에 "상세보기" 버튼 추가**:
```tsx
<div className="학생카드">
  <span>{student.name}</span>
  <input type="number" ... />
  <button onClick={() => handleShowStudentRecord(student.id)}>
    📊 상세보기
  </button>
</div>
```

### 2. StudentListModal.tsx 수정
**학생 카드 클릭 시 기록 모달 열기**:
```tsx
<div
  onClick={() => onShowStudentRecord(student.id)}
  className="cursor-pointer hover:bg-blue-50"
>
  {student.name}
</div>
```

### 3. ClassManagementModal.tsx 연결
**학생 목록 모달에서 기록 조회로 이동하는 props 전달**

---

## 🎯 Phase 3: 차트 시각화 (Recharts)

### 1. Recharts 설치
```bash
npm install recharts
```

### 2. PracticeRecordChart.tsx 생성
**개별 차트 컴포넌트**:
- 라인 차트: 날짜별 점수 추이
- 바 차트: 종목별 평균 비교
- 영역 차트: 성장 추세

**차트 스타일**:
- 현재 프로젝트의 색상 테마 (green-500, indigo-600 등) 사용
- 반응형 디자인 (`ResponsiveContainer`)
- 호버 시 툴팁 표시

---

## 🎯 Phase 4: 데이터 통계 계산

### StatsCalculator 유틸리티
**파일**: `lib/statsCalculator.ts`

**계산 함수들**:
```typescript
// 평균 점수
calculateAverage(records: PracticeRecord[]): number

// 최고 기록
getPersonalBest(records: PracticeRecord[]): number

// 향상률 계산
calculateImprovement(records: PracticeRecord[]): number

// 최근 N회 평균
getRecentAverage(records: PracticeRecord[], n: number): number
```

---

## 🎯 Phase 5: 추가 기능

### 1. 학급/학년 랭킹 표시
- 같은 반 학생들과 비교
- 순위 표시 (🥇🥈🥉)

### 2. 성장 인사이트
- "최근 5회 평균이 이전보다 10% 향상되었습니다!" 같은 메시지
- 다음 목표 제안

### 3. 기록 필터링
- 날짜 범위 선택
- 종목별 필터
- 세션별 필터

---

## 📦 구현 순서

1. **Recharts 설치** (npm install)
2. **Firestore 쿼리 함수 추가** (services/firestore.ts)
3. **StatsCalculator 유틸리티 생성** (lib/statsCalculator.ts)
4. **PracticeRecordChart 컴포넌트** (차트 컴포넌트)
5. **StudentRecordModal 컴포넌트** (메인 모달)
6. **PracticeModeView 연결** (상세보기 버튼)
7. **StudentListModal 연결** (클릭 이벤트)
8. **ClassManagementModal 연결** (props 전달)
9. **테스트 및 UI 개선**

---

## 💡 디자인 원칙

- ✅ 현재 프로젝트의 디자인 시스템 유지 (Tailwind 클래스)
- ✅ 모달 레이아웃은 기존 모달들과 일관성 유지
- ✅ 차트는 직관적이고 읽기 쉽게
- ✅ 반응형 디자인 (모바일/태블릿 대응)
- ✅ 로딩 상태 표시

---

## 🔧 기술 스택

- **TypeScript**: 타입 안전성
- **Recharts**: 차트 라이브러리
- **Tailwind CSS**: 스타일링
- **Firebase Firestore**: 데이터 저장/조회
- **React Hooks**: 상태 관리

---

## 📊 Baseball-Firebase 참고 자료

### 주요 컴포넌트 구조

1. **StudentGameHistory** - 학생의 전체 경기 기록 + 차트 분석
   - 모든 경기를 테이블로 표시
   - 누적 통계 카드 6개 (경기수, 안타, 득점, 수비, 쿠키, 배지수)
   - Recharts로 시각화된 상세 통계 모달 (라인 차트 4개 + 바 차트 1개)

2. **StudentHistoryModal** - 최근 경기 요약 모달
   - 최근 N경기 (기본 3경기) 빠른 확인
   - 누적 통계 요약
   - "전체 기록 보기"로 StudentView 이동

3. **StudentView** - 학생 개인 대시보드
   - 배지 컬렉션
   - 경기 기록 (StudentGameHistory 포함)
   - 우리 반 랭킹

### 데이터 흐름

```
Firestore Collections
├─ competitions/{competitionId}/grades/{gradeId}/practiceRecords
│  └─ {recordId}: { studentId, eventId, score, date, sessionNumber, mode }
│
├─ classes/{classId}
│  └─ students: [{ id, name, personalBests: { eventId: { score, date } } }]
│
└─ grades/{gradeId}/stats
   └─ classStats: { eventId: { average, max, min, count } }
```

### 통계 계산 방식

```javascript
// reduce() 패턴 사용
totalStats = records.reduce((acc, record) => ({
  total: acc.total + record.score,
  count: acc.count + 1,
  max: Math.max(acc.max, record.score),
  min: Math.min(acc.min, record.score)
}), { total: 0, count: 0, max: 0, min: Infinity })

average = totalStats.total / totalStats.count
```

---

## 🎨 UI 디자인 가이드

### 색상 팔레트
- **Primary**: `indigo-600`, `green-500`
- **Success**: `green-600`
- **Warning**: `yellow-500`
- **Info**: `blue-500`
- **Neutral**: `slate-200`, `gray-50`

### 모달 스타일
```tsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
    {/* Header */}
    <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-4">
      ...
    </div>
    {/* Content */}
    <div className="flex-1 overflow-y-auto p-6">
      ...
    </div>
    {/* Footer */}
    <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
      ...
    </div>
  </div>
</div>
```

### 통계 카드
```tsx
<div className="grid grid-cols-4 gap-4">
  <div className="bg-indigo-50 rounded-xl p-4 border-2 border-indigo-200">
    <div className="text-sm font-bold text-indigo-900">총 연습 횟수</div>
    <div className="text-3xl font-black text-indigo-700 mt-2">24회</div>
  </div>
</div>
```

---

## ✅ 체크리스트

### Phase 1: 기초 설정
- [ ] Recharts 설치 및 설정
- [ ] TypeScript 타입 정의 추가
- [ ] Firestore 쿼리 함수 작성

### Phase 2: 컴포넌트 개발
- [ ] StatsCalculator 유틸리티
- [ ] PracticeRecordChart 컴포넌트
- [ ] StudentRecordModal 컴포넌트
- [ ] 로딩/에러 상태 처리

### Phase 3: UI 연결
- [ ] PracticeModeView에 상세보기 버튼
- [ ] StudentListModal 클릭 이벤트
- [ ] ClassManagementModal props 전달
- [ ] 모달 열기/닫기 상태 관리

### Phase 4: 테스트 & 최적화
- [ ] 실제 데이터로 테스트
- [ ] 반응형 디자인 확인
- [ ] 성능 최적화 (메모이제이션)
- [ ] 접근성 개선

### Phase 5: 추가 기능
- [ ] 학급 랭킹 표시
- [ ] 성장 인사이트 메시지
- [ ] 기록 필터링 기능
- [ ] PDF/이미지 내보내기

---

## 📝 참고 사항

- Baseball-Firebase의 코드를 직접 복사하지 말고, 개념과 패턴만 참고
- jumprope 프로젝트의 현재 디자인 시스템과 일관성 유지
- 사용자 경험을 최우선으로 고려
- 학생들의 성장이 시각적으로 명확하게 보이도록 차트 디자인

---

**작성일**: 2025-01-23
**버전**: 1.0
**상태**: 계획 수립 완료
