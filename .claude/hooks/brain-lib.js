'use strict';
const fs = require('fs');
const path = require('path');

function projectRoot(input) {
  return (input && input.cwd) ? input.cwd
    : path.resolve(__dirname, '..', '..');
}
function brainConfig(root) {
  try { return JSON.parse(fs.readFileSync(path.join(root, '.brain.json'), 'utf8')) || {}; }
  catch { return {}; }
}
function vaultDir(root) {
  const v = brainConfig(root).vaultDir;
  return (typeof v === 'string' && v) ? v : 'brain';
}
function projectName(root) {
  const n = brainConfig(root).project;
  return (typeof n === 'string' && n) ? n : require('path').basename(root);
}
const P = (root, ...p) => path.join(root, vaultDir(root), ...p);
const stateDir = root => P(root, '.brainstate');

function ensureDir(d){ fs.mkdirSync(d, { recursive:true }); }
function readJson(f, dflt){ try { return JSON.parse(fs.readFileSync(f,'utf8')); }
  catch { return dflt; } }
function writeJson(f, o){ ensureDir(path.dirname(f)); fs.writeFileSync(f, JSON.stringify(o,null,2)); }
const nowIso = () => new Date().toISOString();

function brainFile(root){ return path.join(stateDir(root),'brain.json'); }
function getBrain(root){ return readJson(brainFile(root),
  { lastCoveredTs:'', lastConsolidationTs:'', taskCountSinceConsolidation:0 }); }
function setBrain(root,b){ writeJson(brainFile(root), b); }

function sentinelFile(root,id){ return path.join(stateDir(root), id+'.sentinel'); }
function ledgerFile(root,id){ return path.join(stateDir(root), id+'.ledger'); }

function appendLedger(root,id,tool,detail){
  ensureDir(stateDir(root));
  fs.appendFileSync(ledgerFile(root,id), `${nowIso()}\t${tool}\t${detail}\n`);
}
function allLedgerLines(root){
  const d = stateDir(root); if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(f=>f.endsWith('.ledger'))
    .flatMap(f=>fs.readFileSync(path.join(d,f),'utf8').split('\n').filter(Boolean))
    .map(l=>{ const ts=l.split('\t')[0];
      return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(ts) ? { ts, raw:l } : null; })
    .filter(Boolean);
}
function unconsumed(root){
  const b = getBrain(root);
  return allLedgerLines(root).filter(x => !b.lastCoveredTs || x.ts > b.lastCoveredTs);
}

function latestJournal(root){
  const jd = P(root,'journal'); if (!fs.existsSync(jd)) return null;
  const files = fs.readdirSync(jd).filter(f=>/^\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort();
  return files.length ? path.join(jd, files[files.length-1]) : null;
}
// returns array of {day:'YYYY-MM-DD', ok:boolean} for each ### [HH:MM] block in the latest day file
function journalBlocks(root){
  const f = latestJournal(root); if (!f) return [];
  const day = path.basename(f,'.md');
  const txt = fs.readFileSync(f,'utf8');
  const blocks = txt.split(/^### \[/m).slice(1);
  return blocks.map(bk=>{
    const ok = /\*\*What did NOT work:\*\*\s*\S/.test(bk) && /Evidence:\s*\S/.test(bk);
    return { day, ok };
  });
}
const PII = [/sk_live_[A-Za-z0-9]/, /AKIA[0-9A-Z]{16}/, /BEGIN [A-Z ]*PRIVATE KEY/,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, /\b\d{3}[-.]\d{3}[-.]\d{4}\b/,
  /\b[0-9a-fA-F]{40,}\b/];
function scanSecrets(text){ return PII.some(re=>re.test(text)); }

module.exports = { projectRoot, brainConfig, vaultDir, projectName, P, stateDir,
  ensureDir, readJson, writeJson, nowIso,
  getBrain, setBrain, sentinelFile, ledgerFile, appendLedger, allLedgerLines,
  unconsumed, latestJournal, journalBlocks, scanSecrets };
