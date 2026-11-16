-- ألعاب الجمعة: تجهيز قاعدة البيانات (يتشغّل مرة وحدة من SQL Editor في Supabase)
-- آمن إنك تشغّله أكثر من مرة.

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  level int not null check (level in (200, 400, 600)),
  question text not null,
  answer text not null,
  media_url text,
  media_type text check (media_type in ('image', 'audio', 'video')),
  answer_media_url text,
  answer_media_type text check (answer_media_type in ('image', 'audio', 'video')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.questions enable row level security;
alter table public.admins enable row level security;

-- أي أحد يقدر يقرأ الأسئلة (اللعبة)، والمشرف فقط يقدر يضيف ويعدّل ويحذف
drop policy if exists "questions read" on public.questions;
create policy "questions read" on public.questions for select using (true);

drop policy if exists "questions admin write" on public.questions;
create policy "questions admin write" on public.questions for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "admins self read" on public.admins;
create policy "admins self read" on public.admins for select to authenticated using (user_id = auth.uid());

grant select on public.questions to anon, authenticated;
grant insert, update, delete on public.questions to authenticated;
grant select on public.admins to authenticated;

-- أول حساب يتسجّل يصير هو المشرف تلقائياً، وأي حساب بعده ما له صلاحية
create or replace function public.first_user_is_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.admins) then
    insert into public.admins (user_id) values (new.id);
  end if;
  return new;
end $$;

drop trigger if exists first_user_is_admin on auth.users;
create trigger first_user_is_admin after insert on auth.users
  for each row execute function public.first_user_is_admin();

-- لو فيه حساب مسجّل من قبل وما فيه مشرف، أقدم حساب يصير المشرف
insert into public.admins (user_id)
select id from auth.users
where not exists (select 1 from public.admins)
order by created_at limit 1
on conflict do nothing;

-- مخزن الصور والصوت والفيديو
insert into storage.buckets (id, name, public) values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "media read" on storage.objects;
create policy "media read" on storage.objects for select using (bucket_id = 'media');

drop policy if exists "media admin insert" on storage.objects;
create policy "media admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and exists (select 1 from public.admins a where a.user_id = auth.uid()));
