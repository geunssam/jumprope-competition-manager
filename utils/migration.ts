import { writeBatch, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createCompetition } from '../services/firestore';
import { ClassTeam, CompetitionEvent, GradeConfig } from '../types';

export const migrateLocalStorageToFirestore = async (userId: string): Promise<string> => {
  // localStorage 데이터 읽기
  const localEvents = JSON.parse(localStorage.getItem('jr_events') || '[]') as CompetitionEvent[];
  const localClasses = JSON.parse(localStorage.getItem('jr_classes') || '[]') as ClassTeam[];
  const localConfigs = JSON.parse(localStorage.getItem('jr_grade_configs_v2') || '[]') as GradeConfig[];

  // 대회 생성
  const competitionId = await createCompetition(userId, '줄넘기 대회');

  // Firestore 일괄 작업
  const batch = writeBatch(db);

  // 종목 저장
  localEvents.forEach(event => {
    const eventRef = doc(db, 'events', event.id);
    batch.set(eventRef, { ...event, competitionId });
  });

  // 학급 저장
  localClasses.forEach(cls => {
    const totalScore = Object.values(cls.results).reduce((sum, result) => sum + result.score, 0);
    const clsRef = doc(db, 'classes', cls.id);
    batch.set(clsRef, {
      ...cls,
      competitionId,
      totalScore
    });
  });

  // 학년 설정 저장
  localConfigs.forEach(config => {
    const configRef = doc(db, 'gradeConfigs', `${competitionId}_${config.grade}`);
    batch.set(configRef, { ...config, competitionId });
  });

  await batch.commit();

  // 마이그레이션 완료 표시
  localStorage.setItem('jr_migrated_to_firebase', 'true');
  localStorage.setItem('jr_competition_id', competitionId);

  return competitionId;
};

export const hasMigratedData = (): boolean => {
  return localStorage.getItem('jr_migrated_to_firebase') === 'true';
};

export const hasLocalStorageData = (): boolean => {
  const events = localStorage.getItem('jr_events');
  const classes = localStorage.getItem('jr_classes');
  return !!(events && classes);
};
