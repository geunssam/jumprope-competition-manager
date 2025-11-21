import React, { useState } from 'react';
import { X, Users, Plus, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { ClassTeam, CompetitionEvent, Team } from '../types';
import { TeamCreationModal } from './TeamCreationModal';

interface TeamManagementModalProps {
  event: CompetitionEvent;
  participatingClasses: ClassTeam[];
  onUpdateClasses: (classes: ClassTeam[]) => void;
  onClose: () => void;
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  event,
  participatingClasses,
  onUpdateClasses,
  onClose,
}) => {
  const [selectedClass, setSelectedClass] = useState<ClassTeam | null>(null);
  const [showTeamCreator, setShowTeamCreator] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // Get teams for a specific class and event
  const getClassTeams = (classId: string): Team[] => {
    const classTeam = participatingClasses.find(c => c.id === classId);
    if (!classTeam) return [];
    const result = classTeam.results[event.id];
    return result?.teams || [];
  };

  // Calculate total team count and participant count for a class
  const getClassStats = (classId: string) => {
    const teams = getClassTeams(classId);
    const totalParticipants = new Set(teams.flatMap(t => t.memberIds)).size;
    return { teamCount: teams.length, totalParticipants };
  };

  const handleAddTeam = (classTeam: ClassTeam) => {
    const teams = getClassTeams(classTeam.id);
    if (teams.length >= 5) {
      alert('한 학급당 최대 5개의 팀만 생성할 수 있습니다.');
      return;
    }
    setSelectedClass(classTeam);
    setEditingTeam(null);
    setShowTeamCreator(true);
  };

  const handleEditTeam = (classTeam: ClassTeam, team: Team) => {
    setSelectedClass(classTeam);
    setEditingTeam(team);
    setShowTeamCreator(true);
  };

  const handleDeleteTeam = (classId: string, teamId: string) => {
    if (!confirm('정말로 이 팀을 삭제하시겠습니까?')) return;

    const updatedClasses = participatingClasses.map(cls => {
      if (cls.id !== classId) return cls;

      const result = cls.results[event.id] || { score: 0 };
      const teams = (result.teams || []).filter(t => t.id !== teamId);

      // Recalculate total score
      const totalScore = teams.reduce((sum, t) => sum + t.score, 0);

      return {
        ...cls,
        results: {
          ...cls.results,
          [event.id]: {
            ...result,
            teams,
            score: totalScore
          }
        }
      };
    });

    onUpdateClasses(updatedClasses);
  };

  const handleSaveTeam = (team: Team) => {
    if (!selectedClass) return;

    const updatedClasses = participatingClasses.map(cls => {
      if (cls.id !== selectedClass.id) return cls;

      const result = cls.results[event.id] || { score: 0 };
      let teams = result.teams || [];

      if (editingTeam) {
        // Update existing team
        teams = teams.map(t => t.id === editingTeam.id ? team : t);
      } else {
        // Add new team
        teams = [...teams, team];
      }

      // Recalculate total score
      const totalScore = teams.reduce((sum, t) => sum + t.score, 0);

      return {
        ...cls,
        results: {
          ...cls.results,
          [event.id]: {
            ...result,
            teams,
            score: totalScore
          }
        }
      };
    });

    onUpdateClasses(updatedClasses);
    setShowTeamCreator(false);
    setSelectedClass(null);
    setEditingTeam(null);
  };

  const canComplete = participatingClasses.every(cls => {
    const teams = getClassTeams(cls.id);
    return teams.length > 0;
  });

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">팀 구성</h3>
                <p className="text-sm text-indigo-100">
                  {event.name} ({event.type === 'PAIR' ? '짝' : '단체'} 종목)
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
              {participatingClasses.map((cls) => {
                const { teamCount, totalParticipants } = getClassStats(cls.id);
                const teams = getClassTeams(cls.id);

                return (
                  <div
                    key={cls.id}
                    className="bg-slate-50 rounded-xl p-5 border-2 border-slate-200"
                  >
                    {/* Class Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">{cls.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          <Users className="w-3 h-3 inline mr-1" />
                          전체 {cls.students.length}명 • 참가 {totalParticipants}명 • {teamCount}/5팀
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddTeam(cls)}
                        disabled={teamCount >= 5}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        팀 추가
                      </Button>
                    </div>

                    {/* Teams List */}
                    {teams.length === 0 ? (
                      <div className="bg-white rounded-lg p-6 text-center border-2 border-dashed border-slate-300">
                        <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">
                          아직 생성된 팀이 없습니다.
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          '팀 추가' 버튼을 눌러 팀을 생성하세요.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {teams.map((team) => (
                          <div
                            key={team.id}
                            className="bg-white rounded-lg p-4 border border-slate-200 hover:border-indigo-300 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h5 className="font-bold text-slate-900">{team.name}</h5>
                                <p className="text-xs text-slate-500 mt-1">
                                  {team.memberIds.length}명 • {team.score}점
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEditTeam(cls, team)}
                                  className="px-2 py-1 text-xs bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => handleDeleteTeam(cls.id, team.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {team.memberIds.map((memberId) => {
                                const student = cls.students.find(s => s.id === memberId);
                                return (
                                  <span
                                    key={memberId}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700"
                                  >
                                    {student?.name || '???'}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Instructions */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>💡 안내</strong>
              </p>
              <ul className="text-xs text-blue-700 mt-2 space-y-1 ml-4 list-disc">
                <li>각 학급당 최대 5개의 팀을 생성할 수 있습니다.</li>
                <li>학생은 여러 팀에 중복으로 참가할 수 있습니다.</li>
                <li>
                  {event.type === 'PAIR'
                    ? '짝 종목은 2명으로 팀을 구성합니다.'
                    : '단체 종목은 여러 명으로 팀을 구성할 수 있습니다.'}
                </li>
                <li>모든 학급에 최소 1개 이상의 팀을 생성해야 완료할 수 있습니다.</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 px-6 py-4 flex justify-between items-center bg-slate-50">
            <p className="text-sm text-slate-600">
              {participatingClasses.filter(cls => getClassTeams(cls.id).length > 0).length} / {participatingClasses.length} 학급 완료
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose}>
                취소
              </Button>
              <Button onClick={onClose} disabled={!canComplete}>
                완료
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Team Creation Modal */}
      {showTeamCreator && selectedClass && (
        <TeamCreationModal
          classTeam={selectedClass}
          event={event}
          existingTeam={editingTeam}
          onSave={handleSaveTeam}
          onClose={() => {
            setShowTeamCreator(false);
            setSelectedClass(null);
            setEditingTeam(null);
          }}
        />
      )}
    </>
  );
};
