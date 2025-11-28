import React from 'react';
import { TrendingUp, TrendingDown, Minus, Trophy, Link2, ExternalLink } from 'lucide-react';
import { Student } from '../types';
import { GrowthStats } from '../lib/statsCalculator';

interface StudentGrowthCardProps {
  student: Student;
  stats: GrowthStats | null;
  loading?: boolean;
  onViewDetail?: () => void;
}

export const StudentGrowthCard: React.FC<StudentGrowthCardProps> = ({
  student,
  stats,
  loading = false,
  onViewDetail,
}) => {
  // 트렌드 아이콘 및 색상
  const getTrendIcon = () => {
    if (!stats) return <Minus className="w-4 h-4 text-slate-400" />;

    switch (stats.recentTrend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTrendColor = () => {
    if (!stats) return 'text-slate-500';

    switch (stats.recentTrend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-slate-500';
    }
  };

  const getGrowthRateText = () => {
    if (!stats || stats.growthRate === 0) return '-';
    const sign = stats.growthRate > 0 ? '+' : '';
    return `${sign}${stats.growthRate}%`;
  };

  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden hover:border-indigo-300 hover:shadow-lg transition-all group">
      {/* 헤더 - 학생 이름 */}
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-4 py-3 border-b border-indigo-200">
        <h4 className="font-bold text-slate-900 truncate">{student.name}</h4>
      </div>

      {/* 본문 */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stats ? (
          <>
            {/* 성장률 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">성장률</span>
              <div className={`flex items-center gap-1 font-bold ${getTrendColor()}`}>
                {getTrendIcon()}
                <span>{getGrowthRateText()}</span>
              </div>
            </div>

            {/* 최고 기록 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">최고기록</span>
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-slate-900">{stats.bestScore}회</span>
              </div>
            </div>

            {/* 총 기록 수 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">총 기록</span>
              <span className="text-sm text-slate-700">
                {stats.totalRecords}회
                <span className="text-slate-400 ml-1">
                  (대회 {stats.competitionCount} / 연습 {stats.practiceCount})
                </span>
              </span>
            </div>

            {/* accessCode */}
            {student.accessCode && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-sm text-slate-600 flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5" />
                  코드
                </span>
                <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {student.accessCode}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4 text-slate-500 text-sm">
            기록이 없습니다
          </div>
        )}
      </div>

      {/* 상세 보기 버튼 */}
      {onViewDetail && (
        <button
          onClick={onViewDetail}
          className="w-full py-2.5 bg-slate-50 hover:bg-indigo-50 border-t border-slate-200 text-sm text-slate-600 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1"
        >
          상세 보기
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
