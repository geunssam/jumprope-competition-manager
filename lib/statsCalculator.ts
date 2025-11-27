import { PracticeRecord, StudentRecord, RecordMode } from '../types';

export interface StudentStats {
  totalRecords: number;
  averageScore: number;
  personalBest: number;
  recentScore: number;
  recentAverage: number; // 최근 5회 평균
  improvementRate: number; // 향상률 (%)
}

/**
 * 학생의 전체 통계 계산
 */
export const calculateStudentStats = (records: PracticeRecord[]): StudentStats => {
  if (records.length === 0) {
    return {
      totalRecords: 0,
      averageScore: 0,
      personalBest: 0,
      recentScore: 0,
      recentAverage: 0,
      improvementRate: 0
    };
  }

  // 날짜순 정렬 (최신순)
  const sortedRecords = [...records].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.sessionNumber - a.sessionNumber;
  });

  const scores = records.map(r => r.score);
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const averageScore = totalScore / scores.length;
  const personalBest = Math.max(...scores);
  const recentScore = sortedRecords[0]?.score || 0;

  // 최근 5회 평균 계산
  const recentScores = sortedRecords.slice(0, 5).map(r => r.score);
  const recentAverage = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;

  // 향상률 계산: 최근 5회 평균 vs 전체 평균
  const improvementRate = averageScore > 0
    ? ((recentAverage - averageScore) / averageScore) * 100
    : 0;

  return {
    totalRecords: records.length,
    averageScore: Math.round(averageScore * 10) / 10,
    personalBest,
    recentScore,
    recentAverage: Math.round(recentAverage * 10) / 10,
    improvementRate: Math.round(improvementRate * 10) / 10
  };
};

/**
 * 종목별 통계 계산
 */
export const calculateEventStats = (
  allRecords: PracticeRecord[],
  eventId: string
): StudentStats => {
  const eventRecords = allRecords.filter(r => r.eventId === eventId);
  return calculateStudentStats(eventRecords);
};

/**
 * 차트용 데이터 포맷 (날짜별 점수)
 */
export interface ChartDataPoint {
  date: string;
  score: number;
  sessionNumber: number;
  label: string; // "2025-01-20 (2회차)"
}

export const formatChartData = (records: PracticeRecord[]): ChartDataPoint[] => {
  // 날짜순 정렬 (오래된순)
  const sortedRecords = [...records].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.sessionNumber - b.sessionNumber;
  });

  return sortedRecords.map(record => ({
    date: record.date,
    score: record.score,
    sessionNumber: record.sessionNumber,
    label: `${record.date.slice(5)} (${record.sessionNumber}회차)`
  }));
};

/**
 * 학급 내 순위 계산
 */
export interface RankingData {
  studentId: string;
  studentName: string;
  score: number;
  rank: number;
}

export const calculateRanking = (
  studentsData: Array<{ studentId: string; studentName: string; bestScore: number }>
): RankingData[] => {
  // 점수순 정렬 (높은 순)
  const sorted = [...studentsData].sort((a, b) => b.bestScore - a.bestScore);

  let currentRank = 1;
  let previousScore = -1;
  let sameRankCount = 0;

  return sorted.map((student, index) => {
    if (student.bestScore !== previousScore) {
      currentRank = index + 1;
      sameRankCount = 0;
    } else {
      sameRankCount++;
    }

    previousScore = student.bestScore;

    return {
      studentId: student.studentId,
      studentName: student.studentName,
      score: student.bestScore,
      rank: currentRank
    };
  });
};

/**
 * 성장 인사이트 메시지 생성
 */
export const generateInsights = (stats: StudentStats): string[] => {
  const insights: string[] = [];

  // 1. 최고 기록 달성
  if (stats.recentScore === stats.personalBest) {
    insights.push(`🎉 최근 연습에서 개인 최고 기록 ${stats.personalBest}회를 달성했습니다!`);
  }

  // 2. 향상률 메시지
  if (stats.improvementRate > 10) {
    insights.push(`📈 최근 5회 평균이 전체 평균보다 ${stats.improvementRate}% 향상되었습니다!`);
  } else if (stats.improvementRate < -10) {
    insights.push(`💪 최근 기록이 다소 낮아졌어요. 꾸준히 연습하면 다시 올라갈 수 있습니다!`);
  } else {
    insights.push(`✨ 안정적으로 실력을 유지하고 있습니다!`);
  }

  // 3. 연습 횟수 메시지
  if (stats.totalRecords >= 20) {
    insights.push(`🏆 총 ${stats.totalRecords}회 연습 기록! 꾸준함이 빛나고 있습니다!`);
  } else if (stats.totalRecords >= 10) {
    insights.push(`👏 ${stats.totalRecords}회 연습 완료! 계속 이 페이스로 가볼까요?`);
  }

  // 4. 다음 목표 제안
  const nextGoal = Math.ceil(stats.personalBest * 1.1); // 10% 향상 목표
  insights.push(`🎯 다음 목표: ${nextGoal}회 도전해보세요!`);

  return insights;
};

// ========================================
// 🆕 StudentRecord 기반 통계 함수 (Phase 2)
// ========================================

/**
 * 학생 성장 통계 인터페이스
 */
