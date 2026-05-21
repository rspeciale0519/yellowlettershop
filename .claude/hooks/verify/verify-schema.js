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
try {
  const lk = JSON.parse(fs.readFileSync(path.join(root,'.brain.lock'),'utf8')||'{}');
  if (lk && lk.renderManaged) {
    const rel = vault + '/CLAUDE.md';
    const e = lk.renderManaged[rel];
    if (!e) fail.push(`.brain.lock renderManaged: missing entry ${rel}`);
    else {
      if (!/^[0-9a-f]{64}$/.test(String(e.renderedHash||''))) fail.push(`.brain.lock renderManaged.${rel}.renderedHash not 64-hex`);
      if (!/^[0-9a-f]{64}$/.test(String(e.templateHash||''))) fail.push(`.brain.lock renderManaged.${rel}.templateHash not 64-hex`);
      if (!String(e.templateVersion||'').trim()) fail.push(`.brain.lock renderManaged.${rel}.templateVersion empty`);
    }
  }
} catch {} // absent/corrupt .brain.lock: no renderManaged entry to check here — lock integrity is doctor's job, not a vault-schema error
if(fail.length){ console.log('SCHEMA FAIL:\n'+fail.join('\n')); process.exit(1); }
console.log('SCHEMA OK'); process.exit(0);
