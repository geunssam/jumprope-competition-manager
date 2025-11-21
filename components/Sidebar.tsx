import React from 'react';
import { Users, Settings, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  currentGrade: number | null;
  onSelectGrade: (grade: number) => void;
  onSelectSettings: () => void;
  isSettingsActive: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentGrade,
  onSelectGrade,
  onSelectSettings,
  isSettingsActive,
  isCollapsed,
  onToggleCollapse,
}) => {
  const grades = [1, 2, 3, 4, 5, 6];

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0 shadow-sm z-10 transition-all duration-300`}>
      <div className={`${isCollapsed ? 'p-3' : 'p-6'} border-b border-slate-100 flex items-center justify-between gap-3 relative`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-indigo-600 p-2 rounded-lg flex-shrink-0">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <h1 className="font-bold text-xl text-slate-800 tracking-tight whitespace-nowrap">줄넘기 대회</h1>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="flex-shrink-0 p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title={isCollapsed ? '펼치기' : '접기'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {!isCollapsed && (
          <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            학년별 관리
          </div>
        )}
        {grades.map((grade) => (
          <button
            key={grade}
            onClick={() => onSelectGrade(grade)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg text-sm font-medium transition-all ${
              !isSettingsActive && currentGrade === grade
                ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            title={isCollapsed ? `${grade}학년` : ''}
          >
            <Users className={`w-5 h-5 flex-shrink-0 ${!isSettingsActive && currentGrade === grade ? 'text-indigo-600' : 'text-slate-400'}`} />
            {!isCollapsed && <span>{grade}학년</span>}
          </button>
        ))}
      </div>

      <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-slate-100`}>
        <button
          onClick={onSelectSettings}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg text-sm font-medium transition-all ${
            isSettingsActive
              ? 'bg-slate-800 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          title={isCollapsed ? '전체 설정' : ''}
        >
          <Settings className={`w-5 h-5 flex-shrink-0 ${isSettingsActive ? 'text-slate-300' : 'text-slate-500'}`} />
          {!isCollapsed && <span>전체 설정 (종목 관리)</span>}
        </button>
      </div>
    </div>
  );
};