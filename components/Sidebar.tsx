import React from 'react';
import { Users, Settings, Trophy } from 'lucide-react';

interface SidebarProps {
  currentGrade: number | null;
  onSelectGrade: (grade: number) => void;
  onSelectSettings: () => void;
  isSettingsActive: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentGrade,
  onSelectGrade,
  onSelectSettings,
  isSettingsActive,
}) => {
  const grades = [1, 2, 3, 4, 5, 6];

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0 shadow-sm z-10">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <h1 className="font-bold text-xl text-slate-800 tracking-tight">줄넘기 대회</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          학년별 관리
        </div>
        {grades.map((grade) => (
          <button
            key={grade}
            onClick={() => onSelectGrade(grade)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              !isSettingsActive && currentGrade === grade
                ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Users className={`w-5 h-5 ${!isSettingsActive && currentGrade === grade ? 'text-indigo-600' : 'text-slate-400'}`} />
            {grade}학년
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={onSelectSettings}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
            isSettingsActive
              ? 'bg-slate-800 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Settings className={`w-5 h-5 ${isSettingsActive ? 'text-slate-300' : 'text-slate-500'}`} />
          전체 설정 (종목 관리)
        </button>
      </div>
    </div>
  );
};