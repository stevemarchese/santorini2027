create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  attending boolean not null,
  party_size integer,
  hotel_staying boolean,
  hotel_nights integer,
  window_1_selected boolean not null default false,
  window_2_selected boolean not null default false,
  window_3_selected boolean not null default false,
  window_priority text check (window_priority in ('window_1', 'window_2', 'window_3')),
  travel_timing text check (travel_timing in ('before', 'after', 'both', 'neither')),
  travel_note text,
  dinner_interested boolean,
  cruise_interested boolean,
  note text
);

alter table responses enable row level security;

-- No policies defined: all reads/writes happen server-side via the
-- service-role key, which bypasses RLS. RLS defaults to deny-all for
-- any other key (e.g. if a public anon key is ever introduced later).
