-- Task 3 assertion: approve_access_request is gated by team admin authority,
-- blocks outsiders, and creates a resource_permissions grant on approval.
do $$
declare adm uuid := gen_random_uuid(); reqer uuid := gen_random_uuid();
        outsider uuid := gen_random_uuid(); tid uuid := gen_random_uuid(); rid uuid := gen_random_uuid();
begin
  insert into auth.users(id) values (adm),(reqer),(outsider);
  insert into teams(id,name,plan,owner_id) values (tid,'T','team',adm);
  insert into team_members(team_id,user_id,role) values (tid,adm,'admin'),(tid,reqer,'member');
  insert into access_requests(id,requester_id,resource_type,resource_id,requested_permission,status,team_id)
    values (rid, reqer, 'mailing_list', 'list-1', 'view_only', 'pending', tid);
  -- An outsider must NOT be able to approve:
  perform set_config('request.jwt.claims', json_build_object('sub', outsider)::text, true);
  begin
    perform public.approve_access_request(rid);
    raise exception 'FAIL: outsider approved';
  exception when others then
    if sqlstate = 'P0001' and sqlerrm like 'FAIL:%' then raise; end if;
    raise notice 'PASS: outsider blocked';
  end;
  -- The team admin MUST approve, creating a grant:
  perform set_config('request.jwt.claims', json_build_object('sub', adm)::text, true);
  perform public.approve_access_request(rid);
  if not exists (select 1 from resource_permissions where user_id=reqer and resource_id='list-1' and revoked_at is null)
    then raise exception 'FAIL: grant not created'; end if;
  raise notice 'PASS: admin approved + grant created';
  rollback;
end $$;
