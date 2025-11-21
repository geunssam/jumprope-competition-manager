# 출전자 선택 시스템 구현 계획

## 📋 핵심 요구사항

### 기본 개념
- **모든 종목 (개인/짝/단체)**: 출전 학생만 선택 가능
- **개인전**: 출전 학생 개별 선택 (예: 1,2번 학생만)
- **짝줄넘기**: 2명 선택 시 자동 팀 생성 (예: 2,3번 → "2,3 팀" 자동 생성)
- **단체전**: 원하는 인원 선택 후 팀 생성
- **경기 기록**: 출전자만 테이블에 표시

### 사용자 의견 반영
1. ✅ **개인전 출전 수정**: 나중에 추가/제거 가능
2. ✅ **짝줄넘기 팀 생성**: 2명 선택 시 자동 생성 (버튼 클릭 불필요)
3. ✅ **팀 이름**: 학생 이름 포함 (예: "철수,영희 팀")

---

## 🎯 상세 시나리오

### 시나리오 1: 개인전 (앞으로 1단 뛰기)

**1학년 1반: 학생 5명 (1,2,3,4,5번)**

```
1. 교사가 "앞으로 1단 뛰기" 종목 체크
2. 📋 학생 선택 모달 자동 표시:

   ┌────────────────────────────────────────┐
   │ 앞으로 1단 뛰기 - 출전 학생 선택        │
   ├────────────────────────────────────────┤
   │ 1학년 1반 (5명)                         │
   │                                         │
   │ ☑ 1번 학생  ☑ 2번 학생  ☐ 3번 학생    │
   │ ☐ 4번 학생  ☐ 5번 학생                 │
   │                                         │
   │ 선택: 2명                               │
   │              [확인]                     │
   └────────────────────────────────────────┘

3. 확인 버튼 → 모달 닫힘
4. 경기 기록 테이블에 1,2번만 표시:

   ┌────────────────────────────────────────┐
   │ 1학년 1반 | 앞으로 1단 뛰기            │
   ├────────────────────────────────────────┤
   │ 1번 학생  [___] 개                     │
   │ 2번 학생  [___] 개                     │
   │                                         │
   │ 총점: 0점                               │
   └────────────────────────────────────────┘

5. 각 학생 점수 입력 → 자동 합산
```

**출전 학생 수정**:
- 경기 기록 테이블 상단 "✏️ 출전 수정" 버튼 클릭
- 다시 모달 열림 → 3번 추가 선택 가능

---

### 시나리오 2: 짝줄넘기 (번갈아 짝줄넘기)

**1학년 1반: 학생 5명 (1,2,3,4,5번)**

```
1. 교사가 "번갈아 짝줄넘기" 종목 체크
2. 🤝 팀 구성 모달 자동 표시:

   ┌────────────────────────────────────────┐
   │ 번갈아 짝줄넘기 - 팀 구성               │
   ├────────────────────────────────────────┤
   │ 1학년 1반 (5명)                         │
   │                                         │
   │ 학생 선택 (2명씩 선택하면 자동 팀 생성) │
   │ ☑ 2번 학생  ☑ 3번 학생  ☐ 4번 학생    │
   │ ☐ 5번 학생  ☐ 1번 학생                 │
   │                                         │
   │ 선택: 2명 → 자동 팀 생성!               │
   │                                         │
   │ 생성된 팀 (0팀):                        │
   │                                         │
   │              [완료]                     │
   └────────────────────────────────────────┘

3. 2,3번 체크 → 즉시 "2,3 팀" 자동 생성 → 체크 자동 해제:

   ┌────────────────────────────────────────┐
   │ 생성된 팀 (1팀):                        │
   │                                         │
   │ ┌──────────────────────────────┐       │
   │ │ 2,3 팀        [🗑️ 삭제]      │       │
   │ │ 2번 학생, 3번 학생            │       │
   │ └──────────────────────────────┘       │
   │                                         │
   │ 학생 선택 (2명씩):                      │
   │ ☐ 2번 학생  ☐ 3번 학생  ☑ 4번 학생    │
   │ ☑ 5번 학생  ☐ 1번 학생                 │
   │                                         │
   │ 선택: 2명 → 자동 팀 생성!               │
   └────────────────────────────────────────┘

4. 4,5번 체크 → "4,5 팀" 자동 생성:

   ┌────────────────────────────────────────┐
   │ 생성된 팀 (2팀):                        │
   │                                         │
   │ ┌──────────────────────────────┐       │
   │ │ 2,3 팀        [🗑️ 삭제]      │       │
   │ │ 2번 학생, 3번 학생            │       │
   │ └──────────────────────────────┘       │
   │                                         │
   │ ┌──────────────────────────────┐       │
   │ │ 4,5 팀        [🗑️ 삭제]      │       │
   │ │ 4번 학생, 5번 학생            │       │
   │ └──────────────────────────────┘       │
   │                                         │
   │              [완료]                     │
   └────────────────────────────────────────┘

5. 경기 기록 테이블에 팀별 표시:

   ┌────────────────────────────────────────┐
   │ 1학년 1반 | 번갈아 짝줄넘기            │
   ├────────────────────────────────────────┤
   │ 2,3 팀    [___] 개                     │
   │ (2번, 3번)                              │
   │                                         │
   │ 4,5 팀    [___] 개                     │
   │ (4번, 5번)                              │
   │                                         │
   │ 총점: 0점                               │
   └────────────────────────────────────────┘
```

