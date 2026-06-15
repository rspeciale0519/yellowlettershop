-- Task 1 assertion (single DO block per CLI constraint; internal rollback cleans up).
-- Asserts team_members + team_invitations exist and the partial-unique
-- "one active team per user" index rejects a 2nd active membership.
do $$
declare uid uuid := gen_random_uuid(); t1 uuid := gen_random_uuid(); t2 uuid := gen_random_uuid();
begin
  if to_regclass('public.team_members') is null then raise exception 'FAIL: team_members missing'; end if;
  if to_regclass('public.team_invitations') is null then raise exception 'FAIL: team_invitations missing'; end if;
  insert into auth.users(id) values (uid);
  insert into teams(id,name,plan,owner_id) values (t1,'A','team',uid),(t2,'B','team',uid);
  insert into team_members(team_id,user_id,role) values (t1,uid,'owner');
  begin
    insert into team_members(team_id,user_id,role) values (t2,uid,'member');
    raise exception 'FAIL: second active membership was allowed';
  exception
    when unique_violation then raise notice 'PASS: partial-unique enforced';
  end;
  rollback;
end $$;
