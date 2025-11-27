/**
 * 학생 식별용 접근 코드 생성 유틸리티
 * 4자리 영문+숫자 코드 (혼동하기 쉬운 문자 제외)
 */

// 혼동하기 쉬운 문자 제외: 0, O, I, l, 1
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * 4자리 랜덤 접근 코드 생성
 * @returns 4자리 접근 코드 (예: "AB3K", "XY7P")
 */
export function generateAccessCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

/**
 * 접근 코드 유효성 검사
 * @param code - 검사할 코드
 * @returns 유효 여부
 */
export function isValidAccessCode(code: string): boolean {
  return /^[A-HJ-NP-Z2-9]{4}$/.test(code);
}

/**
 * 중복 없는 접근 코드 생성
 * @param existingCodes - 기존에 사용 중인 코드 목록
 * @param maxRetries - 최대 재시도 횟수 (기본: 100)
 * @returns 고유한 접근 코드
 */
export function generateUniqueAccessCode(
  existingCodes: string[],
  maxRetries: number = 100
): string {
  const existingSet = new Set(existingCodes);

  for (let i = 0; i < maxRetries; i++) {
    const code = generateAccessCode();
    if (!existingSet.has(code)) {
      return code;
    }
  }

  // 만약 모든 시도 실패 시 (매우 드문 경우) 타임스탬프 기반 코드 생성
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  return timestamp.padStart(4, 'A');
}

/**
 * 접근 코드 포맷팅 (대문자 변환)
 * @param code - 입력 코드
 * @returns 대문자로 변환된 코드
 */
export function formatAccessCode(code: string): string {
  return code.toUpperCase().trim();
}
