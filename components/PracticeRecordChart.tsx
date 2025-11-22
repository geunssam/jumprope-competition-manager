import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '../lib/statsCalculator';

interface PracticeRecordChartProps {
  data: ChartDataPoint[];
  eventName: string;
}

export const PracticeRecordChart: React.FC<PracticeRecordChartProps> = ({ data, eventName }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">기록이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{eventName} 점수 추이</h4>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            label={{ value: '점수 (회)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            labelStyle={{ fontWeight: 'bold', color: '#374151' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="점수"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
