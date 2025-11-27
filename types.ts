export type EventType = 'INDIVIDUAL' | 'PAIR' | 'TEAM';

export interface Student {
  id: string;
  name: string;
  number?: number; // 학생 번호
  accessCode: string; // 🆕 학생 식별용 4자리 코드 (예: "AB3K")
  // 연습 기록 관련
  personalBests?: Record<string, {
    score: number;
    date: string; // YYYY-MM-DD
    recordId: string;
  }>;
  totalPracticeCount?: number; // 총 연습 횟수
  lastPracticeDate?: string; // 마지막 연습 날짜 (YYYY-MM-DD)
}

export interface CompetitionEvent {
  id: string;
  name: string;
  type: EventType;
  defaultTimeLimit: number; // 0 for no limit
  defaultMaxParticipants: number; // 0 for unlimited
  description?: string;
}

export interface Team {
  id: string;           // team_${timestamp}
  classId: string;      // Which class this team belongs to
  eventId: string;      // Which event they're competing in
  name: string;         // e.g., "1반 A팀"
  memberIds: string[];  // Student IDs (duplicates allowed across teams)
  score: number;        // Team score
}

export interface ClassResult {
  // Common
  score: number; // This is the aggregated score used for ranking
  date?: string; // YYYY-MM-DD 경기 날짜

  // For INDIVIDUAL Events
  participantIds?: string[];  // Array of student IDs who are participating
  studentScores?: Record<string, number>; // StudentID -> Score mapping

  // For PAIR/TEAM Events
  teams?: Team[];       // Array of teams (max 5 per class per event)

  // DEPRECATED: For backwards compatibility only
  teamParticipantIds?: string[]; // Will be migrated to teams array
}

export interface ClassTeam {
  id: string;
  grade: number;
  name: string;
  students: Student[];
  // Map of Event ID to Result
  results: Record<string, ClassResult>;
}

export interface GradeConfig {
  grade: number;
  // Map of Event ID to specific config for this grade (e.g., participant limit override)
  events: Record<string, {
    selected: boolean;
    targetParticipants: number; // e.g., 6 people for Figure 8
  }>;
  // Custom events created by copying (only visible in this grade)
  customEvents?: CompetitionEvent[];

  // 날짜별 종목 선택 (신규 필드)
  dateEvents?: Record<string, Record<string, {
    selected: boolean;
    targetParticipants: number;
  }>>;

  // 날짜별 커스텀 종목 (복사된 종목들)
  customEventsByDate?: Record<string, CompetitionEvent[]>;
}

export enum ViewMode {
  GRADE = 'GRADE',
  SETTINGS = 'SETTINGS'
}

// 기록 모드 타입
export type RecordMode = 'competition' | 'practice';

// 🆕 학생 중심 기록 인터페이스 (records 컬렉션용)
export interface StudentRecord {
  id: string;
  studentId: string;
  studentName: string;
  accessCode: string; // 학생 식별용 코드
  classId: string;
  className: string;
  grade: number;
  eventId: string;
  eventName: string;
  score: number;
  date: string; // YYYY-MM-DD
  mode: RecordMode;
  // 단체전 전용
  teamId?: string;
  teamMembers?: string[];
  teamScore?: number;
  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
}

// 🆕 게임 세션 인터페이스 (향후 사용)
export interface Game {
  id: string;
  date: string; // YYYY-MM-DD
  mode: RecordMode;
  grade: number;
  eventIds: string[];
  status: 'in_progress' | 'completed';
  competitionId: string;
  createdAt: Date;
}

// 연습 기록 인터페이스 (기존 - 호환성 유지)
export interface PracticeRecord {
  id: string;
  studentId: string;
  eventId: string; // 종목 ID
  score: number; // 기록 (횟수)
  date: string; // YYYY-MM-DD
  sessionNumber: number; // 그날의 몇 번째 연습인지 (1, 2, 3...)
  mode: RecordMode;
  createdAt: Date;
  notes?: string; // 메모 (선택)
}

// 교사 설정 인터페이스
export interface TeacherSettings {
  teacherId: string; // Firebase user ID
  selectedGrades: number[]; // 선택한 학년 (예: [3, 4])
  competitionId: string;
  updatedAt?: Date;
}

// 학급 통계 인터페이스
export interface ClassStats {
  gradeId: string; // grade_1, grade_2, etc.
  eventId: string;
  averageScore: number; // 평균 기록
  topScore: number; // 최고 기록
  totalRecords: number; // 총 기록 수
  participationRate: number; // 참여율 (%)
  lastUpdated: Date;
}