**팀 삭제 시 자동 재정렬**:
- "2,3 팀" 삭제 → "4,5 팀"이 자동으로 "1팀"으로 재정렬
- 테이블에서도 즉시 반영

---

## 📦 데이터 구조

### 수정된 ClassResult

```typescript
// types.ts
export interface ClassResult {
  score: number;  // 학급 총점 (자동 합산)

  // 개인전용 (INDIVIDUAL)
  participantIds?: string[];  // 출전 학생 ID 배열 (NEW!)
  studentScores?: Record<string, number>;  // 학생별 점수

  // 짝/단체전용 (PAIR/TEAM)
  teams?: Team[];  // 팀 배열
}
```

### Team 인터페이스 (기존 유지)

```typescript
export interface Team {
  id: string;           // team_${timestamp}
  classId: string;      // 소속 학급
  eventId: string;      // 참가 종목
  name: string;         // "2,3 팀"
  memberIds: string[];  // 팀원 ID
  score: number;        // 팀 점수
}
```

### 데이터 저장 예시

```typescript
// 1학년 1반의 results
{
  "evt_1": {  // 앞으로 1단 뛰기 (INDIVIDUAL)
    "score": 25,
    "participantIds": ["std_1", "std_2"],  // 1,2번만 출전
    "studentScores": {
      "std_1": 10,
      "std_2": 15
    }
  },
  "evt_9": {  // 번갈아 짝줄넘기 (PAIR)
    "score": 83,
    "teams": [
      {
        "id": "team_1",
        "classId": "class_1",
        "eventId": "evt_9",
        "name": "2,3 팀",
        "memberIds": ["std_2", "std_3"],
        "score": 45
      },
      {
        "id": "team_2",
        "classId": "class_1",
        "eventId": "evt_9",
        "name": "4,5 팀",
        "memberIds": ["std_4", "std_5"],
        "score": 38
      }
    ]
  }
}
```

---

## 🛠️ 구현 단계

### Phase 1: 데이터 구조 수정 (15분)

**파일**: `types.ts`

**작업**:
```typescript
export interface ClassResult {
  score: number;

  // INDIVIDUAL용 (NEW!)
  participantIds?: string[];  // 출전 학생 ID 배열
  studentScores?: Record<string, number>;

  // PAIR/TEAM용
  teams?: Team[];
}
```

---

### Phase 2: 개인전 출전 학생 선택 모달 (45분)

**파일**: `components/ParticipantSelectionModal.tsx` (신규)

**Props**:
```typescript
interface ParticipantSelectionModalProps {
  event: CompetitionEvent;
  classTeam: ClassTeam;
  existingParticipantIds: string[];  // 기존 선택 학생
  onSave: (participantIds: string[]) => void;
  onClose: () => void;
}
```

**UI 구조**:
```tsx
<Modal>
  <Header>{event.name} - 출전 학생 선택</Header>

  {/* 학생 체크박스 그리드 */}
  <div className="grid grid-cols-3 gap-2">
    {classTeam.students.map(student => (
      <Checkbox
        key={student.id}
        checked={selectedIds.includes(student.id)}
        onChange={() => toggleStudent(student.id)}
      >
        {student.name}
      </Checkbox>
    ))}
  </div>

  {/* 선택 현황 */}
  <div className="text-sm text-slate-600">
    선택: {selectedIds.length}명
  </div>

  <Footer>
    <Button onClick={onClose}>취소</Button>
    <Button onClick={handleSave}>확인</Button>
  </Footer>
</Modal>
```

**주요 로직**:
```typescript
const handleSave = () => {
  onSave(selectedIds);  // participantIds 저장
};
```

---

### Phase 3: 짝/단체전 간편 팀 생성 모달 (1시간)

