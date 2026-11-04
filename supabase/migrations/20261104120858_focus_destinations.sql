-- Focus destinations: "Find my trip" suggests these first whenever they fit (or nearly fit) the budget; the
-- others are the backup for smaller budgets. Southeast Asia is the focus; the closer countries are the backup.

alter table public.brain_countries add column is_featured boolean not null default true;

update public.brain_countries set is_featured = false where code in ('turkey', 'egypt', 'morocco', 'jordan', 'georgia');
