import React, { useState } from 'react';
import { X, Edit2, Trash2, UserPlus, Check } from 'lucide-react';
import { ClassTeam, Student } from '../types';
import { Button } from './Button';

interface StudentListModalProps {
  classData: ClassTeam;
  onClose: () => void;
  onUpdateStudents: (classId: string, students: Student[]) => void;
}

export const StudentListModal: React.FC<StudentListModalProps> = ({
  classData,
  onClose,
  onUpdateStudents
}) => {
  const [students, setStudents] = useState<Student[]>(classData.students);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  const handleStartEdit = (student: Student) => {
    setEditingId(student.id);
    setEditingName(student.name);
  };

  const handleSaveEdit = (studentId: string) => {
    if (!editingName.trim()) {
      alert('학생 이름을 입력해주세요.');
      return;
    }

    const updatedStudents = students.map(s =>
      s.id === studentId ? { ...s, name: editingName.trim() } : s
    );

    setStudents(updatedStudents);
    onUpdateStudents(classData.id, updatedStudents);
    setEditingId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDeleteStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    if (confirm(`"${student.name}" 학생을 삭제하시겠습니까?`)) {
      const updatedStudents = students.filter(s => s.id !== studentId);
      setStudents(updatedStudents);
      onUpdateStudents(classData.id, updatedStudents);
    }
  };

  const handleAddStudent = () => {
    if (!newStudentName.trim()) {
      alert('학생 이름을 입력해주세요.');
      return;
    }

    const newStudent: Student = {
      id: `std_${Date.now()}`,
      name: newStudentName.trim()
    };

    const updatedStudents = [...students, newStudent];
    setStudents(updatedStudents);
    onUpdateStudents(classData.id, updatedStudents);
    setNewStudentName('');
    setIsAddingStudent(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{classData.grade}학년 {classData.name} 학생 목록</h3>
            <p className="text-sm text-purple-100">총 {students.length}명</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {students.map((student) => (
              <div
                key={student.id}
                className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
              >
                {editingId === student.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(student.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="w-full px-2 py-1 border-2 border-purple-500 rounded-md focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSaveEdit(student.id)}
                        className="flex-1 px-2 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-xs flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        저장
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 px-2 py-1 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400 text-xs"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 flex-1 truncate">
                      {student.name}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleStartEdit(student)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="이름 수정"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="학생 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add Student Card */}
            {isAddingStudent ? (
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddStudent();
                      if (e.key === 'Escape') {
                        setIsAddingStudent(false);
                        setNewStudentName('');
                      }
                    }}
                    placeholder="학생 이름"
                    className="w-full px-2 py-1 border-2 border-green-500 rounded-md focus:ring-2 focus:ring-green-500 outline-none text-sm"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={handleAddStudent}
                      className="flex-1 px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs flex items-center justify-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      추가
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingStudent(false);
                        setNewStudentName('');
                      }}
                      className="flex-1 px-2 py-1 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400 text-xs"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingStudent(true)}
                className="bg-green-50 border-2 border-dashed border-green-300 rounded-lg p-4 hover:bg-green-100 hover:border-green-400 transition-colors flex items-center justify-center gap-2 text-green-700 font-medium"
              >
                <UserPlus className="w-5 h-5" />
                <span>학생 추가</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
};
