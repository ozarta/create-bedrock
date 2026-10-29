import { rmSync, mkdirSync, cpSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { validate } from './validate.mjs';
// Delete generated scripts first: a failed compilation must never package stale output.
rmSync('build/scripts', { recursive: true, force: true });
rmSync('behavior_pack/scripts', { recursive: true, force: true });
const audit=spawnSync(process.platform==='win32'?'py':'python3',[...(process.platform==='win32'?['-3']:[]),'tools/qa-static.py'],{stdio:'inherit'});
if(audit.status!==0)process.exit(audit.status??1);
const processing=spawnSync(process.platform==='win32'?'py':'python3',[...(process.platform==='win32'?['-3']:[]),'tools/generate_processing.py'],{stdio:'inherit'});
if(processing.status!==0)process.exit(processing.status??1);
const generated = spawnSync(process.platform === 'win32' ? 'py' : 'python3', [...(process.platform === 'win32' ? ['-3'] : []), 'tools/generate_guide.py'], { stdio: 'inherit' });
if (generated.status !== 0) process.exit(generated.status ?? 1);
const result = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json'], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);
mkdirSync('behavior_pack/scripts', { recursive: true });
cpSync('build/scripts', 'behavior_pack/scripts', { recursive: true });
validate();
console.log('TypeScript compilado y referencias locales validadas. Minecraft no ejecutado.');
