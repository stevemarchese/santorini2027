create table if not exists site_content (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
