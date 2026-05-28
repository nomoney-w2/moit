# Phase 1 — Data Model: 087-meet-figma-sync-fixes

## Domain Entities

**해당 없음.** 본 명세는 클라이언트 UI/검증 폴리시이며, 도메인 엔티티(`Meet`, `Vote`, `VoteTimeSlotStat` 등)와 DTO 형태에 어떤 변경도 가하지 않는다.

## Client State / Validation Policy 변경

| 필드                                                    | 이전 정책                                                                                                                  | 변경 후 정책                                                                                                                                                                                                                   |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `hostName` (모임장)                                     | `^[ㄱ-힣a-zA-Z]*$` 만 허용. 공백 입력 시 "한글, 영문만 입력 가능해요" 에러. 공백-only 입력 시 별도 에러 없이 CTA만 비활성. | `^[ㄱ-힣a-zA-Z ]*$` 허용. 일반 공백 입력은 에러 없음. **공백-only 입력** (`hostName !== '' && hostName.trim() === ''`) 시 인라인 에러 `"공백만 입력할 수 없어요"` + CTA 비활성. CTA 가드는 기존 `hostName.trim() !== ''` 유지. |
| `meetingName` (모임명) — 정규식                         | `^[ㄱ-힣a-zA-Z0-9]*$` 만 허용.                                                                                             | `^[ㄱ-힣a-zA-Z0-9 ]*$` 허용.                                                                                                                                                                                                   |
| `meetingName` — 완전 빈 입력 (`""`)                     | placeholder 문구가 최종 모임명으로 자동 대체. is_autofilled=true.                                                          | 변경 없음 (기존 동작 유지).                                                                                                                                                                                                    |
| `meetingName` — 공백만 입력 (`" "`, `"   "`)            | placeholder 대체 발생 (현재 동작).                                                                                         | placeholder 대체 차단. 에러 메시지 `"공백만 입력할 수 없어요"`, CTA 비활성.                                                                                                                                                    |
| `meetingName` — 길이 제한                               | `maxLength=10` (공백 포함).                                                                                                | 변경 없음.                                                                                                                                                                                                                     |
| `participantName` (등록 / `useParticipantRegisterName`) | `^[ㄱ-힣a-zA-Z]*$` 만 허용. `isValidInput = name.length > 0 && !err`.                                                      | `^[ㄱ-힣a-zA-Z ]*$` 허용. 공백-only 입력 시 인라인 에러 + `isValidInput=false`. `isValidInput = name.trim().length > 0 && !err`.                                                                                               |
| `participantName` (수정 / `useParticipantEditName`)     | 동상.                                                                                                                      | 동상.                                                                                                                                                                                                                          |

## Server / Persistence 영향

- API 페이로드 형식 변경 없음. POST `/v1/meeting` 의 `meetingName`, 호스트 이름 필드에 공백 포함 문자열이 들어갈 수 있다는 점만 추가됨 (백엔드는 이미 임의 문자열을 수용하는 것으로 가정).
- localStorage 의 `lastHostName` 값에 공백 포함 가능. `readLastHostName` / `writeLastHostName` 자체는 변경 없음.

## Display Format 변경

| 영역                        | 이전 표시                              | 변경 후 표시                                           |
| --------------------------- | -------------------------------------- | ------------------------------------------------------ |
| `TimeSlotGrid` 좌측 시 라벨 | `0`, `1`, …, `9`, `10`, …, `23`        | `00`, `01`, …, `09`, `10`, …, `23`                     |
| `HeatmapGrid` 좌측 시 라벨  | 동상                                   | 동상                                                   |
| `ViewToggle` thumb 아이콘   | 인라인 SVG (사각형+십자/사각형+상단점) | Figma 노드 3639:20842 / 3650:30362 자산과 일치하는 SVG |

## 변경 없는 항목

- Time slot index 계산(`slotIdx`), 시간 그리드 행/열 구조, 셀 selection 모델.
- 토글 동작(슬라이드, `aria-checked`, 색상).
- 모임명 placeholder 후보 5종 — 문구·랜덤 선택 로직 모두 유지.
