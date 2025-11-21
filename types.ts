export type EventType = 'INDIVIDUAL' | 'PAIR' | 'TEAM';

export interface Student {
  id: string;
  name: string;
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
}

export enum ViewMode {
  GRADE = 'GRADE',
  SETTINGS = 'SETTINGS'
}