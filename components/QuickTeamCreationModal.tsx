import React, { useState, useEffect } from 'react';
import { X, Users, Trash2, Check } from 'lucide-react';
import { Button } from './Button';
import { ClassTeam, CompetitionEvent, Team } from '../types';

interface QuickTeamCreationModalProps {
  event: CompetitionEvent;
  classTeam: ClassTeam;
  existingTeams: Team[];
  onSave: (teams: Team[]) => void;
  onClose: () => void;
}

export const QuickTeamCreationModal: React.FC<QuickTeamCreationModalProps> = ({
  event,
  classTeam,
  existingTeams,
  onSave,
  onClose,
}) => {
  const [teams, setTeams] = useState<Team[]>(existingTeams);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 짝줄넘기: 2명 선택 시 자동 팀 생성
  useEffect(() => {
    if (event.type === 'PAIR' && selectedIds.length === 2) {
      createTeamFromSelection(selectedIds);
    }
  }, [selectedIds, event.type]);

  const toggleStudent = (studentId: string) => {
    setSelectedIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

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

  const handleCreateTeam = () => {
    if (selectedIds.length === 0) {
      alert('팀원을 선택해주세요.');
      return;
    }
    createTeamFromSelection(selectedIds);
  };

  const handleDeleteTeam = (teamId: string) => {
    if (!confirm('정말로 이 팀을 삭제하시겠습니까?')) return;

    // 팀 삭제 후 자동 재정렬
    const updatedTeams = teams
      .filter(t => t.id !== teamId)
      .map((team, idx) => {
        // 팀 이름 유지 (학생 이름 포함)
        return team;
      });

    setTeams(updatedTeams);
  };

  const handleSave = () => {
    onSave(teams);
  };

  const isStudentSelected = (studentId: string) => selectedIds.includes(studentId);

  const isPairAndReady = event.type === 'PAIR' && selectedIds.length === 2;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
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
                {classTeam.name} • {event.type === 'PAIR' ? '짝 종목 (2명)' : '단체 종목'}
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
            {/* Generated Teams */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900">
                  생성된 팀 ({teams.length}팀)
                </h4>
              </div>

              {teams.length === 0 ? (
                <div className="bg-slate-50 rounded-lg p-6 text-center border-2 border-dashed border-slate-300">
                  <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">
                    아직 생성된 팀이 없습니다.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {event.type === 'PAIR'
                      ? '학생 2명을 선택하면 자동으로 팀이 생성됩니다.'
                      : '학생을 선택한 후 "팀 생성" 버튼을 눌러주세요.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {teams.map((team, idx) => (
                    <div
                      key={team.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                        event.type === 'PAIR'
                          ? 'bg-green-50 border-green-200 hover:border-green-300'
                          : 'bg-purple-50 border-purple-200 hover:border-purple-300'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        event.type === 'PAIR' ? 'bg-green-600 text-white' : 'bg-purple-600 text-white'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm text-slate-900">
                          {team.name}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {team.memberIds.map((memberId) => {
                            const student = classTeam.students.find(s => s.id === memberId);
                            return (
                              <span
                                key={memberId}
                                className={`text-xs px-2 py-0.5 rounded ${
                                  event.type === 'PAIR'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-purple-100 text-purple-700'
                                }`}
                              >
                                {student?.name || '???'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="팀 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Student Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                학생 선택
                {event.type === 'PAIR' && (
                  <span className="ml-2 text-xs font-normal text-green-600">
                    (2명씩 선택하면 자동 팀 생성)
                  </span>
                )}
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {classTeam.students.map((student) => {
                  const selected = isStudentSelected(student.id);
                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => toggleStudent(student.id)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all font-medium text-sm flex items-center justify-between ${
                        selected
                          ? event.type === 'PAIR'
                            ? 'bg-green-600 text-white border-green-600 shadow-md'
                            : 'bg-purple-600 text-white border-purple-600 shadow-md'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="truncate">{student.name}</span>
                      {selected && <Check className="w-4 h-4 ml-2 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Selection Status */}
              <div className="mt-3 flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-200">
                <span className="text-sm font-bold text-slate-900">
                  선택: {selectedIds.length}명
                </span>
                {isPairAndReady && (
                  <span className="text-sm font-bold text-green-600 animate-pulse">
                    → 자동 팀 생성!
                  </span>
                )}
              </div>

              {/* Manual Team Creation Button (TEAM only) */}
              {event.type === 'TEAM' && selectedIds.length > 0 && (
                <Button
                  onClick={handleCreateTeam}
                  className="w-full mt-3"
                >
                  팀 생성 ({selectedIds.length}명)
                </Button>
              )}
            </div>

            {/* Instructions */}
            <div className={`rounded-lg p-4 border-2 ${
              event.type === 'PAIR'
                ? 'bg-green-50 border-green-200'
                : 'bg-purple-50 border-purple-200'
            }`}>
              <p className="text-sm font-bold text-slate-900 mb-1">
                💡 안내
              </p>
              <ul className="text-xs text-slate-600 space-y-1 ml-4 list-disc">
                {event.type === 'PAIR' ? (
                  <>
                    <li>학생 2명을 선택하면 자동으로 팀이 생성됩니다.</li>
                    <li>잘못 선택한 팀은 삭제 버튼으로 제거할 수 있습니다.</li>
                    <li>같은 학생이 여러 팀에 참가할 수 있습니다.</li>
                  </>
                ) : (
                  <>
                    <li>원하는 인원을 선택한 후 "팀 생성" 버튼을 눌러주세요.</li>
                    <li>잘못 생성한 팀은 삭제 버튼으로 제거할 수 있습니다.</li>
                    <li>같은 학생이 여러 팀에 참가할 수 있습니다.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 flex justify-between items-center bg-slate-50">
          <p className="text-sm text-slate-600">
            총 {teams.length}팀 생성됨
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button onClick={handleSave}>
              완료
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