**파일**: `components/QuickTeamCreationModal.tsx` (신규)

**Props**:
```typescript
interface QuickTeamCreationModalProps {
  event: CompetitionEvent;
  classTeam: ClassTeam;
  existingTeams: Team[];
  onSave: (teams: Team[]) => void;
  onClose: () => void;
}
```

**UI 구조**:
```tsx
<Modal>
  <Header>{event.name} - 팀 구성</Header>

  {/* 생성된 팀 목록 */}
  <div className="space-y-2">
    <h4 className="font-bold">생성된 팀 ({teams.length}팀)</h4>
    {teams.map((team, idx) => (
      <div key={team.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
        <span className="flex-1">
          {idx + 1}팀: {team.name}
          <span className="text-xs text-slate-500 ml-2">
            ({team.memberIds.map(id =>
              classTeam.students.find(s => s.id === id)?.name
            ).join(', ')})
          </span>
        </span>
        <button onClick={() => handleDeleteTeam(team.id)}>
          🗑️ 삭제
        </button>
      </div>
    ))}
  </div>

  {/* 학생 선택 */}
  <div>
    <h4 className="font-bold">
      학생 선택 ({event.type === 'PAIR' ? '2명씩 선택하면 자동 팀 생성' : '원하는 인원 선택'})
    </h4>
    <div className="grid grid-cols-3 gap-2">
      {classTeam.students.map(student => (
        <Checkbox
          key={student.id}
          checked={selectedIds.includes(student.id)}
          onChange={() => toggleStudent(student.id)}
        >
          {student.name}
        </Checkbox>
      ))}
    </div>
    <div className="text-sm text-slate-600 mt-2">
      선택: {selectedIds.length}명
      {event.type === 'PAIR' && selectedIds.length === 2 && (
        <span className="text-green-600 font-bold ml-2">→ 자동 팀 생성!</span>
      )}
    </div>
  </div>

  {/* 단체전일 때만 "팀 생성" 버튼 */}
  {event.type === 'TEAM' && selectedIds.length > 0 && (
    <Button onClick={handleCreateTeam}>팀 생성</Button>
  )}

  <Footer>
    <Button onClick={onClose}>취소</Button>
    <Button onClick={handleSave}>완료</Button>
  </Footer>
</Modal>
```

**핵심 로직**:
```typescript
// 학생 선택/해제
const toggleStudent = (studentId: string) => {
  const newIds = selectedIds.includes(studentId)
    ? selectedIds.filter(id => id !== studentId)
    : [...selectedIds, studentId];

  setSelectedIds(newIds);

  // 짝줄넘기: 2명 선택 시 자동 팀 생성
  if (event.type === 'PAIR' && newIds.length === 2) {
    createTeamFromSelection(newIds);
  }
};

// 팀 자동 생성
const createTeamFromSelection = (memberIds: string[]) => {
  const memberNames = memberIds
    .map(id => classTeam.students.find(s => s.id === id)?.name)
    .filter(Boolean)
    .join(',');

  const newTeam: Team = {
    id: `team_${Date.now()}`,
    classId: classTeam.id,
    eventId: event.id,
    name: `${memberNames} 팀`,
    memberIds,
    score: 0
  };

  setTeams([...teams, newTeam]);
  setSelectedIds([]);  // 체크 해제
};

// 팀 삭제 + 자동 재정렬
const handleDeleteTeam = (teamId: string) => {
  const updatedTeams = teams
    .filter(t => t.id !== teamId)
    .map((team, idx) => {
      // 팀 이름 재정렬: "1팀", "2팀", "3팀"...
      const memberNames = team.memberIds
        .map(id => classTeam.students.find(s => s.id === id)?.name)
        .filter(Boolean)
        .join(',');

      return {
        ...team,
        name: `${memberNames} 팀`
      };
    });

  setTeams(updatedTeams);
};
```

---

### Phase 4: GradeView 통합 (30분)

**파일**: `components/GradeView.tsx`

**수정 사항**:

1. **모달 상태 관리**
```typescript
const [participantModalEvent, setParticipantModalEvent] = useState<CompetitionEvent | null>(null);
const [teamCreationModalEvent, setTeamCreationModalEvent] = useState<CompetitionEvent | null>(null);
```

