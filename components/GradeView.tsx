import React, { useState, useMemo } from 'react';
import { ClassTeam, CompetitionEvent, GradeConfig, Student, Team } from '../types';
import { Button } from './Button';
import { Plus, Trash, CheckSquare, Square, Users, Trophy, ClipboardList, Settings2, Medal, UserPlus, ChevronDown, ChevronUp, Check, AlertCircle, X } from 'lucide-react';
import { MatrixRecordTable } from './MatrixRecordTable';
import { CreateClassModal } from './CreateClassModal';
import { MultiClassParticipantModal } from './MultiClassParticipantModal';
import { MultiClassTeamCreationModal } from './MultiClassTeamCreationModal';

interface GradeViewProps {
  grade: number;
  classes: ClassTeam[];
  events: CompetitionEvent[];
  gradeConfig: GradeConfig;
  onUpdateClasses: (classes: ClassTeam[]) => void;
  onUpdateConfig: (config: GradeConfig) => void;
}

type TabType = 'MANAGEMENT' | 'EVENTS' | 'RECORDS' | 'RESULTS';
type EventSubTab = 'INDIVIDUAL' | 'PAIR' | 'TEAM';

export const GradeView: React.FC<GradeViewProps> = ({
  grade,
  classes,
  events,
  gradeConfig,
  onUpdateClasses,
  onUpdateConfig,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('MANAGEMENT');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeEventTab, setActiveEventTab] = useState<EventSubTab>('INDIVIDUAL');

  // For Records Tab
  const [selectedRecordEventId, setSelectedRecordEventId] = useState<string | null>(null);

  // For Multi-Class Participant/Team Management
  const [multiClassParticipantModalEvent, setMultiClassParticipantModalEvent] = useState<CompetitionEvent | null>(null);
  const [multiClassTeamModalEvent, setMultiClassTeamModalEvent] = useState<CompetitionEvent | null>(null);

  // Filter classes for this grade
  const gradeClasses = useMemo(() => 
    classes.filter(c => c.grade === grade), 
  [classes, grade]);

  // Filter active events for this grade
  const activeEvents = useMemo(() => {
    if (!gradeConfig || !gradeConfig.events) return [];
    return events.filter(e => gradeConfig.events[e.id]?.selected);
  }, [events, gradeConfig]);

  // --- Handlers ---

  const handleAddClass = (className: string, students: Student[]) => {
    const newClass: ClassTeam = {
      id: `cls_${Date.now()}`,
      grade,
      name: className,
      students: students,
      results: {}
    };

    onUpdateClasses([...classes, newClass]);
    setIsCreateModalOpen(false);
  };

  const handleRemoveClass = (id: string) => {
    if (confirm('해당 학급을 삭제하시겠습니까? 점수 데이터도 함께 삭제됩니다.')) {
      onUpdateClasses(classes.filter(c => c.id !== id));
    }
  };

  const handleToggleEvent = (eventId: string) => {
    const currentConfig = gradeConfig.events[eventId] || { selected: false, targetParticipants: 0 };
    const event = events.find(e => e.id === eventId);
    const isSelecting = !currentConfig.selected;

    // Update config first
    onUpdateConfig({
      ...gradeConfig,
      events: {
        ...gradeConfig.events,
        [eventId]: {
          ...currentConfig,
          selected: isSelecting,
          targetParticipants: currentConfig.targetParticipants || event?.defaultMaxParticipants || 0
        }
      }
    });

    // If deselecting, no need to open modal
    if (!isSelecting) {
      return;
    }

    // If selecting, open unified modal for all classes
    if (!event) return;

    if (gradeClasses.length === 0) {
      alert('먼저 학급을 등록해주세요.');
      return;
    }

    // Open unified modal based on event type
    if (event.type === 'INDIVIDUAL') {
      setMultiClassParticipantModalEvent(event);
    } else {
      setMultiClassTeamModalEvent(event);
    }
  };

  // Save multi-class participants (INDIVIDUAL events)
  const handleSaveMultiClassParticipants = (data: Record<string, string[]>) => {
    const eventId = multiClassParticipantModalEvent?.id;
    if (!eventId) return;

    const updatedClasses = classes.map(c => {
      const participantIds = data[c.id] || [];
      if (participantIds.length === 0 && !c.results[eventId]) return c; // No change

      const result = c.results[eventId] || { score: 0, studentScores: {} };

      // Calculate score only for participants
      const totalScore = participantIds.reduce((sum, id) => {
        return sum + (result.studentScores?.[id] || 0);
      }, 0);

      return {
        ...c,
        results: {
          ...c.results,
          [eventId]: {
            ...result,
            participantIds,
            score: totalScore
          }
        }
      };
    });

    onUpdateClasses(updatedClasses);
    setMultiClassParticipantModalEvent(null);
  };

  // Save multi-class teams (TEAM/PAIR events)
  const handleSaveMultiClassTeams = (data: Record<string, Team[]>) => {
    const eventId = multiClassTeamModalEvent?.id;
    if (!eventId) return;

    const updatedClasses = classes.map(c => {
      const teams = data[c.id] || [];
      if (teams.length === 0 && !c.results[eventId]) return c; // No change

      const result = c.results[eventId] || { score: 0 };
      const totalScore = teams.reduce((sum, t) => sum + t.score, 0);

      return {
        ...c,
        results: {
          ...c.results,
          [eventId]: {
            ...result,
            teams,
            score: totalScore
          }
        }
      };
    });

    onUpdateClasses(updatedClasses);
    setMultiClassTeamModalEvent(null);
  };

  const handleEventParticipantChange = (eventId: string, count: number) => {
    const currentConfig = gradeConfig.events[eventId] || { selected: false, targetParticipants: 0 };
    onUpdateConfig({
      ...gradeConfig,
      events: {
        ...gradeConfig.events,
        [eventId]: {
          ...currentConfig,
          targetParticipants: count
        }
      }
    });
  };

  // --- Scoring Handlers ---

  // For Team Events: Update total score
  const handleTeamScoreChange = (classId: string, eventId: string, score: number) => {
    const updatedClasses = classes.map(c => {
      if (c.id !== classId) return c;
      const currentResult = c.results[eventId] || { score: 0 };
      return {
        ...c,
        results: {
          ...c.results,
          [eventId]: { ...currentResult, score }
        }
      };
    });
    onUpdateClasses(updatedClasses);
  };

  // For Team Events: Toggle participating student
  const handleTeamParticipantToggle = (classId: string, eventId: string, studentId: string) => {
    const updatedClasses = classes.map(c => {
      if (c.id !== classId) return c;
      const currentResult = c.results[eventId] || { score: 0 };
      const currentIds = currentResult.teamParticipantIds || [];
      
      const newIds = currentIds.includes(studentId)
        ? currentIds.filter(id => id !== studentId)
        : [...currentIds, studentId];

      return {
        ...c,
        results: {
          ...c.results,
          [eventId]: { ...currentResult, teamParticipantIds: newIds }
        }
      };
    });
    onUpdateClasses(updatedClasses);
  };

  // For Individual Events: Update specific student score
  const handleIndividualScoreChange = (classId: string, eventId: string, studentId: string, score: number) => {
    const updatedClasses = classes.map(c => {
      if (c.id !== classId) return c;
      const currentResult = c.results[eventId] || { score: 0 };
      const currentScores = currentResult.studentScores || {};

      const newScores = { ...currentScores, [studentId]: score };
      
      // Recalculate total class score for this event (Sum of all individuals)
      // You could change this logic to "Average" or "Top N" if needed.
      const totalScore = Object.values(newScores).reduce((sum: number, val: number) => sum + (val || 0), 0);

      return {
        ...c,
        results: {
          ...c.results,
          [eventId]: { 
            ...currentResult, 
            studentScores: newScores,
            score: totalScore
          }
        }
      };
    });
    onUpdateClasses(updatedClasses);
  };

  const calculateTotalScore = (classTeam: ClassTeam) => {
    let total = 0;
    activeEvents.forEach(evt => {
      const res = classTeam.results[evt.id];
      if (res) total += res.score;
    });
    return total;
  };

  // --- Render Components ---

  const renderTabs = () => {
    const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
      { id: 'MANAGEMENT', label: '학급/학생 관리', icon: Users },
      { id: 'EVENTS', label: '경기 종목 선정', icon: Settings2 },
      { id: 'RECORDS', label: '경기 기록 입력', icon: ClipboardList },
      { id: 'RESULTS', label: '경기 결과 종합', icon: Trophy },
    ];

    return (
      <div className="flex border-b border-slate-200 bg-white px-6 sticky top-0 z-20 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  const renderManagementTab = () => (
    <div className="max-w-4xl mx-auto p-8 animate-in fade-in duration-300">
      {/* Create Class Button */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-900">학급 관리</h3>
          <p className="text-slate-500 mt-1">학급을 생성하고 학생을 등록하세요.</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          학급 생성
        </Button>
      </div>

      {/* Class List */}
      <div className="grid gap-4">
        {gradeClasses.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border-2 border-dashed border-slate-200">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium mb-2">등록된 학급이 없습니다.</p>
            <p className="text-sm text-slate-400 mb-4">
              학급 생성 버튼을 눌러 첫 학급을 등록해보세요.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              첫 학급 생성하기
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center px-1 mb-2">
              <h4 className="font-bold text-slate-700">
                등록된 학급 ({gradeClasses.length})
              </h4>
            </div>
            {gradeClasses.map(cls => (
              <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="px-6 py-4 bg-slate-50 flex justify-between items-center border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-slate-900">{cls.name}</span>
                    <span className="text-xs font-medium bg-white px-3 py-1 rounded-full border text-slate-500">
                      <Users className="w-3 h-3 inline mr-1" />
                      {cls.students.length}명
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveClass(cls.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
                <div className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {cls.students.map(student => (
                      <span key={student.id} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                        {student.name}
                      </span>
                    ))}
                    {cls.students.length === 0 && <span className="text-slate-400 text-sm">등록된 학생 없음</span>}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Create Class Modal */}
      {isCreateModalOpen && (
        <CreateClassModal
          grade={grade}
          onSubmit={handleAddClass}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );

  const renderEventsTab = () => {
    // Filter events by type
    const individualEvents = events.filter(e => e.type === 'INDIVIDUAL');
    const pairEvents = events.filter(e => e.type === 'PAIR');
    const teamEvents = events.filter(e => e.type === 'TEAM');

    // Get selected events count by type
    const selectedIndividual = individualEvents.filter(e => gradeConfig.events[e.id]?.selected).length;
    const selectedPair = pairEvents.filter(e => gradeConfig.events[e.id]?.selected).length;
    const selectedTeam = teamEvents.filter(e => gradeConfig.events[e.id]?.selected).length;

    // Get all selected events
    const selectedEvents = events.filter(e => gradeConfig.events[e.id]?.selected);

    const eventTabs: { id: EventSubTab; label: string; count: number; total: number }[] = [
      { id: 'INDIVIDUAL', label: '개인', count: selectedIndividual, total: individualEvents.length },
      { id: 'PAIR', label: '짝', count: selectedPair, total: pairEvents.length },
      { id: 'TEAM', label: '단체', count: selectedTeam, total: teamEvents.length },
    ];

    const renderEventCard = (evt: CompetitionEvent) => {
      const config = gradeConfig.events[evt.id] || { selected: false, targetParticipants: 0 };
      const isSelected = config.selected;

      return (
        <div
          key={evt.id}
          className={`rounded-lg border-2 p-4 transition-all ${
            isSelected
              ? 'border-indigo-600 bg-indigo-50/30'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <button
              onClick={() => handleToggleEvent(evt.id)}
              className={`mt-0.5 p-1 rounded-md flex-shrink-0 transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300 hover:text-slate-400'}`}
            >
              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-bold text-base truncate ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                  {evt.name}
                </h4>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase flex-shrink-0 ${
                  evt.type === 'TEAM' ? 'bg-purple-100 text-purple-700' :
                  evt.type === 'PAIR' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {evt.type === 'TEAM' ? '단체' : evt.type === 'PAIR' ? '짝' : '개인'}
                </span>
              </div>

              {evt.description && (
                <p className="text-xs text-slate-500 mb-2">{evt.description}</p>
              )}

              {isSelected && (
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-[10px] font-bold text-indigo-800 whitespace-nowrap">
                    참가 인원
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={config.targetParticipants || ''}
                    onChange={(e) => handleEventParticipantChange(evt.id, parseInt(e.target.value) || 0)}
                    className="w-14 px-2 py-0.5 text-center text-xs border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder={evt.defaultMaxParticipants.toString()}
                  />
                  <span className="text-[10px] text-slate-400">
                    명
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="flex flex-col h-full">
        {/* Selected Events Navigation Bar */}
        {selectedEvents.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-4 border-b border-indigo-400 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold uppercase tracking-wider">선택된 종목</h4>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold">
                {selectedEvents.length}개 종목
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedEvents.map(evt => (
                <div
                  key={evt.id}
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
                >
                  <span className="text-sm font-medium">{evt.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    evt.type === 'TEAM' ? 'bg-purple-400/50 text-purple-50' :
                    evt.type === 'PAIR' ? 'bg-green-400/50 text-green-50' :
                    'bg-blue-400/50 text-blue-50'
                  }`}>
                    {evt.type === 'TEAM' ? '단체' : evt.type === 'PAIR' ? '짝' : '개인'}
                  </span>
                  <button
                    onClick={() => handleToggleEvent(evt.id)}
                    className="text-white/70 hover:text-white hover:bg-white/10 rounded p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Event Category Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          {eventTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveEventTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeEventTab === tab.id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeEventTab === tab.id
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}/{tab.total}
              </span>
            </button>
          ))}
        </div>

        {/* Event Cards */}
        <div className="flex-1 overflow-auto p-8 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                {activeEventTab === 'INDIVIDUAL' && '개인 종목'}
                {activeEventTab === 'PAIR' && '짝 종목'}
                {activeEventTab === 'TEAM' && '단체 종목'}
              </h3>
              <p className="text-slate-500 mt-1">
                {activeEventTab === 'INDIVIDUAL' && '각 학생이 개별적으로 참가하는 종목입니다.'}
                {activeEventTab === 'PAIR' && '2명이 한 조가 되어 참가하는 종목입니다.'}
                {activeEventTab === 'TEAM' && '여러 명이 팀으로 참가하는 종목입니다.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeEventTab === 'INDIVIDUAL' && individualEvents.map(renderEventCard)}
              {activeEventTab === 'PAIR' && pairEvents.map(renderEventCard)}
              {activeEventTab === 'TEAM' && teamEvents.map(renderEventCard)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRecordsTab = () => {
    if (gradeClasses.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <Users className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">등록된 학급이 없습니다.</p>
          <button onClick={() => setActiveTab('MANAGEMENT')} className="text-indigo-600 font-semibold mt-2 hover:underline">
            학급 관리 탭으로 이동
          </button>
        </div>
      );
    }

    if (activeEvents.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <Settings2 className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">선택된 종목이 없습니다.</p>
          <button onClick={() => setActiveTab('EVENTS')} className="text-indigo-600 font-semibold mt-2 hover:underline">
            종목 선정 탭으로 이동
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Matrix Record Table */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          <div className="max-w-full mx-auto">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">경기 기록 매트릭스</h3>
              <p className="text-slate-500 mt-1">
                각 셀을 클릭하여 학급별 종목별 기록을 입력하세요. 총점은 자동으로 계산됩니다.
              </p>
            </div>

            <MatrixRecordTable
              classes={gradeClasses}
              activeEvents={activeEvents}
              onUpdateClasses={onUpdateClasses}
              onEditParticipants={(eventId, classId) => {
                const event = events.find(e => e.id === eventId);
                if (event && event.type === 'INDIVIDUAL') {
                  setMultiClassParticipantModalEvent(event);
                } else if (event && (event.type === 'PAIR' || event.type === 'TEAM')) {
                  setMultiClassTeamModalEvent(event);
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderResultsTab = () => {
    const sortedClasses = [...gradeClasses].sort((a, b) => calculateTotalScore(b) - calculateTotalScore(a));

    return (
      <div className="max-w-6xl mx-auto p-8 animate-in fade-in duration-300">
        <div className="text-center mb-10">
          <h3 className="text-3xl font-bold text-slate-900 mb-2">{grade}학년 대회 결과</h3>
          <p className="text-slate-500">현재까지 입력된 점수를 바탕으로 한 종합 순위입니다.</p>
        </div>

        {sortedClasses.length === 0 ? (
           <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
             <p className="text-slate-400">데이터가 없습니다.</p>
           </div>
        ) : (
          <div className="space-y-4">
            {sortedClasses.map((cls, index) => {
              const rank = index + 1;
              const isTop3 = rank <= 3;
              const totalScore = calculateTotalScore(cls);
              
              return (
                <div 
                  key={cls.id}
                  className={`relative bg-white rounded-xl p-6 border transition-all ${
                    isTop3 
                      ? 'border-indigo-100 shadow-md scale-[1.01]' 
                      : 'border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className={`flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-2xl text-2xl font-bold ${
                      rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      rank === 2 ? 'bg-slate-100 text-slate-600' :
                      rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-50 text-slate-400'
                    }`}>
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                    </div>
                    
                    <div className="flex-1 w-full text-center md:text-left">
                      <div className="flex flex-col md:flex-row md:items-baseline gap-3 mb-3">
                        <h4 className="text-2xl font-bold text-slate-900">{cls.name}</h4>
                        <span className="text-sm text-slate-500">재적 {cls.students.length}명</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        {activeEvents.map(evt => {
                          const res = cls.results[evt.id];
                          const score = res?.score || 0;
                          const participants = (evt.type === 'TEAM' || evt.type === 'PAIR')
                             ? (res?.teamParticipantIds?.length || 0)
                             : cls.students.length; // Assuming all joined individual or just show count of those with >0 score? Simplest is just count score.

                          return (
                            <div key={evt.id} className="bg-slate-50 p-2 rounded border border-slate-100 flex flex-col">
                              <span className="text-slate-500 text-xs truncate">{evt.name}</span>
                              <div className="flex justify-between items-end mt-1">
                                <span className="font-bold text-slate-800">{score}점</span>
                                {(evt.type === 'TEAM' || evt.type === 'PAIR') && (
                                  <span className="text-[10px] text-slate-400">{participants}명 참가</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                      <span className="block text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Total Score</span>
                      <span className="text-4xl font-black text-slate-900 tracking-tight">{totalScore}</span>
                    </div>
                  </div>
                  
                  {isTop3 && (
                    <div className="absolute -top-3 -right-3 hidden md:block">
                      <Medal className={`w-8 h-8 ${
                        rank === 1 ? 'text-yellow-400 drop-shadow-sm' :
                        rank === 2 ? 'text-slate-300 drop-shadow-sm' :
                        'text-orange-400 drop-shadow-sm'
                      }`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 bg-slate-50 h-full overflow-hidden flex flex-col">
      {/* Header with Tabs */}
      <header className="bg-white border-b border-slate-200 flex-shrink-0">
        <div className="px-8 py-5">
          <h2 className="text-2xl font-bold text-slate-900">{grade}학년 대회 관리</h2>
        </div>
        {renderTabs()}
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-slate-50 scroll-smooth">
        {activeTab === 'MANAGEMENT' && renderManagementTab()}
        {activeTab === 'EVENTS' && renderEventsTab()}
        {activeTab === 'RECORDS' && renderRecordsTab()}
        {activeTab === 'RESULTS' && renderResultsTab()}
      </div>

      {/* Multi-Class Participant Selection Modal (INDIVIDUAL) */}
      {multiClassParticipantModalEvent && (
        <MultiClassParticipantModal
          event={multiClassParticipantModalEvent}
          classes={gradeClasses}
          existingData={gradeClasses.reduce((acc, cls) => {
            const participantIds = cls.results[multiClassParticipantModalEvent.id]?.participantIds || [];
            return { ...acc, [cls.id]: participantIds };
          }, {} as Record<string, string[]>)}
          onSave={handleSaveMultiClassParticipants}
          onClose={() => setMultiClassParticipantModalEvent(null)}
        />
      )}

      {/* Multi-Class Team Creation Modal (PAIR/TEAM) */}
      {multiClassTeamModalEvent && (
        <MultiClassTeamCreationModal
          event={multiClassTeamModalEvent}
          classes={gradeClasses}
          existingData={gradeClasses.reduce((acc, cls) => {
            const teams = cls.results[multiClassTeamModalEvent.id]?.teams || [];
            return { ...acc, [cls.id]: teams };
          }, {} as Record<string, Team[]>)}
          onSave={handleSaveMultiClassTeams}
          onClose={() => setMultiClassTeamModalEvent(null)}
        />
      )}

      {/* Create Class Modal */}
      {isCreateModalOpen && (
        <CreateClassModal
          grade={grade}
          onSubmit={handleAddClass}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
};