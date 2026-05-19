'use strict';
const fs=require('fs'); const path=require('path');
const root=path.resolve(__dirname,'..','..','..');
let vault='brain';
try{ vault=JSON.parse(fs.readFileSync(path.join(root,'.brain.json'),'utf8')).vaultDir||'brain'; }catch{}
const K=f=>path.join(root,vault,'knowledge',f);
const DOCS=['orientation','superseded','features','roadmap'];
const LAYER={orientation:'orientation',superseded:'reference',features:'reference',roadmap:'roadmap'};
const STATUS=['stub','current','partial','needs-reconcile'];
let fail=[];
for(const slug of DOCS){
  const fp=K(slug+'.md');
  if(!fs.existsSync(fp)){ fail.push(`missing ${vault}/knowledge/${slug}.md`); continue; }
  const txt=fs.readFileSync(fp,'utf8');
  const m=txt.match(/^---\n([\s\S]*?)\n---\n/);
  if(!m){ fail.push(`${slug}.md: no frontmatter`); continue; }
  const fm=m[1];
  if(!/\bkind:\s*knowledge\b/.test(fm)) fail.push(`${slug}.md: kind!=knowledge`);
  if(!new RegExp(`\\bslug:\\s*${slug}\\b`).test(fm)) fail.push(`${slug}.md: slug!=${slug}`);
  const st=(fm.match(/\bstatus:\s*([a-z-]+)/)||[])[1];
  if(!STATUS.includes(st)) fail.push(`${slug}.md: status "${st}" invalid`);
  const ly=(fm.match(/\blayer:\s*([a-z-]+)/)||[])[1];
  if(ly!==LAYER[slug]) fail.push(`${slug}.md: layer "${ly}"!=${LAYER[slug]}`);
  if(!/\bupdated:\s*\d{4}-\d{2}-\d{2}/.test(fm)) fail.push(`${slug}.md: updated missing/!ISO`);
  if(!/\bsources:\s*\n(\s*-\s+\S+\n?)+/.test(fm+'\n')) fail.push(`${slug}.md: sources needs >=1`);
  if(st==='current'){
    const body=txt.slice(m[0].length);
    if(/Not yet built/.test(body)) fail.push(`${slug}.md: status current but stub placeholder remains`);
    if(slug==='orientation' && txt.split('\n').length>120) fail.push(`orientation.md: >120 lines`);
    for(const mm of body.matchAll(/\[\[knowledge\/([a-z-]+)\]\]/g))
      if(!fs.existsSync(K(mm[1]+'.md'))) fail.push(`${slug}.md: dangling [[knowledge/${mm[1]}]]`);
  }
}
if(fail.length){ console.log('KNOWLEDGE FAIL:\n'+fail.join('\n')); process.exit(1); }
console.log('KNOWLEDGE OK'); process.exit(0);