export interface GrowthStats {
  totalRecords: number;
  practiceCount: number;
  competitionCount: number;
  bestScore: number;
  bestPracticeScore: number;
  bestCompetitionScore: number;
  averageScore: number;
  recentTrend: 'up' | 'down' | 'stable';
  growthRate: number; // 최근 5회 vs 이전 5회 비교 (%)
}

/**
 * StudentRecord 배열에서 성장 통계 계산
 */
export function calculateGrowthStats(records: StudentRecord[]): GrowthStats {
  if (records.length === 0) {
    return {
      totalRecords: 0,
      practiceCount: 0,
      competitionCount: 0,
      bestScore: 0,
      bestPracticeScore: 0,
      bestCompetitionScore: 0,
      averageScore: 0,
      recentTrend: 'stable',
      growthRate: 0,
    };
  }

  // 날짜순 정렬 (최신순)
  const sortedRecords = [...records].sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  const practiceRecords = records.filter((r) => r.mode === 'practice');
  const competitionRecords = records.filter((r) => r.mode === 'competition');

  const scores = records.map((r) => r.score);
  const practiceScores = practiceRecords.map((r) => r.score);
  const competitionScores = competitionRecords.map((r) => r.score);

  const totalScore = scores.reduce((sum, s) => sum + s, 0);
  const averageScore = totalScore / scores.length;

  // 성장률 계산: 최근 5회 vs 이전 5회
  const recent5 = sortedRecords.slice(0, 5);
  const previous5 = sortedRecords.slice(5, 10);

  let growthRate = 0;
  let recentTrend: 'up' | 'down' | 'stable' = 'stable';

  if (recent5.length > 0 && previous5.length > 0) {
    const recentAvg =
      recent5.reduce((sum, r) => sum + r.score, 0) / recent5.length;
    const previousAvg =
      previous5.reduce((sum, r) => sum + r.score, 0) / previous5.length;

    if (previousAvg > 0) {
      growthRate = ((recentAvg - previousAvg) / previousAvg) * 100;
    }

    if (growthRate > 5) {
      recentTrend = 'up';
    } else if (growthRate < -5) {
      recentTrend = 'down';
    }
  }

  return {
    totalRecords: records.length,
    practiceCount: practiceRecords.length,
    competitionCount: competitionRecords.length,
    bestScore: scores.length > 0 ? Math.max(...scores) : 0,
    bestPracticeScore: practiceScores.length > 0 ? Math.max(...practiceScores) : 0,
    bestCompetitionScore: competitionScores.length > 0 ? Math.max(...competitionScores) : 0,
    averageScore: Math.round(averageScore * 10) / 10,
    recentTrend,
    growthRate: Math.round(growthRate * 10) / 10,
  };
}

/**
 * 종목별 기록 필터링
 */
export function getRecordsByEvent(
  records: StudentRecord[],
  eventId: string
): StudentRecord[] {
  return records.filter((r) => r.eventId === eventId);
}

/**
 * 모드별 기록 필터링
 */
export function getRecordsByMode(
  records: StudentRecord[],
  mode: RecordMode
): StudentRecord[] {
  return records.filter((r) => r.mode === mode);
}

/**
 * 날짜 범위별 기록 필터링
 */
export function getRecordsByDateRange(
  records: StudentRecord[],
  startDate: string,
  endDate: string
): StudentRecord[] {
  return records.filter(
    (r) => r.date >= startDate && r.date <= endDate
  );
}

/**
 * 성장 차트용 데이터 포맷 (StudentRecord)
 */
export interface GrowthChartDataPoint {
  date: string;
  score: number;
  mode: RecordMode;
  eventName: string;
  label: string;
}

export function formatGrowthChartData(
  records: StudentRecord[]
): GrowthChartDataPoint[] {
  // 날짜순 정렬 (오래된순)
  const sortedRecords = [...records].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return sortedRecords.map((record) => ({
    date: record.date,
    score: record.score,
    mode: record.mode,
    eventName: record.eventName,
    label: `${record.date.slice(5)} (${record.mode === 'competition' ? '대회' : '연습'})`,
  }));
}

/**
 * 종목별 최고 기록 요약
 */
export interface EventBestRecord {
  eventId: string;
  eventName: string;
  bestPracticeScore: number;
  bestCompetitionScore: number;
  totalRecords: number;
  lastRecordDate: string;
}

export function getEventBestRecords(
  records: StudentRecord[]
): EventBestRecord[] {
  const eventMap = new Map<string, StudentRecord[]>();

  // 종목별로 그룹화
  records.forEach((record) => {
    const existing = eventMap.get(record.eventId) || [];
    existing.push(record);
    eventMap.set(record.eventId, existing);
  });

  // 각 종목별 최고 기록 계산
  const results: EventBestRecord[] = [];

  eventMap.forEach((eventRecords, eventId) => {
    const practiceRecords = eventRecords.filter((r) => r.mode === 'practice');
    const competitionRecords = eventRecords.filter((r) => r.mode === 'competition');

    const sortedByDate = [...eventRecords].sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    results.push({
      eventId,
      eventName: eventRecords[0]?.eventName || '',
      bestPracticeScore:
        practiceRecords.length > 0
          ? Math.max(...practiceRecords.map((r) => r.score))
          : 0,
      bestCompetitionScore:
        competitionRecords.length > 0
          ? Math.max(...competitionRecords.map((r) => r.score))
          : 0,
      totalRecords: eventRecords.length,
      lastRecordDate: sortedByDate[0]?.date || '',
    });
  });

  return results;
}
