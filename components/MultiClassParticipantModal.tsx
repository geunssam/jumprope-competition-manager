import React, { useState } from 'react';
import { X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';
import { ClassTeam, CompetitionEvent } from '../types';

interface MultiClassParticipantModalProps {
  event: CompetitionEvent;
  classes: ClassTeam[];
  existingData: Record<string, string[]>; // classId -> participantIds
  onSave: (data: Record<string, string[]>) => void;
  onClose: () => void;
}

export const MultiClassParticipantModal: React.FC<MultiClassParticipantModalProps> = ({
  event,
  classes,
  existingData,
  onSave,
  onClose,
}) => {
  const [selectedStudents, setSelectedStudents] = useState<Record<string, string[]>>(existingData);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(
    new Set(classes.map(c => c.id))
  );

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

  const isStudentSelected = (classId: string, studentId: string) => {
    return selectedStudents[classId]?.includes(studentId) || false;
  };

  const getTotalSelectedCount = () => {
    return Object.values(selectedStudents).reduce((sum, arr) => sum + arr.length, 0);
  };

  const handleSave = () => {
    onSave(selectedStudents);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{event.name} - 출전 학생 선택</h3>
            <p className="text-sm text-blue-100">
              모든 학급 ({classes.length}개 학급)
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
            {/* Total Summary */}
            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900 mb-1">
                  📋 전체 선택 현황
                </p>
                <p className="text-xs text-slate-600">
                  이 종목에 출전할 학생을 학급별로 선택해주세요
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-blue-600">
                  {getTotalSelectedCount()}명
                </div>
                <div className="text-xs text-slate-500">전체 선택</div>
              </div>
            </div>

            {/* Class Sections */}
            {classes.map((classTeam) => {
              const isExpanded = expandedClasses.has(classTeam.id);
              const selectedCount = selectedStudents[classTeam.id]?.length || 0;

              return (
                <div
                  key={classTeam.id}
                  className="border-2 border-slate-200 rounded-xl overflow-hidden"
                >
                  {/* Class Header */}
                  <button
                    onClick={() => toggleClass(classTeam.id)}
                    className="w-full bg-slate-50 hover:bg-slate-100 px-4 py-3 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-lg text-slate-900">
                        {classTeam.name}
                      </div>
                      <div className="text-sm text-slate-500">
                        ({classTeam.students.length}명)
                      </div>
                      <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                        {selectedCount}명 선택
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  {/* Student Grid */}
                  {isExpanded && (
                    <div className="p-4 bg-white">
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
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                            >
                              <span className="truncate">{student.name}</span>
                              {selected && <Check className="w-3 h-3 ml-1 flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* No Selection Warning */}
            {getTotalSelectedCount() === 0 && (
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <p className="text-sm text-orange-700">
                  ⚠️ 최소 1명 이상의 학생을 선택해주세요.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 flex justify-between items-center bg-slate-50">
          <div className="text-sm text-slate-600">
            총 <span className="font-bold text-blue-600">{getTotalSelectedCount()}명</span> 선택됨
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} type="button">
              취소
            </Button>
            <Button onClick={handleSave} type="button" disabled={getTotalSelectedCount() === 0}>
              확인
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
