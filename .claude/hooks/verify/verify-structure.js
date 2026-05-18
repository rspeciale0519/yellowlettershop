'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..', '..'); // yls/
const required = [
  'ylsbrain/CLAUDE.md', 'ylsbrain/STATE.md', 'ylsbrain/index.md', 'ylsbrain/log.md',
  'ylsbrain/journal/.gitkeep', 'ylsbrain/skills/.gitkeep', 'ylsbrain/archive/.gitkeep',
  '.claude/hooks/brain-lib.js'
];
const missing = required.filter(p => !fs.existsSync(path.join(root, p)));
const gi = fs.existsSync(path.join(root, '.gitignore'))
  ? fs.readFileSync(path.join(root, '.gitignore'), 'utf8') : '';
if (!gi.includes('ylsbrain/.brainstate/')) missing.push('.gitignore: ylsbrain/.brainstate/');
if (missing.length) { console.log('MISSING:\n' + missing.join('\n')); process.exit(1); }
console.log('STRUCTURE OK'); process.exit(0);
