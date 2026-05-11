import type { KeyboardEvent, RefObject } from 'react';

export function handleKeyboardNav(
  e: KeyboardEvent<HTMLInputElement>,
  nextRef?: RefObject<HTMLInputElement | null>,
) {
  if (e.key !== 'Enter') return;
  if (nextRef?.current) {
    nextRef.current.focus();
  } else {
    (e.currentTarget as HTMLInputElement).blur();
  }
}
