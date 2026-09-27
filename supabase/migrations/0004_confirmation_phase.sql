alter table responses
  add column phase text not null default 'interest'
    check (phase in ('interest', 'confirm')),
  add column email text,
  add column arrival_date date,
  add column departure_date date,
  add constraint responses_dates_ordered
    check (arrival_date is null or departure_date is null or departure_date > arrival_date);

-- Existing rows keep phase = 'interest' via the default. The new flow inserts
-- phase = 'confirm' and never writes the legacy window/travel/dinner columns.
