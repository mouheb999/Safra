-- Trip brain calibration: the first estimates asked for budgets well above what agencies charge.
-- Flights match current Tunis fares, food is per person per day at street / mid-range prices, and
-- pocket money only covers extras (food, transport and activities are already budgeted).
-- Rows SAFRA already edited in /admin/brain are left alone (each update checks the old value).

alter table public.site_settings alter column brain_min_pocket_tnd set default 25;
update public.site_settings set brain_min_pocket_tnd = 25 where brain_min_pocket_tnd = 60;

update public.brain_countries c set flight_tnd = v.new_tnd
from (values
    ('thailand', 2900, 2400),
    ('bali', 3400, 2900),
    ('malaysia', 2700, 2300),
    ('vietnam', 3000, 2600),
    ('philippines', 3300, 2800)
) as v (code, old_tnd, new_tnd)
where c.code = v.code and c.flight_tnd = v.old_tnd;

update public.brain_bases b set food_budget_tnd = v.new_budget, food_mid_tnd = v.new_mid
from (values
    ('bangkok', 45, 85, 35, 65),
    ('phuket', 50, 95, 40, 70),
    ('krabi', 45, 85, 35, 65),
    ('chiang-mai', 35, 70, 30, 50),
    ('koh-samui', 55, 100, 45, 75),
    ('ubud', 40, 80, 30, 60),
    ('seminyak', 50, 95, 40, 70),
    ('uluwatu', 50, 100, 40, 75),
    ('kuala-lumpur', 35, 70, 30, 50),
    ('langkawi', 40, 80, 30, 60),
    ('penang', 30, 60, 25, 45),
    ('hanoi', 30, 60, 25, 45),
    ('ha-long', 40, 70, 30, 50),
    ('hoi-an', 30, 60, 25, 45),
    ('ho-chi-minh', 30, 60, 25, 45),
    ('phu-quoc', 40, 80, 30, 60),
    ('el-nido', 45, 85, 35, 65),
    ('coron', 40, 80, 30, 60),
    ('bohol', 40, 75, 30, 55),
    ('siargao', 40, 80, 30, 60)
) as v (slug, old_budget, old_mid, new_budget, new_mid)
where b.slug = v.slug and b.food_budget_tnd = v.old_budget and b.food_mid_tnd = v.old_mid;
