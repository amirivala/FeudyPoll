-- Players may now vote for themselves.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'votes'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%voter_id <> target_id%'
  loop
    execute format('alter table votes drop constraint %I', c.conname);
  end loop;
end $$;
