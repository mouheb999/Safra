-- "Find my trip" gets 6 more vibes (Islands, Diving, Relaxation, Wellness, Shopping, Romance) and visitors pick up
-- to 5. Places and activities are tagged where they really fit (same tags as src/data/brain.ts); the admin can
-- change them on each place. Re-running is harmless: a tag is only added when missing.

update public.brain_bases set strengths = array_append(strengths, 'Relaxation')
 where slug in ('ubud', 'koh-samui', 'langkawi', 'phu-quoc', 'chefchaouen', 'essaouira', 'uluwatu', 'antalya', 'bohol', 'hoi-an') and not ('Relaxation' = any(strengths));
update public.brain_bases set strengths = array_append(strengths, 'Islands')
 where slug in ('el-nido', 'coron', 'bohol', 'siargao', 'krabi', 'koh-samui', 'phuket', 'phu-quoc', 'langkawi', 'uluwatu', 'ha-long') and not ('Islands' = any(strengths));
update public.brain_bases set strengths = array_append(strengths, 'Diving')
 where slug in ('hurghada', 'coron', 'el-nido', 'bohol', 'phu-quoc', 'krabi', 'phuket', 'koh-samui', 'siargao') and not ('Diving' = any(strengths));
update public.brain_bases set strengths = array_append(strengths, 'Wellness')
 where slug in ('ubud', 'koh-samui', 'marrakech', 'istanbul', 'tbilisi', 'chiang-mai', 'seminyak', 'amman') and not ('Wellness' = any(strengths));
update public.brain_bases set strengths = array_append(strengths, 'Shopping')
 where slug in ('bangkok', 'kuala-lumpur', 'istanbul', 'ho-chi-minh', 'marrakech', 'fes', 'cairo', 'hanoi', 'seminyak', 'phuket') and not ('Shopping' = any(strengths));
update public.brain_bases set strengths = array_append(strengths, 'Romance')
 where slug in ('uluwatu', 'koh-samui', 'cappadocia', 'ha-long', 'phu-quoc', 'langkawi', 'el-nido', 'hoi-an', 'chefchaouen', 'ubud') and not ('Romance' = any(strengths));

update public.brain_bases b
   set activities = (
     select jsonb_agg(case when a ->> 'name' in ('Beach club afternoon', 'Loboc river lunch cruise') and not (a -> 'vibes' ? 'Relaxation')
                           then jsonb_set(a, '{vibes}', (a -> 'vibes') || '["Relaxation"]'::jsonb) else a end order by n)
       from jsonb_array_elements(b.activities) with ordinality as t(a, n))
 where jsonb_array_length(b.activities) > 0;
update public.brain_bases b
   set activities = (
     select jsonb_agg(case when a ->> 'name' in ('Island hopping: lagoons tour', 'Three-islands hopping', 'Island hopping', 'Nusa Penida day trip', 'Four Islands longtail tour', 'Phi Phi & Maya Bay speedboat day', 'Ang Thong Marine Park day', 'Southern islands snorkelling', 'Kayangan Lake & Twin Lagoon tour') and not (a -> 'vibes' ? 'Islands')
                           then jsonb_set(a, '{vibes}', (a -> 'vibes') || '["Islands"]'::jsonb) else a end order by n)
       from jsonb_array_elements(b.activities) with ordinality as t(a, n))
 where jsonb_array_length(b.activities) > 0;
update public.brain_bases b
   set activities = (
     select jsonb_agg(case when a ->> 'name' in ('Giftun island snorkelling', 'Intro scuba dive', 'Wreck diving (2 dives)', 'Balicasag island snorkelling', 'Southern islands snorkelling', 'Ang Thong Marine Park day', 'Phi Phi & Maya Bay speedboat day', 'Four Islands longtail tour') and not (a -> 'vibes' ? 'Diving')
                           then jsonb_set(a, '{vibes}', (a -> 'vibes') || '["Diving"]'::jsonb) else a end order by n)
       from jsonb_array_elements(b.activities) with ordinality as t(a, n))
 where jsonb_array_length(b.activities) > 0;
update public.brain_bases b
   set activities = (
     select jsonb_agg(case when a ->> 'name' in ('Thai spa afternoon', 'Hammam & spa', 'Turkish bath (hammam)', 'Old town walk & sulfur baths', 'Dead Sea day', 'Maquinit hot springs') and not (a -> 'vibes' ? 'Wellness')
                           then jsonb_set(a, '{vibes}', (a -> 'vibes') || '["Wellness"]'::jsonb) else a end order by n)
       from jsonb_array_elements(b.activities) with ordinality as t(a, n))
 where jsonb_array_length(b.activities) > 0;
update public.brain_bases b
   set activities = (
     select jsonb_agg(case when a ->> 'name' in ('Fisherman''s Village evening market', 'Night market seafood', 'Tanneries & artisans tour', 'Khan el-Khalili food walk') and not (a -> 'vibes' ? 'Shopping')
                           then jsonb_set(a, '{vibes}', (a -> 'vibes') || '["Shopping"]'::jsonb) else a end order by n)
       from jsonb_array_elements(b.activities) with ordinality as t(a, n))
 where jsonb_array_length(b.activities) > 0;
update public.brain_bases b
   set activities = (
     select jsonb_agg(case when a ->> 'name' in ('Hot-air balloon at sunrise', 'Hot-air balloon over Luxor', 'Chao Phraya dinner cruise', 'Jimbaran seafood dinner on the beach', 'Promthep Cape sunset & seafood dinner', 'Sunset at Las Cabanas', 'Nile felucca at sunset', 'Lantern-making & Old Town by night') and not (a -> 'vibes' ? 'Romance')
                           then jsonb_set(a, '{vibes}', (a -> 'vibes') || '["Romance"]'::jsonb) else a end order by n)
       from jsonb_array_elements(b.activities) with ordinality as t(a, n))
 where jsonb_array_length(b.activities) > 0;
