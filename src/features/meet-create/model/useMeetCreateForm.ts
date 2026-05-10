'use client';

import { useState } from 'react';

import { readLastHostName } from '@/features/meet-create/lib/hostNameStorage';

// 랜덤 모임명 플레이스홀더 목록
const MEETING_NAME_PLACEHOLDERS = [
  '멋쟁이들 모임',
  '우리들의 약속',
  '즐거운 만남',
  '행복한 하루',
  '설레는 모임',
];

const getRandomPlaceholder = () => {
  const randomIndex = Math.floor(
    Math.random() * MEETING_NAME_PLACEHOLDERS.length,
  );
  return MEETING_NAME_PLACEHOLDERS[randomIndex];
};

// 모임명 허용 문자: 한글, 영문(대소문자), 숫자
const MEETING_NAME_REGEX = /^[ㄱ-힣a-zA-Z0-9]*$/;

export function useMeetCreateForm(
  initialHostName = '',
  initialMeetingName = '',
) {
  // 초기값 우선순위: URL searchParams > localStorage > '' (AD-6)
  // SSR에서는 readLastHostName이 항상 '' 반환 → hydration mismatch 없음
  const [hostName, setHostName] = useState(
    () => initialHostName || readLastHostName(),
  );
  const [meetingName, setMeetingName] = useState(initialMeetingName);
  const [hostNameError, setHostNameError] = useState('');
  const [meetingNameError, setMeetingNameError] = useState('');

  // useState의 lazy initializer로 마운트 시 한 번만 랜덤값 생성
  // SSR/CSR 불일치는 Input의 suppressHydrationWarning으로 처리
  const [meetingNamePlaceholder] = useState(getRandomPlaceholder);

  const validateHostName = (value: string) => {
    // 한글, 영문(대소문자)만 허용하는 정규식
    const koreanEnglishOnly = /^[ㄱ-힣a-zA-Z]*$/;

    if (value && !koreanEnglishOnly.test(value)) {
      setHostNameError('한글, 영문만 입력 가능해요');
    } else {
      setHostNameError('');
    }
  };

  const handleHostNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setHostName(newValue);
    validateHostName(newValue);
  };

  const handleHostNameClear = () => {
    // Clear는 로컬 저장값을 변경하지 않는다 — 저장은 CTA 성공 시에만 (FR-006, FR-008)
    setHostName('');
    setHostNameError('');
  };

  const handleMeetingNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setMeetingName(newValue);

    if (newValue && !MEETING_NAME_REGEX.test(newValue)) {
      setMeetingNameError('한글, 영문, 숫자만 입력 가능해요');
    } else {
      setMeetingNameError('');
    }
  };

  const handleMeetingNameClear = () => {
    setMeetingName('');
    setMeetingNameError('');
  };

  const isValid = hostName.trim() !== '' && !hostNameError && !meetingNameError;

  return {
    hostName,
    meetingName,
    meetingNamePlaceholder,
    hostNameError,
    meetingNameError,
    isValid,
    handleHostNameChange,
    handleHostNameClear,
    handleMeetingNameChange,
    handleMeetingNameClear,
  };
}
