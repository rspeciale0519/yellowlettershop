'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..', '..'); // yls/
const K = (f) => path.join(root, 'ylsbrain', 'knowledge', f);
const DOCS = ['orientation', 'superseded', 'features', 'roadmap'];
const LAYER = { orientation: 'orientation', superseded: 'reference', features: 'reference', roadmap: 'roadmap' };
const STATUS = ['current', 'partial', 'needs-reconcile'];
let fail = [];

// 1. four docs exist with parseable frontmatter
for (const slug of DOCS) {
  const fp = K(slug + '.md');
  if (!fs.existsSync(fp)) { fail.push(`missing ylsbrain/knowledge/${slug}.md`); continue; }
  const txt = fs.readFileSync(fp, 'utf8');
  const m = txt.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) { fail.push(`${slug}.md: no frontmatter block`); continue; }
  const fm = m[1];
  if (!/\bkind:\s*knowledge\b/.test(fm)) fail.push(`${slug}.md: kind != knowledge`);
  if (!new RegExp(`\\bslug:\\s*${slug}\\b`).test(fm)) fail.push(`${slug}.md: slug != ${slug}`);
  const st = (fm.match(/\bstatus:\s*([a-z-]+)/) || [])[1];
  if (!STATUS.includes(st)) fail.push(`${slug}.md: status "${st}" not in ${STATUS.join('|')}`);
  const ly = (fm.match(/\blayer:\s*([a-z-]+)/) || [])[1];
  if (ly !== LAYER[slug]) fail.push(`${slug}.md: layer "${ly}" != ${LAYER[slug]}`);
  if (!/\bupdated:\s*\d{4}-\d{2}-\d{2}/.test(fm)) fail.push(`${slug}.md: updated date missing/!ISO`);
  if (!/\bsources:\s*\n(\s*-\s+\S+\n?)+/.test(fm + '\n')) fail.push(`${slug}.md: sources: needs >=1 entry`);
}

// 2. orientation.md <= 120 lines (hard, one-screen rule)
if (fs.existsSync(K('orientation.md'))) {
  const n = fs.readFileSync(K('orientation.md'), 'utf8').split('\n').length;
  if (n > 120) fail.push(`orientation.md: ${n} lines > 120 (one-screen rule)`);
}

// 3. required section anchors per doc
const NEED = {
  'features.md':   ['## BUILT', '## PARTIAL', '## PLANNED', '## SUPERSEDED'],
  'superseded.md': ['doc said', 'truth', 'why'],
  'roadmap.md':    ['## ', 'dev-docs/roadmap.md'],
  'orientation.md':['where it', 'transactional'],
};
for (const [f, toks] of Object.entries(NEED)) {
  if (!fs.existsSync(K(f))) continue;
  const c = fs.readFileSync(K(f), 'utf8');
  toks.forEach(t => { if (!c.includes(t)) fail.push(`${f}: missing anchor "${t}"`); });
}

// 4. wikilinks to knowledge/* must resolve to an existing file
for (const slug of DOCS) {
  if (!fs.existsSync(K(slug + '.md'))) continue;
  const c = fs.readFileSync(K(slug + '.md'), 'utf8');
  for (const mm of c.matchAll(/\[\[knowledge\/([a-z-]+)\]\]/g)) {
    if (!fs.existsSync(K(mm[1] + '.md'))) fail.push(`${slug}.md: dangling [[knowledge/${mm[1]}]]`);
  }
}

// 5. protocol wiring present
const claude = path.join(root, 'ylsbrain', 'CLAUDE.md');
const idx = path.join(root, 'ylsbrain', 'index.md');
const cc = fs.existsSync(claude) ? fs.readFileSync(claude, 'utf8') : '';
if (!cc.includes('Knowledge layer')) fail.push('ylsbrain/CLAUDE.md: missing "Knowledge layer" block');
if (!cc.includes('kind: knowledge')) fail.push('ylsbrain/CLAUDE.md: missing kind: knowledge contract');
if (!cc.includes('git log --name-only')) fail.push('ylsbrain/CLAUDE.md: missing mechanical consolidation clause');
const ic = fs.existsSync(idx) ? fs.readFileSync(idx, 'utf8') : '';
if (!ic.includes('## Knowledge')) fail.push('ylsbrain/index.md: missing "## Knowledge" section');

if (fail.length) { console.log('KNOWLEDGE FAIL:\n' + fail.join('\n')); process.exit(1); }
console.log('KNOWLEDGE OK'); process.exit(0);
