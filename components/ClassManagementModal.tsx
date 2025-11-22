import React, { useState } from 'react';
import { X, Users, Trash2, UserPlus } from 'lucide-react';
import { ClassTeam, Student } from '../types';
import { CreateClassModal } from './CreateClassModal';
import { StudentListModal } from './StudentListModal';
import { Button } from './Button';

interface ClassManagementModalProps {
  competitionId: string;
  allClasses: ClassTeam[];
  onClose: () => void;
  onAddClass: (grade: number, className: string, students: Student[]) => void;
  onDeleteClass: (classId: string) => void;
  onUpdateStudents: (classId: string, students: Student[]) => void;
}

export const ClassManagementModal: React.FC<ClassManagementModalProps> = ({
  competitionId,
  allClasses,
  onClose,
  onAddClass,
  onDeleteClass,
  onUpdateStudents
}) => {
  const [selectedGrade, setSelectedGrade] = useState<number>(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassTeam | null>(null);

  // 선택한 학년의 학급 필터링
  const gradeClasses = allClasses.filter(cls => cls.grade === selectedGrade);

  const handleDeleteClass = (classData: ClassTeam) => {
    if (confirm(`"${classData.grade}학년 ${classData.name}"을(를) 삭제하시겠습니까?\n\n이 학급의 모든 경기 기록도 함께 삭제됩니다.`)) {
      onDeleteClass(classData.id);
    }
  };

  const handleClassCardClick = (classData: ClassTeam) => {
    setSelectedClass(classData);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-[1200px] h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">학급 관리</h3>
                <p className="text-sm text-indigo-100">학급 및 학생 정보를 관리합니다</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
              >
                <UserPlus className="w-4 h-4" />
                새 학급 추가
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Grade Tabs */}
          <div className="border-b border-slate-200 bg-slate-50">
            <div className="flex overflow-x-auto">
              {[1, 2, 3, 4, 5, 6].map((grade) => {
                const gradeClassCount = allClasses.filter(cls => cls.grade === grade).length;
                return (
                  <button
                    key={grade}
                    onClick={() => setSelectedGrade(grade)}
                    className={`flex-shrink-0 px-6 py-3 font-medium transition-colors border-b-2 ${
                      selectedGrade === grade
                        ? 'border-indigo-600 text-indigo-600 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {grade}학년
                    {gradeClassCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                        {gradeClassCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Class Cards */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            {gradeClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-full text-center py-12">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-10 h-10 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium mb-2">등록된 학급이 없습니다</p>
                <p className="text-sm text-slate-500 mb-4">
                  우측 상단의 "새 학급 추가" 버튼을 눌러 학급을 등록하세요
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  학급 추가하기
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gradeClasses.map((classData) => (
                  <div
                    key={classData.id}
                    className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden hover:border-indigo-300 hover:shadow-lg transition-all group"
                  >
                    {/* Class Card Header */}
                    <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 border-b border-indigo-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-slate-900">
                            {classData.grade}학년
                          </span>
                          <span className="font-bold text-lg text-slate-900">
                            {classData.name}
                          </span>
                          <span className="text-sm text-slate-600 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {classData.students.length}명
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClass(classData);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="학급 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Class Card Body - Click to view students */}
                    <div
                      onClick={() => handleClassCardClick(classData)}
                      className="p-3 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-center"
                    >
                      <span className="text-sm text-slate-600">
                        학생 목록 보기 →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-between items-center">
            <p className="text-sm text-slate-600">
              전체 <strong className="text-indigo-600">{allClasses.length}</strong>개 학급,{' '}
              <strong className="text-indigo-600">
                {allClasses.reduce((sum, cls) => sum + cls.students.length, 0)}
              </strong>
              명의 학생
            </p>
            <Button variant="secondary" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
      </div>

      {/* Create Class Modal */}
      {isCreateModalOpen && (
        <CreateClassModal
          onSubmit={(grade, className, students) => {
            onAddClass(grade, className, students);
            setIsCreateModalOpen(false);
          }}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {/* Student List Modal */}
      {selectedClass && (
        <StudentListModal
          classData={selectedClass}
          onClose={() => setSelectedClass(null)}
          onUpdateStudents={onUpdateStudents}
        />
      )}
    </>
  );
};
