# Quickstart — Local Verification

본 폴리시는 표시·검증 변경이라 로컬에서 눈으로 확인하면 끝난다.

## 0. Prerequisites

```bash
npm install
npm run dev   # localhost:3000
```

## 1. 이름 성격 입력 3 흐름의 공백 허용 (US1)

### 1-1. 모임 생성 (`/create`)

1. `/create` 진입.
2. 모임장 입력 칸에 `김 길동` 타이핑 → 에러 없음, CTA 활성화 가능 상태.
3. 모임명 칸에 `멋쟁이들 모임` (placeholder 문구 그대로) 타이핑 → 에러 없음.
4. 모임명 칸을 모두 지운 뒤 스페이스 키 3회 (`"   "`) → 모임명 하단에 `"공백만 입력할 수 없어요"` 에러 표시, CTA 비활성.
5. 모임명 칸을 다시 모두 지움 (`""`) → 에러 사라짐, 모임장만 채워져 있으면 CTA 활성. CTA 클릭 시 URL 쿼리에 placeholder 문구가 `meetingName` 으로 전달되는지 확인.
6. 모임장 칸을 공백 3회만 (`"   "`) → 모임장 하단에 `"공백만 입력할 수 없어요"` 에러 표시, CTA 비활성 (4 필드 일관 정책 — FR-003-host-ws).
7. 모임장/모임명 어느 쪽이든 11자 입력 시도 → 10자에서 멈추는지 확인 (`maxLength=10`, FR-006).

### 1-2. 참여자 이름 등록 (`/meet/[meetingId]/register`)

1. 호스트로 생성한 모임의 등록 페이지 진입.
2. 이름 칸에 `김 길동` 타이핑 → 에러 없음, CTA 활성.
3. 이름 칸을 모두 지운 뒤 스페이스 3회 (`"   "`) → 인라인 에러 메시지 노출, CTA 비활성. (수정 전에는 trim 후 submit 시점에야 "이름을 입력해주세요" 가 떴음 → 즉시 노출로 일관 적용)
4. 이름 칸 비움(`""`) → 에러 사라짐, 길이 0 → CTA 자체 비활성 유지.
5. `김 길동` 다시 입력 후 CTA → `checkParticipantExist(meetingId, '김 길동')` 호출되어 다음 단계로 진행.

### 1-3. 참여자 이름 수정/검색 (`/meet/[meetingId]/edit`)

1. 1-2 에서 `김 길동` 으로 투표한 상태에서 같은 모임의 수정 페이지 진입.
2. 이름 칸에 `김 길동` 타이핑 → 에러 없음, CTA 활성.
3. CTA → `checkParticipantExist` 가 isExist=true 로 응답하여 날짜 수정 페이지로 이동.
4. 이름 칸 공백만 입력 (`"   "`) → 인라인 에러 + CTA 비활성 확인.

## 2. 시간 슬롯 행 라벨 두 자리수 (US2)

### 호스트 흐름

1. 모임 생성 → 날짜 1개 이상 선택 → 시간 범위를 `00:00 ~ 06:00` 또는 비슷한 새벽 시간 포함으로 설정.
2. 참여자 시간 슬롯 페이지(`ParticipantRegisterTimeSlotPage` → `TimeSlotGrid`) 에서 좌측 라벨이 `00`, `01`, `02`, `03`, `04`, `05` 로 두 자리 표시되는지 확인.
3. 시간 범위를 `10:00 ~ 18:00` 로 바꿔도 `10` ~ `17` 그대로(회귀 없음) 확인.

### 결과 페이지

1. 투표 1~2건 진행 후 `/meet/[meetingId]` 진입.
2. `HeatmapGrid` 좌측 라벨이 `00`~`23` 모두 두 자리수로 표시되는지 확인. 라벨 폭 비뚤어짐 0건.

### Storybook 시각 회귀

```bash
npm run storybook
```

- `meet-result-table/HeatmapGrid` story 들에서 시간 범위에 `00`~`09` 가 포함되는 케이스를 확인. 미포함이면 새벽 시간 케이스를 args로 추가.

## 3. 결과 페이지 토글 아이콘 (US3)

1. `/meet/[meetingId]` 진입.
2. 우상단 토글 thumb 안 아이콘이 Figma 시안 노드 [3639:20842](https://www.figma.com/design/3QGpLOWvN7ZvBpYhqqzcJ4/moit-UI-Design?node-id=3639-20842&m=dev) (grid 상태) 와 시각적으로 일치하는지 확인.
3. 토글을 한 번 눌러 캘린더 상태로 전환 → 아이콘이 Figma 시안 노드 [3650:30362](https://www.figma.com/design/3QGpLOWvN7ZvBpYhqqzcJ4/moit-UI-Design?node-id=3650-30362&m=dev) 와 일치하는지 확인.
4. 슬라이드 애니메이션·`aria-checked` 동작·색상 그대로 유지되는지 확인.

## 4. 자동화 검증

```bash
npm run lint
npm run typecheck   # 또는 tsc --noEmit
npm test            # Vitest — useMeetCreateForm.test.ts 포함
```

- 모든 lint, typecheck, unit test 가 통과해야 한다.
- 본 폴리시로 인해 기존 테스트가 깨지지 않아야 한다(회귀 0).
