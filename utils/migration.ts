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

  // Phase 2.5: users/{userId}/ 하위 컬렉션에 저장
  // 종목 저장
  localEvents.forEach(event => {
    const eventRef = doc(db, 'users', userId, 'events', event.id);
    batch.set(eventRef, { ...event, competitionId });
  });

  // 학급 저장
  localClasses.forEach(cls => {
    const totalScore = Object.values(cls.results).reduce((sum, result) => sum + result.score, 0);
    const clsRef = doc(db, 'users', userId, 'classes', cls.id);
    batch.set(clsRef, {
      ...cls,
      competitionId,
      totalScore
    });
  });

  // 학년 설정 저장 (Phase 2.5: users 하위에 저장)
  localConfigs.forEach(config => {
    const configRef = doc(db, 'users', userId, 'gradeConfigs', `${competitionId}_${config.grade}`);
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

/**
 * 고아 데이터(orphaned records) 정리 함수
 * 삭제된 종목이나 학급에 대한 기록을 정리합니다.
 */
export const cleanupOrphanedEventRecords = async (
  userId: string,
  classes: ClassTeam[],
  events: CompetitionEvent[],
  gradeConfigs: Record<number, GradeConfig>
): Promise<{ cleaned: boolean; removedCount: number; details: string[] }> => {
  const details: string[] = [];
  let removedCount = 0;

  try {
    // 현재 존재하는 종목 ID 목록
    const validEventIds = new Set(events.map(e => e.id));

    // 각 학급의 results에서 고아 기록 찾기
    for (const cls of classes) {
      if (!cls.results) continue;

      const orphanedEventIds: string[] = [];

      for (const eventId of Object.keys(cls.results)) {
        if (!validEventIds.has(eventId)) {
          orphanedEventIds.push(eventId);
        }
      }

      if (orphanedEventIds.length > 0) {
        // 고아 기록 제거
        const updatedResults = { ...cls.results };
        orphanedEventIds.forEach(eventId => {
          delete updatedResults[eventId];
          removedCount++;
          details.push(`${cls.name}: 종목 ${eventId} 기록 삭제`);
        });

        // Firestore 업데이트 (배치로 처리)
        const classRef = doc(db, 'users', userId, 'classes', cls.id);
        const batch = writeBatch(db);
        batch.update(classRef, { results: updatedResults });
        await batch.commit();
      }
    }

    return {
      cleaned: removedCount > 0,
      removedCount,
      details,
    };
  } catch (error) {
    console.error('❌ cleanupOrphanedEventRecords 실패:', error);
    return {
      cleaned: false,
      removedCount: 0,
      details: [`오류 발생: ${error}`],
    };
  }
};
