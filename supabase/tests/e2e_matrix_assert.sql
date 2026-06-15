-- Task 15: authority-matrix assertion. One team with owner/admin/member/outsider;
-- verifies the negative cases of the §1 matrix that earlier per-task tests didn't.
do $$
declare owner_id uuid := gen_random_uuid(); adm uuid := gen_random_uuid();
        mem uuid := gen_random_uuid(); outsider uuid := gen_random_uuid();
        tid uuid := gen_random_uuid(); rid uuid := gen_random_uuid(); ok boolean;
begin
  insert into auth.users(id) values (owner_id),(adm),(mem),(outsider);
  insert into teams(id,name,plan,max_seats,owner_id) values (tid,'T','team',25,owner_id);
  insert into team_members(team_id,user_id,role) values
    (tid,owner_id,'owner'),(tid,adm,'admin'),(tid,mem,'member');
  insert into access_requests(id,requester_id,resource_type,resource_id,requested_permission,status,team_id)
    values (rid, mem, 'mailing_list', 'l1', 'view_only', 'pending', tid);

  -- member CANNOT approve:
  perform set_config('request.jwt.claims', json_build_object('sub', mem)::text, true);
  begin perform public.approve_access_request(rid); ok := true; exception when others then ok := false; end;
  if ok then raise exception 'FAIL: member approved a request'; end if;

  -- member CANNOT remove another member:
  begin perform public.remove_member(tid, adm); ok := true; exception when others then ok := false; end;
  if ok then raise exception 'FAIL: member removed a teammate'; end if;

  -- member CANNOT delete the team:
  begin perform public.delete_team(tid); ok := true; exception when others then ok := false; end;
  if ok then raise exception 'FAIL: member deleted the team'; end if;

  -- admin CANNOT delete the team (owner-only):
  perform set_config('request.jwt.claims', json_build_object('sub', adm)::text, true);
  begin perform public.delete_team(tid); ok := true; exception when others then ok := false; end;
  if ok then raise exception 'FAIL: admin deleted the team'; end if;

  -- admin CAN approve the request (and not their own):
  perform public.approve_access_request(rid);
  if not exists (select 1 from resource_permissions where user_id=mem and resource_id='l1' and revoked_at is null)
    then raise exception 'FAIL: admin approval did not grant'; end if;

  -- non-super-admin CANNOT change seat limits:
  begin perform public.set_max_seats(tid, 999); ok := true; exception when others then ok := false; end;
  if ok then raise exception 'FAIL: non-super-admin changed seat limit'; end if;

  -- outsider CANNOT see the team roster (RLS):
  perform set_config('request.jwt.claims', json_build_object('sub', outsider)::text, true);
  set local role authenticated;
  if exists (select 1 from public.team_members where team_id = tid) then
    reset role; raise exception 'FAIL: outsider saw the roster';
  end if;
  reset role;

  -- owner CAN transfer ownership to the admin:
  perform set_config('request.jwt.claims', json_build_object('sub', owner_id)::text, true);
  perform public.transfer_ownership(tid, adm);
  if (select teams.owner_id from teams where teams.id=tid) <> adm then raise exception 'FAIL: ownership not transferred'; end if;

  raise notice 'PASS: authority matrix holds';
  rollback;
end $$;
