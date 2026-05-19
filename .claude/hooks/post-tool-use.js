'use strict';
const fs = require('fs');
const L = require('./brain-lib');
let input = {}; try { input = JSON.parse(fs.readFileSync(0,'utf8')||'{}'); } catch {}
try {
  const tool = input.tool_name || '';
  const cmd = (input.tool_input && input.tool_input.command) || '';
  if (!/^(Edit|Write|MultiEdit)$/.test(tool)
      && !(tool==='Bash' && /git\s+commit/.test(cmd)))
    process.exit(0);
  const root = L.projectRoot(input);
  const id = input.session_id || 'unknown';
  let detail = (input.tool_input && (input.tool_input.file_path
    || input.tool_input.command)) || tool;
  detail = String(detail).replace(/[\r\n]+/g, ' ').slice(0, 300);
  L.appendLedger(root, id, tool, detail);
  process.exit(0);
} catch (e) { console.error('[brain] post-tool-use failed open: '+e.message); process.exit(0); }
