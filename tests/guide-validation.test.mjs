import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateGuide } from '../tools/validate-guide.mjs';
const data=()=>JSON.parse(readFileSync('build/guide-catalog.json','utf8'));
test('structured guide validates all materialized references and live BP definitions',()=>{
 assert.deepEqual(validateGuide(),{items:1873,recipes:1901,bedrockRecipes:17,javaReferences:1884,tutorials:4});
});
test('unknown ingredient is rejected',()=>{const d=data();d.recipes[0].inputs[0].options=['missing:ingredient'];assert.throws(()=>validateGuide(process.cwd(),d),/Ingrediente u objeto inexistente/);});
test('duplicate recipe is rejected',()=>{const d=data();d.recipes.push(d.recipes[0]);assert.throws(()=>validateGuide(process.cwd(),d),/Receta duplicado/);});
test('broken machine link is rejected',()=>{const d=data();d.recipes[0].machineId='missing:machine';assert.throws(()=>validateGuide(process.cwd(),d),/sin máquina/);});
test('functional recipe without implemented machine is rejected',()=>{const d=data();d.recipes[0].status='functional';d.machines.find(m=>m.id===d.recipes[0].machineId).implemented=false;assert.throws(()=>validateGuide(process.cwd(),d),/funcional sin máquina/);});
test('custom crafting is not marked tested just because its table is native',()=>{const d=data();d.recipes[0].status='functional';assert.throws(()=>validateGuide(process.cwd(),d),/funcional sin máquina\/evidencia/);});
test('reference recipe can never be marked Bedrock craftable',()=>{const d=data();d.recipes.find(r=>r.scope==='java').implemented=true;assert.throws(()=>validateGuide(process.cwd(),d),/Java marcada fabricable/);});
test('missing guide icon is rejected',()=>{const d=data();d.items[0].icon='textures/missing';assert.throws(()=>validateGuide(process.cwd(),d),/Icono faltante/);});
test('missing translation key on a machine page is rejected',()=>{const d=data();d.items[0].operationKey='manual.missing';assert.throws(()=>validateGuide(process.cwd(),d),/Traducción usada faltante/);});
test('normalized counts must match the real BP rather than a second hand-written table',()=>{const d=data();d.recipes[0].inputs[0].count=99;assert.throws(()=>validateGuide(process.cwd(),d),/Cantidades divergentes/);});
test('technical Java source and conditional requirements cannot be silently modified',()=>{const d=data();d.recipes.find(r=>r.scope==='java').technical.type='other:recipe';assert.throws(()=>validateGuide(process.cwd(),d),/Referencia técnica alterada/);});
test('broken tutorial reference is rejected',()=>{const d=data();d.tutorials[0].steps[0].related=['missing:tutorial-item'];assert.throws(()=>validateGuide(process.cwd(),d),/Ingrediente u objeto inexistente/);});
test('processing quantities cannot diverge from the manufacturing engine',()=>{
 const d=data();d.recipes.find(r=>r.source.startsWith('data/processing/')).outputs[0].count=64;
 assert.throws(()=>validateGuide(process.cwd(),d),/Cantidades divergentes del proceso/);
});
