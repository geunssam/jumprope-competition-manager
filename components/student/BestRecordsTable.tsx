import React, { useMemo } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { StudentRecord } from '../../types';

interface BestRecordsTableProps {
  records: StudentRecord[];
  mode: 'all' | 'competition' | 'practice';
}

interface EventBestRecord {
  eventId: string;
  eventName: string;
  competitionBest: number | null;
  practiceBest: number | null;
  competitionDate: string | null;
  practiceDate: string | null;
  overallBest: number;
  bestMode: 'competition' | 'practice';
}

export const BestRecordsTable: React.FC<BestRecordsTableProps> = ({ records, mode }) => {
  // 종목별 최고기록 계산
  const eventBests = useMemo(() => {
    const eventMap = new Map<string, EventBestRecord>();

    records.forEach(record => {
      const existing = eventMap.get(record.eventId);

      if (!existing) {
        eventMap.set(record.eventId, {
          eventId: record.eventId,
          eventName: record.eventName,
          competitionBest: record.mode === 'competition' ? record.score : null,
          practiceBest: record.mode === 'practice' ? record.score : null,
          competitionDate: record.mode === 'competition' ? record.date : null,
          practiceDate: record.mode === 'practice' ? record.date : null,
          overallBest: record.score,
          bestMode: record.mode,
        });
      } else {
        if (record.mode === 'competition') {
          if (existing.competitionBest === null || record.score > existing.competitionBest) {
            existing.competitionBest = record.score;
            existing.competitionDate = record.date;
          }
        } else {
          if (existing.practiceBest === null || record.score > existing.practiceBest) {
            existing.practiceBest = record.score;
            existing.practiceDate = record.date;
          }
        }

        // 전체 최고 기록 업데이트
        const compBest = existing.competitionBest || 0;
        const pracBest = existing.practiceBest || 0;
        if (compBest >= pracBest) {
          existing.overallBest = compBest;
          existing.bestMode = 'competition';
        } else {
          existing.overallBest = pracBest;
          existing.bestMode = 'practice';
        }

        eventMap.set(record.eventId, existing);
      }
    });

    // 최고기록 순으로 정렬
    return Array.from(eventMap.values()).sort((a, b) => b.overallBest - a.overallBest);
  }, [records]);

  if (eventBests.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">
        기록이 없습니다
      </div>
    );
  }

  // 메달 아이콘 선택
  const getMedalIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-5 h-5 text-amber-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-slate-400" />;
      case 2:
        return <Award className="w-5 h-5 text-amber-700" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-slate-400 text-sm">{index + 1}</span>;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 px-2 text-slate-500 font-medium w-10">#</th>
            <th className="text-left py-2 px-2 text-slate-500 font-medium">종목</th>
            {(mode === 'all' || mode === 'competition') && (
              <th className="text-center py-2 px-2 text-indigo-500 font-medium">대회 최고</th>
            )}
            {(mode === 'all' || mode === 'practice') && (
              <th className="text-center py-2 px-2 text-emerald-500 font-medium">연습 최고</th>
            )}
          </tr>
        </thead>
        <tbody>
          {eventBests.map((event, index) => (
            <tr
              key={event.eventId}
              className={`border-b border-slate-100 ${index === 0 ? 'bg-amber-50' : ''}`}
            >
              <td className="py-3 px-2">
                {getMedalIcon(index)}
              </td>
              <td className="py-3 px-2 font-medium text-slate-700">
                {event.eventName}
                {event.teamMembers && (
                  <span className="text-xs text-slate-400 block">단체전</span>
                )}
              </td>
              {(mode === 'all' || mode === 'competition') && (
                <td className="py-3 px-2 text-center">
                  {event.competitionBest !== null ? (
                    <div>
                      <span className={`font-bold ${
                        event.bestMode === 'competition' ? 'text-indigo-600' : 'text-slate-600'
                      }`}>
                        {event.competitionBest}회
                      </span>
                      {event.competitionDate && (
                        <span className="text-xs text-slate-400 block">
                          {formatDate(event.competitionDate)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
              )}
              {(mode === 'all' || mode === 'practice') && (
                <td className="py-3 px-2 text-center">
                  {event.practiceBest !== null ? (
                    <div>
                      <span className={`font-bold ${
                        event.bestMode === 'practice' ? 'text-emerald-600' : 'text-slate-600'
                      }`}>
                        {event.practiceBest}회
                      </span>
                      {event.practiceDate && (
                        <span className="text-xs text-slate-400 block">
                          {formatDate(event.practiceDate)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 날짜 포맷 헬퍼
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
