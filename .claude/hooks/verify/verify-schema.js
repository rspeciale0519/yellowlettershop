'use strict';
const fs=require('fs'); const path=require('path');
const root=path.resolve(__dirname,'..','..','..');
let vault='brain';
try{ vault=JSON.parse(fs.readFileSync(path.join(root,'.brain.json'),'utf8')).vaultDir||'brain'; }catch{}
let fail=[];
const claude=path.join(root,vault,'CLAUDE.md');
const toks=['## Session-Start Ritual','## Per-task Journal','## Skill','## Knowledge layer',
  '## Consolidation','## Accepted Limitations','no-op','Evidence'];
if(!fs.existsSync(claude)) fail.push(`${vault}/CLAUDE.md absent`);
else { const c=fs.readFileSync(claude,'utf8'); toks.forEach(t=>{ if(!c.includes(t)) fail.push(`${vault}/CLAUDE.md: missing "${t}"`); }); }
const rc=path.join(root,'CLAUDE.md');
if(!fs.existsSync(rc)||!fs.readFileSync(rc,'utf8').includes('<!-- brain:pointer -->'))
  fail.push('root CLAUDE.md: missing <!-- brain:pointer --> sentinel');
if(fail.length){ console.log('SCHEMA FAIL:\n'+fail.join('\n')); process.exit(1); }
console.log('SCHEMA OK'); process.exit(0);
