create extension if not exists pgcrypto;

create type public.workspace_role as enum ('owner', 'editor', 'viewer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.workspace_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  share_slug text not null unique default encode(gen_random_bytes(9), 'hex'),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.briefs (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references public.rooms(id) on delete cascade,
  content jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brief_revisions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  content jsonb not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role public.workspace_role not null default 'viewer',
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid not null references public.profiles(id) on delete cascade,
  accepted_at timestamptz,
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_email_idx on public.profiles(email);
create index workspaces_created_by_idx on public.workspaces(created_by);
create index workspace_members_user_id_idx on public.workspace_members(user_id);
create index workspace_members_role_idx on public.workspace_members(workspace_id, role);
create index rooms_workspace_id_idx on public.rooms(workspace_id);
create index rooms_share_slug_idx on public.rooms(share_slug);
create index briefs_room_id_idx on public.briefs(room_id);
create index brief_revisions_room_created_idx on public.brief_revisions(room_id, created_at desc);
create index invitations_workspace_email_idx on public.invitations(workspace_id, email);
create index invitations_token_idx on public.invitations(token);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger workspaces_set_updated_at before update on public.workspaces for each row execute function public.set_updated_at();
create trigger workspace_members_set_updated_at before update on public.workspace_members for each row execute function public.set_updated_at();
create trigger rooms_set_updated_at before update on public.rooms for each row execute function public.set_updated_at();
create trigger briefs_set_updated_at before update on public.briefs for each row execute function public.set_updated_at();
create trigger invitations_set_updated_at before update on public.invitations for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.create_room_for_user(p_title text, p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
  v_room_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'unauthorized';
  end if;

  insert into public.profiles (id, email)
  select u.id, u.email from auth.users u where u.id = p_user_id
  on conflict (id) do nothing;

  select wm.workspace_id into v_workspace_id
  from public.workspace_members wm
  where wm.user_id = p_user_id and wm.role = 'owner'
  order by wm.created_at asc
  limit 1;

  if v_workspace_id is null then
    insert into public.workspaces (name, created_by)
    values ('내 워크스페이스', p_user_id)
    returning id into v_workspace_id;

    insert into public.workspace_members (workspace_id, user_id, role)
    values (v_workspace_id, p_user_id, 'owner');
  end if;

  insert into public.rooms (workspace_id, title, created_by)
  values (v_workspace_id, p_title, p_user_id)
  returning id into v_room_id;

  insert into public.briefs (room_id, content, updated_by)
  values (
    v_room_id,
    '{
      "background": "",
      "objective": "",
      "task": "",
      "target": "",
      "considerations": "",
      "deliverables": ""
    }'::jsonb,
    p_user_id
  );

  return v_room_id;
end;
$$;

create or replace function public.seed_demo_room_for_current_user()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
begin
  if auth.uid() is null then
    raise exception 'login required';
  end if;

  v_room_id := public.create_room_for_user('맥도날드 청귤 맥피즈 브리프', auth.uid());

  update public.briefs
  set content = '{
    "background": "• 청귤 맥피즈는 제주 청귤 원재료가 주는 상큼함과 지역성을 중심으로, 여름철 갈증 해소와 청량한 음용 니즈에 맞춰 고객에게 제안할 수 있는 제품/캠페인이다.",
    "objective": "• 청귤 맥피즈의 제품 인지도 및 핵심 이미지 강화\\n• 제주 청귤과 맥도날드 맥피즈를 자연스럽게 연결한다.",
    "task": "• 키비주얼, 메인 카피, SNS 영상, 매장 POP, 메뉴보드 적용안을 포함한 제작 방향을 제안한다.",
    "target": "• 여름에 시원하고 산뜻한 음료를 찾는 QSR 고객\\n• 버거와 함께 즐길 페어링 음료를 찾는 고객",
    "considerations": "• 원재료 함량, 효능, 판매 조건을 오해하게 만드는 표현은 피한다.\\n• 로고, 제품명, 가격, 판매 기간, 필수 고지는 최종 제작 전 재확인한다.",
    "deliverables": "• 키비주얼 방향안\\n• 숏폼 영상 콘티\\n• SNS 소재안\\n• 매장 POP/메뉴보드 적용안\\n• 메인 카피 3안 이상"
  }'::jsonb
  where room_id = v_room_id;

  return v_room_id;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.briefs;
exception
  when duplicate_object then null;
end;
$$;
