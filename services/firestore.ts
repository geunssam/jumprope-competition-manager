import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ClassTeam, CompetitionEvent, GradeConfig, PracticeRecord, TeacherSettings, ClassStats, StudentRecord, Student } from '../types';

// === Helper 함수 ===
const getUserCollection = (userId: string, collectionName: string) => {
  return collection(db, 'users', userId, collectionName);
};

const getUserDoc = (userId: string, collectionName: string, docId: string) => {
  return doc(db, 'users', userId, collectionName, docId);
};

// === 대회 관리 ===
export const createCompetition = async (userId: string, name: string): Promise<string> => {
  const compRef = doc(collection(db, 'competitions'));
  await setDoc(compRef, {
    name,
    createdBy: userId,
    createdAt: serverTimestamp(),
    status: 'active'
  });
  return compRef.id;
};

export const getMyCompetitions = async (userId: string) => {
  const q = query(collection(db, 'competitions'), where('createdBy', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// === 종목 관리 ===
export const createEvent = async (userId: string, competitionId: string, event: CompetitionEvent) => {
  await setDoc(getUserDoc(userId, 'events', event.id), {
    ...event,
    competitionId
  });
};

export const getEvents = async (userId: string, competitionId: string): Promise<CompetitionEvent[]> => {
  const q = query(getUserCollection(userId, 'events'), where('competitionId', '==', competitionId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as CompetitionEvent);
};

export const subscribeToEvents = (
  userId: string,
  competitionId: string,
  callback: (events: CompetitionEvent[]) => void
): Unsubscribe => {
  console.log('🔥 [Firestore] subscribeToEvents 호출됨', {
    userId,
    competitionId
  });

  const q = query(getUserCollection(userId, 'events'), where('competitionId', '==', competitionId));

  console.log('📝 [Firestore] 종목 쿼리 생성 완료, onSnapshot 등록 중...');

  return onSnapshot(
    q,
    (snapshot) => {
      console.log('📡 [Firestore] 종목 onSnapshot 콜백 실행', {
        docCount: snapshot.docs.length,
        isEmpty: snapshot.empty
      });

      const events = snapshot.docs.map(doc => {
        const data = doc.data() as CompetitionEvent;
        console.log('📄 [Firestore] 종목 문서 데이터:', {
          id: doc.id,
          data
        });
        return data;
      });

      console.log('✅ [Firestore] 종목 데이터 콜백 전달', {
        eventCount: events.length,
        events
      });

      callback(events);
    },
    (error) => {
      console.error('❌ [Firestore] 종목 onSnapshot 에러:', error);
      console.error('에러 상세:', {
        code: error.code,
        message: error.message,
        name: error.name
      });
    }
  );
};

export const updateEvent = async (userId: string, eventId: string, updates: Partial<CompetitionEvent>) => {
  await updateDoc(getUserDoc(userId, 'events', eventId), updates);
};

export const deleteEvent = async (userId: string, eventId: string) => {
  await deleteDoc(getUserDoc(userId, 'events', eventId));
};

// === 학급 관리 ===
export const createClass = async (userId: string, competitionId: string, classData: ClassTeam) => {
  await setDoc(getUserDoc(userId, 'classes', classData.id), {
    ...classData,
    competitionId,
    totalScore: 0,
    updatedAt: serverTimestamp()
  });
};

export const updateClass = async (userId: string, classId: string, updates: Partial<ClassTeam>) => {
  await updateDoc(getUserDoc(userId, 'classes', classId), {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const updateClassStudents = async (userId: string, classId: string, students: Student[]) => {
  await updateDoc(getUserDoc(userId, 'classes', classId), {
    students,
    updatedAt: serverTimestamp()
  });
};

export const deleteClass = async (userId: string, classId: string) => {
  console.log('🗑️ 학급 삭제 시작:', classId);
  try {
    await deleteDoc(getUserDoc(userId, 'classes', classId));
    console.log('✅ 학급 삭제 완료:', classId);
  } catch (error) {
    console.error('❌ 학급 삭제 실패:', error);
    throw error;
  }
};

export const getGradeClasses = async (
  userId: string,
  competitionId: string,
  grade: number
): Promise<ClassTeam[]> => {
  const q = query(
    getUserCollection(userId, 'classes'),
    where('competitionId', '==', competitionId),
    where('grade', '==', grade)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as ClassTeam);
};

export const getAllClasses = async (
  userId: string,
  competitionId: string
): Promise<ClassTeam[]> => {
  const q = query(
    getUserCollection(userId, 'classes'),
    where('competitionId', '==', competitionId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as ClassTeam));
};

export const subscribeToGradeClasses = (
  userId: string,
  competitionId: string,
  grade: number,
  callback: (classes: ClassTeam[]) => void
): Unsubscribe => {
  console.log('🔥 [Firestore] subscribeToGradeClasses 호출됨', {
    userId,
    competitionId,
    grade
  });

  const q = query(
    getUserCollection(userId, 'classes'),
    where('competitionId', '==', competitionId),
    where('grade', '==', grade)
  );

  console.log('📝 [Firestore] 쿼리 생성 완료, onSnapshot 등록 중...');

  return onSnapshot(
    q,
    (snapshot) => {
      console.log('📡 [Firestore] onSnapshot 콜백 실행', {
        docCount: snapshot.docs.length,
        isEmpty: snapshot.empty
      });

      const classes = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 [Firestore] 문서 데이터:', {
          id: doc.id,
          data
        });
        return {
          id: doc.id,
          ...data
        } as ClassTeam;
      });

      console.log('✅ [Firestore] 학급 데이터 콜백 전달', {
        classCount: classes.length,
        classes
      });

      callback(classes);
    },
    (error) => {
      console.error('❌ [Firestore] onSnapshot 에러:', error);
      console.error('에러 상세:', {
        code: error.code,
        message: error.message,
        name: error.name
      });
    }
  );
};

export const subscribeToAllClasses = (
  userId: string,
  competitionId: string,
  callback: (classes: ClassTeam[]) => void
): Unsubscribe => {
  const q = query(
    getUserCollection(userId, 'classes'),
    where('competitionId', '==', competitionId)
  );
  return onSnapshot(q, (snapshot) => {
    const classes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ClassTeam));
    callback(classes);
  });
};

export const updateClassResults = async (
  userId: string,
  classId: string,
  results: ClassTeam['results']
) => {
  // 총점 계산
  const totalScore = Object.values(results).reduce((sum, result) => sum + result.score, 0);

  await updateDoc(getUserDoc(userId, 'classes', classId), {
    results,
    totalScore,
    updatedAt: serverTimestamp()
  });
};

// === 학년 설정 관리 ===
export const updateGradeConfig = async (
  userId: string,
  competitionId: string,
  config: GradeConfig
) => {
  const configId = `${competitionId}_${config.grade}`;
  await setDoc(getUserDoc(userId, 'gradeConfigs', configId), {
    ...config,
    competitionId
  });
};

export const getGradeConfig = async (
  userId: string,
  competitionId: string,
  grade: number
): Promise<GradeConfig | null> => {
  const configId = `${competitionId}_${grade}`;
  const snapshot = await getDoc(getUserDoc(userId, 'gradeConfigs', configId));
  return snapshot.exists() ? snapshot.data() as GradeConfig : null;
};

// === 일괄 작업 ===
export const batchUpdateClasses = async (userId: string, competitionId: string, classes: ClassTeam[]) => {
  const batch = writeBatch(db);

  classes.forEach(cls => {
    const ref = getUserDoc(userId, 'classes', cls.id);
    batch.set(ref, {
      ...cls,
      competitionId,
      updatedAt: serverTimestamp()
    }, { merge: true });
  });

  await batch.commit();
};

export const batchUpdateEvents = async (userId: string, competitionId: string, events: CompetitionEvent[]) => {
  const batch = writeBatch(db);

  events.forEach(event => {
    const ref = getUserDoc(userId, 'events', event.id);
    batch.set(ref, {
      ...event,
      competitionId
    }, { merge: true });
  });

  await batch.commit();
};

// === 개인정보 동의 관리 ===
interface PrivacyConsent {
  id?: string;
  consentType: 'teacher';
  teacherId: string;
  teacherEmail: string;
  privacyPolicyVersion: string;
  termsAgreed: boolean;
  dataCollectionAgreed: boolean;
  marketingAgreed: boolean;
  ipAddress: string | null;
  userAgent: string;
  metadata: {
    createdAt: any;
    updatedAt: any;
    updatedBy: string;
  };
}

/**
 * 개인정보 처리 동의 기록 조회
 * @param teacherId - 교사 ID (Google UID)
 * @param version - 처리방침 버전
 * @returns 동의 기록 또는 null
 */
export const checkPrivacyConsent = async (
  teacherId: string,
  version: string
): Promise<PrivacyConsent | null> => {
  try {
    console.log('🔍 [checkPrivacyConsent] 조회 시작:', { teacherId, version });

    // privacy_consents 컬렉션에서 해당 버전의 동의 기록 조회
    // 문서 ID: {teacherId}_{version}
    const consentId = `${teacherId}_${version}`;
    const consentDoc = await getDoc(doc(db, 'privacy_consents', consentId));

    if (!consentDoc.exists()) {
      console.log('ℹ️ [checkPrivacyConsent] 동의 기록 없음 (정상)');
      return null;
    }

    const data = { id: consentDoc.id, ...consentDoc.data() } as PrivacyConsent;
    console.log('✅ [checkPrivacyConsent] 동의 기록 있음:', data);
    return data;
  } catch (error) {
    console.error('❌ [checkPrivacyConsent] 예외 발생:', error);
    throw error;
  }
};

/**
 * 개인정보 처리 동의 기록 저장
 * @param params - 동의 정보
 * @returns 저장된 동의 기록
 */
export const savePrivacyConsent = async (params: {
  teacherId: string;
  teacherEmail: string;
  consentType?: 'teacher';
  version: string;
  termsAgreed: boolean;
  dataCollectionAgreed: boolean;
  marketingAgreed?: boolean;
}): Promise<PrivacyConsent> => {
  try {
    console.log('📝 [savePrivacyConsent] 저장 시작:', {
      teacherId: params.teacherId,
      teacherEmail: params.teacherEmail,
      version: params.version,
    });

    // IP 주소 및 User Agent 수집
    const ipAddress = null; // 클라이언트에서는 IP 직접 수집 불가
    const userAgent = navigator.userAgent;

    // privacy_consents 컬렉션에 저장
    // 문서 ID: {teacherId}_{version}
    const consentId = `${params.teacherId}_${params.version}`;
    const consentData: Omit<PrivacyConsent, 'id'> = {
      consentType: params.consentType || 'teacher',
      teacherId: params.teacherId,
      teacherEmail: params.teacherEmail,
      privacyPolicyVersion: params.version,
      termsAgreed: params.termsAgreed,
      dataCollectionAgreed: params.dataCollectionAgreed,
      marketingAgreed: params.marketingAgreed || false,
      ipAddress,
      userAgent,
      metadata: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: 'system',
      },
    };

    // set with merge: true를 사용하여 upsert 구현
    await setDoc(doc(db, 'privacy_consents', consentId), consentData, { merge: true });

    console.log('✅ [savePrivacyConsent] 저장 완료:', consentId);
    return { id: consentId, ...consentData };
  } catch (error) {
    console.error('❌ [savePrivacyConsent] 예외 발생:', error);
    throw error;
  }
};

