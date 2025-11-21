import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { SettingsView } from './components/SettingsView';
import { GradeView } from './components/GradeView';
import { CompetitionEvent, ClassTeam, GradeConfig, ViewMode } from './types';
import { INITIAL_EVENTS } from './constants';

const App: React.FC = () => {
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

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        currentGrade={currentView === ViewMode.GRADE ? currentGrade : null}
        onSelectGrade={handleSelectGrade}
        onSelectSettings={handleSelectSettings}
        isSettingsActive={currentView === ViewMode.SETTINGS}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
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
          />
        )}
      </main>
    </div>
  );
};

export default App;