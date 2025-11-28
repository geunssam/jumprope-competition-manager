import React, { useState } from 'react';
import { CompetitionEvent, ClassTeam } from '../types';
import { X, ChevronDown, ChevronRight, Save } from 'lucide-react';
import { saveCompetitionResults } from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';

interface CompetitionRecordMatrixModalProps {
  date: string;
  classes: ClassTeam[];
  events: CompetitionEvent[];
  onClose: () => void;
}

export const CompetitionRecordMatrixModal: React.FC<CompetitionRecordMatrixModalProps> = ({
  date,
  classes,
  events,
  onClose
}) => {
  const { user } = useAuth();
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // 해당 날짜의 기록만 필터링
  const getScoreForDate = (cls: ClassTeam, eventId: string) => {
    const result = cls.results?.[eventId];
    if (!result) return null;

    const resultDate = result.date || '날짜 미지정';
    if (resultDate !== date) return null;

    return result.score || 0;
  };

  // 해당 날짜에 기록이 있는 종목만 필터링
  const eventsWithRecords = events.filter(event =>
    classes.some(cls => getScoreForDate(cls, event.id) !== null)
  );

  // 학급 펼치기/접기 토글
  const toggleClassExpand = (classId: string) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classId)) {
      newExpanded.delete(classId);
    } else {
      newExpanded.add(classId);
    }
    setExpandedClasses(newExpanded);
  };

  // 저장 핸들러
  const handleSave = async () => {
    if (!user?.uid) {
      setSaveMessage('❌ 사용자 인증 정보가 없습니다.');
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    try {
      // Phase 2.5: userId 파라미터 추가
      await saveCompetitionResults(user.uid, classes);
      setSaveMessage('✅ 저장되었습니다!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('저장 실패:', error);
      setSaveMessage('❌ 저장에 실패했습니다.');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{date} 대회 기록</h3>
            <p className="text-sm text-slate-500 mt-1">
              {eventsWithRecords.length}개 종목 기록
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {eventsWithRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              해당 날짜에 기록된 종목이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border border-slate-200">
                      학급
                    </th>
                    {eventsWithRecords.map(event => (
                      <th
                        key={event.id}
                        className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border border-slate-200"
                      >
                        {event.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classes.map(cls => {
                    const isExpanded = expandedClasses.has(cls.id);
                    return (
                      <React.Fragment key={cls.id}>
                        {/* 학급 총점 행 */}
                        <tr className="hover:bg-slate-50 transition-colors cursor-pointer">
                          <td
                            onClick={() => toggleClassExpand(cls.id)}
                            className="px-4 py-3 font-medium text-slate-900 border border-slate-200"
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                              {cls.name}
                            </div>
                          </td>
                          {eventsWithRecords.map(event => {
                            const score = getScoreForDate(cls, event.id);
                            return (
                              <td
                                key={event.id}
                                className="px-4 py-3 text-center border border-slate-200"
                              >
                                {score !== null ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800">
                                    {score}회
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>

                        {/* 선수별 기록 행 (펼쳐진 경우) */}
                        {isExpanded && eventsWithRecords.some(event => {
                          const result = cls.results?.[event.id];
                          return result && (result.studentScores || result.teams);
                        }) && cls.students.map(student => (
                          <tr key={`${cls.id}-${student.id}`} className="bg-slate-100">
                            <td className="px-4 py-2 text-sm text-slate-700 border border-slate-200 pl-12">
                              {student.name}
                            </td>
                            {eventsWithRecords.map(event => {
                              const result = cls.results?.[event.id];
                              const resultDate = result?.date || '날짜 미지정';

                              if (resultDate !== date) {
                                return (
                                  <td key={event.id} className="px-4 py-2 text-center text-sm border border-slate-200">
                                    <span className="text-slate-400">-</span>
                                  </td>
                                );
                              }

                              // 개인전: studentScores 표시
                              if (result?.studentScores) {
                                const studentScore = result.studentScores[student.id] || 0;
                                return (
                                  <td key={event.id} className="px-4 py-2 text-center text-sm border border-slate-200">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      {studentScore}회
                                    </span>
                                  </td>
                                );
                              }

                              // 단체전/짝 종목: teams 표시 (해당 학생이 속한 팀)
                              if (result?.teams) {
                                const studentTeam = result.teams.find(team =>
                                  team.memberIds?.includes(student.id)
                                );
                                if (studentTeam) {
                                  return (
                                    <td key={event.id} className="px-4 py-2 text-center text-sm border border-slate-200">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        팀 {studentTeam.score}회
                                      </span>
                                    </td>
                                  );
                                }
                              }

                              return (
                                <td key={event.id} className="px-4 py-2 text-center text-sm border border-slate-200">
                                  <span className="text-slate-400">-</span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          {/* 저장 메시지 */}
          <div className="flex-1">
            {saveMessage && (
              <p className={`text-sm font-medium ${saveMessage.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                {saveMessage}
              </p>
            )}
          </div>

          {/* 버튼 그룹 */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