// === 연습 기록 관리 ===

/**
 * 연습 기록 저장
 */
export const savePracticeRecord = async (
  competitionId: string,
  gradeId: string,
  record: Omit<PracticeRecord, 'id' | 'createdAt'>
): Promise<string> => {
  const recordRef = doc(collection(db, 'competitions', competitionId, 'grades', gradeId, 'practiceRecords'));
  const recordData = {
    ...record,
    createdAt: serverTimestamp()
  };
  await setDoc(recordRef, recordData);
  return recordRef.id;
};

/**
 * 특정 날짜의 연습 기록 조회
 */
export const getPracticeRecordsByDate = async (
  competitionId: string,
  gradeId: string,
  date: string
): Promise<PracticeRecord[]> => {
  const q = query(
    collection(db, 'competitions', competitionId, 'grades', gradeId, 'practiceRecords'),
    where('date', '==', date)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date()
  } as PracticeRecord));
};

/**
 * 학생별 모든 연습 기록 조회
 */
export const getStudentPracticeRecords = async (
  competitionId: string,
  gradeId: string,
  studentId: string
): Promise<PracticeRecord[]> => {
  const q = query(
    collection(db, 'competitions', competitionId, 'grades', gradeId, 'practiceRecords'),
    where('studentId', '==', studentId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date()
  } as PracticeRecord));
};

