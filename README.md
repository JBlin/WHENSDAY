# WHENSDAY

친구들과 가능한 날짜를 빠르게 조율하는 Vue 3 + Supabase 앱입니다.

## 기술 스택

- Vue 3
- Vite
- Pinia
- Tailwind CSS
- Supabase

## 환경 변수

`.env` 파일에 아래 값을 넣어 주세요.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key-here
KMA_SERVICE_KEY=your-kma-service-key-here
FISHING_SERVICE_KEY=your-fishing-service-key-here
```

현재 코드는 `VITE_SUPABASE_PUBLISHABLE_KEY`를 우선 사용하고, 없으면 `VITE_SUPABASE_ANON_KEY`도 fallback으로 읽습니다.
기상청 중기예보 키와 바다낚시지수 키는 브라우저에 노출하지 않도록 `KMA_SERVICE_KEY`, `FISHING_SERVICE_KEY`를 Vercel 서버 환경 변수로만 사용합니다.

## Supabase SQL

Supabase SQL Editor에서 아래 SQL을 실행하세요.

```sql
create table meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date_from date not null,
  date_to date not null,
  host_token text,
  host_code text,
  status text not null default 'open',
  confirmed_date date,
  region_name text,
  region_display_name text,
  region_parent_name text,
  legal_dong_code text,
  weather_region_code text,
  temperature_region_code text,
  fishing_place_name text,
  fishing_gubun text,
  created_at timestamptz default now()
);

create table responses (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  name text not null,
  available_dates date[] not null default '{}',
  is_host boolean not null default false,
  created_at timestamptz default now(),
  unique (meeting_id, name)
);

alter table meetings add column if not exists host_token text;
alter table meetings add column if not exists host_code text;
alter table meetings add column if not exists status text not null default 'open';
alter table meetings add column if not exists confirmed_date date;
alter table meetings add column if not exists region_name text;
alter table meetings add column if not exists region_display_name text;
alter table meetings add column if not exists region_parent_name text;
alter table meetings add column if not exists legal_dong_code text;
alter table meetings add column if not exists weather_region_code text;
alter table meetings add column if not exists temperature_region_code text;
alter table meetings add column if not exists fishing_place_name text;
alter table meetings add column if not exists fishing_gubun text;
alter table responses add column if not exists is_host boolean not null default false;

alter table meetings enable row level security;
alter table responses enable row level security;

create policy "Anyone can read meetings" on meetings for select using (true);
create policy "Anyone can insert meetings" on meetings for insert with check (true);

create policy "Anyone can read responses" on responses for select using (true);
create policy "Anyone can insert responses" on responses for insert with check (true);
create policy "Anyone can update responses" on responses for update using (true);

alter publication supabase_realtime add table responses;
```

## 지역 기반 참고 정보

- `/meeting/:id`의 `날씨`, `온도` 뱃지는 `/api/forecast` Vercel Function을 통해 기상청 중기예보 API를 프록시 호출합니다.
- `/meeting/:id`의 `바다` 뱃지는 `/api/fishing` Vercel Function을 통해 바다낚시지수 API를 프록시 호출합니다.
- 약속 생성 시 `region_display_name`에는 사용자가 선택한 실제 지역명(예: `제주특별자치도 서귀포시 서귀동`)이 저장되고, `region_parent_name`에는 API 기준 대표 지역명(예: `서귀포`)이 저장됩니다.
- `legal_dong_code`에는 사용자가 선택한 법정동코드가 함께 저장됩니다.
- `region_name`은 기존 호환을 위해 실제 선택 지역명과 동일하게 저장됩니다.
- `weather_region_code`, `temperature_region_code`, `fishing_place_name`, `fishing_gubun`은 대표 API 매핑 지역 기준으로 meeting 레코드에 저장됩니다.
- 중기예보는 발표 시각 기준 `4~10일 후` 날짜 중심으로 제공되므로, 가까운 날짜 범위에서는 정보가 없을 수 있습니다.
- 물때 표시는 API의 `tdlvHrCn` 텍스트를 그대로 쓰지 않고, 브라우저 `Intl` 기반 음력일 계산 후 `n물`로 표시합니다.

## 약속 만들기 실패 시

`약속 만들기`에서 권한 관련 오류가 나오면, 프론트엔드 문제가 아니라 Supabase RLS 정책이 아직 적용되지 않은 상태일 가능성이 큽니다.

특히 `meetings` 테이블의 `insert` 정책이 없으면 생성이 막힙니다. 위 SQL을 다시 확인해 주세요.

## OneDrive 경로 이슈

이 프로젝트는 OneDrive 아래 한글 경로에 있으면 `esbuild` 설치나 Vite 실행이 실패할 수 있습니다.

그래서 아래 우회 스크립트를 같이 사용합니다.

- 개발 서버: `.\dev.ps1`
- 로컬 빌드: `.\build-local.ps1`

두 스크립트는 프로젝트 파일을 ASCII 경로로 복사한 뒤 그 위치에서 실행합니다.

## 실행

법정동 검색 데이터는 `scripts/raw/법정동코드 전체자료.txt`를 바탕으로 생성합니다. 원본 TXT를 갱신했다면 아래 명령으로 `src/data/legalDongs.json`을 다시 빌드해 주세요.

```powershell
npm run build:legal-dongs
```

OneDrive 경로 이슈가 없는 환경이면 일반적으로 아래처럼 실행할 수 있습니다.

```powershell
npm install
npm run dev
```

현재 폴더처럼 OneDrive 한글 경로라면 아래를 권장합니다.

```powershell
npm run dev
```

`npm run dev`는 이제 로컬 `node_modules/vite`가 있으면 그대로 실행하고, 없으면 Windows에서 `.\dev.ps1` 우회 경로를 자동으로 사용합니다.

## 커밋/푸시 자동화

커밋 메시지만 넣으면 빌드 확인 뒤 `git add`, `commit`, `push`까지 한 번에 실행할 수 있습니다.

```powershell
npm run sync -- "Add regional tide cycles"
```

- 이미 staged 된 변경이 있으면 그 변경만 커밋합니다.
- staged 된 변경이 없으면 `git add -A`로 전체 변경을 스테이징합니다.
- 빌드를 건너뛰려면 `npm run sync -- --skip-build "Commit message"`를 사용합니다.
- push 없이 커밋까지만 하려면 `npm run sync -- --no-push "Commit message"`를 사용합니다.

## 배포

Vercel 배포 시 아래 환경 변수를 추가하세요.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `KMA_SERVICE_KEY`
- `FISHING_SERVICE_KEY`
