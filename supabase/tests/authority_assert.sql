-- Task 2 assertion: SECURITY DEFINER authority helpers resolve per-team roles.
-- Uses set_config(...,true) to simulate each user's JWT inside the transaction.
do $$
declare owner_id uuid := gen_random_uuid(); mem_id uuid := gen_random_uuid(); tid uuid := gen_random_uuid();
begin
  insert into auth.users(id) values (owner_id),(mem_id);
  insert into teams(id,name,plan,owner_id) values (tid,'T','team',owner_id);
  insert into team_members(team_id,user_id,role) values (tid,owner_id,'owner'),(tid,mem_id,'member');
  perform set_config('request.jwt.claims', json_build_object('sub', owner_id)::text, true);
  if not public.is_team_admin(tid) then raise exception 'FAIL: owner should be admin'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', mem_id)::text, true);
  if public.is_team_admin(tid) then raise exception 'FAIL: member must NOT be admin'; end if;
  if not public.is_team_member(tid) then raise exception 'FAIL: member should be member'; end if;
  raise notice 'PASS: authority helpers correct';
  rollback;
end $$;