/**
 * 종목별 학생 기록 조회
 */
export const getStudentEventRecords = async (
  competitionId: string,
  gradeId: string,
  studentId: string,
  eventId: string
): Promise<PracticeRecord[]> => {
  const q = query(
    collection(db, 'competitions', competitionId, 'grades', gradeId, 'practiceRecords'),
    where('studentId', '==', studentId),
    where('eventId', '==', eventId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date()
  } as PracticeRecord));
};

/**
 * 학년별 모든 연습 기록 조회
 */
export const getPracticeRecordsByGrade = async (
  competitionId: string,
  gradeId: string
): Promise<PracticeRecord[]> => {
  const q = query(
    collection(db, 'competitions', competitionId, 'grades', gradeId, 'practiceRecords'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date()
  } as PracticeRecord));
};

/**
 * 특정 날짜/세션의 모든 연습 기록 삭제
 */
export const deletePracticeSession = async (
  competitionId: string,
  grade: number,
  date: string,
  sessionNumber: number
): Promise<number> => {
  console.log('🗑️ 연습 기록 삭제 시작:', { competitionId, grade, date, sessionNumber });

  const gradeId = `grade_${grade}`;
  const q = query(
    collection(db, 'competitions', competitionId, 'grades', gradeId, 'practiceRecords'),
    where('date', '==', date),
    where('sessionNumber', '==', sessionNumber)
  );

  const snapshot = await getDocs(q);
  console.log(`📦 삭제할 기록 수: ${snapshot.docs.length}개`);

  if (snapshot.docs.length === 0) {
    console.log('⚠️ 삭제할 기록이 없습니다.');
    return 0;
  }

  const batch = writeBatch(db);
  snapshot.docs.forEach(docSnapshot => {
    batch.delete(docSnapshot.ref);
  });

  await batch.commit();
  console.log(`✅ ${snapshot.docs.length}개 기록 삭제 완료`);

  return snapshot.docs.length;
};

