# 짝/단체 종목 팀 구성 시스템 구현 계획

## 📋 핵심 요구사항 (사용자 확정)

1. **팀 구성 시점**: 종목 선정 직후 - GradeView의 종목 선정 탭에서 PAIR/TEAM 종목 체크 시 즉시 팀 구성 모달 오픈
2. **팀 수 제한**: 학급당 종목별 최대 5개 팀
3. **학생 참여 정책**:
   - 선택 참가 (일부 학생 불참 가능)
   - **중복 참가 허용** - 1명의 학생이 여러 종목, 여러 팀에 중복 출전 가능
   - 예: 김철수가 개인(번갈아뛰기), 짝(2번과 A팀, 3번과 B팀), 단체(8자 줄넘기) 모두 참가 가능
4. **UI 방식**: 모달 기반 팀 관리

---

## 🎯 수정된 워크플로우

### 종목 선정 → 팀 구성 흐름
```
1. 교사가 "번갈아 짝줄넘기" 체크
2. 즉시 "팀 구성 모달" 자동 오픈
3. 참가 학급 선택 → 각 학급별 팀 구성
4. 완료 후 종목 선정 목록에 표시: "✓ 번갈아 짝줄넘기 (3개 학급, 총 8팀)"
```

### 상세 사용자 시나리오

**시나리오 1: 짝줄넘기 (번갈아 짝줄넘기)**

1. 교사가 1학년 탭 → 종목 선정에서 "번갈아 짝줄넘기" 체크
2. 팀 구성 모달 자동 오픈:
   ```
   ┌────────────────────────────────────────┐
   │ 번갈아 짝줄넘기 - 팀 구성               │
   ├────────────────────────────────────────┤
   │ 참가 학급 선택:                         │
   │ ☑ 1반 (20명)  ☑ 2반 (22명)  ☐ 3반     │
   │                                         │
   │ 1반 팀 구성 (0/5팀):                   │
   │ [+ 팀 추가]                             │
   │                                         │
   │ 2반 팀 구성 (0/5팀):                   │
   │ [+ 팀 추가]                             │
   │                                         │
   │              [완료]                     │
   └────────────────────────────────────────┘
   ```

3. "1반 [+ 팀 추가]" 클릭 → 팀 생성 모달:
   ```
   ┌────────────────────────────────────────┐
   │ 1반 - 번갈아 짝줄넘기 팀 생성          │
   ├────────────────────────────────────────┤
   │ 팀 이름: [1반 A팀______________]       │
   │                                         │
   │ 팀원 선택 (2명 필수):                  │
   │ ☑ 김철수  ☑ 이영희  ☐ 박민수          │
   │ ☐ 정지훈  ☐ 최수연  ☐ 강민지          │
   │                                         │
   │ 선택: 2/2명                             │
   │                                         │
   │ [취소]              [팀 생성]          │
   └────────────────────────────────────────┘
   ```

4. 여러 팀 생성 (최대 5팀):
   ```
   ┌────────────────────────────────────────┐
   │ 번갈아 짝줄넘기 - 팀 구성               │
   ├────────────────────────────────────────┤
   │ 1반 팀 구성 (3/5팀):                   │
   │                                         │
   │ ┌──────────────────────────────┐       │
   │ │ 1반 A팀  ✏️ 🗑️              │       │
   │ │ 김철수, 이영희                │       │
   │ └──────────────────────────────┘       │
   │                                         │
   │ ┌──────────────────────────────┐       │
   │ │ 1반 B팀  ✏️ 🗑️              │       │
   │ │ 박민수, 정지훈                │       │
   │ └──────────────────────────────┘       │
   │                                         │
   │ ┌──────────────────────────────┐       │
   │ │ 1반 C팀  ✏️ 🗑️              │       │
   │ │ 김철수, 최수연  ⚠️중복        │       │
   │ └──────────────────────────────┘       │
   │                                         │
   │ [+ 팀 추가] (최대 2팀 더)              │
   └────────────────────────────────────────┘
   ```

**시나리오 2: 단체 종목 (8자 줄넘기, 6명)**

1. 교사가 "8자 줄넘기" 체크, 참가 인원 6명 입력
2. 팀 구성 모달 오픈
3. 팀 생성 시 정확히 6명 선택 필수

---

## 📦 데이터 구조

### 새로 추가되는 타입

