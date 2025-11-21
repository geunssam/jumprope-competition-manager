import React, { useState } from 'react';
import { ClassTeam, CompetitionEvent } from '../types';
import { Users, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface MatrixRecordTableProps {
  classes: ClassTeam[];
  activeEvents: CompetitionEvent[];
  onUpdateClasses: (classes: ClassTeam[]) => void;
}

export const MatrixRecordTable: React.FC<MatrixRecordTableProps> = ({
  classes,
  activeEvents,
  onUpdateClasses,
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

  const handleScoreChange = (classId: string, eventId: string, score: number) => {
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

  const handleStudentScoreChange = (classId: string, eventId: string, studentId: string, score: number) => {
    const updatedClasses = classes.map(c => {
      if (c.id !== classId) return c;
      const currentResult = c.results[eventId] || { score: 0 };
      const currentScores = currentResult.studentScores || {};
      const newScores = { ...currentScores, [studentId]: score };

      // Auto-calculate total
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

  const toggleParticipant = (classId: string, eventId: string, studentId: string) => {
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
                      evt.type === 'TEAM'
                        ? 'bg-purple-400/30 text-purple-100'
                        : 'bg-blue-400/30 text-blue-100'
                    }`}
                  >
                    {evt.type === 'TEAM' ? '단체전' : '개인전'}
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
                    const participantCount = evt.type === 'TEAM' ? (result?.teamParticipantIds?.length || 0) : cls.students.length;

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
                              {evt.type === 'TEAM' ? (
                                // Team Event
                                <>
                                  <div className="flex items-center gap-2 mb-2">
                                    <label className="text-xs font-bold text-slate-700">팀 점수:</label>
                                    <input
                                      type="number"
                                      value={score || ''}
                                      onChange={(e) => handleScoreChange(cls.id, evt.id, parseInt(e.target.value) || 0)}
                                      className="w-20 px-2 py-1 text-center text-sm font-bold border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">참가자 선택</p>
                                    <div className="grid grid-cols-2 gap-1">
                                      {cls.students.map((student) => {
                                        const isSelected = result?.teamParticipantIds?.includes(student.id);
                                        return (
                                          <button
                                            key={student.id}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleParticipant(cls.id, evt.id, student.id);
                                            }}
                                            className={`px-2 py-1 text-xs rounded border transition-all flex items-center justify-between ${
                                              isSelected
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                          >
                                            <span className="truncate">{student.name}</span>
                                            {isSelected && <Check className="w-3 h-3 ml-1 flex-shrink-0" />}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                // Individual Event
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">학생별 점수</p>
                                  {cls.students.map((student) => {
                                    const studentScore = result?.studentScores?.[student.id] || 0;
                                    return (
                                      <div key={student.id} className="flex items-center gap-2">
                                        <span className="text-xs text-slate-700 flex-1 truncate">{student.name}</span>
                                        <input
                                          type="number"
                                          value={studentScore || ''}
                                          onChange={(e) => handleStudentScoreChange(cls.id, evt.id, student.id, parseInt(e.target.value) || 0)}
                                          className="w-16 px-2 py-1 text-xs text-center border border-slate-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                    );
                                  })}
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
