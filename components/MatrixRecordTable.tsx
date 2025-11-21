import React, { useState } from 'react';
import { ClassTeam, CompetitionEvent } from '../types';
import { Users, Check, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';

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
  // 모든 셀이 기본적으로 펼쳐진 상태 (collapsedCells로 접힌 셀만 추적)
  const [collapsedCells, setCollapsedCells] = useState<Set<string>>(new Set());

  const toggleCell = (classId: string, eventId: string) => {
    const cellKey = `${classId}_${eventId}`;
    setCollapsedCells(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cellKey)) {
        newSet.delete(cellKey);
      } else {
        newSet.add(cellKey);
      }
      return newSet;
    });
  };

  const isCellExpanded = (classId: string, eventId: string) => {
    return !collapsedCells.has(`${classId}_${eventId}`);
  };

  const getClassTotalScore = (classTeam: ClassTeam) => {
    let total = 0;
    activeEvents.forEach(evt => {
      const res = classTeam.results[evt.id];
      if (res) total += res.score;
    });
    return total;
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white">
            <th className="sticky left-0 z-10 bg-indigo-600 px-4 py-3 text-left text-sm font-bold min-w-[120px] border-r border-indigo-500">
              학급
            </th>
            {activeEvents.map((evt) => (
              <th
                key={evt.id}
                className="px-4 py-3 text-center text-xs font-bold min-w-[200px] border-r border-indigo-500 last:border-r-0"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm">{evt.name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-normal ${
                      evt.type === 'TEAM' ? 'bg-purple-400/30 text-purple-100' :
                      evt.type === 'PAIR' ? 'bg-green-400/30 text-green-100' :
                      'bg-blue-400/30 text-blue-100'
                    }`}
                  >
                    {evt.type === 'TEAM' ? '단체전' : evt.type === 'PAIR' ? '짝 종목' : '개인전'}
                  </span>
                </div>
              </th>
            ))}
            <th className="sticky right-0 z-10 bg-indigo-700 px-4 py-3 text-center text-sm font-bold min-w-[100px] border-l border-indigo-500">
              총점
            </th>
          </tr>
        </thead>
        <tbody>
          {classes.map((cls, classIndex) => {
            const totalScore = getClassTotalScore(cls);
            const isEvenRow = classIndex % 2 === 0;

            return (
              <React.Fragment key={cls.id}>
                <tr className={`${isEvenRow ? 'bg-white' : 'bg-slate-50'}`}>
                  <td className={`sticky left-0 z-10 ${isEvenRow ? 'bg-white' : 'bg-slate-50'} px-4 py-3 border-r border-slate-200`}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{cls.name}</span>
                      <span className="text-xs text-slate-400">
                        <Users className="w-3 h-3 inline mr-1" />
                        {cls.students.length}명
                      </span>
                    </div>
                  </td>
                  {activeEvents.map((evt) => {
                    const result = cls.results[evt.id];
                    const score = result?.score || 0;
                    const isExpanded = isCellExpanded(cls.id, evt.id);

                    // Calculate participant count based on event type
                    let participantCount = 0;
                    if (evt.type === 'INDIVIDUAL') {
                      // Use participantIds if available, otherwise default to 0
                      participantCount = result?.participantIds?.length || 0;
                    } else if (evt.type === 'TEAM' || evt.type === 'PAIR') {
                      // Count unique participants across all teams
                      if (result?.teams && result.teams.length > 0) {
                        const uniqueMembers = new Set(result.teams.flatMap(t => t.memberIds));
                        participantCount = uniqueMembers.size;
                      } else {
                        participantCount = result?.teamParticipantIds?.length || 0;
                      }
                    }

                    return (
                      <td
                        key={evt.id}
                        className="px-2 py-2 border-r border-slate-200 last:border-r-0"
                      >
                        <div className="flex flex-col gap-2">
                          {/* Score Display */}
                          <button
                            onClick={() => toggleCell(cls.id, evt.id)}
                            className="w-full px-3 py-2 rounded-lg border-2 transition-all hover:shadow-md bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold text-indigo-700">
                                {score}
                              </span>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] text-slate-500">
                                  {participantCount}명
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-indigo-600" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </div>
                          </button>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
                              {(evt.type === 'TEAM' || evt.type === 'PAIR') ? (
                                // Team/Pair Event - Show Teams
                                <>
                                  {result?.teams && result.teams.length > 0 ? (
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-bold text-slate-500 uppercase">팀별 점수</p>
                                      {result.teams.map((team) => (
                                        <div key={team.id} className="bg-white rounded-lg p-2 border border-slate-200">
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-slate-700 truncate">
                                              {team.name}
                                            </span>
                                            <input
                                              type="number"
                                              value={team.score || ''}
                                              onChange={(e) => {
                                                const newScore = parseInt(e.target.value) || 0;
                                                const updatedClasses = classes.map(c => {
                                                  if (c.id !== cls.id) return c;
                                                  const res = c.results[evt.id];
                                                  if (!res || !res.teams) return c;

                                                  const updatedTeams = res.teams.map(t =>
                                                    t.id === team.id ? { ...t, score: newScore } : t
                                                  );
                                                  const totalScore = updatedTeams.reduce((sum, t) => sum + t.score, 0);

                                                  return {
                                                    ...c,
                                                    results: {
                                                      ...c.results,
                                                      [evt.id]: { ...res, teams: updatedTeams, score: totalScore }
                                                    }
                                                  };
                                                });
                                                onUpdateClasses(updatedClasses);
                                              }}
                                              className="w-16 px-2 py-1 text-xs text-center border border-slate-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          </div>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {team.memberIds.map((memberId) => {
                                              const student = cls.students.find(s => s.id === memberId);
                                              return (
                                                <span
                                                  key={memberId}
                                                  className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded"
                                                >
                                                  {student?.name || '???'}
                                                </span>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    // Legacy format or no teams yet
                                    <div className="text-center py-4">
                                      <p className="text-xs text-slate-500">
                                        팀이 아직 구성되지 않았습니다.
                                      </p>
                                      <p className="text-[10px] text-slate-400 mt-1">
                                        종목 선정 탭에서 팀을 구성해주세요.
                                      </p>
                                    </div>
                                  )}
                                </>
                              ) : (
                                // Individual Event - Show only participating students
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">학생별 점수</p>
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
                                    <div className="space-y-1">
                                      {result.participantIds.map((studentId) => {
                                        const student = cls.students.find(s => s.id === studentId);
                                        if (!student) return null;
                                        const studentScore = result?.studentScores?.[studentId] || 0;
                                        return (
                                          <div key={studentId} className="flex items-center gap-2">
                                            <span className="text-xs text-slate-700 flex-1 truncate">{student.name}</span>
                                            <input
                                              type="number"
                                              value={studentScore || ''}
                                              onChange={(e) => handleStudentScoreChange(cls.id, evt.id, studentId, parseInt(e.target.value) || 0)}
                                              className="w-16 px-2 py-1 text-xs text-center border border-slate-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="text-center py-4">
                                      <p className="text-xs text-slate-500">
                                        출전 학생이 아직 선택되지 않았습니다.
                                      </p>
                                      <p className="text-[10px] text-slate-400 mt-1">
                                        종목 선정 탭에서 출전 학생을 선택해주세요.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className={`sticky right-0 z-10 ${isEvenRow ? 'bg-white' : 'bg-slate-50'} px-4 py-3 text-center border-l border-slate-200`}>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-black text-indigo-700">
                        {totalScore}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">점</span>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
