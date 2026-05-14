export const OPACITY_LEVELS = [100, 70, 50, 30, 10] as const;

export type OpacityLevel = (typeof OPACITY_LEVELS)[number];

export const OPACITY_CLASS_MAP: Record<OpacityLevel, string> = {
  100: 'bg-[#3C7EFA]',
  70: 'bg-[#3C7EFA]/70',
  50: 'bg-[#3C7EFA]/50',
  30: 'bg-[#3C7EFA]/30',
  10: 'bg-[#3C7EFA]/10',
};

// 시안 (Figma 3617:5634 / 3770:6061) 기준: BASE 셀 = #F9FAFB (Tailwind gray-50).
// 모든 셀의 점선 분리는 #E6E8EB (≈ gray-200) 회색, 셀 색과 무관하게 동일 색으로 BASE/selected 양쪽 모두에서 보이도록 한다.
export const BASE_TONE_CLASS = 'bg-gray-50';

export function rankFromOpacity(opacity: OpacityLevel | null): number | null {
  if (opacity === null) return null;
  const idx = OPACITY_LEVELS.indexOf(opacity);
  return idx >= 0 ? idx + 1 : null;
}
