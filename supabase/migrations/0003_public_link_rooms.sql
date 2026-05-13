alter table public.workspaces alter column created_by drop not null;
alter table public.rooms alter column created_by drop not null;

create policy "public can read link rooms"
on public.rooms for select
using (true);

create policy "public can read link briefs"
on public.briefs for select
using (
  exists (
    select 1 from public.rooms r
    where r.id = briefs.room_id
  )
);

create policy "public can read link revisions"
on public.brief_revisions for select
using (
  exists (
    select 1 from public.rooms r
    where r.id = brief_revisions.room_id
  )
);
