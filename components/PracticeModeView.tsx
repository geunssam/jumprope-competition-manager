import React, { useState, useEffect } from 'react';
import { CompetitionEvent, ClassTeam, PracticeRecord } from '../types';
import {
  savePracticeRecord,
  getPracticeRecordsByDate,
  getNextSessionNumber,
  recalculateClassStats
} from '../services/firestore';
import { Calendar, Save, TrendingUp, BarChart3, ClipboardList } from 'lucide-react';
import { CompetitionTimer } from './CompetitionTimer';
import { StudentRecordModal } from './StudentRecordModal';
import { RecordHistoryView } from './RecordHistoryView';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
  // Date 객체로 날짜 관리
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // YYYY-MM-DD 형식으로 변환하는 헬퍼 함수
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [sessionNumber, setSessionNumber] = useState<number>(1);
  const [records, setRecords] = useState<Record<string, Record<string, number>>>({}); // classId -> studentId -> eventId -> score
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'history'>('input');

  // 선택된 학급
  const selectedClass = classes.find(c => c.id === selectedClassId);

  // classes가 로드되면 첫 번째 학급 자동 선택
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes]);

  // events가 로드되면 첫 번째 종목 자동 선택
  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events]);

  // 날짜 변경 시 해당 날짜의 기록 로드
  useEffect(() => {
    loadPracticeRecords();
  }, [selectedDate, selectedClassId]);

  const loadPracticeRecords = async () => {
    if (!selectedClassId) return;

    setLoading(true);
    try {
      const gradeId = `grade_${grade}`;
      const dateString = formatDateString(selectedDate);
      const practiceRecords = await getPracticeRecordsByDate(competitionId, gradeId, dateString);

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
      // 기록 로드 실패 시에도 경고창을 띄우지 않고 조용히 처리
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
        // 기록이 없어도 경고창을 띄우지 않고 조용히 리턴
        setSaving(false);
        return;
      }

      // 각 기록 저장
      const dateString = formatDateString(selectedDate);
      const savePromises = recordsToSave.map(async ({ studentId, eventId, score }) => {
        const sessionNum = await getNextSessionNumber(competitionId, gradeId, studentId, dateString);

        await savePracticeRecord(competitionId, gradeId, {
          studentId,
          eventId,
          score,
          date: dateString,
          sessionNumber: sessionNum,
          mode: 'practice'
        });

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
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-6">
        <button
          onClick={() => setActiveTab('input')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'input'
              ? 'border-green-600 text-green-700'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          기록 입력
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-green-600 text-green-700'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          기록 조회
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'input' ? (
          <div className="space-y-6 p-6">
            {/* 타이머 */}
            <CompetitionTimer />

            {/* 날짜 및 세션 선택 */}
            <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">날짜</span>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => {
                if (date) {
                  setSelectedDate(date);
                }
              }}
              dateFormat="yyyy-MM-dd"
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 cursor-pointer"
              calendarClassName="shadow-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">학급</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">종목</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            >
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} ({event.defaultTimeLimit}초)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 ml-auto">
            <TrendingUp className="w-4 h-4" />
            <span>오늘의 세션: {sessionNumber}회차</span>
          </div>
        </div>
      </div>

      {/* 학생 기록 입력 */}
      {selectedClass && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">{selectedClass.name} - {events.find(e => e.id === selectedEventId)?.name}</h3>

          <div className="grid grid-cols-3 gap-3">
            {selectedClass.students.map((student) => {
              const currentScore = records[selectedClassId]?.[student.id]?.[selectedEventId] || 0;

              return (
                <div
                  key={student.id}
                  className="flex items-center gap-2 p-3 rounded-lg border bg-gray-50 border-gray-200"
                >
                  <span className="font-medium text-gray-700 text-sm flex-shrink-0">{student.name}</span>

                  <input
                    type="number"
                    min="0"
                    value={currentScore || ''}
                    onChange={(e) => handleScoreChange(student.id, selectedEventId, e.target.value)}
                    placeholder="0"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-green-500 ml-auto"
                  />
                  <span className="text-gray-600 text-sm flex-shrink-0">회</span>

                  <button
                    onClick={() => setSelectedStudentId(student.id)}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors flex-shrink-0"
                    title="상세 기록 보기"
                  >
                    <BarChart3 className="w-4 h-4" />
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
        ) : (
          <RecordHistoryView
            competitionId={competitionId}
            grade={grade}
            events={events}
            classes={classes}
            mode="practice"
          />
        )}
      </div>

      {/* 학생 상세 기록 모달 */}
      {selectedStudentId && selectedClass && (
        <StudentRecordModal
          competitionId={competitionId}
          gradeId={`grade_${grade}`}
          student={selectedClass.students.find(s => s.id === selectedStudentId)!}
          events={events}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </div>
  );
};
