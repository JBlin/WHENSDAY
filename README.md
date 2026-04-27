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
```

현재 코드는 `VITE_SUPABASE_PUBLISHABLE_KEY`를 우선 사용하고, 없으면 `VITE_SUPABASE_ANON_KEY`도 fallback으로 읽습니다.

## Supabase SQL

Supabase SQL Editor에서 아래 SQL을 실행하세요.

```sql
create table meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date_from date not null,
  date_to date not null,
  created_at timestamptz default now()
);

create table responses (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  name text not null,
  available_dates date[] not null default '{}',
  created_at timestamptz default now(),
  unique (meeting_id, name)
);

alter table meetings enable row level security;
alter table responses enable row level security;

create policy "Anyone can read meetings" on meetings for select using (true);
create policy "Anyone can insert meetings" on meetings for insert with check (true);

create policy "Anyone can read responses" on responses for select using (true);
create policy "Anyone can insert responses" on responses for insert with check (true);
create policy "Anyone can update responses" on responses for update using (true);

alter publication supabase_realtime add table responses;
```

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

## 배포

Vercel 배포 시 아래 환경 변수를 추가하세요.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