```typescript
// types.ts
export interface Team {
  id: string;           // 고유 ID: team_${timestamp}
  classId: string;      // 소속 학급 ID
  eventId: string;      // 참가 종목 ID
  name: string;         // 팀 이름: "1반 A팀"
  memberIds: string[];  // 팀원 ID 배열 (중복 허용)
  score: number;        // 팀 점수
}

// 기존 ClassResult 수정
export interface ClassResult {
  score: number;        // 학급 총점 (개인전: 합산, 팀전: 모든 팀 점수 합)

  // INDIVIDUAL 종목용
  studentScores?: Record<string, number>;

  // PAIR/TEAM 종목용
  teams?: Team[];       // 최대 5개 팀
}
```

### 데이터 저장 예시

```typescript
// 1반의 results 구조
{
  "evt_9": {  // 번갈아 짝줄넘기
    "score": 135,
    "teams": [
      {
        "id": "team_1",
        "classId": "class_1",
        "eventId": "evt_9",
        "name": "1반 A팀",
        "memberIds": ["std_1", "std_2"],
        "score": 45
      },
      {
        "id": "team_2",
        "classId": "class_1",
        "eventId": "evt_9",
        "name": "1반 B팀",
        "memberIds": ["std_3", "std_4"],
        "score": 38
      },
      {
        "id": "team_3",
        "classId": "class_1",
        "eventId": "evt_9",
        "name": "1반 C팀",
        "memberIds": ["std_1", "std_5"],  // std_1 중복 참가
        "score": 52
      }
    ]
  }
}
```

---

## 🛠️ 구현 단계

### Phase 1: 데이터 구조 확장 (20분)

**파일**: `types.ts`, `App.tsx`

**작업**:
1. `Team` 인터페이스 추가
2. `ClassResult.teams` 필드 추가
3. App.tsx 마이그레이션 로직:
   ```typescript
   const DATA_VERSION = '2.1';

   // 기존 teamParticipantIds → teams 변환
   if (result.teamParticipantIds && !result.teams) {
     result.teams = [{
       id: `team_${classId}_${eventId}_1`,
       classId,
       eventId,
       name: `${className} 1팀`,
       memberIds: result.teamParticipantIds,
       score: result.score
     }];
     delete result.teamParticipantIds;
   }
   ```

**테스트**:
- 기존 데이터 마이그레이션 확인
- localStorage 구조 확인

---

### Phase 2: TeamManagementModal 개발 (1시간)

**파일**: `components/TeamManagementModal.tsx` (신규)

**Props**:
```typescript
interface TeamManagementModalProps {
  isOpen: boolean;
  event: CompetitionEvent;
  classes: ClassTeam[];
  gradeConfig: GradeConfig;
  onClose: () => void;
  onSave: (classResults: Record<string, ClassResult>) => void;
}
```

**UI 구조**:
```tsx
<Modal>
  <Header>{event.name} - 팀 구성</Header>

  {/* 참가 학급 선택 */}
  <ClassSelector
    classes={classes}
    selectedClassIds={selectedClassIds}
    onChange={setSelectedClassIds}
  />

  {/* 각 학급별 팀 구성 섹션 */}
  {selectedClassIds.map(classId => (
    <ClassTeamSection
      key={classId}
      class={getClassById(classId)}
      event={event}
      teams={classTeams[classId] || []}
      onAddTeam={() => openTeamCreationModal(classId)}
      onEditTeam={(teamId) => openTeamEditModal(classId, teamId)}
      onDeleteTeam={(teamId) => handleDeleteTeam(classId, teamId)}
      maxTeams={5}
    />
  ))}

  <Footer>
    <Button onClick={onClose}>취소</Button>
    <Button onClick={handleSave}>완료</Button>
  </Footer>
</Modal>
```

**주요 기능**:
- 학급당 최대 5팀 제한
- 팀 목록 표시 (이름, 팀원, 수정/삭제 버튼)
- 중복 참가 학생 표시 (⚠️ 아이콘)

---

### Phase 3: TeamCreationModal 개발 (1시간)

**파일**: `components/TeamCreationModal.tsx` (신규)

**Props**:
```typescript
interface TeamCreationModalProps {
  isOpen: boolean;
  classTeam: ClassTeam;
  event: CompetitionEvent;
  existingTeam?: Team;  // 수정 모드일 때
  allTeams: Team[];     // 중복 체크용
  onClose: () => void;
  onSave: (team: Omit<Team, 'id' | 'score'>) => void;
}
```

