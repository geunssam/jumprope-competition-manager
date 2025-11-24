import React, { useState, useEffect } from 'react';
import { CompetitionEvent, ClassTeam, PracticeRecord, RecordMode } from '../types';
import { getPracticeRecordsByGrade, deletePracticeSession, deleteCompetitionDateRecords } from '../services/firestore';
import { Calendar, Trophy, TrendingUp, Trash2, Loader } from 'lucide-react';
import { CompetitionRecordMatrixModal } from './CompetitionRecordMatrixModal';
import { PracticeSessionModal } from './PracticeSessionModal';

interface RecordHistoryViewProps {
  competitionId: string;
  grade: number;
  events: CompetitionEvent[];
  classes: ClassTeam[];
  mode?: RecordMode;
}

type SessionKey = string; // "YYYY-MM-DD|세션번호"

export const RecordHistoryView: React.FC<RecordHistoryViewProps> = ({
  competitionId,
  grade,
  events,
  classes,
  mode = 'practice'
}) => {
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatrixDate, setSelectedMatrixDate] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<{ date: string; sessionNumber: number } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null); // 삭제 중인 항목 키

  // 모든 학생 목록
  const allStudents = classes.flatMap(cls =>
    cls.students.map(s => ({ ...s, className: cls.name, classId: cls.id }))
  );

  const loadRecords = async () => {
    setLoading(true);
    try {
      if (mode === 'practice') {
        const gradeId = `grade_${grade}`;
        console.log('📊 연습 기록 로딩 시작:', { competitionId, gradeId });
        const allRecords = await getPracticeRecordsByGrade(competitionId, gradeId);
        console.log('📊 조회된 전체 기록:', allRecords.length);
        const practiceRecords = allRecords.filter(r => r.mode === 'practice');
        console.log('📊 연습 기록만 필터링:', practiceRecords.length);
        practiceRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecords(practiceRecords);
      } else {
        console.log('🏆 대회 모드 - 기록 초기화');
        setRecords([]);
      }
    } catch (error) {
      console.error('❌ 기록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 연습 모드 세션 삭제 핸들러
  const handleDeletePracticeSession = async (date: string, sessionNumber: number) => {
    if (!confirm(
      `${date} ${sessionNumber}회차 연습 기록을 삭제하시겠습니까?\n\n` +
      `이 작업은 되돌릴 수 없습니다.`
    )) {
      return;
    }

    const sessionKey = `${date}|${sessionNumber}`;
    setDeleting(sessionKey);

    try {
      const deletedCount = await deletePracticeSession(competitionId, grade, date, sessionNumber);
      console.log(`✅ ${deletedCount}개 연습 기록 삭제 완료`);
      await loadRecords(); // 목록 새로고침
    } catch (error) {
      console.error('❌ 연습 기록 삭제 실패:', error);
      alert('기록 삭제에 실패했습니다.');
    } finally {
      setDeleting(null);
    }
  };

  // 대회 모드 날짜별 기록 삭제 핸들러
  const handleDeleteCompetitionDate = async (date: string) => {
    if (!confirm(
      `${date} 대회 기록을 삭제하시겠습니까?\n\n` +
      `이 작업은 되돌릴 수 없습니다.`
    )) {
      return;
    }

    setDeleting(date);

    try {
      await deleteCompetitionDateRecords(competitionId, grade, date);
      console.log(`✅ ${date} 대회 기록 삭제 완료`);
      await loadRecords(); // 목록 새로고침
    } catch (error) {
      console.error('❌ 대회 기록 삭제 실패:', error);
      alert('기록 삭제에 실패했습니다.');
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    console.log('🔄 useEffect 실행:', { competitionId, grade, mode, classCount: classes.length });
    loadRecords();
  }, [competitionId, grade, mode, classes]);

  // 연습 기록의 세션 목록 추출 (날짜|세션번호로 그룹핑)
  const practiceSessions = mode === 'practice'
    ? Array.from(
        records.reduce((map, record) => {
          const key: SessionKey = `${record.date}|${record.sessionNumber}`;
          if (!map.has(key)) {
            map.set(key, {
              date: record.date,
              sessionNumber: record.sessionNumber,
              count: 0,
              records: []
            });
          }
          const session = map.get(key)!;
          session.count++;
          session.records.push(record);
          return map;
        }, new Map<SessionKey, { date: string; sessionNumber: number; count: number; records: PracticeRecord[] }>())
        .values()
      ).sort((a, b) => {
        // 날짜 내림차순, 같은 날짜면 세션번호 오름차순 (1회차부터)
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.sessionNumber - b.sessionNumber;
      })
    : [];

  // 대회 기록의 날짜 목록 추출
  const competitionDates = mode === 'competition'
    ? Array.from(new Set(
        classes.flatMap(cls =>
          Object.values(cls.results || {})
            .map(result => result.date || '날짜 미지정')
        )
      )).sort((a, b) => {
        // "날짜 미지정"은 맨 뒤로
        if (a === '날짜 미지정') return 1;
        if (b === '날짜 미지정') return -1;
        // 빠른 날짜(과거)가 먼저 오도록 오름차순 정렬
        return new Date(a).getTime() - new Date(b).getTime();
      })
    : [];

  const getStudentName = (studentId: string) => {
    const student = allStudents.find(s => s.id === studentId);
    return student ? `${student.name} (${student.className})` : '알 수 없음';
  };

  const getEventName = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.name : '알 수 없음';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">기록을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            {mode === 'practice' ? (
              <>
                <TrendingUp className="w-6 h-6 text-green-600" />
                연습 기록 조회
              </>
            ) : (
              <>
                <Trophy className="w-6 h-6 text-yellow-600" />
                대회 기록 조회
              </>
            )}
          </h3>
          <p className="text-slate-500 mt-1">
            {mode === 'practice'
              ? `전체 ${practiceSessions.length}개 세션`
              : `전체 ${competitionDates.length}개 날짜`}
          </p>
        </div>

        <button
          onClick={loadRecords}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          새로고침
        </button>
      </div>

      {/* Records List */}
      {mode === 'competition' ? (
        // 대회 기록: 날짜 카드 목록
        competitionDates.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border border-slate-200">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">기록이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitionDates.map(date => {
              // 해당 날짜의 기록 개수 계산
              const recordCount = classes.reduce((count, cls) => {
                return count + Object.values(cls.results || {}).filter(r => r.date === date).length;
              }, 0);
              const isDeleting = deleting === date;

              return (
                <div
                  key={date}
                  className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-yellow-400 transition-all relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      onClick={() => !isDeleting && setSelectedMatrixDate(date)}
                      className="flex items-start gap-3 flex-1 cursor-pointer"
                    >
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-yellow-700" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">{date}</h4>
                        <p className="text-sm text-slate-500 mt-1">
                          {recordCount}개 종목 기록
                        </p>
                        <p className="text-xs text-yellow-700 font-medium mt-2">
                          클릭하여 상세 보기 →
                        </p>
                      </div>
                    </div>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCompetitionDate(date);
                      }}
                      disabled={isDeleting}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      aria-label="삭제"
                    >
                      {isDeleting ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        // 연습 기록: 날짜/세션 카드 목록
        practiceSessions.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border border-slate-200">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">기록이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {practiceSessions.map(session => {
              const sessionKey = `${session.date}|${session.sessionNumber}`;
              const isDeleting = deleting === sessionKey;

              return (
                <div
                  key={sessionKey}
                  className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-green-400 transition-all relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      onClick={() => !isDeleting && setSelectedSession({ date: session.date, sessionNumber: session.sessionNumber })}
                      className="flex items-start gap-3 flex-1 cursor-pointer"
                    >
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-green-700" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">{session.date}</h4>
                        <p className="text-sm text-slate-500 mt-1">
                          {session.sessionNumber}회차 - {session.count}개 기록
                        </p>
                        <p className="text-xs text-green-700 font-medium mt-2">
                          클릭하여 상세 보기 →
                        </p>
                      </div>
                    </div>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePracticeSession(session.date, session.sessionNumber);
                      }}
                      disabled={isDeleting}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      aria-label="삭제"
                    >
                      {isDeleting ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* 대회 기록 매트릭스 모달 */}
      {selectedMatrixDate && (
        <CompetitionRecordMatrixModal
          date={selectedMatrixDate}
          classes={classes}
          events={events}
          onClose={() => setSelectedMatrixDate(null)}
        />
      )}

      {/* 연습 기록 세션 모달 */}
      {selectedSession && (
        <PracticeSessionModal
          date={selectedSession.date}
          sessionNumber={selectedSession.sessionNumber}
          records={records.filter(
            r => r.date === selectedSession.date && r.sessionNumber === selectedSession.sessionNumber
          )}
          events={events}
          getStudentName={getStudentName}
          getEventName={getEventName}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
};