/**
 * 개인 최고 기록 업데이트
 * @param userId - 사용자 ID (Phase 2.5에서 추가)
 */
export const updatePersonalBest = async (
  userId: string,
  classId: string,
  studentId: string,
  eventId: string,
  record: {
    score: number;
    date: string;
    recordId: string;
  }
): Promise<void> => {
  // Phase 2.5: users/{userId}/classes/{classId} 경로 사용
  const classRef = getUserDoc(userId, 'classes', classId);
  const classDoc = await getDoc(classRef);

  if (!classDoc.exists()) {
    throw new Error('Class not found');
  }

  const classData = classDoc.data() as ClassTeam;
  const students = classData.students || [];
  const studentIndex = students.findIndex(s => s.id === studentId);

  if (studentIndex === -1) {
    throw new Error('Student not found');
  }

  const updatedStudents = [...students];
  if (!updatedStudents[studentIndex].personalBests) {
    updatedStudents[studentIndex].personalBests = {};
  }
  updatedStudents[studentIndex].personalBests![eventId] = record;

  await updateDoc(classRef, {
    students: updatedStudents,
    updatedAt: serverTimestamp()
  });
};

/**
 * 학급 통계 재계산
 */
export const recalculateClassStats = async (
  competitionId: string,
  gradeId: string,
  eventId: string
): Promise<void> => {
  // 모든 연습 기록 가져오기
  const q = query(
    collection(db, 'competitions', competitionId, 'grades', gradeId, 'practiceRecords'),
    where('eventId', '==', eventId)
  );
  const snapshot = await getDocs(q);
  const records = snapshot.docs.map(doc => doc.data() as PracticeRecord);

  if (records.length === 0) {
    return; // 기록이 없으면 통계 생성 안 함
  }

  // 통계 계산
  const scores = records.map(r => r.score);
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const topScore = Math.max(...scores);
  const uniqueStudents = new Set(records.map(r => r.studentId));

  // 참여율은 별도로 계산 필요 (전체 학생 수 필요)
  const statsData: ClassStats = {
    gradeId,
    eventId,
    averageScore: Math.round(averageScore * 10) / 10, // 소수점 1자리
    topScore,
    totalRecords: records.length,
    participationRate: 0, // 추후 계산
    lastUpdated: new Date()
  };

  const statsRef = doc(db, 'competitions', competitionId, 'grades', gradeId, 'classStats', eventId);
  await setDoc(statsRef, statsData, { merge: true });
};

