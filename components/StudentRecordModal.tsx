import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Award, Calendar, BarChart3 } from 'lucide-react';
import { Student, CompetitionEvent, PracticeRecord, EventType } from '../types';
import { getStudentPracticeRecords } from '../services/firestore';
import { calculateStudentStats, calculateEventStats, formatChartData, generateInsights } from '../lib/statsCalculator';
import { PracticeRecordChart } from './PracticeRecordChart';

interface StudentRecordModalProps {
  competitionId: string;
  gradeId: string;
  student: Student;
  events: CompetitionEvent[];
  onClose: () => void;
}

export const StudentRecordModal: React.FC<StudentRecordModalProps> = ({
  competitionId,
  gradeId,
  student,
  events,
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<EventType>(events[0]?.type || 'INDIVIDUAL');
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await getStudentPracticeRecords(competitionId, gradeId, student.id);
      setRecords(data);
    } catch (error) {
      console.error('기록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 종목 유형별 필터링
  const filteredEvents = events.filter(e => e.type === selectedEventType);

  // 종목 유형 변경 시 첫 번째 종목 자동 선택
  useEffect(() => {
    const firstEventOfType = events.find(e => e.type === selectedEventType);
    if (firstEventOfType) {
      setSelectedEventId(firstEventOfType.id);
    }
  }, [selectedEventType, events]);

  // 전체 통계
  const totalStats = calculateStudentStats(records);

  // 선택한 종목의 통계 및 차트 데이터
  const selectedEvent = events.find(e => e.id === selectedEventId);
  const eventStats = calculateEventStats(records, selectedEventId);
  const chartData = formatChartData(records.filter(r => r.eventId === selectedEventId));

  // 인사이트 메시지
  const insights = generateInsights(eventStats);

  // 종목 유형 레이블
  const eventTypeLabels: Record<EventType, string> = {
    'INDIVIDUAL': '개인',
    'PAIR': '짝',
    'TEAM': '단체'
  };

  // 날짜별 기록 (최신순)
  const sortedRecords = [...records]
    .filter(r => r.eventId === selectedEventId)
    .sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.sessionNumber - a.sessionNumber;
    });

  if (loading) {
    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-gray-500">기록을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{student.name}의 연습 기록</h3>
            <p className="text-sm text-indigo-100">총 {totalStats.totalRecords}회 연습 완료</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-2">아직 연습 기록이 없습니다</p>
              <p className="text-sm text-gray-500">연습 모드에서 기록을 시작해보세요!</p>
            </div>
          ) : (
            <>
              {/* 1단계: 종목 유형 선택 탭 */}
              <div className="border-b border-gray-200">
                <div className="flex gap-2">
                  {(['INDIVIDUAL', 'PAIR', 'TEAM'] as EventType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedEventType(type)}
                      className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                        selectedEventType === type
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {eventTypeLabels[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2단계: 세부 종목 선택 버튼 */}
              <div className="flex gap-2 flex-wrap">
                {filteredEvents.map((event) => {
                  const eventRecordCount = records.filter(r => r.eventId === event.id).length;
                  return (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEventId(event.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedEventId === event.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {event.name}
                      {eventRecordCount > 0 && (
                        <span className="ml-2 text-xs opacity-75">({eventRecordCount})</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 누적 통계 카드 */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-indigo-50 rounded-xl p-4 border-2 border-indigo-200">
                  <div className="flex items-center gap-2 text-sm font-bold text-indigo-900 mb-2">
                    <Calendar className="w-4 h-4" />
                    총 연습 횟수
                  </div>
                  <div className="text-3xl font-black text-indigo-700">{eventStats.totalRecords}회</div>
                </div>

                <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                  <div className="flex items-center gap-2 text-sm font-bold text-green-900 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    평균 점수
                  </div>
                  <div className="text-3xl font-black text-green-700">{eventStats.averageScore}회</div>
                </div>

                <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                  <div className="flex items-center gap-2 text-sm font-bold text-yellow-900 mb-2">
                    <Award className="w-4 h-4" />
                    최고 기록
                  </div>
                  <div className="text-3xl font-black text-yellow-700">{eventStats.personalBest}회</div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                  <div className="flex items-center gap-2 text-sm font-bold text-blue-900 mb-2">
                    <BarChart3 className="w-4 h-4" />
                    최근 기록
                  </div>
                  <div className="text-3xl font-black text-blue-700">{eventStats.recentScore}회</div>
                </div>
              </div>

              {/* 성장 인사이트 */}
              {insights.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                  <h4 className="text-sm font-bold text-purple-900 mb-3">📊 성장 인사이트</h4>
                  <div className="space-y-2">
                    {insights.map((insight, index) => (
                      <p key={index} className="text-sm text-purple-800">{insight}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* 점수 추이 차트 */}
              {chartData.length > 0 && (
                <PracticeRecordChart
                  data={chartData}
                  eventName={selectedEvent?.name || ''}
                />
              )}

              {/* 기록 목록 */}
              <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-sm font-bold text-gray-900">📋 연습 기록 상세</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">날짜</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">세션</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">점수</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">비고</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedRecords.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                            이 종목의 연습 기록이 없습니다
                          </td>
                        </tr>
                      ) : (
                        sortedRecords.slice(0, 20).map((record, index) => {
                          const isPersonalBest = record.score === eventStats.personalBest;
                          return (
                            <tr key={index} className={isPersonalBest ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                              <td className="px-4 py-3 text-sm text-gray-900">{record.date}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{record.sessionNumber}회차</td>
                              <td className="px-4 py-3">
                                <span className={`text-sm font-semibold ${isPersonalBest ? 'text-yellow-700' : 'text-gray-900'}`}>
                                  {record.score}회
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {isPersonalBest && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs font-semibold">
                                    <Award className="w-3 h-3" />
                                    최고기록
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                  {sortedRecords.length > 20 && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-center text-xs text-gray-500">
                      최근 20개 기록만 표시됩니다
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
