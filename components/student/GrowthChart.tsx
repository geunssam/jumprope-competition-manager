import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { StudentRecord } from '../../types';

interface GrowthChartProps {
  records: StudentRecord[];
  mode: 'all' | 'competition' | 'practice';
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  competition?: number;
  practice?: number;
  eventName?: string;
}

export const GrowthChart: React.FC<GrowthChartProps> = ({ records, mode }) => {
  // 차트 데이터 준비
  const chartData = useMemo(() => {
    if (records.length === 0) return [];

    // 날짜별로 그룹화
    const dateMap = new Map<string, { competition?: number; practice?: number; eventName: string }>();

    // 날짜순 정렬
    const sortedRecords = [...records].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedRecords.forEach(record => {
      const existing = dateMap.get(record.date) || { eventName: record.eventName };

      if (record.mode === 'competition') {
        // 같은 날 여러 기록이 있으면 최고 기록 사용
        existing.competition = Math.max(existing.competition || 0, record.score);
      } else {
        existing.practice = Math.max(existing.practice || 0, record.score);
      }
      existing.eventName = record.eventName;

      dateMap.set(record.date, existing);
    });

    // 차트 데이터로 변환
    const data: ChartDataPoint[] = [];
    dateMap.forEach((value, date) => {
      data.push({
        date,
        displayDate: formatDate(date),
        competition: value.competition,
        practice: value.practice,
        eventName: value.eventName,
      });
    });

    return data;
  }, [records]);

  // 평균 계산
  const averageScore = useMemo(() => {
    if (records.length === 0) return 0;
    const sum = records.reduce((acc, r) => acc + r.score, 0);
    return Math.round(sum / records.length);
  }, [records]);

  if (records.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        기록이 없습니다
      </div>
    );
  }

  if (chartData.length === 1) {
    // 데이터가 하나뿐이면 단순 표시
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl font-bold text-indigo-600">{records[0].score}회</p>
          <p className="text-sm text-slate-500 mt-2">
            {records[0].date} • {records[0].eventName}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            추가 기록이 쌓이면 성장 그래프가 표시됩니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#cbd5e1' }}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string) => [
              `${value}회`,
              name === 'competition' ? '대회' : '연습',
            ]}
            labelFormatter={(label) => label}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => (value === 'competition' ? '대회' : '연습')}
          />

          {/* 평균선 */}
          <ReferenceLine
            y={averageScore}
            stroke="#94a3b8"
            strokeDasharray="5 5"
            label={{
              value: `평균 ${averageScore}`,
              position: 'right',
              fill: '#94a3b8',
              fontSize: 10,
            }}
          />

          {/* 대회 기록 라인 */}
          {(mode === 'all' || mode === 'competition') && (
            <Line
              type="monotone"
              dataKey="competition"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#4f46e5' }}
              connectNulls
              name="competition"
            />
          )}

          {/* 연습 기록 라인 */}
          {(mode === 'all' || mode === 'practice') && (
            <Line
              type="monotone"
              dataKey="practice"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#059669' }}
              connectNulls
              name="practice"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// 날짜 포맷 헬퍼
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
