# API Contract: `fetchVoteTimeSlotStat`

**Feature**: feat/#133-meet-table-view
**Status**: STUB (실 API 정의는 별도 명세에 의존)

## Purpose

모임의 시간 슬롯별 투표 통계(`VoteTimeSlotStat`)를 가져오는 클라이언트 함수. 본 명세는 표시 계층만 다루므로 함수 시그니처와 mock 동작만 확정하고, 실제 HTTP 호출은 추후 데이터 모델 명세에서 채운다.

## Function Signature

```typescript
// src/entities/voteTimeSlotStat/api/fetchVoteTimeSlotStat.ts
import type { VoteTimeSlotStat } from '../dto/voteTimeSlotStat.dto';

export type FetchVoteTimeSlotStatParams = {
  meetingId: string;
};

export async function fetchVoteTimeSlotStat(
  params: FetchVoteTimeSlotStatParams,
): Promise<VoteTimeSlotStat>;
```

## Initial Implementation (스텁)

기존 `voteDateStat/api/fetchVoteDateStat.ts` 패턴 mirror:

```typescript
import type { VoteTimeSlotStat } from '../dto/voteTimeSlotStat.dto';

export type FetchVoteTimeSlotStatParams = {
  meetingId: string;
};

// TODO: 실제 API 스펙이 정해지면 이 파일에서 구현합니다.
export async function fetchVoteTimeSlotStat(
  _params: FetchVoteTimeSlotStatParams,
): Promise<VoteTimeSlotStat> {
  throw new Error('fetchVoteTimeSlotStat is not implemented yet');
}
```

## Page-Level Data Loading Strategy

`app/meet/[meetingId]/page.tsx`(Server Component)는 다음 순서로 데이터를 준비:

1. `getMeetingById(meetingId)` 실 API (기존)
2. `VoteTimeSlotStat` 가져오기:
   - **개발 모드 / API 미구현**: `generateMockVoteTimeSlotStat(meetingId, meeting.dates, meeting.participants)` 호출 (entities/voteTimeSlotStat/lib/mock.ts)
   - **API 구현 후**: `fetchVoteTimeSlotStat({ meetingId })` 호출
3. 두 데이터 모두 클라이언트 컴포넌트(`MeetResultTablePage`)로 prop 전달

본 명세 구현 단계에서는 mock 경로만 활성화. 실 API 도입 시 page.tsx 1줄 변경.

## Expected Future API Spec (예상)

실 API가 구현되면 다음과 같은 형태가 될 것으로 예상(구속력 없음, 별도 명세에서 확정):

```
GET /v1/meeting/timeslot-stat?meetId={meetingId}

Response 200:
{
  "meetingId": "abc123",
  "dates": ["2026-04-16", "2026-04-17", ...],
  "cells": [
    {
      "date": "2026-04-16",
      "slotIdx": 0,
      "count": 5,
      "participants": [{ "id": 1, "name": "예진" }, ...]
    },
    ...
  ]
}
```

zod 검증은 `voteTimeSlotStatDto` 스키마로 수행. 검증 실패 시 `validateSchema`(기존 패턴)로 throw.

## Test Strategy

- **단위 테스트**: mock 생성기(`generateMockVoteTimeSlotStat`)의 결정성·분포 보장
- **통합 테스트**: page.tsx에서 mock → MeetResultTablePage 렌더 e2e
- **실 API 도입 후**: `fetchVoteTimeSlotStat`은 zod 검증 통과 시나리오 + 실패 시나리오 단위 테스트 추가(별도 명세 책임)

## Out of Scope (본 명세)

- 실 HTTP endpoint 정의 (path, query, response shape 최종 확정)
- 백엔드 구현
- 시간 슬롯 단위 투표 등록/수정 API (`/register`, `/edit` 페이지의 데이터 모델)
- 캐싱·재검증 정책(SWR/React Query 등)
