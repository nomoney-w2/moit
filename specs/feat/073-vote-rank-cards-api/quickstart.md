# Quickstart: vote-rank-cards API 연동 검증

**Date**: 2026-05-07
**Spec**: [spec.md](./spec.md)

본 문서는 개발자가 본 작업의 결과물을 로컬·QA에서 시각·기능적으로 검증할 수 있는 절차를 담는다.

---

## Prerequisites

- 의존 PR 머지 완료: #71, #72 (또는 본 브랜치에 cherry-pick).
- `.env.development` 의 `NEXT_PUBLIC_API_BASE_URL` 이 sandbox 또는 운영 환경 가리킴.
- sandbox 모임 ID 1건 (timeRange 있음 / 없음 각각).

---

## Scenario 1 — timeRange 있는 모임

1. `npm run dev` 후 `http://localhost:3000/meet/{meetingId}` 진입.
2. **검증 포인트:**
   - [ ] TopBar 에 `{호스트명}님이 초대한 {모임 제목}` 노출
   - [ ] 헤더에 `N명이 투표했어요` (N = participants.filter(hasVoted).length)
   - [ ] 기본 뷰 = 히트맵 표
   - [ ] 토글 클릭 시 카드 리스트로 전환
   - [ ] 카드의 `N/M` 수치가 sandbox 응답 데이터와 일치
   - [ ] 카드 펼침 시 가능/불가 명단의 이름·순서가 응답과 일치
   - [ ] 푸터 `투표 수정하기` 클릭 → `/meet/{id}/edit` 이동
   - [ ] 푸터 `투표하기` 클릭 → `/meet/{id}/register` 이동

3. **DevTools Network 탭 확인:**
   - [ ] `GET /api/v1/meeting?meetId=...` 호출 1회만 발생
   - [ ] `fetchVoteTimeSlotStat` 호출 0건 (deprecation 적용됨)

---

## Scenario 2 — timeRange 없는 모임

1. timeRange 미선택으로 만든 모임 ID로 `/meet/{meetingId}` 진입.
2. **검증 포인트:**
   - [ ] TopBar 동일 노출
   - [ ] 시간대 토글(표/카드) 미노출
   - [ ] 기존 vote-results-calendar (날짜 단위) 뷰 노출
   - [ ] 날짜 클릭 시 해당 날짜의 가능/불가 명단 표시 (기존 동작)
   - [ ] 푸터 두 버튼 동작 동일

---

## Scenario 3 — 빈 상태 (참여자 0명 / 모두 미투표)

1. 갓 만든 모임 (participants=[] 또는 hasVoted=false 만) ID로 진입.
2. **검증 포인트:**
   - [ ] timeRange 있는 모임: 카드 뷰 토글 시 `아직 투표한 사람이 없어요` 빈 상태 표시
   - [ ] timeRange 없는 모임: 캘린더 뷰의 빈 상태 동작 (기존)
   - [ ] 푸터 두 버튼 모두 노출 (TODO-2 추적 항목)

---

## Scenario 4 — 오류 처리

1. 존재하지 않는 ID로 `/meet/invalid-id` 진입.
2. **검증 포인트:**
   - [ ] 404 응답 시 사용자에게 "존재하지 않는 모임" 안내 노출 (개발자 콘솔의 zod 검증 에러가 그대로 노출되지 않음)
   - [ ] 네트워크 차단 후 진입 시 "다시 시도" 가능한 안내

---

## Scenario 5 — 개발용 라우트 (보존됨)

1. `/test/vote-rank-cards` 진입.
2. **검증 포인트:**
   - [ ] 기존 mock fixture (`mockMeetingVoteSnapshot`) 기반 카드 리스트 노출 (시각 회귀 확인용)
   - [ ] 운영 라우트와 무관하게 동작 (deprecation 주석은 있지만 동작 보존)

---

## Scenario 6 — 단위 테스트

```bash
# 본 spec에서 추가/변경된 테스트만 빠르게
npx vitest run src/entities/meet/lib/toMeetingVoteSnapshot.test.ts \
              src/entities/voteTimeSlotStat/lib/buildVoteTimeSlotStat.test.ts \
              src/entities/voteDateStat/lib/buildVoteDateStat.test.ts \
              src/features/vote-rank-cards/lib/rankSlots.test.ts
```

**기대 결과**: 모든 테스트 통과. 신규 어댑터 3종은 data-model.md §7 의 매트릭스 충족. `rankSlots.test.ts` 는 과거 날짜 보조정렬 케이스 1개 추가 통과.

---

## Scenario 7 — Storybook 회귀

```bash
npm run storybook
```

**기대 결과**: 다음 stories 변경 없이 그대로 렌더:

- `Features/VoteRankCards/RankChip` (5개)
- `Features/VoteRankCards/VoteRankCard` (9개)
- `Features/VoteRankCards/VoteRankCardsPage` (4개) — deprecation 주석에도 stories는 유지
- `Features/MeetResultTable/...` (기존)

---

## Scenario 8 — 운영 환경 첫 호출 검증

배포 후 1회 한정 검증 (Production smoke test):

1. 운영 모임 1건의 결과 페이지 진입.
2. DevTools Network 탭에서 응답 raw JSON 다운로드.
3. 다음 항목이 응답에 모두 존재 확인:
   - `participants[*].voteTimeSlots`
   - `timeRange.slotCount` (timeRange 있는 모임)
   - `status`
4. 클라 console 에 zod validation error 0건.

→ contracts/README.md §C-4 의 "운영 환경 응답 검증" 절차.

---

## Pass/Fail 기준

본 quickstart 의 모든 시나리오가 ✅ 일 때 본 spec의 SC-001 ~ SC-007 충족으로 간주.

| Scenario | 충족 SC                                               |
| -------- | ----------------------------------------------------- |
| 1        | SC-001, SC-004, SC-008                                |
| 2        | SC-001 (date-only mode), SC-008                       |
| 3        | SC-001, SC-003                                        |
| 4        | SC-003                                                |
| 5        | (별도 — deprecation 정책 일관성)                      |
| 6        | SC-005, SC-006, SC-007 (grep 으로 호출 0개 검증 포함) |
| 7        | (회귀 보호)                                           |
| 8        | SC-001 (운영 데이터 일치)                             |
