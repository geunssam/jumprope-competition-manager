import { CompetitionEvent } from './types';

export const INITIAL_EVENTS: CompetitionEvent[] = [
  // 개인 종목 (8개)
  {
    id: 'evt_1',
    name: '번갈아뛰기',
    type: 'INDIVIDUAL',
    defaultTimeLimit: 30,
    defaultMaxParticipants: 0,
    description: '30초 동안 번갈아뛰기 (전원 참가)'
  },
  {
    id: 'evt_2',
    name: '한발뛰기',
    type: 'INDIVIDUAL',
    defaultTimeLimit: 30,
    defaultMaxParticipants: 0,
    description: '30초 동안 한발뛰기 (전원 참가)'
  },
  {
    id: 'evt_3',
    name: '가위바위보',
    type: 'INDIVIDUAL',
    defaultTimeLimit: 30,
    defaultMaxParticipants: 0,
    description: '30초 동안 가위바위보 (전원 참가)'
  },
  {
    id: 'evt_4',
    name: '앞뒤흔들어뛰기',
    type: 'INDIVIDUAL',
    defaultTimeLimit: 30,
    defaultMaxParticipants: 0,
    description: '30초 동안 앞뒤흔들어뛰기 (전원 참가)'
  },
  {
    id: 'evt_5',
    name: '겹뛰기',
    type: 'INDIVIDUAL',
    defaultTimeLimit: 30,
    defaultMaxParticipants: 0,
    description: '30초 동안 겹뛰기 (전원 참가)'
  },
  {
    id: 'evt_6',
    name: '엇갈려뛰기',
    type: 'INDIVIDUAL',
    defaultTimeLimit: 30,
    defaultMaxParticipants: 0,
    description: '30초 동안 엇갈려뛰기 (전원 참가)'
  },
  {
    id: 'evt_7',
    name: '2단뛰기',
    type: 'INDIVIDUAL',
    defaultTimeLimit: 30,
    defaultMaxParticipants: 0,
    description: '30초 동안 2단뛰기 (전원 참가)'
  },
  {
    id: 'evt_8',
    name: '엉덩이치기',
    type: 'INDIVIDUAL',
    defaultTimeLimit: 30,
    defaultMaxParticipants: 0,
    description: '30초 동안 엉덩이치기 (전원 참가)'
  },

  // 짝 종목 (3개)
  {
    id: 'evt_9',
    name: '번갈아 짝줄넘기',
    type: 'TEAM',
    defaultTimeLimit: 30,
    defaultMaxParticipants: 2,
    description: '30초 동안 번갈아 짝줄넘기 (2명 1조)'
  },
  {
    id: 'evt_10',
    name: '함께 짝줄넘기',
    type: 'TEAM',
    defaultTimeLimit: 30,
    defaultMaxParticipants: 2,
    description: '30초 동안 함께 짝줄넘기 (2명 1조)'
  },
  {
    id: 'evt_11',
    name: '마주보고 짝줄넘기',
    type: 'TEAM',
    defaultTimeLimit: 30,
    defaultMaxParticipants: 2,
    description: '30초 동안 마주보고 짝줄넘기 (2명 1조)'
  },

  // 단체 종목 (5개)
  {
    id: 'evt_12',
    name: '긴줄넘기',
    type: 'TEAM',
    defaultTimeLimit: 60,
    defaultMaxParticipants: 0,
    description: '60초 동안 긴줄넘기 (전원 참가)'
  },
  {
    id: 'evt_13',
    name: '8자 줄넘기',
    type: 'TEAM',
    defaultTimeLimit: 60,
    defaultMaxParticipants: 0,
    description: '60초 동안 8자 줄넘기 (전원 참가)'
  },
  {
    id: 'evt_14',
    name: '8자마라톤',
    type: 'TEAM',
    defaultTimeLimit: 90,
    defaultMaxParticipants: 0,
    description: '90초 동안 8자마라톤 (전원 참가)'
  },
  {
    id: 'evt_15',
    name: '단체 줄넘기',
    type: 'TEAM',
    defaultTimeLimit: 60,
    defaultMaxParticipants: 0,
    description: '60초 동안 단체 줄넘기 (전원 참가)'
  },
  {
    id: 'evt_16',
    name: '허들 줄넘기',
    type: 'TEAM',
    defaultTimeLimit: 60,
    defaultMaxParticipants: 0,
    description: '60초 동안 허들 줄넘기 (전원 참가)'
  }
];
