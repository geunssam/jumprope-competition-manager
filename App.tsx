import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { SettingsView } from './components/SettingsView';
import { GradeView } from './components/GradeView';
import { CompetitionEvent, ClassTeam, GradeConfig, ViewMode } from './types';
import { INITIAL_EVENTS } from './constants';

const App: React.FC = () => {
  // --- Data Migration Logic ---
  const DATA_VERSION = '2.1'; // Increment this when data structure changes

  useEffect(() => {
    const currentVersion = localStorage.getItem('jr_data_version');

    if (currentVersion !== DATA_VERSION) {
      console.log('🔄 Migrating data to version', DATA_VERSION);

      if (currentVersion === '2.0') {
        // Migrate from 2.0 to 2.1: Convert teamParticipantIds to teams array
        const savedClasses = localStorage.getItem('jr_classes');
        if (savedClasses) {
          const classes = JSON.parse(savedClasses);
          const migratedClasses = classes.map((cls: any) => {
            const newResults: any = {};
            Object.keys(cls.results || {}).forEach((eventId: string) => {
              const result = cls.results[eventId];
              if (result.teamParticipantIds && result.teamParticipantIds.length > 0) {
                // Migrate old teamParticipantIds to new teams array
                newResults[eventId] = {
                  score: result.score,
                  teams: [{
                    id: `team_migration_${cls.id}_${eventId}`,
                    classId: cls.id,
                    eventId: eventId,
                    name: `${cls.name} 팀`,
                    memberIds: result.teamParticipantIds,
                    score: result.score
                  }]
                };
              } else {
                newResults[eventId] = result;
              }
            });
            return { ...cls, results: newResults };
          });
          localStorage.setItem('jr_classes', JSON.stringify(migratedClasses));
        }
      } else {
        // For versions older than 2.0, clear all data
        localStorage.removeItem('jr_events');
        localStorage.removeItem('jr_classes');
        localStorage.removeItem('jr_grade_configs');
        localStorage.removeItem('jr_grade_configs_v2');
      }

      // Set new version
      localStorage.setItem('jr_data_version', DATA_VERSION);

      // Force reload to initialize with fresh data
      window.location.reload();
    }
  }, []);

  // --- State Management ---
  const [events, setEvents] = useState<CompetitionEvent[]>(() => {
    const saved = localStorage.getItem('jr_events');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  const [classes, setClasses] = useState<ClassTeam[]>(() => {
    const saved = localStorage.getItem('jr_classes');
    // Basic migration for old data format if needed: check if 'students' exists
    const parsed = saved ? JSON.parse(saved) : [];
    if (parsed.length > 0 && !parsed[0].students) {
      // Migrate old simple count to student objects
      return parsed.map((c: any) => ({
        ...c,
        students: Array.from({ length: c.studentCount || 0 }, (_, i) => ({
          id: `std_mig_${c.id}_${i}`,
          name: `학생 ${i + 1}`
        }))
      }));
    }
    return parsed;
  });

  const [gradeConfigs, setGradeConfigs] = useState<GradeConfig[]>(() => {
    const saved = localStorage.getItem('jr_grade_configs_v2'); // Versioned key for new config structure
    if (saved) return JSON.parse(saved);
    
    // Initialize for grades 1-6
    return Array.from({ length: 6 }, (_, i) => ({
      grade: i + 1,
      events: {} // New structure
    }));
  });

  // UI State
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.GRADE);
  const [currentGrade, setCurrentGrade] = useState<number>(1);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem('jr_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('jr_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('jr_grade_configs_v2', JSON.stringify(gradeConfigs));
  }, [gradeConfigs]);

  // --- Handlers ---
  const handleSelectGrade = (grade: number) => {
    setCurrentGrade(grade);
    setCurrentView(ViewMode.GRADE);
  };

  const handleSelectSettings = () => {
    setCurrentView(ViewMode.SETTINGS);
  };

  const handleUpdateGradeConfig = (newConfig: GradeConfig) => {
    setGradeConfigs(prev => prev.map(c => c.grade === newConfig.grade ? newConfig : c));
  };

  // Get config for current grade
  const currentGradeConfig = gradeConfigs.find(c => c.grade === currentGrade) || { grade: currentGrade, events: {} };

  const handleMigration = () => {
    if (confirm('⚠️ 모든 데이터가 초기화됩니다. 계속하시겠습니까?')) {
      console.log('🔄 Manual migration triggered');
      localStorage.clear();
      window.location.reload();
    }
  };

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
        {/* Migration Button - Top Right */}
        <button
          onClick={handleMigration}
          className="absolute top-4 right-4 z-50 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-bold flex items-center gap-2 transition-all hover:scale-105"
          title="데이터 초기화 및 마이그레이션"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          데이터 초기화
        </button>

        {currentView === ViewMode.SETTINGS ? (
          <SettingsView
            events={events}
            onUpdateEvents={setEvents}
          />
        ) : (
          <GradeView
            key={currentGrade} // Force re-render on grade switch to clear local inputs if needed
            grade={currentGrade}
            classes={classes}
            events={events}
            gradeConfig={currentGradeConfig}
            onUpdateClasses={setClasses}
            onUpdateConfig={handleUpdateGradeConfig}
            onUpdateEvents={setEvents}
          />
        )}
      </main>
    </div>
  );
};

export default App;