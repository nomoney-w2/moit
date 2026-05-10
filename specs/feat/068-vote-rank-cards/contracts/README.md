# Contracts — vote-rank-cards

본 기능은 **mock UI 단계**이므로 실 API 계약은 정의하지 않는다. 향후 실 API 연동 시 본 디렉터리에 명세를 추가한다.

## 현재 단계 (Mock UI)

- 데이터 출처: `src/features/vote-rank-cards/lib/mock.ts` 의 fixture 함수.
- 데이터 타입: `MeetingVoteSnapshot` (정의: `data-model.md` §1).
- 어댑터: `toRankedSlots(snapshot, options?) → RankedListResult` (정의: `data-model.md` §4).

## 향후 API 계약 placeholder

| 엔드포인트 (가정)             | 메서드 | 응답                                                   | 비고                          |
| ----------------------------- | ------ | ------------------------------------------------------ | ----------------------------- |
| `/api/v1/meeting?meetId={id}` | GET    | `MeetingVoteSnapshot`(또는 기존 `MeetResponse` 확장형) | 실 백엔드 결정 후 어댑터 교체 |

> 현재 프로덕션 DTO인 `MeetResponse`(src/entities/meet/dto/meet.dto.ts)에는 `voteTimeSlots`/`timeRange`/`status`/`finalizedDate`가 부재하다. 실 연동 시 백엔드와 합의 후 DTO 확장 또는 별도 신규 엔드포인트로 처리한다.

## 참고

- 본 기능 컴포넌트는 **ViewModel**(`RankedListResult`)을 직접 받는다. API 응답 형태가 어떻게 결정되든 어댑터(`toRankedSlots`) 한 곳만 변경하면 컴포넌트는 영향이 없다.
