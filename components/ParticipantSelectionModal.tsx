import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from './Button';
import { ClassTeam, CompetitionEvent } from '../types';

interface ParticipantSelectionModalProps {
  event: CompetitionEvent;
  classTeam: ClassTeam;
  existingParticipantIds: string[];
  onSave: (participantIds: string[]) => void;
  onClose: () => void;
}

export const ParticipantSelectionModal: React.FC<ParticipantSelectionModalProps> = ({
  event,
  classTeam,
  existingParticipantIds,
  onSave,
  onClose,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(existingParticipantIds);

  const toggleStudent = (studentId: string) => {
    setSelectedIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSave = () => {
    onSave(selectedIds);
  };

  const isStudentSelected = (studentId: string) => selectedIds.includes(studentId);

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
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{event.name} - 출전 학생 선택</h3>
            <p className="text-sm text-blue-100">
              {classTeam.name} ({classTeam.students.length}명)
            </p>
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
            {/* Info */}
            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <p className="text-sm font-bold text-slate-900 mb-1">
                📋 출전 학생 선택
              </p>
              <p className="text-xs text-slate-600">
                이 종목에 출전할 학생을 선택해주세요. 선택된 학생만 경기 기록 테이블에 표시됩니다.
              </p>
            </div>

            {/* Selection Status */}
            <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-200">
              <span className="text-sm font-bold text-slate-900">
                선택된 학생
              </span>
              <span className="text-lg font-black text-blue-600">
                {selectedIds.length}명
              </span>
            </div>

            {/* Student Grid */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3">
                학생 목록
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
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
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
            {selectedIds.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  선택된 학생 ({selectedIds.length}명)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedIds.map((studentId, idx) => {
                    const student = classTeam.students.find(s => s.id === studentId);
                    return (
                      <div
                        key={studentId}
                        className="inline-flex items-center px-3 py-2 rounded-lg text-sm bg-white text-slate-700 border-2 border-blue-200 font-medium"
                      >
                        <span className="text-xs text-blue-600 font-bold mr-2">
                          {idx + 1}
                        </span>
                        {student?.name || '???'}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No Selection Warning */}
            {selectedIds.length === 0 && (
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <p className="text-sm text-orange-700">
                  ⚠️ 최소 1명 이상의 학생을 선택해주세요.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3 bg-slate-50">
          <Button variant="secondary" onClick={onClose} type="button">
            취소
          </Button>
          <Button onClick={handleSave} type="button" disabled={selectedIds.length === 0}>
            확인
          </Button>
        </div>
      </div>
    </div>
  );
};
