import React, { useState, useEffect } from 'react';
import { CompetitionEvent, ClassTeam, PracticeRecord } from '../types';
import {
  savePracticeRecord,
  getPracticeRecordsByDate,
  getNextSessionNumber,
  updatePersonalBest,
  recalculateClassStats
} from '../services/firestore';
import { Calendar, Save, TrendingUp, Award } from 'lucide-react';

interface PracticeModeViewProps {
  competitionId: string;
  grade: number;
  events: CompetitionEvent[];
  classes: ClassTeam[];
  onStudentDetailClick?: (studentId: string) => void;
}

export const PracticeModeView: React.FC<PracticeModeViewProps> = ({
  competitionId,
  grade,
  events,
  classes,
  onStudentDetailClick
}) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [sessionNumber, setSessionNumber] = useState<number>(1);
  const [records, setRecords] = useState<Record<string, Record<string, number>>>({}); // classId -> studentId -> eventId -> score
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');

  // 선택된 학급
  const selectedClass = classes.find(c => c.id === selectedClassId);

  // 날짜 변경 시 해당 날짜의 기록 로드
  useEffect(() => {
    loadPracticeRecords();
  }, [selectedDate, selectedClassId]);

  const loadPracticeRecords = async () => {
    if (!selectedClassId) return;

    setLoading(true);
    try {
      const gradeId = `grade_${grade}`;
      const practiceRecords = await getPracticeRecordsByDate(competitionId, gradeId, selectedDate);

      // 기록을 state에 반영
      const newRecords: Record<string, Record<string, number>> = {};
      practiceRecords.forEach(record => {
        if (!newRecords[selectedClassId]) {
          newRecords[selectedClassId] = {};
        }
        if (!newRecords[selectedClassId][record.studentId]) {
          newRecords[selectedClassId][record.studentId] = {};
        }
        newRecords[selectedClassId][record.studentId][record.eventId] = record.score;
      });

      setRecords(newRecords);

      // 세션 번호도 업데이트 (가장 큰 세션 번호 + 1)
      if (practiceRecords.length > 0) {
        const maxSession = Math.max(...practiceRecords.map(r => r.sessionNumber));
        setSessionNumber(maxSession + 1);
      } else {
        setSessionNumber(1);
      }
    } catch (error) {
      console.error('기록 로드 실패:', error);
      alert('기록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (studentId: string, eventId: string, score: string) => {
    const numScore = parseInt(score) || 0;
    setRecords(prev => ({
      ...prev,
      [selectedClassId]: {
        ...(prev[selectedClassId] || {}),
        [studentId]: {
          ...(prev[selectedClassId]?.[studentId] || {}),
          [eventId]: numScore
        }
      }
    }));
  };

  const handleSaveRecords = async () => {
    if (!selectedClass) return;

    setSaving(true);
    try {
      const gradeId = `grade_${grade}`;
      const classRecords = records[selectedClassId] || {};

      // 저장할 기록들
      const recordsToSave: Array<{
        studentId: string;
        eventId: string;
        score: number;
      }> = [];

      Object.entries(classRecords).forEach(([studentId, eventScores]) => {
        Object.entries(eventScores).forEach(([eventId, score]) => {
          if (score > 0) {
            recordsToSave.push({ studentId, eventId, score });
          }
        });
      });

      if (recordsToSave.length === 0) {
        alert('저장할 기록이 없습니다.');
        return;
      }

      // 각 기록 저장
      const savePromises = recordsToSave.map(async ({ studentId, eventId, score }) => {
        const sessionNum = await getNextSessionNumber(competitionId, gradeId, studentId, selectedDate);

        const recordId = await savePracticeRecord(competitionId, gradeId, {
          studentId,
          eventId,
          score,
          date: selectedDate,
          sessionNumber: sessionNum,
          mode: 'practice'
        });

        // 개인 최고 기록 체크 및 업데이트
        const student = selectedClass.students.find(s => s.id === studentId);
        const currentBest = student?.personalBests?.[eventId];

        if (!currentBest || score > currentBest.score) {
          await updatePersonalBest(selectedClassId, studentId, eventId, {
            score,
            date: selectedDate,
            recordId
          });
        }

        // 학급 통계 재계산 (비동기)
        recalculateClassStats(competitionId, gradeId, eventId).catch(err =>
          console.error('통계 재계산 실패:', err)
        );
      });

      await Promise.all(savePromises);

      alert(`${recordsToSave.length}개의 기록이 저장되었습니다!`);

      // 기록 초기화 (다음 세션 준비)
      setRecords({});
      setSessionNumber(prev => prev + 1);
    } catch (error) {
      console.error('기록 저장 실패:', error);
      alert('기록 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">기록을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-2">📝 연습 기록</h2>
        <p className="text-green-100">학생들의 일상 연습 기록을 입력하고 성장을 추적하세요</p>
      </div>

      {/* 날짜 및 세션 선택 */}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              날짜
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              학급
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              종목
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            >
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} ({event.defaultTimeLimit}초)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp className="w-4 h-4" />
          <span>오늘의 세션: {sessionNumber}회차</span>
        </div>
      </div>

      {/* 학생 기록 입력 */}
      {selectedClass && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">{selectedClass.name} - {events.find(e => e.id === selectedEventId)?.name}</h3>

          <div className="space-y-2">
            {selectedClass.students.map((student) => {
              const currentScore = records[selectedClassId]?.[student.id]?.[selectedEventId] || 0;
              const personalBest = student.personalBests?.[selectedEventId];
              const isNewRecord = personalBest && currentScore > personalBest.score;

              return (
                <div
                  key={student.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border ${
                    isNewRecord ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-medium text-gray-700">{student.name}</span>
                    {personalBest && (
                      <span className="text-xs text-gray-500">
                        <Award className="inline w-3 h-3" /> 최고: {personalBest.score}회
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={currentScore || ''}
                      onChange={(e) => handleScoreChange(student.id, selectedEventId, e.target.value)}
                      placeholder="0"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-green-500"
                    />
                    <span className="text-gray-600">회</span>
                    {isNewRecord && (
                      <span className="text-yellow-600 font-semibold text-sm">✨ 신기록!</span>
                    )}
                  </div>

                  <button
                    onClick={() => onStudentDetailClick?.(student.id)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    상세보기
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setRecords({})}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              초기화
            </button>
            <button
              onClick={handleSaveRecords}
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? '저장 중...' : '기록 저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
