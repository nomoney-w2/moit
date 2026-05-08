# API Contracts: vote-rank-cards API 연동

**Spec**: [../spec.md](../spec.md)
**Source of Truth**: sandbox swagger `https://sandbox-api.weddin.kr/swagger-ui/index.html`

---

## C-1. `GET /api/v1/meeting`

### Request

| 항목    | 값                                                              |
| ------- | --------------------------------------------------------------- |
| Method  | GET                                                             |
| Path    | `/api/v1/meeting`                                               |
| Query   | `meetId` (string, required) — 모임 고유 ID                      |
| Headers | 표준 (`Accept: application/json`) — 별도 인증 헤더 본 spec 무관 |

### Response (200)

```jsonc
{
  "id": "abc123", // string
  "title": "두쫀쿠 투어", // string
  "hostName": "김야뿌", // string
  "dates": ["2026-04-17", "2026-04-18"], // string[] (ISO 'YYYY-MM-DD')
  "status": "VOTING", // 'VOTING' | 'FINALIZED' | 'CLOSED'
  "finalizedDate": null, // string | null (status==='FINALIZED'일 때만 채워짐)
  "maxParticipantCount": 9, // number | null
  "timeRange": {
    // object | null | undefined
    "startTime": "12:00", // 'HH:mm' (30분 단위)
    "endTime": "14:00",
    "slotCount": 4,
  },
  "participants": [
    {
      "id": 1, // number
      "name": "상민", // string
      "voteDates": ["2026-04-17"], // string[]
      "voteTimeSlots": [
        // boolean[][] (dates.length × slotCount)
        [true, true, false, false],
      ],
      "hasVoted": true, // boolean
    },
  ],
}
```

### Validation Schema (zod)

→ [data-model.md §1](../data-model.md#1-확장된-meetresponsedto-서버--클라-raw)

### Error Responses

| Status              | 의미             | 클라 동작                                                  |
| ------------------- | ---------------- | ---------------------------------------------------------- |
| 400                 | meetId 형식 오류 | 결과 페이지 진입 자체 차단 (라우트 가드) — 본 spec 범위 밖 |
| 404                 | 모임 없음        | "존재하지 않는 모임" 안내 + 홈 이동 CTA (FR-004)           |
| 5xx / 네트워크 오류 | 서버/네트워크    | "다시 시도" 가능 안내 (FR-004)                             |

### 호출 패턴 (재사용)

```ts
// src/entities/meet/api/getMeetingById.ts (변경 없음, DTO 확장만으로 자동 반영)
const rawResponse = await api
  .get('v1/meeting', { searchParams: { meetId } })
  .json<unknown>();
return validateSchema({
  dto: rawResponse,
  schema: meetResponseDto,
  schemaName: 'v1/meeting',
});
```

---

## C-2. (참조용) 본 spec에서 호출하지 않는 엔드포인트

| 엔드포인트                                  | 본 spec과의 관계                                                     |
| ------------------------------------------- | -------------------------------------------------------------------- |
| `GET /api/v1/meeting/list`                  | 결과 페이지와 무관                                                   |
| `POST /api/v1/meeting`                      | 모임 생성 (별도 feature)                                             |
| `POST /api/v1/meeting/vote`                 | 투표 등록 — 푸터 `투표하기` Link로 라우팅, 본 페이지에서 직접 호출 X |
| `PUT /api/v1/meeting/vote`                  | 투표 수정 — 동일                                                     |
| `GET /api/v1/host/meeting/finalize/preview` | 호스트 확정 플로우 (out of scope)                                    |
| `POST /api/v1/host/meeting/finalize`        | 동일                                                                 |

---

## C-3. (제거 후보) 본 spec 시점에 미구현이었지만 사용 안 할 함수

다음 함수는 swagger에 대응 엔드포인트가 없어 호출되지 않음. **본 spec 작업 중에는 제거하지 않고 deprecation 주석만 추가**(plan.md AD-6).

| 함수                    | 위치                                                     | 사유                                                              |
| ----------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| `fetchVoteTimeSlotStat` | `entities/voteTimeSlotStat/api/fetchVoteTimeSlotStat.ts` | 서버 엔드포인트 부재. `buildVoteTimeSlotStat` (클라 집계) 로 대체 |
| `fetchVoteDateStat`     | `entities/voteDateStat/api/fetchVoteDateStat.ts`         | 서버 엔드포인트 부재. `buildVoteDateStat` (클라 집계) 로 대체     |

---

## C-4. 운영 환경 응답 검증

본 contracts는 **sandbox** swagger 기준. 운영 환경에서도 동일한지 본 작업 통합 단계에서 다음 절차로 확인 (quickstart.md 참조):

1. 운영 모임 1건의 ID로 `GET /api/v1/meeting?meetId=...` 호출
2. 응답에 `voteTimeSlots`, `timeRange.slotCount`, `status` 모두 존재 확인
3. zod 검증 통과 확인 (`validateSchema` log 없음)
