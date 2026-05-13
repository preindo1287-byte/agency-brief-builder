alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.rooms enable row level security;
alter table public.briefs enable row level security;
alter table public.brief_revisions enable row level security;
alter table public.invitations enable row level security;

alter table public.profiles force row level security;
alter table public.workspaces force row level security;
alter table public.workspace_members force row level security;
alter table public.rooms force row level security;
alter table public.briefs force row level security;
alter table public.brief_revisions force row level security;
alter table public.invitations force row level security;

create or replace function public.is_workspace_member(p_workspace_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = p_user_id
  );
$$;

create or replace function public.workspace_role_for(p_workspace_id uuid, p_user_id uuid default auth.uid())
returns public.workspace_role
language sql
stable
security definer
set search_path = public
as $$
  select wm.role from public.workspace_members wm
  where wm.workspace_id = p_workspace_id
    and wm.user_id = p_user_id
  limit 1;
$$;

create or replace function public.can_edit_workspace(p_workspace_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.workspace_role_for(p_workspace_id, p_user_id) in ('owner', 'editor'), false);
$$;

create or replace function public.is_workspace_owner(p_workspace_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.workspace_role_for(p_workspace_id, p_user_id) = 'owner';
$$;

create policy "profiles can read self or shared workspace members"
on public.profiles for select
using (
  id = auth.uid()
  or exists (
    select 1
    from public.workspace_members mine
    join public.workspace_members theirs on theirs.workspace_id = mine.workspace_id
    where mine.user_id = auth.uid()
      and theirs.user_id = profiles.id
  )
);

create policy "profiles insert self"
on public.profiles for insert
with check (id = auth.uid());

create policy "profiles update self"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "workspace members can read workspace"
on public.workspaces for select
using (public.is_workspace_member(id));

create policy "authenticated users can create own workspace"
on public.workspaces for insert
with check (created_by = auth.uid());

create policy "workspace owners can update workspace"
on public.workspaces for update
using (public.is_workspace_owner(id))
with check (public.is_workspace_owner(id));

create policy "workspace owners can delete workspace"
on public.workspaces for delete
using (public.is_workspace_owner(id));

create policy "workspace members can read members"
on public.workspace_members for select
using (public.is_workspace_member(workspace_id));

create policy "workspace owners can add members"
on public.workspace_members for insert
with check (public.is_workspace_owner(workspace_id));

create policy "workspace owners can update member roles"
on public.workspace_members for update
using (public.is_workspace_owner(workspace_id))
with check (public.is_workspace_owner(workspace_id));

create policy "workspace owners can remove members"
on public.workspace_members for delete
using (public.is_workspace_owner(workspace_id));

create policy "workspace members can read rooms"
on public.rooms for select
using (public.is_workspace_member(workspace_id));

create policy "editors can create rooms"
on public.rooms for insert
with check (public.can_edit_workspace(workspace_id) and created_by = auth.uid());

create policy "editors can update rooms"
on public.rooms for update
using (public.can_edit_workspace(workspace_id))
with check (public.can_edit_workspace(workspace_id));

create policy "owners can delete rooms"
on public.rooms for delete
using (public.is_workspace_owner(workspace_id));

create policy "workspace members can read briefs"
on public.briefs for select
using (
  exists (
    select 1 from public.rooms r
    where r.id = briefs.room_id
      and public.is_workspace_member(r.workspace_id)
  )
);

create policy "editors can create briefs"
on public.briefs for insert
with check (
  exists (
    select 1 from public.rooms r
    where r.id = briefs.room_id
      and public.can_edit_workspace(r.workspace_id)
  )
);

create policy "editors can update briefs"
on public.briefs for update
using (
  exists (
    select 1 from public.rooms r
    where r.id = briefs.room_id
      and public.can_edit_workspace(r.workspace_id)
  )
)
with check (
  exists (
    select 1 from public.rooms r
    where r.id = briefs.room_id
      and public.can_edit_workspace(r.workspace_id)
  )
);

create policy "owners can delete briefs"
on public.briefs for delete
using (
  exists (
    select 1 from public.rooms r
    where r.id = briefs.room_id
      and public.is_workspace_owner(r.workspace_id)
  )
);

create policy "workspace members can read revisions"
on public.brief_revisions for select
using (
  exists (
    select 1 from public.rooms r
    where r.id = brief_revisions.room_id
      and public.is_workspace_member(r.workspace_id)
  )
);

create policy "editors can create revisions"
on public.brief_revisions for insert
with check (
  exists (
    select 1 from public.rooms r
    where r.id = brief_revisions.room_id
      and public.can_edit_workspace(r.workspace_id)
  )
);

create policy "owners can delete revisions"
on public.brief_revisions for delete
using (
  exists (
    select 1 from public.rooms r
    where r.id = brief_revisions.room_id
      and public.is_workspace_owner(r.workspace_id)
  )
);

create policy "workspace owners can manage invitations"
on public.invitations for all
using (public.is_workspace_owner(workspace_id))
with check (public.is_workspace_owner(workspace_id));
