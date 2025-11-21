import React, { useState, useEffect } from 'react';
import { X, Users, Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';
import { ClassTeam, CompetitionEvent, Team } from '../types';

interface MultiClassTeamCreationModalProps {
  event: CompetitionEvent;
  classes: ClassTeam[];
  existingData: Record<string, Team[]>; // classId -> teams
  onSave: (data: Record<string, Team[]>) => void;
  onClose: () => void;
}

export const MultiClassTeamCreationModal: React.FC<MultiClassTeamCreationModalProps> = ({
  event,
  classes,
  existingData,
  onSave,
  onClose,
}) => {
  const [teams, setTeams] = useState<Record<string, Team[]>>(existingData);
  const [selectedStudents, setSelectedStudents] = useState<Record<string, string[]>>({});
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(
    new Set(classes.map(c => c.id))
  );

  // 짝줄넘기: 2명 선택 시 자동 팀 생성
  useEffect(() => {
    if (event.type === 'PAIR') {
      Object.entries(selectedStudents).forEach(([classId, studentIds]) => {
        if (studentIds.length === 2) {
          createTeamFromSelection(classId, studentIds);
        }
      });
    }
  }, [selectedStudents, event.type]);

  const toggleClass = (classId: string) => {
    setExpandedClasses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(classId)) {
        newSet.delete(classId);
      } else {
        newSet.add(classId);
      }
      return newSet;
    });
  };

  const toggleStudent = (classId: string, studentId: string) => {
    setSelectedStudents(prev => {
      const classStudents = prev[classId] || [];
      const newClassStudents = classStudents.includes(studentId)
        ? classStudents.filter(id => id !== studentId)
        : [...classStudents, studentId];

      return {
        ...prev,
        [classId]: newClassStudents
      };
    });
  };

  const createTeamFromSelection = (classId: string, memberIds: string[]) => {
    const classTeam = classes.find(c => c.id === classId);
    if (!classTeam) return;

    const memberNames = memberIds
      .map(id => classTeam.students.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(',');

    const newTeam: Team = {
      id: `team_${Date.now()}_${Math.random()}`,
      classId,
      eventId: event.id,
      name: `${memberNames} 팀`,
      memberIds,
      score: 0
    };

    setTeams(prev => ({
      ...prev,
      [classId]: [...(prev[classId] || []), newTeam]
    }));

    setSelectedStudents(prev => ({
      ...prev,
      [classId]: []
    }));
  };

  const handleCreateTeam = (classId: string) => {
    const studentIds = selectedStudents[classId] || [];
    if (studentIds.length === 0) {
      alert('팀원을 선택해주세요.');
      return;
    }
    createTeamFromSelection(classId, studentIds);
  };

  const handleDeleteTeam = (classId: string, teamId: string) => {
    if (!confirm('정말로 이 팀을 삭제하시겠습니까?')) return;

    setTeams(prev => ({
      ...prev,
      [classId]: (prev[classId] || []).filter(t => t.id !== teamId)
    }));
  };

  const isStudentSelected = (classId: string, studentId: string) => {
    return selectedStudents[classId]?.includes(studentId) || false;
  };

  const getTotalTeamCount = () => {
    return Object.values(teams).reduce((sum, arr) => sum + arr.length, 0);
  };

  const handleSave = () => {
    onSave(teams);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r text-white px-6 py-4 flex items-center justify-between ${
          event.type === 'PAIR' ? 'from-green-600 to-green-500' : 'from-purple-600 to-purple-500'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{event.name} - 팀 구성</h3>
              <p className={`text-sm ${event.type === 'PAIR' ? 'text-green-100' : 'text-purple-100'}`}>
                모든 학급 ({classes.length}개 학급) • {event.type === 'PAIR' ? '짝 종목 (2명)' : '단체 종목'}
              </p>
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
          <div className="space-y-6">
            {/* Total Summary */}
            <div className={`rounded-lg p-4 border-2 flex items-center justify-between ${
              event.type === 'PAIR'
                ? 'bg-green-50 border-green-200'
                : 'bg-purple-50 border-purple-200'
            }`}>
              <div>
                <p className="text-sm font-bold text-slate-900 mb-1">
                  💡 전체 팀 현황
                </p>
                <p className="text-xs text-slate-600">
                  {event.type === 'PAIR'
                    ? '학생 2명을 선택하면 자동으로 팀이 생성됩니다.'
                    : '원하는 인원을 선택한 후 "팀 생성" 버튼을 눌러주세요.'}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-black ${
                  event.type === 'PAIR' ? 'text-green-600' : 'text-purple-600'
                }`}>
                  {getTotalTeamCount()}팀
                </div>
                <div className="text-xs text-slate-500">전체 생성</div>
              </div>
            </div>

            {/* Class Sections */}
            {classes.map((classTeam) => {
              const isExpanded = expandedClasses.has(classTeam.id);
              const classTeams = teams[classTeam.id] || [];
              const selectedCount = selectedStudents[classTeam.id]?.length || 0;

              return (
                <div
                  key={classTeam.id}
                  className="border-2 border-slate-200 rounded-xl overflow-hidden"
                >
                  {/* Class Header */}
                  <button
                    onClick={() => toggleClass(classTeam.id)}
                    className="w-full bg-slate-50 hover:bg-slate-100 px-4 py-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-base text-slate-900">
                        {classTeam.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {classTeam.students.length}명
                      </div>
                      <div className="h-4 w-px bg-slate-300"></div>
                      <div className={`px-2 py-0.5 rounded text-xs font-bold ${
                        event.type === 'PAIR'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {classTeams.length}팀
                      </div>
                      <div className="h-4 w-px bg-slate-300"></div>

                      {/* Generated Teams - Inline */}
                      <div className="flex-1 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {classTeams.map((team, idx) => (
                          <div
                            key={team.id}
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border ${
                              event.type === 'PAIR'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-purple-50 border-purple-200'
                            }`}
                          >
                            <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              event.type === 'PAIR' ? 'bg-green-600 text-white' : 'bg-purple-600 text-white'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="text-xs font-medium text-slate-700">
                              {team.memberIds.map((memberId) => {
                                const student = classTeam.students.find(s => s.id === memberId);
                                return student?.name || '???';
                              }).join(', ')}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTeam(classTeam.id, team.id);
                              }}
                              className="flex-shrink-0 p-0.5 text-red-500 hover:bg-red-100 rounded transition-colors"
                              title="팀 삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>

                  {/* Class Content */}
                  {isExpanded && (
                    <div className="p-4 bg-white space-y-4">

                      {/* Student Selection */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-bold text-slate-900">
                            학생 선택
                            {event.type === 'PAIR' && (
                              <span className="ml-2 text-xs font-normal text-green-600">
                                (2명씩 선택하면 자동 팀 생성)
                              </span>
                            )}
                          </label>
                          {selectedCount > 0 && (
                            <span className="text-xs text-slate-500">
                              {selectedCount}명 선택됨
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5">
                          {classTeam.students.map((student) => {
                            const selected = isStudentSelected(classTeam.id, student.id);
                            return (
                              <button
                                key={student.id}
                                type="button"
                                onClick={() => toggleStudent(classTeam.id, student.id)}
                                className={`px-2 py-1.5 rounded-md border-2 transition-all font-medium text-xs flex items-center justify-center ${
                                  selected
                                    ? event.type === 'PAIR'
                                      ? 'bg-green-600 text-white border-green-600 shadow-sm'
                                      : 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <span className="truncate">{student.name}</span>
                                {selected && <Check className="w-3 h-3 ml-1 flex-shrink-0" />}
                              </button>
                            );
                          })}
                        </div>

                        {/* Manual Team Creation Button (TEAM only) */}
                        {event.type === 'TEAM' && selectedCount > 0 && (
                          <Button
                            onClick={() => handleCreateTeam(classTeam.id)}
                            className="w-full mt-3"
                          >
                            팀 생성 ({selectedCount}명)
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 flex justify-between items-center bg-slate-50">
          <div className="text-sm text-slate-600">
            총 <span className={`font-bold ${event.type === 'PAIR' ? 'text-green-600' : 'text-purple-600'}`}>
              {getTotalTeamCount()}팀
            </span> 생성됨
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} type="button">
              취소
            </Button>
            <Button onClick={handleSave} type="button">
              완료
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
