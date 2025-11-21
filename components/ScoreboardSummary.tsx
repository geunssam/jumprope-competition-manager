import React from 'react';
import { ClassTeam, CompetitionEvent } from '../types';
import { Trophy } from 'lucide-react';

interface ScoreboardSummaryProps {
  classes: ClassTeam[];
  activeEvents: CompetitionEvent[];
}

export const ScoreboardSummary: React.FC<ScoreboardSummaryProps> = ({
  classes,
  activeEvents
}) => {
  // 각 학급별 총점 계산
  const getClassTotalScore = (classTeam: ClassTeam) => {
    let total = 0;
    activeEvents.forEach(evt => {
      const res = classTeam.results[evt.id];
      if (res) total += res.score;
    });
    return total;
  };

  // 총점 기준으로 정렬
  const sortedClasses = [...classes].sort((a, b) => {
    return getClassTotalScore(b) - getClassTotalScore(a);
  });

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 mb-6 shadow-sm border border-indigo-100">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-bold text-slate-900">학급별 총점</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {sortedClasses.map((cls, index) => {
          const totalScore = getClassTotalScore(cls);
          const isTopThree = index < 3;

          return (
            <div
              key={cls.id}
              className={`bg-white rounded-lg p-4 border-2 transition-all ${
                isTopThree
                  ? 'border-indigo-400 shadow-md'
                  : 'border-slate-200 hover:border-indigo-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-bold text-slate-900">{cls.name}</span>
                {isTopThree && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      index === 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : index === 1
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {index + 1}등
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-indigo-700">
                {totalScore}
              </div>
              <div className="text-xs text-slate-400 mt-1">점</div>
            </div>
          );
        })}
      </div>

      {classes.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          등록된 학급이 없습니다.
        </div>
      )}
    </div>
  );
};
