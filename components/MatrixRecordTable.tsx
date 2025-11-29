import React, { useState } from 'react';
import { ClassTeam, CompetitionEvent, StudentRecord, RecordMode } from '../types';
import { ChevronDown, ChevronRight, Edit3, Save, Users, X, Trash2 } from 'lucide-react';
import { saveCompetitionResults, createRecordsBatch, deleteEventRecords, getGradeClasses } from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';

interface MatrixRecordTableProps {
  classes: ClassTeam[];
  activeEvents: CompetitionEvent[];
  onUpdateClasses: (classes: ClassTeam[]) => void;
  onEditParticipants?: (eventId: string, classId: string) => void;
  selectedDate: string; // 사용자가 선택한 경기 날짜
  competitionId: string; // Firestore에서 최신 데이터 가져오기 위해 필요
  grade: number; // Firestore에서 최신 데이터 가져오기 위해 필요
  mode?: RecordMode; // 🆕 기록 모드 (대회/연습)
}

export const MatrixRecordTable: React.FC<MatrixRecordTableProps> = ({
  classes,
  activeEvents,
  onUpdateClasses,
  onEditParticipants,
  selectedDate,
  competitionId,
  grade,
  mode = 'competition', // 기본값: 대회
}) => {
  const { user } = useAuth();
  // 종목별 접기/펼치기 상태 (기본값: 모두 접힌 상태)
  const [collapsedEvents, setCollapsedEvents] = useState<Set<string>>(
    new Set(activeEvents.map(e => e.id))
  );

  // 저장 상태
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // 멤버 목록 모달 상태
  const [memberModal, setMemberModal] = useState<{ members: string[] } | null>(null);

  // 초기화 확인 모달 상태
  const [resetConfirm, setResetConfirm] = useState<{ eventId: string; eventName: string } | null>(null);
  const [resetting, setResetting] = useState(false);

  // 각 학급별 총점 계산
  const getClassTotalScore = (classTeam: ClassTeam) => {
    let total = 0;
    activeEvents.forEach(evt => {
      const res = classTeam.results[evt.id];
      if (res) total += res.score;
    });
    return total;
  };

  const toggleEventRow = (eventId: string) => {
    setCollapsedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const isEventExpanded = (eventId: string) => {
    return !collapsedEvents.has(eventId);
  };

  // 🆕 records 컬렉션용 데이터 생성 함수
  const buildStudentRecords = (): Omit<StudentRecord, 'id' | 'createdAt' | 'updatedAt'>[] => {
    const records: Omit<StudentRecord, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    classes.forEach((cls) => {
      activeEvents.forEach((evt) => {
        const result = cls.results[evt.id];
        if (!result) return;

        // 개인전: 각 학생별 기록 저장
        if (evt.type === 'INDIVIDUAL' && result.studentScores) {
          Object.entries(result.studentScores).forEach(([studentId, score]) => {
            const student = cls.students.find((s) => s.id === studentId);
            if (!student || !score) return;

            records.push({
              studentId: student.id,
              studentName: student.name,
              accessCode: student.accessCode || '',
              classId: cls.id,
              className: cls.name,
              grade,
              eventId: evt.id,
              eventName: evt.name,
              score,
              date: selectedDate,
              mode,
            });
          });
        }

        // 단체전/짝: 각 팀별로 팀원들의 기록 저장
        if ((evt.type === 'TEAM' || evt.type === 'PAIR') && result.teams) {
          result.teams.forEach((team) => {
            team.memberIds?.forEach((memberId) => {
              const student = cls.students.find((s) => s.id === memberId);
              if (!student) return;

              records.push({
                studentId: student.id,
                studentName: student.name,
                accessCode: student.accessCode || '',
                classId: cls.id,
                className: cls.name,
                grade,
                eventId: evt.id,
                eventName: evt.name,
                score: 0, // 단체전은 개인 점수 0
                date: selectedDate,
                mode,
                teamId: team.id,
                teamMembers: team.memberIds?.map((id) => {
                  const s = cls.students.find((st) => st.id === id);
                  return s?.name || '';
                }).filter(Boolean),
                teamScore: team.score,
              });
            });
          });
        }
      });
    });

    return records;
  };

  // 종목 기록 초기화 핸들러
  const handleResetEventRecords = async () => {
    if (!resetConfirm || !user?.uid) return;

    setResetting(true);
    try {
      const classIds = classes.map(c => c.id);
      const result = await deleteEventRecords(
        user.uid,
        classIds,
        resetConfirm.eventId,
        selectedDate
      );

      // Firestore에서 최신 데이터 가져오기
      const updatedClasses = await getGradeClasses(user.uid, competitionId, grade);
      onUpdateClasses(updatedClasses);

      setSaveMessage(`✅ "${resetConfirm.eventName}" 기록이 초기화되었습니다. (${result.recordsDeleted}개 삭제)`);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('❌ 기록 초기화 실패:', error);
      setSaveMessage('❌ 기록 초기화에 실패했습니다.');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setResetting(false);
      setResetConfirm(null);
    }
  };

  // 저장 핸들러
  const handleSave = async () => {
    console.log('\n=== 경기 기록 저장 시작 ===');
    console.log('📅 선택된 날짜:', selectedDate);
    console.log('🎯 모드:', mode);
    console.log('📦 저장할 학급 데이터:', classes.map(c => ({
      id: c.id,
      name: c.name,
      resultsCount: Object.keys(c.results || {}).length,
      results: c.results
    })));

    setSaving(true);
    setSaveMessage(null);
    try {
      // 1. 기존 classes.results 저장 (호환성 유지)
      // Phase 2.5: userId 파라미터 추가
      await saveCompetitionResults(user!.uid, classes);
      console.log('✅ saveCompetitionResults 완료 (기존 방식)');

      // 2. 🆕 records 컬렉션에도 저장 (이중 저장)
      if (user?.uid) {
        const studentRecords = buildStudentRecords();
        if (studentRecords.length > 0) {
          await createRecordsBatch(user.uid, studentRecords);
          console.log(`✅ createRecordsBatch 완료 (${studentRecords.length}개 레코드)`);
        }
      } else {
        console.warn('⚠️ 사용자 인증 정보가 없어 records 컬렉션 저장 생략');
      }

      // 3. Firestore에서 최신 데이터 다시 가져오기
      console.log('🔄 Firestore에서 최신 데이터 가져오는 중...');
      const { getGradeClasses } = await import('../services/firestore');
      const updatedClasses = await getGradeClasses(user!.uid, competitionId, grade);
      console.log('✅ 최신 데이터 가져오기 완료:', updatedClasses.length, '개 학급');

      // 4. 부모 컴포넌트의 상태를 Firestore의 최신 데이터로 업데이트
      console.log('🔄 부모 컴포넌트 상태 업데이트 중...');
      onUpdateClasses(updatedClasses);
      console.log('✅ 부모 컴포넌트 상태 업데이트 완료');

      setSaveMessage('✅ 경기 기록이 저장되었습니다!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('❌ 저장 실패:', error);
      setSaveMessage('❌ 저장에 실패했습니다.');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setSaving(false);
      console.log('=== 경기 기록 저장 종료 ===\n');
    }
  };

  const handleStudentScoreChange = (classId: string, eventId: string, studentId: string, score: number) => {
    const updatedClasses = classes.map(c => {
      if (c.id !== classId) return c;
      const currentResult = c.results[eventId] || { score: 0 };
      const currentScores = currentResult.studentScores || {};
      const newScores = { ...currentScores, [studentId]: score };

      // Auto-calculate total - only for participating students
      const participantIds = currentResult.participantIds || [];
      const totalScore = participantIds.reduce((sum: number, id: string) => {
        return sum + (newScores[id] || 0);
      }, 0);

      return {
        ...c,
        results: {
          ...c.results,
          [eventId]: {
            ...currentResult,
            studentScores: newScores,
            score: totalScore,
            date: selectedDate // 사용자가 선택한 날짜 사용
          }
        }
      };
    });
    onUpdateClasses(updatedClasses);
  };

  const handleTeamScoreChange = (classId: string, eventId: string, teamId: string, score: number) => {
    const updatedClasses = classes.map(c => {
      if (c.id !== classId) return c;
      const res = c.results[eventId];
      if (!res || !res.teams) return c;

      const updatedTeams = res.teams.map(t =>
        t.id === teamId ? { ...t, score: score } : t
      );
      const totalScore = updatedTeams.reduce((sum, t) => sum + t.score, 0);

      return {
        ...c,
        results: {
          ...c.results,
          [eventId]: {
            ...res,
            teams: updatedTeams,
            score: totalScore,
            date: selectedDate // 사용자가 선택한 날짜 사용
          }
        }
      };
    });
    onUpdateClasses(updatedClasses);
  };

  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center text-slate-400">
        등록된 학급이 없습니다. 먼저 학급을 생성해주세요.
      </div>
    );
  }

  if (activeEvents.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center text-slate-400">
        선택된 종목이 없습니다. 종목 선정 탭에서 종목을 선택해주세요.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
        {/* Header - 학급명들 */}
        <thead className="sticky top-0 z-20">
          <tr className="bg-gradient-to-r from-indigo-600/30 to-indigo-500/30 text-slate-900">
            <th className="sticky left-0 z-30 bg-indigo-600/30 px-4 py-3 text-left text-sm font-bold w-[160px] border-r border-indigo-500/30">
            </th>
            {classes.map((cls) => {
              const totalScore = getClassTotalScore(cls);
              return (
                <th
                  key={cls.id}
                  className="px-4 py-3 text-center border-r border-indigo-500/30 last:border-r-0"
                  style={{ minWidth: '180px', flex: '1 1 0' }}
                >
                  <div className="text-2xl font-black">{cls.name} ({totalScore}점)</div>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Body - 종목별 행 */}
        <tbody>
          {activeEvents.map((evt, eventIndex) => {
            const isExpanded = isEventExpanded(evt.id);
            const isEvenRow = eventIndex % 2 === 0;

            return (
              <tr
                key={evt.id}
                className={`${isEvenRow ? 'bg-white' : 'bg-slate-50'} border-b border-slate-200`}
              >
                {/* 종목명 칼럼 (고정) */}
                <td
                  className={`sticky left-0 z-10 ${
                    isEvenRow ? 'bg-indigo-50' : 'bg-indigo-100/50'
                  } px-3 py-2 border-r-2 border-indigo-200 w-[160px]`}
                >
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleEventRow(evt.id)}
                      className="flex items-center gap-2 flex-1 text-left hover:text-indigo-700 transition-colors min-w-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-slate-900 truncate whitespace-nowrap">
                          {evt.name}
                          <span
                            className={`ml-1 text-[10px] px-1.5 py-0.5 rounded font-normal ${
                              evt.type === 'TEAM'
                                ? 'bg-purple-100 text-purple-700'
                                : evt.type === 'PAIR'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {evt.type === 'TEAM' ? '단체' : evt.type === 'PAIR' ? '짝' : '개인'}
                          </span>
                        </div>
                      </div>
                    </button>
                    {/* 종목 기록 초기화 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setResetConfirm({ eventId: evt.id, eventName: evt.name });
                      }}
                      className="p-1 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                      title={`${evt.name} 기록 초기화`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                    </button>
                  </div>
                </td>

                {/* 각 학급별 데이터 셀 */}
                {classes.map((cls) => {
                  const result = cls.results[evt.id];
                  const score = result?.score || 0;

                  // 참가 인원 계산
                  let participantCount = 0;
                  if (evt.type === 'INDIVIDUAL') {
                    participantCount = result?.participantIds?.length || 0;
                  } else if (evt.type === 'TEAM' || evt.type === 'PAIR') {
                    if (result?.teams && result.teams.length > 0) {
                      const uniqueMembers = new Set(result.teams.flatMap(t => t.memberIds));
                      participantCount = uniqueMembers.size;
                    } else {
                      participantCount = result?.teamParticipantIds?.length || 0;
                    }
                  }

                  return (
                    <td
                      key={cls.id}
                      className={`px-3 py-3 border-r border-slate-200 last:border-r-0 align-top ${
                        isEvenRow ? 'bg-white' : 'bg-slate-50'
                      }`}
                    >
                      {/* 접힌 상태: 점수만 표시 */}
                      {!isExpanded && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-indigo-700">{score}</div>
                          <div className="text-[10px] text-slate-400 mt-1">{participantCount}명</div>
                        </div>
                      )}

                      {/* 펼친 상태: 상세 정보 */}
                      {isExpanded && (
                        <div className="space-y-2">
                          {/* 점수 표시 */}
                          <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-200 text-center">
                            <div className="text-2xl font-bold text-indigo-700">{score}</div>
                            <div className="text-[10px] text-slate-400">{participantCount}명 참가</div>
                          </div>

                          {/* 개인전 */}
                          {evt.type === 'INDIVIDUAL' && (
                            <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-bold text-slate-500 uppercase">
                                  학생별 점수
                                </p>
                                {onEditParticipants && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditParticipants(evt.id, cls.id);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="출전 학생 수정"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    출전 수정
                                  </button>
                                )}
                              </div>

                              {result?.participantIds && result.participantIds.length > 0 ? (
                                <div className="space-y-2">
                                  {result.participantIds.map((studentId) => {
                                    const student = cls.students.find(s => s.id === studentId);
                                    if (!student) return null;
                                    const studentScore = result?.studentScores?.[studentId] || 0;
                                    return (
                                      <div key={studentId} className="flex items-center gap-2">
                                        <span className="text-base font-bold text-slate-900 flex-1 truncate min-w-[60px]">
                                          {student.name}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          {/* -10 버튼 */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleStudentScoreChange(
                                                cls.id,
                                                evt.id,
                                                studentId,
                                                Math.max(0, studentScore - 10)
                                              );
                                            }}
                                            className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-300 transition-colors text-xs font-medium touch-manipulation active:bg-slate-300"
                                          >
                                            -10
                                          </button>
                                          {/* -5 버튼 */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleStudentScoreChange(
                                                cls.id,
                                                evt.id,
                                                studentId,
                                                Math.max(0, studentScore - 5)
                                              );
                                            }}
                                            className="w-7 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-300 transition-colors text-xs font-medium touch-manipulation active:bg-slate-300"
                                          >
                                            -5
                                          </button>
                                          {/* -1 버튼 */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleStudentScoreChange(
                                                cls.id,
                                                evt.id,
                                                studentId,
                                                Math.max(0, studentScore - 1)
                                              );
                                            }}
                                            className="w-6 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-300 transition-colors text-xs font-medium touch-manipulation active:bg-slate-300"
                                          >
                                            -1
                                          </button>
                                          {/* 점수 입력 필드 - 스피너 숨김 */}
                                          <input
                                            type="number"
                                            value={studentScore || ''}
                                            onChange={(e) =>
                                              handleStudentScoreChange(
                                                cls.id,
                                                evt.id,
                                                studentId,
                                                parseInt(e.target.value) || 0
                                              )
                                            }
                                            className="w-14 h-8 px-2 text-sm text-center font-bold border-2 border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-indigo-700 touch-manipulation [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          {/* +1 버튼 */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleStudentScoreChange(
                                                cls.id,
                                                evt.id,
                                                studentId,
                                                studentScore + 1
                                              );
                                            }}
                                            className="w-6 h-8 flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded border border-indigo-300 transition-colors text-xs font-medium touch-manipulation active:bg-indigo-300"
                                          >
                                            +1
                                          </button>
                                          {/* +5 버튼 */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleStudentScoreChange(
                                                cls.id,
                                                evt.id,
                                                studentId,
                                                studentScore + 5
                                              );
                                            }}
                                            className="w-7 h-8 flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded border border-indigo-300 transition-colors text-xs font-medium touch-manipulation active:bg-indigo-300"
                                          >
                                            +5
                                          </button>
                                          {/* +10 버튼 */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleStudentScoreChange(
                                                cls.id,
                                                evt.id,
                                                studentId,
                                                studentScore + 10
                                              );
                                            }}
                                            className="w-8 h-8 flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded border border-indigo-300 transition-colors text-xs font-medium touch-manipulation active:bg-indigo-300"
                                          >
                                            +10
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-center py-3">
                                  <p className="text-xs text-slate-500">
                                    출전 학생이 선택되지 않았습니다.
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    종목 선정 탭에서 선택해주세요.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 단체전/짝 종목 */}
                          {(evt.type === 'TEAM' || evt.type === 'PAIR') && (
                            <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-bold text-slate-500 uppercase">
                                  팀별 점수
                                </p>
                                <div className="flex items-center gap-1">
                                  {/* 명단 보기 버튼 - 단체전만 표시 (짝줄넘기는 2명이라 불필요) */}
                                  {evt.type === 'TEAM' && result?.teams && result.teams.length > 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const allMemberNames = result.teams?.flatMap(team =>
                                          team.memberIds?.map(memberId => {
                                            const student = cls.students.find(s => s.id === memberId);
                                            return student?.name || '';
                                          }).filter(name => name) || []
                                        ) || [];
                                        if (allMemberNames.length > 0) {
                                          setMemberModal({ members: allMemberNames });
                                        }
                                      }}
                                      className="flex items-center gap-1 px-2 py-1 text-[10px] text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                      title="팀 명단 보기"
                                    >
                                      <Users className="w-3 h-3" />
                                      명단
                                    </button>
                                  )}
                                  {onEditParticipants && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditParticipants(evt.id, cls.id);
                                      }}
                                      className="flex items-center gap-1 px-2 py-1 text-[10px] text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="출전 팀 수정"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      출전 수정
                                    </button>
                                  )}
                                </div>
                              </div>

                              {result?.teams && result.teams.length > 0 ? (
                                <div className="space-y-2">
                                  {result.teams.map((team) => {
                                    const memberNames = team.memberIds
                                      ?.map(memberId => {
                                        const student = cls.students.find(s => s.id === memberId);
                                        return student?.name || '';
                                      })
                                      .filter(name => name) || [];

                                    return (
                                      <div key={team.id} className="flex items-center gap-2">
                                        {evt.type === 'PAIR' && memberNames.length > 0 && (
                                          <span className="text-sm font-bold text-slate-900 min-w-[80px]">
                                            {memberNames.join(', ')}
                                          </span>
                                        )}
                                        <div className={`flex items-center gap-1 ${evt.type === 'TEAM' ? 'mx-auto' : 'ml-auto'}`}>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleTeamScoreChange(cls.id, evt.id, team.id, Math.max(0, team.score - 10));
                                            }}
                                            className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-300 transition-colors text-xs font-medium touch-manipulation active:bg-slate-300"
                                          >
                                            -10
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleTeamScoreChange(cls.id, evt.id, team.id, Math.max(0, team.score - 5));
                                            }}
                                            className="w-7 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-300 transition-colors text-xs font-medium touch-manipulation active:bg-slate-300"
                                          >
                                            -5
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleTeamScoreChange(cls.id, evt.id, team.id, Math.max(0, team.score - 1));
                                            }}
                                            className="w-6 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-300 transition-colors text-xs font-medium touch-manipulation active:bg-slate-300"
                                          >
                                            -1
                                          </button>
                                          <input
                                            type="number"
                                            value={team.score || ''}
                                            onChange={(e) => handleTeamScoreChange(cls.id, evt.id, team.id, parseInt(e.target.value) || 0)}
                                            className="w-16 h-8 px-2 text-base text-center font-bold border-2 border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-indigo-700 touch-manipulation [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleTeamScoreChange(cls.id, evt.id, team.id, team.score + 1);
                                            }}
                                            className="w-6 h-8 flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded border border-indigo-300 transition-colors text-xs font-medium touch-manipulation active:bg-indigo-300"
                                          >
                                            +1
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleTeamScoreChange(cls.id, evt.id, team.id, team.score + 5);
                                            }}
                                            className="w-7 h-8 flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded border border-indigo-300 transition-colors text-xs font-medium touch-manipulation active:bg-indigo-300"
                                          >
                                            +5
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleTeamScoreChange(cls.id, evt.id, team.id, team.score + 10);
                                            }}
                                            className="w-8 h-8 flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded border border-indigo-300 transition-colors text-xs font-medium touch-manipulation active:bg-indigo-300"
                                          >
                                            +10
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-center py-3">
                                  <p className="text-xs text-slate-500">
                                    팀이 구성되지 않았습니다.
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    종목 선정 탭에서 구성해주세요.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 저장 버튼 - Sticky Footer */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t-2 border-indigo-200 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex-1">
          {saveMessage && (
            <p className={`text-sm font-medium ${saveMessage.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {saveMessage}
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
        >
          <Save className="w-5 h-5" />
          {saving ? '저장 중...' : '경기 기록 저장'}
        </button>
      </div>

      {/* 멤버 목록 모달 */}
      {memberModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setMemberModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                팀 멤버 ({memberModal.members.length}명)
              </h3>
              <button
                onClick={() => setMemberModal(null)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {memberModal.members.map((name, idx) => (
                <div
                  key={idx}
                  className="px-2 py-1.5 bg-slate-100 rounded text-center text-sm font-medium text-slate-700"
                >
                  {name}
                </div>
              ))}
            </div>
            <button
              onClick={() => setMemberModal(null)}
              className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 기록 초기화 확인 모달 */}
      {resetConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => !resetting && setResetConfirm(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              기록 초기화
            </h3>
            <p className="text-sm text-slate-600 text-center mb-4">
              <strong>"{resetConfirm.eventName}"</strong>의<br />
              {selectedDate} 기록을 삭제하시겠습니까?
            </p>
            <p className="text-xs text-red-500 text-center mb-6">
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setResetConfirm(null)}
                disabled={resetting}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleResetEventRecords}
                disabled={resetting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
