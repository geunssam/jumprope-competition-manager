import React from 'react';
import { CompetitionEvent, PracticeRecord } from '../types';
import { X } from 'lucide-react';

interface PracticeSessionModalProps {
  date: string;
  sessionNumber: number;
  records: PracticeRecord[];
  events: CompetitionEvent[];
  getStudentName: (studentId: string) => string;
  getEventName: (eventId: string) => string;
  onClose: () => void;
}

export const PracticeSessionModal: React.FC<PracticeSessionModalProps> = ({
  date,
  sessionNumber,
  records,
  events,
  getStudentName,
  getEventName,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {date} - {sessionNumber}회차 연습 기록
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {records.length}개 기록
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    시간
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    학생
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    종목
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    기록
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {record.createdAt ? new Date(record.createdAt).toLocaleTimeString('ko-KR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {getStudentName(record.studentId)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {getEventName(record.eventId)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                        {record.score}회
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