**UI 구조**:
```tsx
<Modal>
  <Header>
    {existingTeam ? '팀 수정' : '팀 생성'} - {event.name}
  </Header>

  {/* 팀 이름 입력 */}
  <Input
    value={teamName}
    onChange={setTeamName}
    placeholder="예: 1반 A팀"
  />

  {/* 학생 선택 그리드 */}
  <StudentGrid>
    {classTeam.students.map(student => (
      <StudentCheckbox
        key={student.id}
        student={student}
        checked={selectedIds.includes(student.id)}
        onChange={toggleStudent}
        badge={getDuplicateBadge(student.id)}  // 중복 참가 표시
      />
    ))}
  </StudentGrid>

  {/* 선택 상태 표시 */}
  <SelectionStatus>
    선택: {selectedIds.length}/{requiredCount}명
    {selectedIds.length !== requiredCount && (
      <Warning>정확히 {requiredCount}명을 선택하세요</Warning>
    )}
  </SelectionStatus>

  <Footer>
    <Button onClick={onClose}>취소</Button>
    <Button
      disabled={selectedIds.length !== requiredCount}
      onClick={handleSave}
    >
      {existingTeam ? '수정' : '생성'}
    </Button>
  </Footer>
</Modal>
```

**유효성 검사**:
```typescript
const requiredCount = event.type === 'PAIR' ? 2 :
  (gradeConfig.events[event.id]?.targetParticipants || 0);

const isValid = selectedIds.length === requiredCount;
```

**중복 참가 표시**:
- 같은 종목의 다른 팀에 속한 학생: "A팀", "B팀" 배지
- 다른 종목에 참가 중인 학생: 표시 없음 (허용)

---

### Phase 4: GradeView 통합 (45분)

**파일**: `components/GradeView.tsx`

**수정 사항**:

1. **종목 체크 시 팀 구성 모달 오픈**
```typescript
const handleToggleEvent = (eventId: string) => {
  const event = events.find(e => e.id === eventId);
  const currentConfig = gradeConfig.events[eventId] || { selected: false };

  if (!currentConfig.selected && (event?.type === 'PAIR' || event?.type === 'TEAM')) {
    // 체크 시 팀 구성 모달 오픈
    setSelectedEventForTeamSetup(eventId);
    setTeamManagementModalOpen(true);
  }

  // 기존 토글 로직...
};
```

2. **팀 구성 모달 상태 관리**
```typescript
const [teamManagementModalOpen, setTeamManagementModalOpen] = useState(false);
const [selectedEventForTeamSetup, setSelectedEventForTeamSetup] = useState<string | null>(null);
```

3. **팀 정보 표시**
```typescript
{config.selected && (evt.type === 'PAIR' || evt.type === 'TEAM') && (
  <div className="mt-2">
    <button
      onClick={() => openTeamManagementModal(evt.id)}
      className="text-xs text-indigo-600"
    >
      {getTeamSummary(evt.id)}  {/* "3개 학급, 총 8팀" */}
    </button>
  </div>
)}
```

---

### Phase 5: MatrixRecordTable 점수 입력 UI (1시간)

**파일**: `components/MatrixRecordTable.tsx`

**수정 사항**:

1. **팀별 점수 입력 UI**
```tsx
{(evt.type === 'TEAM' || evt.type === 'PAIR') && isExpanded && (
  <div className="space-y-2">
    {result?.teams?.map(team => (
      <div key={team.id} className="flex items-center gap-2 p-2 bg-white rounded border">
        <div className="flex-1">
          <div className="font-medium text-sm">{team.name}</div>
          <div className="text-xs text-slate-500">
            {team.memberIds
              .map(id => cls.students.find(s => s.id === id)?.name)
              .join(', ')}
          </div>
        </div>
        <input
          type="number"
          value={team.score || ''}
          onChange={(e) => handleTeamScoreChange(
            cls.id,
            evt.id,
            team.id,
            parseInt(e.target.value) || 0
          )}
          className="w-16 px-2 py-1 text-center border rounded"
        />
        <span className="text-xs text-slate-400">점</span>
      </div>
    ))}

    {/* 총점 표시 */}
    <div className="pt-2 border-t">
      <span className="text-sm font-bold">총점: {result.score}점</span>
    </div>
  </div>
)}
```

2. **점수 자동 합산**
```typescript
const handleTeamScoreChange = (classId: string, eventId: string, teamId: string, score: number) => {
  const updatedClasses = classes.map(c => {
    if (c.id !== classId) return c;

    const result = c.results[eventId];
    if (!result?.teams) return c;

    const updatedTeams = result.teams.map(t =>
      t.id === teamId ? { ...t, score } : t
    );

    // 총점 자동 계산
    const totalScore = updatedTeams.reduce((sum, t) => sum + t.score, 0);

    return {
      ...c,
      results: {
        ...c.results,
        [eventId]: {
          ...result,
          teams: updatedTeams,
          score: totalScore
        }
      }
    };
  });

  onUpdateClasses(updatedClasses);
};
```

