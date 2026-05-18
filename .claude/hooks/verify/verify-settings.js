'use strict';
const fs=require('fs'); const path=require('path');
const root=path.resolve(__dirname,'..','..','..');
const s=JSON.parse(fs.readFileSync(path.join(root,'.claude/settings.json'),'utf8'));
let fail=[];
['SessionStart','PostToolUse','Stop'].forEach(k=>{ if(!s.hooks||!s.hooks[k]) fail.push('missing '+k); });
['session-start.js','post-tool-use.js','stop.js'].forEach(h=>{
  if(!fs.existsSync(path.join(root,'.claude/hooks',h))) fail.push('missing hook file '+h); });
if(fail.length){ console.log('SETTINGS FAIL:\n'+fail.join('\n')); process.exit(1); }
console.log('SETTINGS OK'); process.exit(0);
