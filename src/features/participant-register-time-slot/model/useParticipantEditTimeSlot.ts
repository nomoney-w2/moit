'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getMeetingById } from '@/entities/meet/api/getMeetingById';
import { updateVote } from '@/entities/meet/api/updateVote';
import {
  type MeetResponse,
  type TimeRangeWithSlotCount,
} from '@/entities/meet/dto/meet.dto';
import {
  matrixToSelection,
  selectionToMatrix,
} from '@/features/participant-register-time-slot/lib/timeSlotMatrix';
import { useTimeSlotSelection } from '@/features/participant-register-time-slot/model/useTimeSlotSelection';
import { useDisclosure } from '@/shared/hooks/useDisclosure';

interface UseParticipantEditTimeSlotResult {
  isLoading: boolean;
  meetingTitle: string;
  dates: string[];
  timeRange: TimeRangeWithSlotCount | null;
  isAllImpossible: boolean;
  isSubmitting: boolean;
  isCtaActive: boolean;
  isSelected: (dateIndex: number, slotIndex: number) => boolean;
  onCellTap: (dateIndex: number, slotIndex: number) => void;
  handleAllImpossibleChange: (checked: boolean) => void;
  handleBack: () => void;
  handleSubmit: () => Promise<void>;
  isSuccessModalOpen: boolean;
  handleSuccessModalClose: () => void;
}

export function useParticipantEditTimeSlot(
  meetingId: string,
): UseParticipantEditTimeSlotResult {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nameFromQuery = searchParams.get('name');
  const STORE_KEY = `last_participant_name_${meetingId}`;

  const [participantName, setParticipantName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [meetingData, setMeetingData] = useState<MeetResponse | null>(null);
  const [isAllImpossible, setIsAllImpossible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { selected, isSelected, tapCell, reset, replaceSelection } =
    useTimeSlotSelection();

  const successModal = useDisclosure();

  useEffect(() => {
    let currentName = nameFromQuery;
    if (!currentName && typeof window !== 'undefined') {
      currentName = localStorage.getItem(STORE_KEY);
    }
    if (!currentName) {
      router.replace(`/meet/${meetingId}/edit`);
      return;
    }
    setParticipantName(currentName);

    const fetchData = async () => {
      try {
        const data = await getMeetingById(meetingId);
        setMeetingData(data);

        const participant = data.participants.find(
          (p) => p.name === currentName,
        );
        if (participant?.voteTimeSlots?.length) {
          replaceSelection(matrixToSelection(participant.voteTimeSlots));
        }
      } catch (error) {
        console.error('Failed to fetch meeting data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [meetingId, nameFromQuery, router, STORE_KEY, replaceSelection]);

  const handleAllImpossibleChange = (checked: boolean) => {
    setIsAllImpossible(checked);
    if (checked) reset();
  };

  const handleBack = () => {
    const params = new URLSearchParams();
    if (participantName) params.set('name', participantName);
    router.replace(`/meet/${meetingId}/edit?${params.toString()}`);
  };

  const handleSuccessModalClose = () => {
    successModal.close();
    router.replace(`/meet/${meetingId}`);
  };

  // 서버 응답 dates 순서를 그대로 사용. (register hook 과 동일 정책)
  const dates = meetingData?.dates ?? [];
  const timeRange = meetingData?.timeRange ?? null;

  const handleSubmit = async () => {
    if (isSubmitting || !meetingData || !timeRange) return;

    try {
      setIsSubmitting(true);

      const voteTimeSlots = isAllImpossible
        ? dates.map(() => Array(timeRange.slotCount).fill(false))
        : selectionToMatrix(selected, dates.length, timeRange.slotCount);

      const voteDates = isAllImpossible
        ? []
        : dates.filter((_, dateIndex) =>
            voteTimeSlots[dateIndex].some((v) => v),
          );

      await updateVote({
        meetingId,
        name: participantName,
        voteDates,
        voteTimeSlots,
      });

      successModal.open();
    } catch (error) {
      console.error('Failed to update vote:', error);
      alert('투표 수정에 실패했습니다. 다시 시도해주세요.');
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
    onCellTap: (d, s) => {
      if (isAllImpossible) setIsAllImpossible(false);
      tapCell(d, s);
    },
    handleAllImpossibleChange,
    handleBack,
    handleSubmit,
    isSuccessModalOpen: successModal.isOpen,
    handleSuccessModalClose,
  };
}