---

### Phase 6: 테스트 및 디버깅 (30분)

**테스트 시나리오**:

1. ✅ **기본 팀 생성**
   - 1반에서 짝줄넘기 3팀 생성
   - 각 팀 2명씩 선택
   - 팀 이름 자동 생성 확인

2. ✅ **중복 참가**
   - 김철수가 A팀과 B팀 모두 참가
   - 중복 표시 확인
   - 점수 입력 정상 동작

3. ✅ **최대 팀 수 제한**
   - 5팀 생성 후 "팀 추가" 버튼 비활성화
   - 경고 메시지 표시

4. ✅ **점수 자동 합산**
   - A팀 45점, B팀 38점, C팀 52점 입력
   - 총점 135점 자동 계산

5. ✅ **팀 수정/삭제**
   - 팀원 변경
   - 팀 삭제 후 총점 재계산

6. ✅ **데이터 마이그레이션**
   - 기존 데이터 정상 변환
   - localStorage 확인

---

## 💡 주요 기능 특징

### 1. 중복 참가 허용
- 한 학생이 같은 종목의 여러 팀에 참가 가능
- 다른 종목에도 자유롭게 참가 가능
- UI에서 중복 상태 표시 (⚠️ 아이콘 + 팀명 배지)

### 2. 5팀 제한
- 학급당 종목별 최대 5개 팀
- UI 복잡도 관리
- 성능 최적화

### 3. 즉시 팀 구성
- 종목 체크 시 자동으로 팀 구성 모달 오픈
- 종목 선정과 팀 구성을 한 번에 처리
- 혼란 방지

### 4. 자동 이름 생성
- "1반 A팀", "1반 B팀" 형식
- 수정 가능

### 5. 점수 자동 합산
- 팀별 점수 입력 시 학급 총점 자동 계산
- 실시간 업데이트

---

## 🎨 UI/UX 고려사항

### 모달 디자인
- **배경 dim 처리**: 모달 외부 영역 어둡게
- **ESC 키로 닫기**: 키보드 접근성
- **애니메이션**: 부드러운 페이드인/아웃

### 학생 선택 그리드
- **3-4열 그리드**: 한 눈에 보기
- **체크박스 크기**: 터치하기 쉽게 큰 사이즈
- **중복 표시**: 작은 배지로 시각적 피드백

### 에러 처리
- **유효성 검사 실패**: 빨간색 경고 메시지
- **최대 팀 수 초과**: "최대 5팀까지 생성 가능합니다"
- **인원수 부족**: "정확히 2명을 선택하세요"

### 성공 피드백
- **팀 생성 완료**: 녹색 토스트 메시지
- **점수 저장**: 자동 저장 표시

---

## ⏱️ 예상 소요 시간

| Phase | 작업 내용 | 시간 |
|-------|----------|------|
| 1 | 데이터 구조 확장 | 20분 |
| 2 | TeamManagementModal | 1시간 |
| 3 | TeamCreationModal | 1시간 |
| 4 | GradeView 통합 | 45분 |
| 5 | MatrixRecordTable UI | 1시간 |
| 6 | 테스트 및 디버깅 | 30분 |

**총 예상 시간: 4-5시간**

---

## 📝 추가 개선 사항 (향후)

### 선택사항 1: 랜덤 팀 생성
- "자동 팀 생성" 버튼
- 학급 전체 학생을 자동으로 팀 배정
- 성별 균형 옵션

### 선택사항 2: 팀 템플릿
- 자주 사용하는 팀 구성 저장
- 다른 종목에 재사용

### 선택사항 3: 학생별 통계
- 학생별 참가 종목 수
- 평균 점수 계산
- MVP 표시

---

## ✅ 완료 체크리스트

### 개발 완료 기준
- [ ] Phase 1-6 모든 단계 완료
- [ ] 모든 테스트 시나리오 통과
- [ ] 기존 INDIVIDUAL 종목 정상 작동
- [ ] 데이터 마이그레이션 정상 작동
- [ ] 반응형 디자인 적용
- [ ] 접근성 확인 (키보드 네비게이션)

### 문서화
- [ ] TEAM_MANAGEMENT_PLAN.md 완성
- [ ] README 업데이트
- [ ] 주요 컴포넌트 JSDoc 주석

---

**작성일**: 2025-01-21
**버전**: 1.0
**작성자**: Claude Code
