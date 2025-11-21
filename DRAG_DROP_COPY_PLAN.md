# 종목 복사 및 드래그 앤 드롭 기능 구현 계획

## 📋 구현 개요
- **목표**: SettingsView의 종목 관리에 복사 기능과 드래그 앤 드롭 순서 조절 기능 추가
- **복사 범위**: 종목 기본 정보 + 출전 인원/팀 구성 모두 복사
- **이름 처리**: 번호 자동 증가 (예: "긴줄넘기" → "긴줄넘기 2" → "긴줄넘기 3")
- **UI 위치**: SettingsView (종목 설정 탭)
- **드래그 UX**: 드래그 핸들 아이콘 + 드롭 위치 하이라이트

## 🔧 Phase 1: 라이브러리 설치 (5분)
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```
- **이유**: 2025년 기준 가장 안정적이고 React 19와 완벽 호환
- **장점**: TypeScript 지원, 접근성 내장, 모바일/터치 지원

## 📝 Phase 2: 종목 복사 기능 구현 (30분)

### 2.1 `components/SettingsView.tsx` 수정
- **lucide-react**에서 `Copy`, `GripVertical` 아이콘 import
- `handleCopyEvent` 함수 추가:
  - 같은 이름 패턴의 종목 찾기 (정규식)
  - 가장 큰 번호 찾아서 +1
  - 새 종목 생성 (고유 ID: `evt_${Date.now()}_${random}`)
  - 원본 바로 다음에 삽입
- 복사 버튼 UI 추가 (수정 버튼 옆)

### 2.2 번호 자동 증가 로직
```typescript
const handleCopyEvent = (event: CompetitionEvent) => {
  // 1. 패턴 추출 ("긴줄넘기 2" → "긴줄넘기")
  const namePattern = event.name.replace(/\s*\d+$/, '');

  // 2. 같은 패턴의 최대 번호 찾기
  const relatedEvents = events.filter(e => e.name.startsWith(namePattern));
  let maxNumber = relatedEvents.length === 1 ? 1 : /* 최대 번호 */;

  // 3. 새 이름 생성
  const newName = maxNumber === 1 ? `${namePattern} 2` : `${namePattern} ${maxNumber + 1}`;

  // 4. 새 종목 생성 및 삽입
};
```

## 🎯 Phase 3: SortableEventCard 컴포넌트 생성 (40분)

### 3.1 `components/SortableEventCard.tsx` (새 파일 생성)
- `useSortable` 훅 사용
- 드래그 핸들 영역 추가 (카드 왼쪽 상단)
- 드래그 중 시각적 피드백:
  - 투명도 50%
  - 파란색 테두리 (ring-2 ring-indigo-500)
- 기존 카드 UI 컴포넌트화

### 3.2 Props 인터페이스
```typescript
interface SortableEventCardProps {
  event: CompetitionEvent;
  isEditing: boolean;
  tempEvent?: Partial<CompetitionEvent>;
  onEdit: (event: CompetitionEvent) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onCopy: (event: CompetitionEvent) => void;
  onTempChange: (updates: Partial<CompetitionEvent>) => void;
}
```

## 🔄 Phase 4: SettingsView에 DnD 통합 (40분)

### 4.1 DndContext 설정
- `DndContext` 래퍼 추가
- `SortableContext`로 현재 탭의 종목 목록 감싸기
- `DragOverlay`로 드래그 미리보기 표시

### 4.2 이벤트 핸들러
```typescript
const handleDragEnd = (event: DragEndEvent) => {
  // 1. 현재 탭의 종목만 추출
  const currentTabEvents = events.filter(e => e.type === activeTab);
  const otherEvents = events.filter(e => e.type !== activeTab);

  // 2. arrayMove로 순서 변경
  const reordered = arrayMove(currentTabEvents, oldIndex, newIndex);

  // 3. 전체 배열 재구성 (탭별로 그룹화 유지)
  onUpdateEvents([...individualEvents, ...pairEvents, ...teamEvents]);
};
```

### 4.3 센서 추가 (모바일/키보드 지원)
```typescript
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(TouchSensor),
  useSensor(KeyboardSensor)
);
```

## 🎨 Phase 5: 시각적 개선 (20분)

### 5.1 드래그 핸들 디자인
- 6개 점 패턴 SVG (::⋮⋮)
- 회색 색상 (text-slate-400)
- 호버 시 커서 변경 (cursor-grab → cursor-grabbing)

### 5.2 드롭 영역 하이라이트
- 드래그 중인 카드 위/아래에 파란색 선 표시
- 부드러운 트랜지션 애니메이션

### 5.3 DragOverlay 스타일
```tsx
<DragOverlay>
  {activeId ? (
    <div className="opacity-80 rotate-2 shadow-2xl">
      <EventCard event={activeEvent} />
    </div>
  ) : null}
</DragOverlay>
```

## ✅ 테스트 체크리스트

### 기능 테스트
- [ ] 종목 복사 시 번호가 올바르게 증가하는가
- [ ] 복사된 종목이 원본 바로 다음에 삽입되는가
- [ ] 같은 탭 내에서 드래그로 순서 변경 가능한가
- [ ] 다른 탭으로 이동해도 순서가 유지되는가
- [ ] localStorage에 순서가 올바르게 저장되는가

### UX 테스트
- [ ] 드래그 핸들이 명확하게 보이는가
- [ ] 드래그 중 시각적 피드백이 적절한가
- [ ] 모바일/터치 환경에서 드래그 가능한가
- [ ] 키보드로도 순서 변경 가능한가 (접근성)

## 📁 수정/생성될 파일 목록

### 수정
1. `components/SettingsView.tsx`
   - import 추가 (dnd-kit, Copy, GripVertical)
   - handleCopyEvent 함수 추가
   - DndContext 래퍼 추가
   - handleDragStart, handleDragEnd 추가
   - 복사 버튼 UI 추가

### 생성
2. `components/SortableEventCard.tsx` (새 파일)
   - 드래그 가능한 종목 카드 컴포넌트

### 자동 생성
3. `package.json` 및 `package-lock.json`
   - @dnd-kit 라이브러리 의존성 추가

## ⏱️ 예상 소요 시간
- **라이브러리 설치**: 5분
- **복사 기능**: 30분
- **SortableEventCard**: 40분
- **DnD 통합**: 40분
- **시각적 개선**: 20분
- **테스트**: 15분
- **총 2시간 30분**

## 🚀 구현 순서
1. 라이브러리 설치
2. 복사 기능 먼저 구현 및 테스트 → 빠른 결과 확인
3. SortableEventCard 컴포넌트 생성
4. SettingsView에 DnD 통합
5. 시각적 개선 및 최종 테스트

## 📚 참고 자료
- [@dnd-kit 공식 문서](https://docs.dndkit.com/)
- [SortableContext 예제](https://docs.dndkit.com/presets/sortable)
- [드래그 센서 설정](https://docs.dndkit.com/api-documentation/sensors)
