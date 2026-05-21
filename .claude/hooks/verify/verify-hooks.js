'use strict';
const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
// Hooks are always siblings of the verify/ directory (engine/hooks/ or .claude/hooks/)
let hooks = path.resolve(__dirname, '..');                 // deployed: .claude/hooks/verify -> .claude/hooks
if (!fs.existsSync(path.join(hooks, 'session-start.js')))  // source:   engine/verify     -> engine/hooks
  hooks = path.resolve(__dirname, '..', 'hooks');
// Isolated throwaway vault root so the verifier NEVER reads/writes/deletes the
// real brain vault (user-approved fix for the plan's destructive verifier defect).
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'brain-vt-'));
const vaultName = 'brain';
const jdir = path.join(sandbox, vaultName, 'journal');
fs.mkdirSync(jdir, { recursive: true });
fs.writeFileSync(path.join(sandbox, vaultName, 'STATE.md'), '# STATE\n');
const bs = path.join(sandbox, vaultName, '.brainstate');
// Write a .brain.json so the hooks pick up the correct vault dir
fs.writeFileSync(path.join(sandbox, '.brain.json'), JSON.stringify({ vaultDir: vaultName, project: 'test' }));
const today = new Date().toISOString().slice(0, 10);
function reset(){
  fs.rmSync(bs, { recursive:true, force:true });
  fs.rmSync(path.join(jdir, today + '.md'), { force:true });
}
function run(script, input){
  return cp.spawnSync(process.execPath, [path.join(hooks, script)],
    { input: JSON.stringify(input), encoding:'utf8' });
}
// Safe JSON read: returns null and pushes a reason on failure instead of throwing.
function safeReadJson(filePath, label, fails){
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    fails.push(label + ': ' + e.message);
    return null;
  }
}
let fails = [];
try {
  reset();
  // 1. session-start injects and creates sentinel
  let r = run('session-start.js', { session_id:'T1', cwd:sandbox });
  if (!/STATE/.test(r.stdout) || !fs.existsSync(path.join(bs,'T1.sentinel'))) {
    fails.push('session-start did not inject/sentinel'
      + ' [status=' + r.status + ' stdout=' + JSON.stringify(r.stdout.slice(0,200))
      + ' stderr=' + JSON.stringify(r.stderr.slice(0,200)) + ']');
  }
  // 2. post-tool-use writes a ledger line
  r = run('post-tool-use.js', { session_id:'T1', tool_name:'Write', tool_input:{file_path:'app/x.ts'}, cwd:sandbox });
  const ledger = path.join(bs,'T1.ledger');
  if (!fs.existsSync(ledger) || !fs.readFileSync(ledger,'utf8').includes('Write')) {
    fails.push('ledger not written'
      + ' [status=' + r.status + ' stderr=' + JSON.stringify(r.stderr.slice(0,200)) + ']');
  }
  // 3. stop blocks when unconsumed work and no covering entry
  r = run('stop.js', { session_id:'T1', cwd:sandbox });
  if (r.status !== 2) {
    fails.push('stop did not block (expected exit 2), got ' + r.status
      + ' [stdout=' + JSON.stringify(r.stdout.slice(0,200))
      + ' stderr=' + JSON.stringify(r.stderr.slice(0,200)) + ']');
  }
  // 4. write a covering journal entry -> stop passes + watermark advances
  fs.writeFileSync(path.join(jdir, today+'.md'),
    `# ${today}\n\n### [23:59] test task (branch: feature/brain · commits: none)\n`+
    `**Synopsis:** s\n**What worked:** w. Evidence: manual: verified\n`+
    `**What did NOT work:** none\n**Artifacts:** a\n**Next / open:** none\n`);
  r = run('stop.js', { session_id:'T1', cwd:sandbox });
  if (r.status !== 0) {
    fails.push('stop did not pass after covering entry, got ' + r.status
      + ' [stdout=' + JSON.stringify(r.stdout.slice(0,200))
      + ' stderr=' + JSON.stringify(r.stderr.slice(0,200)) + ']');
  }
  const brain = safeReadJson(path.join(bs,'brain.json'), 'brain.json missing after stop', fails);
  if (brain !== null && !brain.lastCoveredTs) fails.push('watermark not advanced');
  // 5. loop-breaker: force 2 blocks then fail open
  reset(); run('session-start.js',{session_id:'T2',cwd:sandbox});
  run('post-tool-use.js',{session_id:'T2',tool_name:'Edit',tool_input:{file_path:'a.ts'},cwd:sandbox});
  run('stop.js',{session_id:'T2',cwd:sandbox}); run('stop.js',{session_id:'T2',cwd:sandbox});
  r = run('stop.js',{session_id:'T2',cwd:sandbox});
  if (r.status !== 0) {
    fails.push('loop-breaker did not fail open on 3rd block'
      + ' [status=' + r.status + ' stderr=' + JSON.stringify(r.stderr.slice(0,200)) + ']');
  }
  // 6. PII heuristic warns (and stop still passes with a covering entry)
  reset(); run('session-start.js',{session_id:'T3',cwd:sandbox});
  run('post-tool-use.js',{session_id:'T3',tool_name:'Write',tool_input:{file_path:'a.ts'},cwd:sandbox});
  fs.writeFileSync(path.join(jdir, today+'.md'),
    `# ${today}\n\n### [23:58] s (branch: x · commits: none)\n**Synopsis:** s\n`+
    `**What worked:** key sk_live_abcdefghij. Evidence: manual: x\n`+
    `**What did NOT work:** none\n**Artifacts:** a\n**Next / open:** none\n`);
  r = run('stop.js',{session_id:'T3',cwd:sandbox});
  if (!/PII|secret/i.test(r.stdout + r.stderr)) {
    fails.push('PII heuristic did not warn'
      + ' [status=' + r.status + ' stdout=' + JSON.stringify(r.stdout.slice(0,200))
      + ' stderr=' + JSON.stringify(r.stderr.slice(0,200)) + ']');
  }
  if (r.status !== 0) {
    fails.push('stop blocked after PII warn (should pass with covering entry), got ' + r.status
      + ' [stdout=' + JSON.stringify(r.stdout.slice(0,200)) + ']');
  }
} catch (e) {
  fails.push('unexpected exception: ' + e.message);
} finally {
  // teardown: remove the entire throwaway sandbox (real brain vault never touched)
  fs.rmSync(sandbox, { recursive:true, force:true });
}
if (fails.length){ console.log('HOOKS FAIL:\n'+fails.join('\n')); process.exit(1); }
console.log('HOOKS OK'); process.exit(0);
