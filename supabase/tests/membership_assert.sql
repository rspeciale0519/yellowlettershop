-- Task 5 assertion: create_team_and_owner (lazy creation + cache sync),
-- invite_member existing-user 'added' branch, and "already on a team" rejection.
do $$
declare owner_id uuid := gen_random_uuid(); existing uuid := gen_random_uuid(); tid uuid; res jsonb;
begin
  insert into auth.users(id) values (owner_id),(existing);
  update auth.users set email = 'existing@example.com' where id = existing;
  perform set_config('request.jwt.claims', json_build_object('sub', owner_id)::text, true);
  tid := public.create_team_and_owner('My Team');
  if (select role from team_members where team_id=tid and user_id=owner_id) <> 'owner'
    then raise exception 'FAIL: owner membership not created'; end if;
  if (select team_id from user_profiles where user_id=owner_id) is distinct from tid
    then raise exception 'FAIL: owner cache not synced'; end if;
  res := public.invite_member(tid, 'existing@example.com', 'member', 'tok-1');
  if res->>'mode' <> 'added' then raise exception 'FAIL: existing user not added (mode=%)', res->>'mode'; end if;
  if not exists (select 1 from team_members where team_id=tid and user_id=existing and role='member' and status='active')
    then raise exception 'FAIL: member row missing'; end if;
  begin
    perform public.invite_member(tid, 'existing@example.com', 'member', 'tok-2');
    raise exception 'FAIL: re-invite of an existing team member allowed';
  exception when others then
    if sqlerrm like 'FAIL:%' then raise; end if;
    raise notice 'PASS: re-invite blocked';
  end;
  raise notice 'PASS: create_team_and_owner + invite(added) works';
  rollback;
end $$;
