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
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ClassTeam, CompetitionEvent, GradeConfig } from '../types';

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
export const createEvent = async (competitionId: string, event: CompetitionEvent) => {
  await setDoc(doc(db, 'events', event.id), {
    ...event,
    competitionId
  });
};

export const getEvents = async (competitionId: string): Promise<CompetitionEvent[]> => {
  const q = query(collection(db, 'events'), where('competitionId', '==', competitionId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as CompetitionEvent);
};

export const subscribeToEvents = (
  competitionId: string,
  callback: (events: CompetitionEvent[]) => void
): Unsubscribe => {
  const q = query(collection(db, 'events'), where('competitionId', '==', competitionId));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => doc.data() as CompetitionEvent);
    callback(events);
  });
};

export const updateEvent = async (eventId: string, updates: Partial<CompetitionEvent>) => {
  await updateDoc(doc(db, 'events', eventId), updates);
};

export const deleteEvent = async (eventId: string) => {
  await deleteDoc(doc(db, 'events', eventId));
};

// === 학급 관리 ===
export const createClass = async (competitionId: string, classData: ClassTeam) => {
  await setDoc(doc(db, 'classes', classData.id), {
    ...classData,
    competitionId,
    totalScore: 0,
    updatedAt: serverTimestamp()
  });
};

export const updateClass = async (classId: string, updates: Partial<ClassTeam>) => {
  await updateDoc(doc(db, 'classes', classId), {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const deleteClass = async (classId: string) => {
  await deleteDoc(doc(db, 'classes', classId));
};

export const getGradeClasses = async (
  competitionId: string,
  grade: number
): Promise<ClassTeam[]> => {
  const q = query(
    collection(db, 'classes'),
    where('competitionId', '==', competitionId),
    where('grade', '==', grade)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as ClassTeam);
};

export const subscribeToGradeClasses = (
  competitionId: string,
  grade: number,
  callback: (classes: ClassTeam[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, 'classes'),
    where('competitionId', '==', competitionId),
    where('grade', '==', grade)
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
  classId: string,
  results: ClassTeam['results']
) => {
  // 총점 계산
  const totalScore = Object.values(results).reduce((sum, result) => sum + result.score, 0);

  await updateDoc(doc(db, 'classes', classId), {
    results,
    totalScore,
    updatedAt: serverTimestamp()
  });
};

// === 학년 설정 관리 ===
export const updateGradeConfig = async (
  competitionId: string,
  config: GradeConfig
) => {
  const configId = `${competitionId}_${config.grade}`;
  await setDoc(doc(db, 'gradeConfigs', configId), {
    ...config,
    competitionId
  });
};

export const getGradeConfig = async (
  competitionId: string,
  grade: number
): Promise<GradeConfig | null> => {
  const configId = `${competitionId}_${grade}`;
  const snapshot = await getDoc(doc(db, 'gradeConfigs', configId));
  return snapshot.exists() ? snapshot.data() as GradeConfig : null;
};

// === 일괄 작업 ===
export const batchUpdateClasses = async (classes: ClassTeam[]) => {
  const batch = writeBatch(db);

  classes.forEach(cls => {
    const ref = doc(db, 'classes', cls.id);
    batch.set(ref, {
      ...cls,
      updatedAt: serverTimestamp()
    }, { merge: true });
  });

  await batch.commit();
};

export const batchUpdateEvents = async (competitionId: string, events: CompetitionEvent[]) => {
  const batch = writeBatch(db);

  events.forEach(event => {
    const ref = doc(db, 'events', event.id);
    batch.set(ref, {
      ...event,
      competitionId
    }, { merge: true });
  });

  await batch.commit();
};
