import React, { useState, useEffect } from 'react';
import { ClassTeam, CompetitionEvent } from '../types';
import { X, Users, Trophy, Check } from 'lucide-react';
import { Button } from './Button';

interface RecordInputModalProps {
  classTeam: ClassTeam;
  event: CompetitionEvent;
  allClasses: ClassTeam[];
  onUpdateClasses: (classes: ClassTeam[]) => void;
  onClose: () => void;
}

export const RecordInputModal: React.FC<RecordInputModalProps> = ({
  classTeam,
  event,
  allClasses,
  onUpdateClasses,
  onClose,
}) => {
  const currentResult = classTeam.results[event.id] || { score: 0 };

  const [teamScore, setTeamScore] = useState(currentResult.score || 0);
  const [teamParticipants, setTeamParticipants] = useState<string[]>(
    currentResult.teamParticipantIds || []
  );
  const [studentScores, setStudentScores] = useState<Record<string, number>>(
    currentResult.studentScores || {}
  );

  // Auto-calculate total for individual events
  useEffect(() => {
    if (event.type === 'INDIVIDUAL') {
      const total = Object.values(studentScores).reduce(
        (sum, score) => sum + (score || 0),
        0
      );
      setTeamScore(total);
    }
  }, [studentScores, event.type]);

  const handleSave = () => {
    const updatedClasses = allClasses.map((c) => {
      if (c.id !== classTeam.id) return c;

      const newResult =
        event.type === 'TEAM'
          ? {
              score: teamScore,
              teamParticipantIds: teamParticipants,
            }
          : {
              score: teamScore,
              studentScores: studentScores,
            };

      return {
        ...c,
        results: {
          ...c.results,
          [event.id]: newResult,
        },
      };
    });

    onUpdateClasses(updatedClasses);
    onClose();
  };

  const handleStudentScoreChange = (studentId: string, score: number) => {
    setStudentScores((prev) => ({
      ...prev,
      [studentId]: score,
    }));
  };

  const toggleParticipant = (studentId: string) => {
    setTeamParticipants((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              {event.type === 'TEAM' ? (
                <Users className="w-5 h-5" />
              ) : (
                <Trophy className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold">{classTeam.name}</h3>
              <p className="text-sm text-indigo-100">{event.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {event.type === 'TEAM' ? (
            // TEAM EVENT UI
            <div className="space-y-6">
              {/* Team Score Input */}
              <div className="bg-indigo-50 rounded-xl p-6 border-2 border-indigo-200">
                <label className="block text-sm font-bold text-indigo-900 mb-3">
                  팀 점수 입력
                </label>
                <input
                  type="number"
                  value={teamScore || ''}
                  onChange={(e) => setTeamScore(parseInt(e.target.value) || 0)}
                  className="w-full text-4xl font-bold text-center px-4 py-4 border-2 border-indigo-300 rounded-xl focus:ring-4 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-indigo-700"
                  placeholder="0"
                  autoFocus
                />
              </div>

              {/* Participant Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900">
                    참가 학생 선택
                  </h4>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {teamParticipants.length}명 선택됨
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {classTeam.students.map((student) => {
                    const isSelected = teamParticipants.includes(student.id);
                    return (
                      <button
                        key={student.id}
                        onClick={() => toggleParticipant(student.id)}
                        className={`px-3 py-2.5 text-sm rounded-lg border-2 transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-105'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate font-medium">{student.name}</span>
                        {isSelected && <Check className="w-4 h-4 ml-1 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {classTeam.students.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-8">
                    등록된 학생이 없습니다.
                  </p>
                )}
              </div>
            </div>
          ) : (
            // INDIVIDUAL EVENT UI
            <div className="space-y-4">
              <div className="bg-indigo-50 rounded-xl p-4 border-2 border-indigo-200 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-indigo-900">
                    총 점수 (자동 계산)
                  </span>
                  <span className="text-4xl font-black text-indigo-700">
                    {teamScore}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3">
                  학생별 점수 입력
                </h4>
                <div className="space-y-2">
                  {classTeam.students.map((student) => {
                    const score = studentScores[student.id] || 0;
                    return (
                      <div
                        key={student.id}
                        className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors"
                      >
                        <span className="flex-1 font-medium text-slate-900">
                          {student.name}
                        </span>
                        <input
                          type="number"
                          value={score || ''}
                          onChange={(e) =>
                            handleStudentScoreChange(
                              student.id,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-28 px-3 py-2 text-center text-lg font-bold border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          placeholder="0"
                        />
                      </div>
                    );
                  })}
                  {classTeam.students.length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-8">
                      등록된 학생이 없습니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3 bg-slate-50">
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </div>
      </div>
    </div>
  );
};
