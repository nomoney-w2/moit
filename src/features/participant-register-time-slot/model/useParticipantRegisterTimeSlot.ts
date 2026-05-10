'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getMeetingById } from '@/entities/meet/api/getMeetingById';
import { voteMeeting } from '@/entities/meet/api/voteMeeting';
import {
  type MeetResponse,
  type TimeRangeWithSlotCount,
} from '@/entities/meet/dto/meet.dto';
import { selectionToMatrix } from '@/features/participant-register-time-slot/lib/timeSlotMatrix';
import { useTimeSlotSelection } from '@/features/participant-register-time-slot/model/useTimeSlotSelection';
import { useDisclosure } from '@/shared/hooks/useDisclosure';

interface UseParticipantRegisterTimeSlotResult {
  isLoading: boolean;
  meetingTitle: string;
  dates: string[];
  timeRange: TimeRangeWithSlotCount | null;
  isAllImpossible: boolean;
  isSubmitting: boolean;
  isCtaActive: boolean;
  isSelected: (dateIndex: number, slotIndex: number) => boolean;
  beginDrag: (dateIndex: number, slotIndex: number) => void;
  updateDrag: (dateIndex: number, slotIndex: number) => void;
  endDrag: () => void;
  handleAllImpossibleChange: (checked: boolean) => void;
  handleBack: () => void;
  handleSubmit: () => Promise<void>;
  isSuccessModalOpen: boolean;
  handleSuccessModalClose: () => void;
}

export function useParticipantRegisterTimeSlot(
  meetingId: string,
): UseParticipantRegisterTimeSlotResult {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nameFromQuery = searchParams.get('name');
  const STORE_KEY = `last_participant_name_${meetingId}`;

  const [participantName, setParticipantName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [meetingData, setMeetingData] = useState<MeetResponse | null>(null);
  const [isAllImpossible, setIsAllImpossible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { selected, isSelected, beginDrag, updateDrag, endDrag, reset } =
    useTimeSlotSelection();

  const successModal = useDisclosure();

  useEffect(() => {
    let currentName = nameFromQuery;
    if (!currentName && typeof window !== 'undefined') {
      currentName = localStorage.getItem(STORE_KEY);
    }
    if (!currentName) {
      router.replace(`/meet/${meetingId}/register`);
      return;
    }
    setParticipantName(currentName);

    const fetchData = async () => {
      try {
        const data = await getMeetingById(meetingId);
        setMeetingData(data);
      } catch (error) {
        console.error('Failed to fetch meeting data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [meetingId, nameFromQuery, router, STORE_KEY]);

  const handleAllImpossibleChange = (checked: boolean) => {
    setIsAllImpossible(checked);
    if (checked) reset();
  };

  const handleBack = () => {
    const params = new URLSearchParams();
    if (participantName) params.set('name', participantName);
    router.replace(`/meet/${meetingId}/register?${params.toString()}`);
  };

  const handleSuccessModalClose = () => {
    successModal.close();
    router.replace(`/meet/${meetingId}`);
  };

  // 서버 응답의 dates 순서를 그대로 사용 (정렬된 채로 응답된다는 컨벤션).
  // 정렬을 클라이언트에서 추가로 적용하면 voteTimeSlots row 와 dates 인덱스 매핑이
  // 서버 기대값과 어긋나 잘못된 셀에 저장될 수 있음.
  const dates = meetingData?.dates ?? [];
  const timeRange = meetingData?.timeRange ?? null;

  const handleSubmit = async () => {
    if (isSubmitting || !meetingData) return;
    if (!timeRange) return;

    try {
      setIsSubmitting(true);

      const voteTimeSlots = isAllImpossible
        ? dates.map(() => Array(timeRange.slotCount).fill(false))
        : selectionToMatrix(selected, dates.length, timeRange.slotCount);

      // 시간 모임에서도 voteDates 는 함께 보낸다 (선택된 시각이 있는 날짜들).
      const voteDates = isAllImpossible
        ? []
        : dates.filter((_, dateIndex) =>
            voteTimeSlots[dateIndex].some((v) => v),
          );

      await voteMeeting({
        meetingId,
        name: participantName,
        voteDates,
        voteTimeSlots,
      });

      successModal.open();
    } catch (error) {
      console.error('Failed to create vote:', error);
      alert('투표 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCtaActive = isAllImpossible || selected.size > 0;

  return {
    isLoading,
    meetingTitle: meetingData?.title ?? '',
    dates,
    timeRange,
    isAllImpossible,
    isSubmitting,
    isCtaActive,
    isSelected,
    beginDrag: (d, s) => {
      if (isAllImpossible) setIsAllImpossible(false);
      beginDrag(d, s);
    },
    updateDrag,
    endDrag,
    handleAllImpossibleChange,
    handleBack,
    handleSubmit,
    isSuccessModalOpen: successModal.isOpen,
    handleSuccessModalClose,
  };
}
