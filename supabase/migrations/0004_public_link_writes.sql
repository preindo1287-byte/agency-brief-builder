create policy "public can create link workspaces"
on public.workspaces for insert
with check (created_by is null);

create policy "public can create link rooms"
on public.rooms for insert
with check (created_by is null);

create policy "public can update link rooms"
on public.rooms for update
using (created_by is null)
with check (created_by is null);

create policy "public can create link briefs"
on public.briefs for insert
with check (
  updated_by is null
  and exists (
    select 1 from public.rooms r
    where r.id = briefs.room_id
      and r.created_by is null
  )
);

create policy "public can update link briefs"
on public.briefs for update
using (
  exists (
    select 1 from public.rooms r
    where r.id = briefs.room_id
      and r.created_by is null
  )
)
with check (
  updated_by is null
  and exists (
    select 1 from public.rooms r
    where r.id = briefs.room_id
      and r.created_by is null
  )
);

create policy "public can create link revisions"
on public.brief_revisions for insert
with check (
  created_by is null
  and exists (
    select 1 from public.rooms r
    where r.id = brief_revisions.room_id
      and r.created_by is null
  )
);
