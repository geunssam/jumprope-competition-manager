import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { SettingsView } from './components/SettingsView';
import { GradeView } from './components/GradeView';
import { LoginPage } from './components/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import {
  subscribeToEvents,
  subscribeToGradeClasses,
  getMyCompetitions,
  createCompetition,
  getGradeConfig,
  updateGradeConfig,
  batchUpdateClasses,
  batchUpdateEvents
} from './services/firestore';
import {
  migrateLocalStorageToFirestore,
  hasLocalStorageData,
  hasMigratedData
} from './utils/migration';
import { CompetitionEvent, ClassTeam, GradeConfig, ViewMode } from './types';
import { INITIAL_EVENTS } from './constants';
import { writeBatch, doc } from 'firebase/firestore';
import { db } from './lib/firebase';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  // 대회 상태
  const [currentCompetitionId, setCurrentCompetitionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 상태
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [classes, setClasses] = useState<ClassTeam[]>([]);
  const [gradeConfigs, setGradeConfigs] = useState<GradeConfig[]>([]);

  // UI State
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.GRADE);
  const [currentGrade, setCurrentGrade] = useState<number>(1);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // 1. 대회 초기화
  useEffect(() => {
    if (!user) return;

    const initCompetition = async () => {
      try {
        setLoading(true);

        // 마이그레이션 확인
        if (!hasMigratedData() && hasLocalStorageData()) {
          if (confirm('기존 데이터를 클라우드로 이전하시겠습니까?')) {
            const compId = await migrateLocalStorageToFirestore(user.uid);
            setCurrentCompetitionId(compId);
            setLoading(false);
            return;
          }
        }

        // 기존 대회 조회
        const savedCompId = localStorage.getItem('jr_competition_id');
        if (savedCompId) {
          setCurrentCompetitionId(savedCompId);
        } else {
          const comps = await getMyCompetitions(user.uid);
          if (comps.length > 0) {
            setCurrentCompetitionId(comps[0].id);
            localStorage.setItem('jr_competition_id', comps[0].id);
          } else {
            // 새 대회 생성 및 초기 종목 추가
            const newCompId = await createCompetition(user.uid, '줄넘기 대회');

            // 초기 종목 추가
            const batch = writeBatch(db);
            INITIAL_EVENTS.forEach(event => {
              const eventRef = doc(db, 'events', event.id);
              batch.set(eventRef, { ...event, competitionId: newCompId });
            });
            await batch.commit();

            setCurrentCompetitionId(newCompId);
            localStorage.setItem('jr_competition_id', newCompId);
          }
        }
      } catch (err) {
        console.error('Competition init error:', err);
        setError('대회 초기화 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    initCompetition();
  }, [user]);

  // 2. 종목 실시간 구독
  useEffect(() => {
    if (!currentCompetitionId) return;

    const unsubscribe = subscribeToEvents(currentCompetitionId, (updatedEvents) => {
      setEvents(updatedEvents);
    });

    return () => unsubscribe();
  }, [currentCompetitionId]);

  // 3. 학급 실시간 구독 (학년별)
  useEffect(() => {
    if (!currentCompetitionId || currentView !== ViewMode.GRADE) return;

    const unsubscribe = subscribeToGradeClasses(
      currentCompetitionId,
      currentGrade,
      (updatedClasses) => {
        setClasses(updatedClasses);
      }
    );

    return () => unsubscribe();
  }, [currentCompetitionId, currentGrade, currentView]);

  // 4. 학년 설정 로드
  useEffect(() => {
    if (!currentCompetitionId) return;

    const loadConfigs = async () => {
      const configs: GradeConfig[] = [];
      for (let grade = 1; grade <= 6; grade++) {
        const config = await getGradeConfig(currentCompetitionId, grade);
        configs.push(config || { grade, events: {} });
      }
      setGradeConfigs(configs);
    };

    loadConfigs();
  }, [currentCompetitionId]);

  // --- Handlers ---
  const handleSelectGrade = (grade: number) => {
    setCurrentGrade(grade);
    setCurrentView(ViewMode.GRADE);
  };

  const handleSelectSettings = () => {
    setCurrentView(ViewMode.SETTINGS);
  };

  const handleUpdateGradeConfig = async (newConfig: GradeConfig) => {
    if (!currentCompetitionId) return;
    await updateGradeConfig(currentCompetitionId, newConfig);
    setGradeConfigs(prev => prev.map(c => c.grade === newConfig.grade ? newConfig : c));
  };

  const handleUpdateClasses = async (updatedClasses: ClassTeam[]) => {
    await batchUpdateClasses(updatedClasses);
    // 실시간 리스너가 자동으로 업데이트
  };

  const handleUpdateEvents = async (updatedEvents: CompetitionEvent[]) => {
    if (!currentCompetitionId) return;
    await batchUpdateEvents(currentCompetitionId, updatedEvents);
    // 실시간 리스너가 자동으로 업데이트
  };

  // Get config for current grade
  const currentGradeConfig = gradeConfigs.find(c => c.grade === currentGrade) || { grade: currentGrade, events: {} };

  // 로딩 화면
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인 페이지
  if (!user) {
    return <LoginPage />;
  }

  // 에러 화면
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        currentGrade={currentView === ViewMode.GRADE ? currentGrade : null}
        onSelectGrade={handleSelectGrade}
        onSelectSettings={handleSelectSettings}
        isSettingsActive={currentView === ViewMode.SETTINGS}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {currentView === ViewMode.SETTINGS ? (
          <SettingsView
            events={events}
            onUpdateEvents={handleUpdateEvents}
          />
        ) : (
          <GradeView
            key={currentGrade} // Force re-render on grade switch to clear local inputs if needed
            grade={currentGrade}
            classes={classes}
            events={events}
            gradeConfig={currentGradeConfig}
            onUpdateClasses={handleUpdateClasses}
            onUpdateConfig={handleUpdateGradeConfig}
            onUpdateEvents={handleUpdateEvents}
          />
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;