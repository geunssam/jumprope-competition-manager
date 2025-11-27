import React, { useState } from 'react';
import { X, Users, UserPlus } from 'lucide-react';
import { Button } from './Button';
import { Student } from '../types';
import { generateUniqueAccessCode } from '../lib/accessCodeGenerator';

interface CreateClassModalProps {
  grade?: number;
  onSubmit: (grade: number, className: string, students: Student[]) => void;
  onClose: () => void;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({
  grade,
  onSubmit,
  onClose,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<number>(grade || 1);
  const [className, setClassName] = useState('');
  const [studentNames, setStudentNames] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!className.trim()) {
      alert('학급명을 입력해주세요.');
      return;
    }

    if (!studentNames.trim()) {
      alert('학생 명단을 입력해주세요.');
      return;
    }

    // 쉼표 또는 줄바꿈으로 구분된 학생 이름 파싱
    // 중복 없는 accessCode 생성을 위해 기존 코드 추적
    const existingCodes: string[] = [];

    const students: Student[] = studentNames
      .split(/[,\n]/)  // 쉼표 또는 줄바꿈으로 분리
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map((name, idx) => {
        // 각 학생마다 고유한 accessCode 생성
        const accessCode = generateUniqueAccessCode(existingCodes);
        existingCodes.push(accessCode);

        return {
          id: `std_${Date.now()}_${idx}`,
          name,
          accessCode, // 🆕 학생 식별용 코드 추가
        };
      });

    if (students.length === 0) {
      alert('최소 1명 이상의 학생을 입력해주세요.');
      return;
    }

    onSubmit(selectedGrade, className.trim(), students);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">새 학급 등록</h3>
              <p className="text-sm text-indigo-100">학급 정보를 입력하세요</p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 p-6">
            <div className="space-y-6">
              {/* Grade and Class Name Input */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    학년 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(Number(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6].map(g => (
                      <option key={g} value={g}>{g}학년</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    반 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="예: 1반, 가반"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg"
                    autoFocus
                  />
                </div>
              </div>

              {/* Student Names Input */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  학생 명단 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={studentNames}
                  onChange={(e) => setStudentNames(e.target.value)}
                  placeholder="김철수&#10;이영희&#10;박민수&#10;최지우"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none h-64 resize-none leading-relaxed text-base"
                />
                <p className="text-xs text-slate-500 mt-1">
                  <Users className="w-3 h-3 inline mr-1" />
                  학생 이름을 <strong>줄바꿈(엔터)</strong> 또는 쉼표(,)로 구분하여 입력하세요.
                </p>
              </div>

              {/* Preview */}
              {studentNames.trim() && (
                <div className="bg-indigo-50 rounded-xl p-3 border-2 border-indigo-100">
                  <h4 className="text-xs font-bold text-indigo-900 mb-2 uppercase tracking-wider">
                    입력된 학생 미리보기 ({studentNames.split(/[,\n]/).filter(s => s.trim().length > 0).length}명)
                  </h4>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {studentNames
                      .split(/[,\n]/)
                      .map(s => s.trim())
                      .filter(s => s.length > 0)
                      .map((name, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-white text-slate-700 border border-indigo-200 font-medium"
                        >
                          {name}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3 bg-slate-50">
            <Button variant="secondary" onClick={onClose} type="button">
              취소
            </Button>
            <Button type="submit">
              학급 생성
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
