-- Task 4 assertion: team admins can SELECT their team's access_requests under RLS.
-- Switches to the authenticated role so RLS is enforced (superuser bypasses it).
do $$
declare adm uuid := gen_random_uuid(); mem uuid := gen_random_uuid(); tid uuid := gen_random_uuid(); cnt int;
begin
  insert into auth.users(id) values (adm),(mem);
  insert into teams(id,name,plan,owner_id) values (tid,'T','team',adm);
  insert into team_members(team_id,user_id,role) values (tid,adm,'admin'),(tid,mem,'member');
  insert into access_requests(requester_id,resource_type,resource_id,requested_permission,status,team_id)
    values (mem,'mailing_list','l1','view_only','pending',tid);
  perform set_config('request.jwt.claims', json_build_object('sub', adm)::text, true);
  set local role authenticated;
  select count(*) into cnt from public.access_requests where team_id = tid;
  reset role;
  if cnt < 1 then raise exception 'FAIL: admin cannot see team requests'; end if;
  raise notice 'PASS: admin sees team requests';
  rollback;
end $$;
