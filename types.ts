export type EventType = 'INDIVIDUAL' | 'TEAM';

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

export interface ClassResult {
  // Common
  score: number; // This is the aggregated score used for ranking

  // For Team Events
  teamParticipantIds?: string[]; // IDs of students who participated
  
  // For Individual Events
  studentScores?: Record<string, number>; // StudentID -> Score mapping
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
}

export enum ViewMode {
  GRADE = 'GRADE',
  SETTINGS = 'SETTINGS'
}