2. **종목 선택 시 모달 자동 오픈**
```typescript
const handleToggleEvent = (eventId: string) => {
  const event = events.find(e => e.id === eventId);
  const currentConfig = gradeConfig.events[eventId] || { selected: false };
  const isSelecting = !currentConfig.selected;

  // 설정 업데이트
  onUpdateConfig({
    ...gradeConfig,
    events: {
      ...gradeConfig.events,
      [eventId]: {
        ...currentConfig,
        selected: isSelecting
      }
    }
  });

  // 선택 시 모달 오픈
  if (isSelecting && event) {
    if (gradeClasses.length === 0) {
      alert('먼저 학급을 등록해주세요.');
      return;
    }

    if (event.type === 'INDIVIDUAL') {
      setParticipantModalEvent(event);
    } else if (event.type === 'PAIR' || event.type === 'TEAM') {
      setTeamCreationModalEvent(event);
    }
  }
};
```

3. **모달 렌더링**
```tsx
{/* 개인전 출전 학생 선택 모달 */}
{participantModalEvent && (
  <ParticipantSelectionModal
    event={participantModalEvent}
    classTeam={gradeClasses[0]}  // 첫 번째 학급
    existingParticipantIds={
      gradeClasses[0]?.results[participantModalEvent.id]?.participantIds || []
    }
    onSave={(participantIds) => {
      // participantIds 저장 로직
      handleSaveParticipants(participantModalEvent.id, participantIds);
      setParticipantModalEvent(null);
    }}
    onClose={() => setParticipantModalEvent(null)}
  />
)}

{/* 짝/단체전 팀 구성 모달 */}
{teamCreationModalEvent && (
  <QuickTeamCreationModal
    event={teamCreationModalEvent}
    classTeam={gradeClasses[0]}
    existingTeams={
      gradeClasses[0]?.results[teamCreationModalEvent.id]?.teams || []
    }
    onSave={(teams) => {
      handleSaveTeams(teamCreationModalEvent.id, teams);
      setTeamCreationModalEvent(null);
    }}
    onClose={() => setTeamCreationModalEvent(null)}
  />
)}
```

---

### Phase 5: MatrixRecordTable 수정 (45분)

**파일**: `components/MatrixRecordTable.tsx`

**핵심 변경사항**:

1. **개인전: 출전 학생만 표시**
```tsx
{evt.type === 'INDIVIDUAL' && isExpanded && (
  <div className="space-y-1">
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] font-bold text-slate-500 uppercase">
        출전 학생 ({result?.participantIds?.length || 0}명)
      </p>
      <button
        onClick={() => handleEditParticipants(cls.id, evt.id)}
        className="text-xs text-indigo-600 hover:underline"
      >
        ✏️ 출전 수정
      </button>
    </div>

    {/* 출전 학생만 표시 */}
    {(result?.participantIds || []).map(studentId => {
      const student = cls.students.find(s => s.id === studentId);
      if (!student) return null;

      const studentScore = result?.studentScores?.[studentId] || 0;
      return (
        <div key={studentId} className="flex items-center gap-2">
          <span className="text-xs text-slate-700 flex-1">
            {student.name}
          </span>
          <input
            type="number"
            value={studentScore || ''}
            onChange={(e) => handleStudentScoreChange(
              cls.id,
              evt.id,
              studentId,
              parseInt(e.target.value) || 0
            )}
            className="w-16 px-2 py-1 text-xs text-center border border-slate-200 rounded"
          />
        </div>
      );
    })}

    {/* 출전 학생이 없을 때 */}
    {(!result?.participantIds || result.participantIds.length === 0) && (
      <p className="text-xs text-slate-400 text-center py-2">
        출전 학생을 선택해주세요
      </p>
    )}
  </div>
)}
```

2. **짝/단체전: 팀별 표시 (기존 유지)**
```tsx
{(evt.type === 'TEAM' || evt.type === 'PAIR') && isExpanded && (
  <div className="space-y-2">
    <p className="text-[10px] font-bold text-slate-500 uppercase">
      팀별 점수
    </p>
    {result?.teams?.map((team) => (
      <div key={team.id} className="bg-white rounded-lg p-2 border">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold">{team.name}</span>
          <input
            type="number"
            value={team.score || ''}
            onChange={(e) => handleTeamScoreChange(
              cls.id,
              evt.id,
              team.id,
              parseInt(e.target.value) || 0
            )}
            className="w-16 px-2 py-1 text-xs text-center border rounded"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {team.memberIds.map(memberId => {
            const student = cls.students.find(s => s.id === memberId);
            return (
              <span key={memberId} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded">
                {student?.name || '???'}
              </span>
            );
          })}
        </div>
      </div>
    ))}
  </div>
)}
```

