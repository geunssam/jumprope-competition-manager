import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Trophy, TrendingUp, Calendar, Activity } from 'lucide-react';
import { StudentRecord } from '../types';
import { getRecordsByAccessCode } from '../services/firestore';
import { GrowthStats, calculateGrowthStats } from '../lib/statsCalculator';
import { GrowthChart } from '../components/student/GrowthChart';
import { BestRecordsTable } from '../components/student/BestRecordsTable';

interface StudentPageProps {
  accessCode: string;
  onBack: () => void;
}

type TabType = 'all' | 'competition' | 'practice';

export const StudentPage: React.FC<StudentPageProps> = ({ accessCode, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentInfo, setStudentInfo] = useState<{
    studentName: string;
    className: string;
    grade: number;
  } | null>(null);
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [stats, setStats] = useState<GrowthStats | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getRecordsByAccessCode(accessCode);

        if (!result || result.records.length === 0) {
          setError('해당 코드의 기록을 찾을 수 없습니다.');
          return;
        }

        setStudentInfo({
          studentName: result.studentName,
          className: result.className,
          grade: result.grade,
        });
        setRecords(result.records);

        // 통계 계산
        const calculatedStats = calculateGrowthStats(result.records);
        setStats(calculatedStats);
      } catch (err) {
        console.error('❌ 데이터 로드 실패:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [accessCode]);

  // 탭별 필터링된 기록
  const filteredRecords = records.filter(record => {
    if (activeTab === 'all') return true;
    return record.mode === activeTab;
  });

  // 탭별 통계 재계산
  const filteredStats = activeTab === 'all' ? stats : calculateGrowthStats(filteredRecords);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">기록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">기록을 찾을 수 없습니다</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              {studentInfo?.studentName}의 성장 기록
            </h1>
            <p className="text-sm text-slate-500">{studentInfo?.className}</p>
          </div>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-mono font-bold">
            {accessCode}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 탭 전환 */}
        <div className="bg-white rounded-xl p-1 shadow-sm flex">
          {[
            { id: 'all', label: '전체' },
            { id: 'competition', label: '대회' },
            { id: 'practice', label: '연습' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {filteredStats?.bestScore || 0}회
            </p>
            <p className="text-xs text-slate-500">최고 기록</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className={`text-2xl font-bold ${
              (filteredStats?.growthRate || 0) > 0 ? 'text-green-600' :
              (filteredStats?.growthRate || 0) < 0 ? 'text-red-600' : 'text-slate-800'
            }`}>
              {filteredStats?.growthRate ? `${filteredStats.growthRate > 0 ? '+' : ''}${filteredStats.growthRate}%` : '-'}
            </p>
            <p className="text-xs text-slate-500">성장률</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {filteredRecords.length}회
            </p>
            <p className="text-xs text-slate-500">총 기록</p>
          </div>
        </div>

        {/* 성장 추이 차트 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            성장 추이
          </h2>
          <GrowthChart records={filteredRecords} mode={activeTab} />
        </div>

        {/* 종목별 최고기록 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            종목별 최고기록
          </h2>
          <BestRecordsTable records={filteredRecords} mode={activeTab} />
        </div>

        {/* 기록 히스토리 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            기록 히스토리
          </h2>
          {filteredRecords.length === 0 ? (
            <p className="text-center text-slate-500 py-8">기록이 없습니다</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredRecords.map((record, idx) => (
                <div
                  key={record.id || idx}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      record.mode === 'competition'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {record.mode === 'competition' ? '대회' : '연습'}
                    </span>
                    <span className="text-sm text-slate-600">{record.eventName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">{record.score}회</span>
                    <span className="text-xs text-slate-400 ml-2">{record.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
