import { CompetitionEvent } from './types';

// 초등학생 줄넘기 급수표 기반 종목
// 참고: 대한줄넘기협회 급수표 (10급 → 1급 → 단급)
export const INITIAL_EVENTS: CompetitionEvent[] = [
  // ===== 개인 종목 (급수표 순서) =====

  // 10급 ~ 7급: 기초 동작
  { id: 'evt_1', name: '양발모아뛰기', type: 'INDIVIDUAL', description: '10급 - 두 발을 모아 뛰기' },
  { id: 'evt_2', name: '번갈아뛰기', type: 'INDIVIDUAL', description: '9급 - 좌우 발을 번갈아 뛰기' },
  { id: 'evt_3', name: '뒤로뛰기', type: 'INDIVIDUAL', description: '8급 - 줄을 뒤로 돌려 뛰기' },
  { id: 'evt_4', name: '한발뛰기', type: 'INDIVIDUAL', description: '7급 - 한 발로 연속 뛰기' },

  // 6급 ~ 4급: 중급 동작
  { id: 'evt_5', name: '십자뛰기', type: 'INDIVIDUAL', description: '6급 - 발을 십자로 교차하며 뛰기' },
  { id: 'evt_6', name: '가위바위보뛰기', type: 'INDIVIDUAL', description: '5급 - 발 모양을 가위바위보로 바꾸며 뛰기' },
  { id: 'evt_7', name: '엇갈려뛰기', type: 'INDIVIDUAL', description: '4급 - 팔을 엇갈려 X자로 뛰기' },

  // 3급 ~ 1급: 고급 동작
  { id: 'evt_8', name: '좌우흔들어뛰기', type: 'INDIVIDUAL', description: '3급 - 줄을 좌우로 흔들며 뛰기' },
  { id: 'evt_9', name: '이중뛰기', type: 'INDIVIDUAL', description: '2급 - 한 번 점프에 줄을 두 번 돌리기' },
  { id: 'evt_10', name: '엇갈려이중뛰기', type: 'INDIVIDUAL', description: '1급 - 엇갈려뛰기 + 이중뛰기 결합' },

  // ===== 짝 종목 =====
  { id: 'evt_11', name: '마주보고 짝줄넘기', type: 'PAIR', description: '2명이 마주보고 함께 뛰기' },
  { id: 'evt_12', name: '나란히 짝줄넘기', type: 'PAIR', description: '2명이 나란히 함께 뛰기' },

  // ===== 단체 종목 =====
  { id: 'evt_13', name: '긴줄넘기', type: 'TEAM', description: '긴 줄을 돌려 여러 명이 함께 뛰기' },
  { id: 'evt_14', name: '8자 줄넘기', type: 'TEAM', description: '8자 모양으로 줄을 통과하며 뛰기' },
  { id: 'evt_15', name: '더블더치', type: 'TEAM', description: '두 줄을 교차로 돌려 뛰기' }
];
