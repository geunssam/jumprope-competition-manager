import React, { useState, useEffect, useMemo } from 'react';
import { ClassTeam, Student, CompetitionEvent, StudentRecord } from '../types';
import { GrowthStats, calculateGrowthStats } from '../lib/statsCalculator';
import { getStudentRecords, migrateClassResultsToRecords, createAccessCodeMappingsBatch } from '../services/firestore';
import { StudentGrowthCard } from './StudentGrowthCard';
import { generateUniqueAccessCode } from '../lib/accessCodeGenerator';
import { Users, Printer, Filter, RefreshCw, Medal, TrendingUp, AlertCircle, Database } from 'lucide-react';

interface StudentGrowthTabProps {
  classes: ClassTeam[];
  events: CompetitionEvent[];
  userId: string;
  onShowStudentDetail?: (student: Student, classId: string) => void;
  onUpdateClasses?: (classes: ClassTeam[]) => void;
}

interface StudentWithStats {
  student: Student;
  classId: string;
  className: string;
  stats: GrowthStats | null;
  loading: boolean;
}

export const StudentGrowthTab: React.FC<StudentGrowthTabProps> = ({
  classes,
  events,
  userId,
  onShowStudentDetail,
  onUpdateClasses,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [studentStatsMap, setStudentStatsMap] = useState<Map<string, GrowthStats | null>>(new Map());
  const [loadingStudents, setLoadingStudents] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ migrated: number; skipped: number } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number } | null>(null);

  // accessCodes 컬렉션 동기화 (학생 상세 페이지 접근용)
  const handleSyncAccessCodes = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      let syncedCount = 0;
      for (const cls of classes) {
        const studentsWithCode = cls.students.filter(s => s.accessCode);
        if (studentsWithCode.length > 0) {
          await createAccessCodeMappingsBatch(userId, cls.id, cls.name, cls.grade, studentsWithCode);
          syncedCount += studentsWithCode.length;
          console.log(`📝 ${cls.name}: ${studentsWithCode.length}명 동기화`);
        }
      }
      setSyncResult({ synced: syncedCount });
      console.log(`✅ 총 ${syncedCount}명 코드 동기화 완료`);
    } catch (error) {
      console.error('❌ 코드 동기화 실패:', error);
      alert('코드 동기화에 실패했습니다.');
    } finally {
      setIsSyncing(false);
    }
  };

  // 기존 데이터 마이그레이션 (classes.results → records)
  const handleMigrateData = async () => {
    if (!confirm('기존 대회 기록을 성장 추적 데이터로 변환하시겠습니까?\n(이미 변환된 데이터는 중복 생성될 수 있습니다)')) {
      return;
    }

    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const result = await migrateClassResultsToRecords(userId, classes, events);
      setMigrationResult(result);

      if (result.migrated > 0) {
        // 통계 새로고침
        setStudentStatsMap(new Map());
        filteredStudents.forEach(({ student }) => {
          loadStudentStats(student.id);
        });
      }
    } catch (error) {
      console.error('❌ 마이그레이션 실패:', error);
      alert('데이터 변환에 실패했습니다.');
    } finally {
      setIsMigrating(false);
    }
  };

  // accessCode 없는 학생 자동 생성 (최초 1회만)
  const [accessCodeGenerated, setAccessCodeGenerated] = useState(false);

  useEffect(() => {
    if (!onUpdateClasses || accessCodeGenerated) return;

    // 기존 accessCode 수집
    const existingCodes: string[] = [];
    let studentsWithoutCode = 0;

    classes.forEach(cls => {
      cls.students.forEach(student => {
        if (student.accessCode) {
          existingCodes.push(student.accessCode);
        } else {
          studentsWithoutCode++;
        }
      });
    });

    // accessCode 없는 학생이 없으면 종료
    if (studentsWithoutCode === 0) {
      setAccessCodeGenerated(true);
      return;
    }

    console.log(`🔑 accessCode 없는 학생 ${studentsWithoutCode}명 발견, 자동 생성 시작...`);

    const updatedClasses = classes.map(cls => ({
      ...cls,
      students: cls.students.map(student => {
        if (!student.accessCode) {
          const newCode = generateUniqueAccessCode(existingCodes);
          existingCodes.push(newCode);
          console.log(`  ✅ ${student.name}: ${newCode}`);
          return { ...student, accessCode: newCode };
        }
        return student;
      }),
    }));

    setAccessCodeGenerated(true);
    onUpdateClasses(updatedClasses);

    // accessCodes 컬렉션에도 저장 (학생 페이지 조회용)
    updatedClasses.forEach(cls => {
      createAccessCodeMappingsBatch(userId, cls.id, cls.name, cls.grade, cls.students)
        .then(() => console.log(`📝 ${cls.name} accessCodes 저장 완료`))
        .catch(err => console.error(`❌ ${cls.name} accessCodes 저장 실패:`, err));
    });

    console.log('🔑 accessCode 자동 생성 완료');
  }, [classes, onUpdateClasses, accessCodeGenerated, userId]);

  // 선택된 학급의 학생 목록
  const filteredStudents = useMemo(() => {
    let students: Array<{ student: Student; classId: string; className: string }> = [];

    if (selectedClassId === 'all') {
      // 모든 학급의 학생
      classes.forEach(cls => {
        cls.students.forEach(student => {
          students.push({
            student,
            classId: cls.id,
            className: cls.name,
          });
        });
      });
    } else {
      // 선택된 학급의 학생
      const selectedClass = classes.find(cls => cls.id === selectedClassId);
      if (selectedClass) {
        selectedClass.students.forEach(student => {
          students.push({
            student,
            classId: selectedClass.id,
            className: selectedClass.name,
          });
        });
      }
    }

    return students;
  }, [classes, selectedClassId]);

  // 학생별 기록 로드 및 통계 계산
  const loadStudentStats = async (studentId: string) => {
    if (loadingStudents.has(studentId)) return;

    setLoadingStudents(prev => new Set(prev).add(studentId));

    try {
      const records = await getStudentRecords(userId, studentId, {
        eventId: selectedEventId !== 'all' ? selectedEventId : undefined,
      });

      const stats = records.length > 0 ? calculateGrowthStats(records) : null;

      setStudentStatsMap(prev => {
        const newMap = new Map(prev);
        newMap.set(studentId, stats);
        return newMap;
      });
    } catch (error) {
      console.error(`❌ 학생 ${studentId} 기록 로드 실패:`, error);
      setStudentStatsMap(prev => {
        const newMap = new Map(prev);
        newMap.set(studentId, null);
        return newMap;
      });
    } finally {
      setLoadingStudents(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    }
  };

  // 전체 새로고침
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    setStudentStatsMap(new Map());

    for (const { student } of filteredStudents) {
      await loadStudentStats(student.id);
    }

    setIsRefreshing(false);
  };

  // 선택 변경 시 통계 로드
  useEffect(() => {
    // 새로운 학생들의 통계만 로드
    filteredStudents.forEach(({ student }) => {
      if (!studentStatsMap.has(student.id)) {
        loadStudentStats(student.id);
      }
    });
  }, [filteredStudents, selectedEventId]);

  // 종목 변경 시 통계 초기화 및 재로드
  useEffect(() => {
    setStudentStatsMap(new Map());
    filteredStudents.forEach(({ student }) => {
      loadStudentStats(student.id);
    });
  }, [selectedEventId]);

  // 전체 학생 수 및 기록 있는 학생 수
  const statsOverview = useMemo(() => {
    let totalStudents = filteredStudents.length;
    let studentsWithRecords = 0;
    let totalRecords = 0;
    let avgGrowthRate = 0;
    let growthRateCount = 0;

    filteredStudents.forEach(({ student }) => {
      const stats = studentStatsMap.get(student.id);
      if (stats && stats.totalRecords > 0) {
        studentsWithRecords++;
        totalRecords += stats.totalRecords;
        if (stats.growthRate !== 0) {
          avgGrowthRate += stats.growthRate;
          growthRateCount++;
        }
      }
    });

    return {
      totalStudents,
      studentsWithRecords,
      totalRecords,
      avgGrowthRate: growthRateCount > 0 ? Math.round(avgGrowthRate / growthRateCount * 10) / 10 : 0,
    };
  }, [filteredStudents, studentStatsMap]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 animate-in fade-in duration-300">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-indigo-600" />
            성장 추적
          </h2>
          <p className="text-slate-500 mt-1">학생별 성장 기록을 확인하고 공유하세요</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleMigrateData}
            disabled={isMigrating}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            title="기존 대회 기록을 성장 추적 데이터로 변환"
          >
            <Database className={`w-4 h-4 ${isMigrating ? 'animate-pulse' : ''}`} />
            {isMigrating ? '변환 중...' : '기록 변환'}
          </button>
          <button
            onClick={handleSyncAccessCodes}
            disabled={isSyncing}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            title="학생 코드를 동기화하여 상세 페이지 접근 가능하게 합니다"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? '동기화 중...' : '코드 동기화'}
          </button>
          <button
            onClick={() => setShowPrintModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            코드 출력
          </button>
        </div>
      </div>

      {/* 결과 메시지 */}
      {(migrationResult || syncResult) && (
        <div className="space-y-2">
          {migrationResult && (
            <div className={`p-4 rounded-lg ${migrationResult.migrated > 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
              <p className={`text-sm font-medium ${migrationResult.migrated > 0 ? 'text-green-700' : 'text-amber-700'}`}>
                {migrationResult.migrated > 0
                  ? `✅ ${migrationResult.migrated}개의 기록이 성장 추적 데이터로 변환되었습니다.`
                  : `⚠️ 변환할 기록이 없습니다. (스킵: ${migrationResult.skipped}개)`}
              </p>
            </div>
          )}
          {syncResult && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-sm font-medium text-emerald-700">
                ✅ {syncResult.synced}명의 학생 코드가 동기화되었습니다. 이제 상세 보기가 작동합니다.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 필터 및 통계 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* 필터 */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="all">전체 학급</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="all">전체 종목</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              title="새로고침"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* 통계 요약 */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">학생 수</span>
              <span className="font-bold text-slate-900">
                {statsOverview.studentsWithRecords}/{statsOverview.totalStudents}명
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">총 기록</span>
              <span className="font-bold text-slate-900">{statsOverview.totalRecords}회</span>
            </div>
            {statsOverview.avgGrowthRate !== 0 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">평균 성장률</span>
                <span className={`font-bold ${statsOverview.avgGrowthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {statsOverview.avgGrowthRate > 0 ? '+' : ''}{statsOverview.avgGrowthRate}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 학생 카드 그리드 */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Medal className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">학생이 없습니다</h3>
          <p className="text-slate-500">학급 관리에서 학생을 추가해주세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredStudents.map(({ student, classId, className }) => (
            <StudentGrowthCard
              key={student.id}
              student={student}
              stats={studentStatsMap.get(student.id) || null}
              loading={loadingStudents.has(student.id)}
              onViewDetail={onShowStudentDetail ? () => onShowStudentDetail(student, classId) : undefined}
            />
          ))}
        </div>
      )}

      {/* 코드 일괄 출력 모달 */}
      {showPrintModal && (
        <AccessCodePrintModal
          classes={selectedClassId === 'all' ? classes : classes.filter(c => c.id === selectedClassId)}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};

// 코드 일괄 출력 모달 (인라인 정의, 나중에 분리 가능)
interface AccessCodePrintModalProps {
  classes: ClassTeam[];
  onClose: () => void;
}

const AccessCodePrintModal: React.FC<AccessCodePrintModalProps> = ({ classes, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const allStudents = classes.flatMap(cls =>
    cls.students.map(student => ({
      ...student,
      className: cls.name,
    }))
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div>
            <h3 className="text-lg font-bold">접근 코드 일괄 출력</h3>
            <p className="text-sm text-indigo-100">총 {allStudents.length}명</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 콘텐츠 - 인쇄용 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 print:grid-cols-4">
            {allStudents.map(student => (
              <div
                key={student.id}
                className="border-2 border-slate-300 rounded-lg p-4 text-center print:border-black print:break-inside-avoid"
              >
                <p className="text-xs text-slate-500 mb-1 print:text-black">{student.className}</p>
                <p className="font-bold text-lg text-slate-900 mb-2 print:text-black">{student.name}</p>
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg py-2 px-3 print:bg-white print:border-black">
                  <p className="font-mono text-2xl font-bold text-indigo-600 tracking-wider print:text-black">
                    {student.accessCode || '----'}
                  </p>
                </div>
                <p className="text-xs text-slate-400 mt-2 print:text-black">줄넘기 성장 기록 코드</p>
              </div>
            ))}
          </div>
        </div>

        {/* 푸터 */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-end gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            인쇄하기
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
