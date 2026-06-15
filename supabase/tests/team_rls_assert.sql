-- Task 6 assertion: a member sees only their own team's roster under RLS.
do $$
declare a uuid := gen_random_uuid(); b uuid := gen_random_uuid();
        t1 uuid := gen_random_uuid(); t2 uuid := gen_random_uuid(); c1 int; c2 int;
begin
  insert into auth.users(id) values (a),(b);
  insert into teams(id,name,plan,owner_id) values (t1,'A','team',a),(t2,'B','team',b);
  insert into team_members(team_id,user_id,role) values (t1,a,'owner'),(t2,b,'owner');
  perform set_config('request.jwt.claims', json_build_object('sub', a)::text, true);
  set local role authenticated;
  select count(*) into c1 from public.team_members where team_id = t1;
  select count(*) into c2 from public.team_members where team_id = t2;
  reset role;
  if c2 <> 0 then raise exception 'FAIL: leaked another team roster (% rows)', c2; end if;
  if c1 < 1 then raise exception 'FAIL: cannot see own roster'; end if;
  raise notice 'PASS: roster isolation correct';
  rollback;
end $$;
