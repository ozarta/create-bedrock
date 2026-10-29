import { readFileSync,existsSync,readdirSync } from 'node:fs';
import { join,resolve,sep } from 'node:path';
import { MinecraftItemTypes,MinecraftBlockTypes } from '@minecraft/vanilla-data';
const native=new Set([...Object.values(MinecraftItemTypes),...Object.values(MinecraftBlockTypes)]);
const fail=message=>{throw new Error(message);};
function indexed(values,name){const map=new Map();for(const value of values){if(!value.id||map.has(value.id))fail(`${name} duplicado: ${value.id}`);map.set(value.id,value);}return map;}
const read=path=>JSON.parse(readFileSync(path,'utf8'));
export function validateGuide(root=process.cwd(),catalog=read(join(root,'build/guide-catalog.json'))){
 const items=indexed(catalog.items,'Objeto del manual'),recipes=indexed(catalog.recipes,'Receta'),machines=indexed(catalog.machines,'Máquina'),categories=indexed(catalog.categories,'Categoría'),tutorials=indexed(catalog.tutorials,'Tutorial');
 const required=new Set(Object.keys(read(join(root,'data/guide/ui.json'))));
 const references=read(join(root,'data/reference/create-6.0.10-recipes.json'));
 if(catalog.reference.commit!=='ac0c444d9828da3453ae8cc65338e8de063286fb'||catalog.reference.count!==references.recipes.length)fail('Cobertura o versión Java incorrecta');
 const manufacturing=read(join(root,'data/processing/recipes.json'));
 const upstream=indexed(references.recipes,'Receta de referencia');
 if(catalog.recipes.filter(r=>r.scope==='java').length!==upstream.size)fail('Cobertura Java incompleta');
 const registered=new Set();
 for(const dir of ['blocks','items'])for(const path of readdirSync(join(root,'behavior_pack',dir))){if(!path.endsWith('.json'))continue;const file=read(join(root,'behavior_pack',dir,path));registered.add(file['minecraft:block']?.description.identifier??file['minecraft:item']?.description.identifier);}
 const icon=path=>{const full=resolve(root,'resource_pack',path+'.png');if(!full.startsWith(resolve(root,'resource_pack')+sep)||!existsSync(full))fail(`Icono faltante: ${path}`);};
 const item=id=>{if(!items.has(id))fail(`Ingrediente u objeto inexistente: ${id}`);return items.get(id);};
 const reference=id=>{if(!recipes.has(id))fail(`Referencia rota a receta: ${id}`);};
 const allowed=['functional','partial','upcoming'];
 const processes=indexed(catalog.processes,'Proceso');for(const p of processes.values())required.add(p.nameKey);
 for(const recipe of catalog.recipes)if(recipe.scope==='java'&&!processes.has(recipe.type))fail('Proceso sin traducción');
 for(const c of categories.values()){required.add(c.nameKey);icon(c.icon);}
 for(const entry of items.values()){
  if(!categories.has(entry.category)||!allowed.includes(entry.status))fail(`Categoría/estado inválido: ${entry.id}`);
  for(const field of ['nameKey','descriptionKey','operationKey','energyKey','exampleKey','errorsKey']){if(!entry[field])fail(`Ficha incompleta: ${entry.id}/${field}`);required.add(entry[field]);}
  if(!entry.names.es_MX||!entry.names.en_US)fail(`Nombre de búsqueda faltante: ${entry.id}`);
  icon(entry.icon);
  if(entry.scope==='java'&&(entry.status!=='upcoming'||entry.implemented))fail(`Referencia Java marcada disponible: ${entry.id}`);
  if(entry.scope==='bedrock'&&entry.implemented&&entry.kind==='item'&&!registered.has(entry.nativeId)&&!native.has(entry.nativeId))fail(`Ingrediente Bedrock inexistente: ${entry.nativeId}`);
  if(entry.scope==='bedrock'&&entry.kind==='tag'&&entry.nativeId!=='minecraft:planks')fail(`Etiqueta Bedrock no verificada: ${entry.nativeId}`);
 }
 for(const machine of machines.values()){
  const entry=item(machine.itemId);
  if(machine.implemented&&!entry.implemented)fail(`Máquina sin implementación: ${machine.id}`);
  if(machine.builtin&&!native.has(entry.nativeId))fail(`Máquina nativa inexistente: ${machine.id}`);
 }
 const ingredient=input=>{
  if(!input.options.length)fail('Ingrediente vacío');for(const id of input.options)item(id);
  if(input.count===null){if(input.unit!=='unknown')fail('Cantidad desconocida sin marcar');}
  else if(!Number.isFinite(input.count)||input.count<=0)fail('Cantidad de ingrediente inválida');
 };
 const output=out=>{
  item(out.itemId);if(!Number.isFinite(out.count)||out.count<=0)fail('Cantidad de resultado inválida');
  if(out.chanceMode==='independent'&&(!(out.chance>=0)||out.chance>1))fail('Probabilidad independiente inválida');
  if(out.chanceMode==='weight'&&(!(out.chance>=0)||!Number.isFinite(out.chance)))fail('Peso de secuencia inválido');
 };
 for(const recipe of recipes.values()){
  const machine=machines.get(recipe.machineId);if(!machine)fail(`Receta sin máquina correspondiente: ${recipe.id}`);
 for(const value of recipe.inputs)ingredient(value);for(const value of recipe.outputs)output(value);
  if(!allowed.includes(recipe.status))fail('Estado de receta inválido');
  if(recipe.status==='functional'&&(!recipe.implemented||!machine.implemented||(!machine.builtin||recipe.outputs.some(o=>items.get(o.itemId)?.nativeId.startsWith('bedrockworks:')))&&!recipe.gameVerified))fail(`Receta funcional sin máquina/evidencia: ${recipe.id}`);
  if(recipe.scope==='java'){
   if(recipe.status!=='upcoming'||recipe.implemented)fail(`Receta Java marcada fabricable: ${recipe.id}`);
   const original=upstream.get(recipe.id.slice(5));if(!original||JSON.stringify(original.raw)!==JSON.stringify(recipe.technical))fail(`Referencia técnica alterada: ${recipe.id}`);
  }
  if(recipe.source.startsWith('data/processing/')){
   const definition=manufacturing.find(r=>r.id===recipe.id);if(!definition||JSON.stringify(definition)!==JSON.stringify(recipe.technical))fail('Proceso divergente del catálogo');
   if(recipe.machineId!==definition.machine||!registered.has(recipe.machineId)||!machine.implemented)fail('Proceso sin máquina real');
   if(definition.inputs.length!==1||definition.outputs.length!==1||definition.inputs[0].item===definition.outputs[0].item||definition.work<=0)fail('Transacción de proceso no soportada');
   if(recipe.inputs.length!==1||recipe.outputs.length!==1||recipe.inputs[0].options.length!==1||recipe.inputs[0].options[0]!==definition.inputs[0].item||recipe.inputs[0].count!==definition.inputs[0].count||recipe.outputs[0].itemId!==definition.outputs[0].item||recipe.outputs[0].count!==definition.outputs[0].count)fail('Cantidades divergentes del proceso');
   if(recipe.type!=='bedrock:'+definition.process||!recipe.implemented||recipe.scope!=='bedrock')fail('Tipo o disponibilidad de proceso divergente');
  }
  if(recipe.source.startsWith('behavior_pack/')){
   const actual=read(join(root,recipe.source));if(JSON.stringify(actual)!==JSON.stringify(recipe.technical))fail(`Catálogo divergente del BP: ${recipe.id}`);
   if(recipe.scope!=='bedrock'||!recipe.implemented)fail('Receta nativa mal registrada');
   const nativeRecipe=Object.entries(actual).find(([k])=>k.startsWith('minecraft:recipe_'))[1];
   let inputs=nativeRecipe.ingredients;
   if(!inputs){inputs=[];for(const [symbol,spec] of Object.entries(nativeRecipe.key))for(let i=0;i<nativeRecipe.pattern.reduce((sum,row)=>sum+[...row].filter(c=>c===symbol).length,0);i++)inputs.push(spec);}
   const counts=new Map();
   for(const value of inputs){const options=(Array.isArray(value)?value:[value]).map(v=>v.item.includes(':')?v.item:'minecraft:'+v.item).sort();const key=JSON.stringify(options);counts.set(key,(counts.get(key)??0)+1);}
   const actualCounts=new Map(recipe.inputs.map(i=>[JSON.stringify([...i.options].sort()),i.count]));
   if(counts.size!==actualCounts.size||[...counts].some(([key,value])=>actualCounts.get(key)!==value))fail(`Cantidades divergentes del BP: ${recipe.id}`);
   const result=nativeRecipe.result,id=result.item.includes(':')?result.item:'minecraft:'+result.item;
   if(recipe.outputs.length!==1||recipe.outputs[0].itemId!==id||recipe.outputs[0].count!==(result.count??1))fail(`Resultado divergente del BP: ${recipe.id}`);
  }
  if(!recipe.partialModel&&(!recipe.inputs.length||!recipe.outputs.length))fail(`Receta normalizada incompleta: ${recipe.id}`);
  for(const c of recipe.conditions)required.add(c.key);
  for(const step of recipe.steps??[]){if(!machines.has(step.machineId))fail('Paso sin máquina correspondiente');for(const value of step.inputs)ingredient(value);for(const value of step.outputs)output(value);}
  if(recipe.steps&&(!Number.isInteger(recipe.loops)||recipe.loops<=0))fail('Número de ciclos inválido');
 }
 for(const dir of ['recipes'])for(const path of readdirSync(join(root,'behavior_pack',dir))){if(!path.endsWith('.json'))continue;const raw=read(join(root,'behavior_pack',dir,path));const recipe=Object.entries(raw).find(([k])=>k.startsWith('minecraft:recipe_'))?.[1];reference(recipe.description.identifier);}
 for(const [tag,members] of Object.entries(catalog.tagMembers)){item(tag);for(const member of members)item(member);}
 for(const t of tutorials.values()){
  required.add(t.titleKey);if(!t.steps.length)fail(`Tutorial vacío: ${t.id}`);
  for(const s of t.steps){required.add(s.titleKey);required.add(s.bodyKey);icon(s.image);for(const id of s.related)item(id);
   if(s.check){const entry=item(s.check.itemId);if(!registered.has(entry.nativeId))fail(`Tutorial verifica bloque no implementado: ${entry.id}`);}
  }
 }
 for(const family of catalog.reference.dynamicFamilies){required.add(family.descriptionKey);if(!references.dynamic_families.some(f=>f.id===family.id&&f.source===family.source))fail('Familia dinámica sin procedencia');}
 const pack=read(join(root,'resource_pack/manifest.json'));if(catalog.resourcePackId!==pack.header.uuid)fail('Referencia rota al RP de imágenes');
 const maps=[];
 for(const folder of ['behavior_pack','resource_pack'])for(const locale of ['es_MX','en_US']){
  const map=new Map(readFileSync(join(root,folder,'texts',locale+'.lang'),'utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)];}));maps.push(map);
 }
 for(const key of required)for(const map of maps)if(!map.get(key))fail(`Traducción usada faltante: ${key}`);
 return {items:items.size,recipes:recipes.size,bedrockRecipes:catalog.recipes.filter(r=>r.scope==='bedrock').length,javaReferences:upstream.size,tutorials:tutorials.size};
}
