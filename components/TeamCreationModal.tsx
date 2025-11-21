import React, { useState, useEffect } from 'react';
import { X, Users, Check } from 'lucide-react';
import { Button } from './Button';
import { ClassTeam, CompetitionEvent, Team } from '../types';

interface TeamCreationModalProps {
  classTeam: ClassTeam;
  event: CompetitionEvent;
  existingTeam: Team | null;
  onSave: (team: Team) => void;
  onClose: () => void;
}

export const TeamCreationModal: React.FC<TeamCreationModalProps> = ({
  classTeam,
  event,
  existingTeam,
  onSave,
  onClose,
}) => {
  const [teamName, setTeamName] = useState(existingTeam?.name || '');
  const [selectedStudents, setSelectedStudents] = useState<string[]>(
    existingTeam?.memberIds || []
  );

  useEffect(() => {
    // Auto-generate team name if creating new team
    if (!existingTeam && !teamName) {
      const existingTeams = classTeam.results[event.id]?.teams || [];
      const nextLetter = String.fromCharCode(65 + existingTeams.length); // A, B, C...
      setTeamName(`${classTeam.name} ${nextLetter}팀`);
    }
  }, [existingTeam, teamName, classTeam, event]);

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim()) {
      alert('팀 이름을 입력해주세요.');
      return;
    }

    if (selectedStudents.length === 0) {
      alert('최소 1명 이상의 팀원을 선택해주세요.');
      return;
    }

    // Validate team size for PAIR events
    if (event.type === 'PAIR' && selectedStudents.length !== 2) {
      alert('짝 종목은 정확히 2명을 선택해야 합니다.');
      return;
    }

    const team: Team = {
      id: existingTeam?.id || `team_${Date.now()}`,
      classId: classTeam.id,
      eventId: event.id,
      name: teamName.trim(),
      memberIds: selectedStudents,
      score: existingTeam?.score || 0
    };

    onSave(team);
  };

  const isStudentSelected = (studentId: string) => selectedStudents.includes(studentId);

  const canSubmit = teamName.trim() && selectedStudents.length > 0 &&
    (event.type !== 'PAIR' || selectedStudents.length === 2);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {existingTeam ? '팀 수정' : '새 팀 생성'}
              </h3>
              <p className="text-sm text-purple-100">
                {classTeam.name} • {event.name}
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Team Name Input */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                팀 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="예: 1반 A팀"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-lg"
                autoFocus
              />
            </div>

            {/* Team Size Info */}
            <div className={`rounded-lg p-4 border-2 ${
              event.type === 'PAIR'
                ? 'bg-green-50 border-green-200'
                : 'bg-purple-50 border-purple-200'
            }`}>
              <p className="text-sm font-bold text-slate-900 mb-1">
                {event.type === 'PAIR' ? '짝 종목' : '단체 종목'} 안내
              </p>
              <p className="text-xs text-slate-600">
                {event.type === 'PAIR'
                  ? '정확히 2명을 선택해주세요.'
                  : '여러 명을 자유롭게 선택할 수 있습니다.'}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                현재 선택: <strong className={`${
                  selectedStudents.length === 0 ? 'text-red-500' :
                  event.type === 'PAIR' && selectedStudents.length === 2 ? 'text-green-600' :
                  event.type === 'PAIR' ? 'text-orange-500' : 'text-purple-600'
                }`}>
                  {selectedStudents.length}명
                </strong>
              </p>
            </div>

            {/* Student Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3">
                팀원 선택 <span className="text-red-500">*</span>
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
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      <span className="truncate">{student.name}</span>
                      {selected && <Check className="w-4 h-4 ml-2 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Students Preview */}
            {selectedStudents.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  선택된 팀원
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedStudents.map((studentId, idx) => {
                    const student = classTeam.students.find(s => s.id === studentId);
                    return (
                      <div
                        key={studentId}
                        className="inline-flex items-center px-3 py-2 rounded-lg text-sm bg-white text-slate-700 border-2 border-purple-200 font-medium"
                      >
                        <span className="text-xs text-purple-600 font-bold mr-2">
                          {idx + 1}
                        </span>
                        {student?.name || '???'}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Validation Message */}
            {event.type === 'PAIR' && selectedStudents.length > 0 && selectedStudents.length !== 2 && (
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <p className="text-sm text-orange-700">
                  ⚠️ 짝 종목은 정확히 2명을 선택해야 합니다.
                  (현재 {selectedStudents.length}명 선택됨)
                </p>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3 bg-slate-50">
          <Button variant="secondary" onClick={onClose} type="button">
            취소
          </Button>
          <Button onClick={handleSubmit} type="submit" disabled={!canSubmit}>
            {existingTeam ? '팀 수정' : '팀 생성'}
          </Button>
        </div>
      </div>
    </div>
  );
};
