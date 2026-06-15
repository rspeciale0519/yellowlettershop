-- Task 7 assertion: grants are enforced on mailing_lists; admins see all team
-- resources (decision B); ungranted members see nothing.
do $$
declare creator uuid := gen_random_uuid(); grantee uuid := gen_random_uuid(); other uuid := gen_random_uuid();
        adm uuid := gen_random_uuid(); tid uuid := gen_random_uuid(); lid uuid := gen_random_uuid(); c int;
        wild uuid := gen_random_uuid(); lid2 uuid := gen_random_uuid();
        tid2 uuid := gen_random_uuid(); lid3 uuid := gen_random_uuid();
begin
  insert into auth.users(id) values (creator),(grantee),(other),(adm),(wild);
  insert into teams(id,name,plan,owner_id) values (tid,'T','team',adm),(tid2,'T2','team',adm);
  insert into team_members(team_id,user_id,role) values
    (tid,adm,'admin'),(tid,creator,'member'),(tid,grantee,'member'),(tid,other,'member'),(tid,wild,'member');
  insert into mailing_lists(id,name,created_by,team_id) values
    (lid,'L',creator,tid),(lid2,'L2',creator,tid),(lid3,'L3',creator,tid2);

  -- grantee can't see it yet:
  perform set_config('request.jwt.claims', json_build_object('sub', grantee)::text, true);
  set local role authenticated;
  select count(*) into c from public.mailing_lists where id=lid; reset role;
  if c <> 0 then raise exception 'FAIL: grantee saw list pre-grant'; end if;

  -- admin (decision B) CAN see it:
  perform set_config('request.jwt.claims', json_build_object('sub', adm)::text, true);
  set local role authenticated;
  select count(*) into c from public.mailing_lists where id=lid; reset role;
  if c < 1 then raise exception 'FAIL: admin cannot see team list'; end if;

  -- grant view to grantee -> grantee CAN see:
  insert into resource_permissions(user_id,granted_by,resource_type,resource_id,permission_level,team_id)
    values (grantee, adm, 'mailing_list', lid::text, 'view_only', tid);
  perform set_config('request.jwt.claims', json_build_object('sub', grantee)::text, true);
  set local role authenticated;
  select count(*) into c from public.mailing_lists where id=lid; reset role;
  if c < 1 then raise exception 'FAIL: grant not honored'; end if;

  -- other member (no grant) still cannot see:
  perform set_config('request.jwt.claims', json_build_object('sub', other)::text, true);
  set local role authenticated;
  select count(*) into c from public.mailing_lists where id=lid; reset role;
  if c <> 0 then raise exception 'FAIL: ungranted member saw list'; end if;

  -- wildcard ('*') grant -> grantee CAN see EVERY mailing list in the team:
  insert into resource_permissions(user_id,granted_by,resource_type,resource_id,permission_level,team_id)
    values (wild, adm, 'mailing_list', '*', 'view_only', tid);
  perform set_config('request.jwt.claims', json_build_object('sub', wild)::text, true);
  set local role authenticated;
  select count(*) into c from public.mailing_lists where team_id=tid; reset role;
  if c < 2 then raise exception 'FAIL: wildcard grant did not open all team lists (saw %)', c; end if;

  -- wildcard is team-bound: it must NOT leak another team's list (tid2):
  perform set_config('request.jwt.claims', json_build_object('sub', wild)::text, true);
  set local role authenticated;
  select count(*) into c from public.mailing_lists where id=lid3; reset role;
  if c <> 0 then raise exception 'FAIL: wildcard grant leaked across teams'; end if;

  raise notice 'PASS: grant enforcement + admin visibility + wildcard scope correct';
  rollback;
end $$;
