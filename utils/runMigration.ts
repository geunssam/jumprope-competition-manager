/**
 * 브라우저 콘솔에서 실행하는 마이그레이션 함수
 *
 * 사용법:
 * 1. 브라우저에서 앱에 로그인
 * 2. 개발자 도구 콘솔 열기
 * 3. runMigration() 실행
 */

import { db } from '../lib/firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  where
} from 'firebase/firestore';

export async function runMigration() {
  console.log('🚀 데이터 마이그레이션 시작...\n');

  try {
    // 1. competitions 컬렉션에서 모든 대회 가져오기
    console.log('📋 Step 1: 대회 목록 조회 중...');
    const competitionsSnap = await getDocs(collection(db, 'competitions'));

    if (competitionsSnap.empty) {
      console.log('⚠️  대회가 없습니다. 마이그레이션을 종료합니다.');
      return;
    }

    console.log(`✅ ${competitionsSnap.size}개의 대회를 찾았습니다.\n`);

    // 대회별로 처리
    for (const compDoc of competitionsSnap.docs) {
      const compId = compDoc.id;
      const compData = compDoc.data();
      const userId = compData.createdBy;

      console.log(`\n📦 대회 처리 중: ${compId}`);
      console.log(`👤 사용자 ID: ${userId}`);

      if (!userId) {
        console.log('⚠️  createdBy 필드가 없습니다. 건너뜁니다.');
        continue;
      }

      // 2. Events 마이그레이션
      console.log('\n  🎯 종목(Events) 마이그레이션 중...');
      const eventsQuery = query(
        collection(db, 'events'),
        where('competitionId', '==', compId)
      );
      const eventsSnap = await getDocs(eventsQuery);

      let eventCount = 0;
      for (const eventDoc of eventsSnap.docs) {
        const eventData = eventDoc.data();
        const newEventRef = doc(db, 'users', userId, 'events', eventDoc.id);
        await setDoc(newEventRef, eventData);
        eventCount++;
        console.log(`    ✓ 종목 복사: ${eventDoc.id}`);
      }
      console.log(`  ✅ ${eventCount}개의 종목을 마이그레이션했습니다.`);

      // 3. Classes 마이그레이션
      console.log('\n  🏫 학급(Classes) 마이그레이션 중...');
      const classesQuery = query(
        collection(db, 'classes'),
        where('competitionId', '==', compId)
      );
      const classesSnap = await getDocs(classesQuery);

      let classCount = 0;
      for (const classDoc of classesSnap.docs) {
        const classData = classDoc.data();
        const newClassRef = doc(db, 'users', userId, 'classes', classDoc.id);
        await setDoc(newClassRef, classData);
        classCount++;
        console.log(`    ✓ 학급 복사: ${classDoc.id}`);
      }
      console.log(`  ✅ ${classCount}개의 학급을 마이그레이션했습니다.`);

      // 4. GradeConfigs 마이그레이션
      console.log('\n  ⚙️  학년 설정(GradeConfigs) 마이그레이션 중...');
      const gradeConfigsSnap = await getDocs(collection(db, 'gradeConfigs'));

      let configCount = 0;
      for (const configDoc of gradeConfigsSnap.docs) {
        const configData = configDoc.data();
        // configId가 {competitionId}_{grade} 형식인지 확인
        if (configDoc.id.startsWith(compId)) {
          const newConfigRef = doc(db, 'users', userId, 'gradeConfigs', configDoc.id);
          await setDoc(newConfigRef, configData);
          configCount++;
          console.log(`    ✓ 설정 복사: ${configDoc.id}`);
        }
      }
      console.log(`  ✅ ${configCount}개의 학년 설정을 마이그레이션했습니다.`);

      console.log(`\n✨ 대회 ${compId} 마이그레이션 완료!`);
      console.log(`   - 종목: ${eventCount}개`);
      console.log(`   - 학급: ${classCount}개`);
      console.log(`   - 설정: ${configCount}개`);
    }

    console.log('\n\n🎉 모든 데이터 마이그레이션이 완료되었습니다!');
    console.log('\n⚠️  다음 단계:');
    console.log('1. 브라우저를 새로고침하여 데이터가 잘 표시되는지 확인');
    console.log('2. 모든 기능이 정상 작동하는지 테스트');
    console.log('3. 문제가 없다면 기존 컬렉션(/events, /classes, /gradeConfigs) 삭제 가능');

    return { success: true };

  } catch (error) {
    console.error('\n❌ 마이그레이션 중 오류 발생:', error);
    throw error;
  }
}

// 전역 스코프에 함수 노출 (브라우저 콘솔에서 접근 가능)
if (typeof window !== 'undefined') {
  (window as any).runMigration = runMigration;
  console.log('✅ runMigration() 함수가 준비되었습니다.');
  console.log('💡 브라우저 콘솔에서 runMigration()을 실행하세요.');
}