/**
 * 그날의 다음 세션 번호 가져오기
 */
export const getNextSessionNumber = async (
  competitionId: string,
  gradeId: string,
  studentId: string,
  date: string
): Promise<number> => {
  const q = query(
    collection(db, 'competitions', competitionId, 'grades', gradeId, 'practiceRecords'),
    where('studentId', '==', studentId),
    where('date', '==', date)
  );
  const snapshot = await getDocs(q);
  const records = snapshot.docs.map(doc => doc.data() as PracticeRecord);

  if (records.length === 0) {
    return 1;
  }

  const maxSession = Math.max(...records.map(r => r.sessionNumber));
  return maxSession + 1;
};

// === 교사 설정 관리 ===

/**
 * 교사 설정 저장
 */
export const saveTeacherSettings = async (settings: TeacherSettings): Promise<void> => {
  await setDoc(doc(db, 'teacherSettings', settings.teacherId), {
    ...settings,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

/**
 * 교사 설정 조회
 */
export const getTeacherSettings = async (teacherId: string): Promise<TeacherSettings | null> => {
  const snapshot = await getDoc(doc(db, 'teacherSettings', teacherId));
  return snapshot.exists() ? snapshot.data() as TeacherSettings : null;
};

/**
 * 학급 통계 조회
 */
export const getClassStats = async (
  competitionId: string,
  gradeId: string,
  eventId: string
): Promise<ClassStats | null> => {
  const statsRef = doc(db, 'competitions', competitionId, 'grades', gradeId, 'classStats', eventId);
  const snapshot = await getDoc(statsRef);
  return snapshot.exists() ? snapshot.data() as ClassStats : null;
};

/**
 * 대회 기록 배치 저장
 * 여러 학급의 results를 한 번에 안전하게 저장
 * @param userId - 사용자 ID (Phase 2.5에서 추가)
 */
export const saveCompetitionResults = async (userId: string, classes: ClassTeam[]): Promise<void> => {
  console.log('🔍 saveCompetitionResults 시작');
  console.log('📦 저장할 학급 수:', classes.length);

  if (!classes || classes.length === 0) {
    console.warn('⚠️ 저장할 학급 데이터가 없습니다.');
    return;
  }

  const batch = writeBatch(db);

  classes.forEach((cls, index) => {
    console.log(`\n📋 학급 ${index + 1}/${classes.length}:`, {
      id: cls.id,
      name: cls.name,
      resultsCount: Object.keys(cls.results || {}).length,
      sampleResults: Object.entries(cls.results || {}).slice(0, 2)
    });

    if (!cls.id) {
      console.error(`❌ 학급 ID가 없습니다:`, cls);
      throw new Error(`학급 ID가 없습니다: ${cls.name}`);
    }

    const totalScore = Object.values(cls.results || {}).reduce(
      (sum, result) => sum + (result?.score || 0),
      0
    );

    console.log(`  ✅ 총점 계산됨: ${totalScore}점`);

    // Phase 2.5: users/{userId}/classes/{classId} 경로 사용
    const classRef = getUserDoc(userId, 'classes', cls.id);
    console.log(`  📍 문서 경로: /users/${userId}/classes/${cls.id}`);

    // update 사용 (문서가 반드시 존재해야 함)
    batch.update(classRef, {
      results: cls.results || {},
      totalScore,
      updatedAt: serverTimestamp()
    });

    console.log(`  💾 배치에 추가됨 (update mode)`);
  });

  try {
    console.log('\n🚀 Firestore 배치 커밋 시작...');
    await batch.commit();
    console.log('✅ Firestore 배치 커밋 성공!');
  } catch (error: any) {
    console.error('❌ Firestore 배치 커밋 실패:', error);
    console.error('  에러 코드:', error.code);
    console.error('  에러 메시지:', error.message);

    if (error.code === 'not-found') {
      console.error('  💡 힌트: 문서가 존재하지 않습니다. 학급 데이터가 Firestore에 생성되었는지 확인하세요.');
    } else if (error.code === 'permission-denied') {
      console.error('  💡 힌트: Firestore 규칙에서 업데이트가 거부되었습니다. 규칙을 확인하세요.');
    }

    throw error;
  }
};

/**
 * 특정 날짜의 모든 학급 대회 기록 삭제
 * @param userId - 사용자 ID (Phase 2.5에서 추가)
 */
export const deleteCompetitionDateRecords = async (
  userId: string,
  competitionId: string,
  grade: number,
  date: string
): Promise<void> => {
  console.log('🗑️ 대회 기록 삭제 시작:', { competitionId, grade, date });

  const classes = await getGradeClasses(userId, competitionId, grade);
  console.log(`📦 확인할 학급 수: ${classes.length}개`);

  const batch = writeBatch(db);
  let updatedClassCount = 0;

  classes.forEach(cls => {
    const updatedResults = { ...cls.results };
    let hasChanges = false;

    // 해당 날짜의 기록만 제거
    Object.keys(updatedResults).forEach(eventId => {
      const resultDate = updatedResults[eventId]?.date || '날짜 미지정';

      if (resultDate === date) {
        console.log(`  🗑️ ${cls.name} - ${eventId} 기록 삭제 (날짜: ${resultDate})`);
        delete updatedResults[eventId];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      const totalScore = Object.values(updatedResults).reduce(
        (sum, result) => sum + (result?.score || 0),
        0
      );

      // Phase 2.5: users/{userId}/classes/{classId} 경로 사용
      const classRef = getUserDoc(userId, 'classes', cls.id);
      batch.update(classRef, {
        results: updatedResults,
        totalScore,
        updatedAt: serverTimestamp()
      });
      updatedClassCount++;
    }
  });

  if (updatedClassCount === 0) {
    console.log('⚠️ 삭제할 대회 기록이 없습니다.');
    return;
  }

  await batch.commit();
  console.log(`✅ ${updatedClassCount}개 학급의 ${date} 대회 기록 삭제 완료`);
};

/**
 * 날짜별 전체 학급 경기 기록 조회
 * 특정 날짜의 모든 학급 기록을 필터링하여 반환
 * @param userId - 사용자 ID (Phase 2.5에서 추가)
 */
export const getAllClassResultsByDate = async (
  userId: string,
  competitionId: string,
  grade: number,
  date: string
): Promise<Array<{ classId: string; className: string; results: ClassTeam['results'] }>> => {
  const classes = await getGradeClasses(userId, competitionId, grade);

  return classes.map(cls => {
    const dateResults: ClassTeam['results'] = {};
    Object.entries(cls.results || {}).forEach(([eventId, result]) => {
      if (result.date === date) {
        dateResults[eventId] = result;
      }
    });

    return {
      classId: cls.id,
      className: cls.name,
      results: dateResults
    };
  });
};

// ========================================
// 🆕 Records 컬렉션 CRUD (Phase 2)
// ========================================

/**
 * 개별 기록 저장
 */
export const createRecord = async (
  userId: string,
  record: Omit<StudentRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const recordRef = doc(collection(db, 'users', userId, 'records'));
  const recordData = {
    ...record,
    id: recordRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(recordRef, recordData);
  return recordRef.id;
};

/**
 * 기록 일괄 저장 (배치)
 */
export const createRecordsBatch = async (
  userId: string,
  records: Omit<StudentRecord, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<void> => {
  if (records.length === 0) return;

  const batch = writeBatch(db);

  records.forEach((record) => {
    const recordRef = doc(collection(db, 'users', userId, 'records'));
    batch.set(recordRef, {
      ...record,
      id: recordRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
};

/**
 * 학생별 기록 조회
 */
export const getStudentRecords = async (
  userId: string,
  studentId: string,
  options?: { mode?: string; eventId?: string; limit?: number }
): Promise<StudentRecord[]> => {
  // 인덱스 없이 작동하도록 orderBy 제거, 클라이언트에서 정렬
  const q = query(
    getUserCollection(userId, 'records'),
    where('studentId', '==', studentId)
  );

  const snapshot = await getDocs(q);
  let records = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as StudentRecord[];

  // 클라이언트에서 날짜 내림차순 정렬
  records.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  // 클라이언트 필터링 (복합 쿼리 제약 회피)
  if (options?.mode) {
    records = records.filter((r) => r.mode === options.mode);
  }
  if (options?.eventId) {
    records = records.filter((r) => r.eventId === options.eventId);
  }
  if (options?.limit) {
    records = records.slice(0, options.limit);
  }

  return records;
};

/**
 * accessCode로 학생 정보 및 기록 조회 (학생 페이지용)
 */
export const getRecordsByAccessCode = async (
  accessCode: string
): Promise<{ studentName: string; className: string; grade: number; records: StudentRecord[] } | null> => {
  // 1. accessCodes 컬렉션에서 학생 정보 조회
  const accessCodeDoc = await getDoc(doc(db, 'accessCodes', accessCode));

  if (!accessCodeDoc.exists()) {
    console.log('❌ accessCode를 찾을 수 없습니다:', accessCode);
    return null;
  }

  const accessCodeData = accessCodeDoc.data();
  const { studentName, className, grade, userId } = accessCodeData;

  // 2. 해당 학생의 기록 조회 (인덱스 없이 - 클라이언트 정렬)
  const recordsQuery = query(
    collection(db, 'users', userId, 'records'),
    where('accessCode', '==', accessCode)
  );

  const recordsSnapshot = await getDocs(recordsQuery);
  let records = recordsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as StudentRecord[];

  // 클라이언트에서 날짜 내림차순 정렬
  records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    studentName,
    className,
    grade: grade || 0,
    records,
  };
};

/**
 * 종목별 기록 조회
 */
export const getEventRecords = async (
  userId: string,
  eventId: string,
  options?: { date?: string; classId?: string }
): Promise<StudentRecord[]> => {
  const q = query(
    getUserCollection(userId, 'records'),
    where('eventId', '==', eventId),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);
  let records = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as StudentRecord[];

  // 클라이언트 필터링
  if (options?.date) {
    records = records.filter((r) => r.date === options.date);
  }
  if (options?.classId) {
    records = records.filter((r) => r.classId === options.classId);
  }

  return records;
};

// ========================================
// 🆕 AccessCodes 컬렉션 관리 (Phase 2)
// ========================================

interface AccessCodeMapping {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  grade: number;
  userId: string;
}

/**
 * accessCode → 학생 정보 매핑 생성
 */
export const createAccessCodeMapping = async (
  code: string,
  data: AccessCodeMapping
): Promise<void> => {
  await setDoc(doc(db, 'accessCodes', code), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

/**
 * accessCode로 학생 정보 조회
 */
export const getStudentByAccessCode = async (
  code: string
): Promise<AccessCodeMapping | null> => {
  const docSnap = await getDoc(doc(db, 'accessCodes', code));
  return docSnap.exists() ? (docSnap.data() as AccessCodeMapping) : null;
};

/**
 * accessCode 매핑 삭제
 */
export const deleteAccessCodeMapping = async (code: string): Promise<void> => {
  await deleteDoc(doc(db, 'accessCodes', code));
};

/**
 * 특정 학급의 모든 학생 accessCode 매핑 일괄 생성
 */
export const createAccessCodeMappingsBatch = async (
  userId: string,
  classId: string,
  className: string,
  grade: number,
  students: Student[]
): Promise<void> => {
  const batch = writeBatch(db);

  students.forEach((student) => {
    if (student.accessCode) {
      const codeRef = doc(db, 'accessCodes', student.accessCode);
      batch.set(codeRef, {
        studentId: student.id,
        studentName: student.name,
        classId,
        className,
        grade,
        userId,
        createdAt: serverTimestamp(),
      });
    }
  });

  await batch.commit();
};

// ========================================
// 🆕 데이터 마이그레이션 (classes.results → records)
// ========================================

/**
 * classes.results 데이터를 records 컬렉션으로 마이그레이션
 * - studentScores (개인전) 데이터를 개별 StudentRecord로 변환
 */
export const migrateClassResultsToRecords = async (
  userId: string,
  classes: ClassTeam[],
  events: CompetitionEvent[]
): Promise<{ migrated: number; skipped: number }> => {
  let migrated = 0;
  let skipped = 0;

  const eventMap = new Map(events.map(e => [e.id, e]));
  const batch = writeBatch(db);

  // 이미 존재하는 기록 확인 (중복 방지)
  const existingRecordsSnap = await getDocs(getUserCollection(userId, 'records'));
  const existingKeys = new Set<string>();
  existingRecordsSnap.docs.forEach(doc => {
    const data = doc.data();
    // studentId + eventId + date + score 조합으로 중복 체크
    existingKeys.add(`${data.studentId}_${data.eventId}_${data.date}_${data.score}`);
  });

  for (const cls of classes) {
    if (!cls.results) continue;

    for (const [eventId, result] of Object.entries(cls.results)) {
      const event = eventMap.get(eventId);
      if (!event) continue;

      const recordDate = result.date || new Date().toISOString().split('T')[0];

      // 1. 개인전 마이그레이션 (studentScores가 있는 경우)
      if (result.studentScores) {
        for (const [studentId, score] of Object.entries(result.studentScores)) {
          if (typeof score !== 'number' || score <= 0) {
            skipped++;
            continue;
          }

          const student = cls.students.find(s => s.id === studentId);
          if (!student) {
            skipped++;
            continue;
          }

          // 중복 체크
          const key = `${studentId}_${eventId}_${recordDate}_${score}`;
          if (existingKeys.has(key)) {
            skipped++;
            continue;
          }

          const recordRef = doc(collection(db, 'users', userId, 'records'));
          const recordData: Omit<StudentRecord, 'createdAt' | 'updatedAt'> = {
            id: recordRef.id,
            studentId,
            studentName: student.name,
            accessCode: student.accessCode || '',
            classId: cls.id,
            className: cls.name,
            grade: cls.grade,
            eventId,
            eventName: event.name,
            score,
            date: recordDate,
            mode: 'competition',
          };

          batch.set(recordRef, {
            ...recordData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          existingKeys.add(key);
          migrated++;
        }
      }

      // 2. 단체전 마이그레이션 (teams가 있는 경우)
      if (result.teams && result.teams.length > 0) {
        for (const team of result.teams) {
          if (!team.score || team.score <= 0) continue;

          // 팀원 이름 목록
          const teamMemberNames = team.memberIds
            .map(id => cls.students.find(s => s.id === id)?.name || '알 수 없음')
            .filter(Boolean);

          // 각 팀원에게 팀 기록 저장
          for (const memberId of team.memberIds) {
            const student = cls.students.find(s => s.id === memberId);
            if (!student) {
              skipped++;
              continue;
            }

            // 중복 체크
            const key = `${memberId}_${eventId}_${recordDate}_${team.score}`;
            if (existingKeys.has(key)) {
              skipped++;
              continue;
            }

            const recordRef = doc(collection(db, 'users', userId, 'records'));
            const recordData: Omit<StudentRecord, 'createdAt' | 'updatedAt'> = {
              id: recordRef.id,
              studentId: memberId,
              studentName: student.name,
              accessCode: student.accessCode || '',
              classId: cls.id,
              className: cls.name,
              grade: cls.grade,
              eventId,
              eventName: event.name,
              score: team.score, // 팀 점수를 개인 기록으로
              date: recordDate,
              mode: 'competition',
              // 단체전 전용 필드
              teamId: team.id,
              teamMembers: teamMemberNames,
              teamScore: team.score,
            };

            batch.set(recordRef, {
              ...recordData,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });

            existingKeys.add(key);
            migrated++;
          }
        }
      }
    }
  }

  if (migrated > 0) {
    await batch.commit();
  }

  console.log(`📊 마이그레이션 완료: ${migrated}개 저장, ${skipped}개 스킵`);
  return { migrated, skipped };
};
