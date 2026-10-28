alter table public.campuses
  add column brand_name text not null default 'StudentStore';

update public.campuses
set brand_name = 'FoxFinder'
where slug = 'marist';
