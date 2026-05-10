/**
 * 모임장 이름 영구 저장소 (localStorage)
 *
 * - 저장 시점: "날짜 선택하기" CTA 성공 시점에만 (FR-005)
 * - 수명: 만료 없이 영구 (FR-012)
 * - 실패 시: 조용히 무시하여 사용자 플로우 유지 (FR-011)
 */

export const LAST_HOST_NAME_KEY = 'last_host_name';

const HOST_NAME_REGEX = /^[ㄱ-힣a-zA-Z]+$/;
const MAX_HOST_NAME_LENGTH = 10;

export function readLastHostName(): string {
  if (typeof window === 'undefined') return '';

  try {
    const raw = window.localStorage.getItem(LAST_HOST_NAME_KEY);
    if (!raw) return '';

    const trimmed = raw.trim();
    if (!trimmed) return '';

    const sliced =
      trimmed.length > MAX_HOST_NAME_LENGTH
        ? trimmed.slice(0, MAX_HOST_NAME_LENGTH)
        : trimmed;

    if (!HOST_NAME_REGEX.test(sliced)) return '';

    return sliced;
  } catch {
    return '';
  }
}

export function writeLastHostName(value: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(LAST_HOST_NAME_KEY, value.trim());
  } catch (error) {
    console.warn('[hostNameStorage] Failed to persist last host name', error);
  }
}