3. **참가자 수 계산 수정**
```typescript
let participantCount = 0;
if (evt.type === 'INDIVIDUAL') {
  // 출전 학생 수만 카운트
  participantCount = result?.participantIds?.length || 0;
} else if (evt.type === 'TEAM' || evt.type === 'PAIR') {
  // 팀 전체 고유 멤버 수
  if (result?.teams && result.teams.length > 0) {
    const uniqueMembers = new Set(result.teams.flatMap(t => t.memberIds));
    participantCount = uniqueMembers.size;
  }
}
```

---

### Phase 6: 점수 계산 로직 검증 (15분)

**개인전 점수 합산**:
```typescript
// MatrixRecordTable.tsx
const handleStudentScoreChange = (classId: string, eventId: string, studentId: string, score: number) => {
  const updatedClasses = classes.map(c => {
    if (c.id !== classId) return c;

    const result = c.results[eventId] || { score: 0, participantIds: [], studentScores: {} };
    const newScores = { ...result.studentScores, [studentId]: score };

    // participantIds에 있는 학생만 합산
    const totalScore = (result.participantIds || [])
      .reduce((sum, id) => sum + (newScores[id] || 0), 0);

    return {
      ...c,
      results: {
        ...c.results,
        [eventId]: {
          ...result,
          studentScores: newScores,
          score: totalScore
        }
      }
    };
  });

  onUpdateClasses(updatedClasses);
};
```

**팀 점수 합산** (기존 유지):
```typescript
const handleTeamScoreChange = (classId: string, eventId: string, teamId: string, score: number) => {
  const updatedClasses = classes.map(c => {
    if (c.id !== classId) return c;

    const result = c.results[eventId];
    if (!result?.teams) return c;

    const updatedTeams = result.teams.map(t =>
      t.id === teamId ? { ...t, score } : t
    );

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

## 🎨 UI/UX 특징

### 1. 자동 팀 생성 (짝줄넘기)
- **2명 체크 → 즉시 팀 생성** → 체크 자동 해제
- **시각적 피드백**: "→ 자동 팀 생성!" 메시지 표시
- **애니메이션**: 팀 카드 부드럽게 추가

### 2. 팀 삭제 시 자동 재정렬
- 1팀 삭제 → 2팀이 1팀으로 자동 재정렬
- 테이블에도 즉시 반영
- 혼란 방지

### 3. 학생 이름 포함 팀명
- "철수,영희 팀" (직관적)
- "민수,지영,수연 팀" (단체전)

### 4. 출전자만 테이블 표시
- **개인전**: 1,2번만 (3,4,5번 제외)
- **짝/단체전**: 팀만 표시
- 불필요한 행 제거 → 깔끔한 UI

---

## ⏱️ 예상 소요 시간

| Phase | 작업 내용 | 시간 |
|-------|----------|------|
| 1 | 데이터 구조 수정 | 15분 |
| 2 | ParticipantSelectionModal | 45분 |
| 3 | QuickTeamCreationModal | 1시간 |
| 4 | GradeView 통합 | 30분 |
| 5 | MatrixRecordTable 수정 | 45분 |
| 6 | 점수 계산 검증 | 15분 |

**총 예상 시간: 3-4시간**

---

## ✅ 완료 체크리스트

### Phase 1
- [ ] `ClassResult.participantIds` 추가
- [ ] 데이터 구조 확인

### Phase 2
- [ ] `ParticipantSelectionModal.tsx` 생성
- [ ] 체크박스 선택 기능
- [ ] 출전 학생 저장

### Phase 3
- [ ] `QuickTeamCreationModal.tsx` 생성
- [ ] 짝줄넘기 2명 자동 팀 생성
- [ ] 팀 삭제 및 재정렬
- [ ] 학생 이름 포함 팀명

### Phase 4
- [ ] GradeView 모달 통합
- [ ] 종목별 모달 자동 오픈

### Phase 5
- [ ] MatrixRecordTable 출전자만 표시
- [ ] "✏️ 출전 수정" 버튼 추가
- [ ] 참가자 수 계산 수정

### Phase 6
- [ ] 개인전 점수 합산 검증
- [ ] 팀 점수 합산 검증
- [ ] 전체 총점 확인

---

## 🔧 기술적 변경사항

### 새 파일 (2개)
- `components/ParticipantSelectionModal.tsx`
- `components/QuickTeamCreationModal.tsx`

### 수정 파일 (3개)
- `types.ts` - ClassResult 확장
- `components/GradeView.tsx` - 모달 통합
- `components/MatrixRecordTable.tsx` - 출전자만 표시

### 삭제 파일 (2개)
- `components/TeamManagementModal.tsx` (불필요)
- `components/TeamCreationModal.tsx` (불필요)

---

**작성일**: 2025-01-21
**버전**: 2.0 (완전 개편)
**작성자**: Claude Code
