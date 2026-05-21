'use strict';
const fs=require('fs'); const path=require('path');
const root=path.resolve(__dirname,'..','..','..');
let vault='brain';
try{ vault=JSON.parse(fs.readFileSync(path.join(root,'.brain.json'),'utf8')).vaultDir||'brain'; }catch{}
const required=[ `${vault}/CLAUDE.md`, `${vault}/STATE.md`, `${vault}/index.md`, `${vault}/log.md`,
  `${vault}/journal/.gitkeep`, `${vault}/skills/.gitkeep`, `${vault}/knowledge/.gitkeep`,
  `${vault}/archive/.gitkeep`, '.claude/hooks/brain-lib.js' ];
const missing=required.filter(p=>!fs.existsSync(path.join(root,p)));
const gi=fs.existsSync(path.join(root,'.gitignore'))?fs.readFileSync(path.join(root,'.gitignore'),'utf8'):'';
if(!gi.includes(`${vault}/.brainstate/`)) missing.push(`.gitignore: ${vault}/.brainstate/`);
if(missing.length){ console.log('MISSING:\n'+missing.join('\n')); process.exit(1); }
console.log('STRUCTURE OK'); process.exit(0);
