-- Security regression assertion (commit-review CRITICAL): a non-admin member must
-- NOT be able to create a permission_template, nor apply one, to self-grant
-- resource access. Templates are admin-only; apply requires team-admin authority.
do $$
declare adm uuid := gen_random_uuid(); mem uuid := gen_random_uuid();
        tid uuid := gen_random_uuid(); tpl uuid := gen_random_uuid(); ok boolean;
begin
  insert into auth.users(id) values (adm),(mem);
  insert into teams(id,name,plan,owner_id) values (tid,'T','team',adm);
  insert into team_members(team_id,user_id,role) values (tid,adm,'admin'),(tid,mem,'member');

  -- 1) A member cannot INSERT a permission_template (RLS with check is_team_admin):
  perform set_config('request.jwt.claims', json_build_object('sub', mem)::text, true);
  set local role authenticated;
  begin
    insert into public.permission_templates(team_id, name, template_permissions)
      values (tid, 'evil',
        '[{"resource_type":"mailing_list","resource_id":"x","permission_level":"edit"}]'::jsonb);
    ok := true;
  exception when others then ok := false;
  end;
  reset role;
  if ok then raise exception 'FAIL: member created a permission_template'; end if;

  -- 2) Even given an admin-owned template, a member cannot apply it to self-grant:
  insert into public.permission_templates(id, created_by, team_id, name, template_permissions)
    values (tpl, adm, tid, 'real',
      '[{"resource_type":"mailing_list","resource_id":"y","permission_level":"edit"}]'::jsonb);
  perform set_config('request.jwt.claims', json_build_object('sub', mem)::text, true);
  begin
    perform public.apply_permission_template(tpl, mem);
    ok := true;
  exception when others then ok := false;
  end;
  if ok then raise exception 'FAIL: member applied a template to self-grant'; end if;

  raise notice 'PASS: template self-grant escalation blocked';
  rollback;
end $$;
