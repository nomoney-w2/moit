export const OPACITY_LEVELS = [100, 70, 50, 30, 10] as const;

export type OpacityLevel = (typeof OPACITY_LEVELS)[number];

export const OPACITY_CLASS_MAP: Record<OpacityLevel, string> = {
  100: 'bg-[#3C7EFA]',
  70: 'bg-[#3C7EFA]/70',
  50: 'bg-[#3C7EFA]/50',
  30: 'bg-[#3C7EFA]/30',
  10: 'bg-[#3C7EFA]/10',
};

export const BASE_TONE_CLASS = 'bg-[#3C7EFA]/[0.04]';

export function rankFromOpacity(opacity: OpacityLevel | null): number | null {
  if (opacity === null) return null;
  const idx = OPACITY_LEVELS.indexOf(opacity);
  return idx >= 0 ? idx + 1 : null;
}
