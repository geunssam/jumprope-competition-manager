import React, { useState } from 'react';
import { ClassTeam, CompetitionEvent } from '../types';
import { ChevronDown, ChevronRight, Edit3 } from 'lucide-react';

interface MatrixRecordTableProps {
  classes: ClassTeam[];
  activeEvents: CompetitionEvent[];
  onUpdateClasses: (classes: ClassTeam[]) => void;
  onEditParticipants?: (eventId: string, classId: string) => void;
}

export const MatrixRecordTable: React.FC<MatrixRecordTableProps> = ({
  classes,
  activeEvents,
  onUpdateClasses,
  onEditParticipants,
}) => {
  // 종목별 접기/펼치기 상태 (기본값: 모두 접힌 상태)
  const [collapsedEvents, setCollapsedEvents] = useState<Set<string>>(
    new Set(activeEvents.map(e => e.id))
  );

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
            score: totalScore
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
          [eventId]: { ...res, teams: updatedTeams, score: totalScore }
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
                  <button
                    onClick={() => toggleEventRow(evt.id)}
                    className="flex items-center gap-2 w-full text-left hover:text-indigo-700 transition-colors"
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
                                            className="w-7 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-300 transition-colors text-xs font-medium touch-manipulation active:bg-slate-300"
                                          >
                                            -1
                                          </button>
                                          {/* 점수 입력 필드 */}
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
                                            className="w-14 h-8 px-2 text-sm text-center font-bold border-2 border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-indigo-700 touch-manipulation"
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
                                            className="w-7 h-8 flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded border border-indigo-300 transition-colors text-xs font-medium touch-manipulation active:bg-indigo-300"
                                          >
                                            +1
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

                              {result?.teams && result.teams.length > 0 ? (
                                <div className="space-y-2">
                                  {result.teams.map((team) => (
                                    <div
                                      key={team.id}
                                      className="bg-white rounded-lg p-2 border border-slate-200"
                                    >
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-base font-bold text-slate-900 truncate flex-1 min-w-[60px]">
                                          {team.name}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          {/* -10 버튼 */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleTeamScoreChange(
                                                cls.id,
                                                evt.id,
                                                team.id,
                                                Math.max(0, team.score - 10)
                                              );
                                            }}
                                            className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-300 transition-colors text-xs font-medium touch-manipulation active:bg-slate-300"
                                          >
                                            -10
                                          </button>
                                          {/* -1 버튼 */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleTeamScoreChange(
                                                cls.id,
                                                evt.id,
                                                team.id,
                                                Math.max(0, team.score - 1)
                                              );
                                            }}
                                            className="w-7 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-300 transition-colors text-xs font-medium touch-manipulation active:bg-slate-300"
                                          >
                                            -1
                                          </button>
                                          {/* 점수 입력 필드 */}
                                          <input
                                            type="number"
                                            value={team.score || ''}
                                            onChange={(e) =>
                                              handleTeamScoreChange(
                                                cls.id,
                                                evt.id,
                                                team.id,
                                                parseInt(e.target.value) || 0
                                              )
                                            }
                                            className="w-14 h-8 px-2 text-sm text-center font-bold border-2 border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-indigo-700 touch-manipulation"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          {/* +1 버튼 */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleTeamScoreChange(
                                                cls.id,
                                                evt.id,
                                                team.id,
                                                team.score + 1
                                              );
                                            }}
                                            className="w-7 h-8 flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded border border-indigo-300 transition-colors text-xs font-medium touch-manipulation active:bg-indigo-300"
                                          >
                                            +1
                                          </button>
                                          {/* +10 버튼 */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleTeamScoreChange(
                                                cls.id,
                                                evt.id,
                                                team.id,
                                                team.score + 10
                                              );
                                            }}
                                            className="w-8 h-8 flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded border border-indigo-300 transition-colors text-xs font-medium touch-manipulation active:bg-indigo-300"
                                          >
                                            +10
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
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
    </div>
  );
};
