import test from 'node:test';
import assert from 'node:assert/strict';
import { DATA } from '../build/scripts/guidebook/generated.js';
import { CatalogIndex,normalize,pageOf,recipeBody,matchesTutorial } from '../build/scripts/guidebook/model.js';
import { Navigation } from '../build/scripts/guidebook/navigation.js';
import { renderScreen } from '../build/scripts/guidebook/screens.js';
import { Sessions } from '../build/scripts/multiplayer/sessions.js';
const index=new CatalogIndex(DATA);
function messages(value){return [value,...(value.rawtext??[]).flatMap(messages)];}
test('all eleven requested categories exist and every home button has a route',()=>{
 assert.equal(DATA.categories.length,11);const screen=renderScreen({kind:'home'},index);
 assert.equal(screen.buttons.filter(b=>b.action.kind==='push').length,12);
 assert.ok(screen.buttons.some(b=>b.action.kind==='search'));
});
test('search supports Spanish accents, English, technical IDs and bounded queries',()=>{
 assert.equal(normalize('  INGENIERÍA_MECÁNICA '),'ingenieria mecanica');
 for(const name of ['eje mecanico','SHAFT'])assert.ok(index.search({name,scope:'bedrock'}).some(i=>i.id==='bedrockworks:shaft'));
 assert.ok(index.search({name:'laton',scope:'java'}).length>0);
 assert.ok(index.search({name:'brass',scope:'java'}).length>0);
 assert.equal(index.search({name:'no-such-material-xyz'}).length,0);
 assert.ok(index.search({name:'bedrockworks:water_wheel',scope:'bedrock'}).some(i=>i.id==='bedrockworks:water_wheel'));
});
test('scope, category and availability filters never promote Java recipes',()=>{
 const result=index.search({scope:'bedrock',category:'energy',status:'partial'});
 assert.deepEqual(new Set(result.map(i=>i.id)),new Set(['bedrockworks:water_wheel','bedrockworks:test_source']));
 assert.ok(index.search({scope:'java'}).every(i=>i.status==='upcoming'&&!i.implemented));
 assert.ok(DATA.recipes.filter(r=>r.scope==='java').every(r=>r.status==='upcoming'&&!r.implemented));
});
test('pagination bounds empty, negative, huge and nonfinite page numbers',()=>{
 assert.deepEqual(pageOf([],999),{values:[],page:0,pages:1,total:0});
 assert.equal(pageOf(Array.from({length:40},(_,i)=>i),999).page,2);
 assert.equal(pageOf([1,2],NaN).page,0);assert.equal(pageOf([1,2],-5).page,0);
});
test('recipe view uses structured counts, ingredients and actual crafting station',()=>{
 const recipe=index.produces('bedrockworks:gearbox')[0];
 assert.equal(recipe.inputs.find(i=>i.options.includes('bedrockworks:gear')).count,2);
 assert.equal(recipe.machineId,'builtin:crafting_table');
 const changed=structuredClone(recipe);changed.inputs[0].count=7;
 const rendered=messages(recipeBody(changed,index));
 assert.ok(rendered.some(m=>m.translate==='manual.count'&&m.with[0]==='7'));
 assert.ok(rendered.some(m=>m.translate===index.items.get('minecraft:crafting_table').nameKey));
});
test('material uses and alternatives are reverse-indexed, including sequenced steps',()=>{
 assert.ok(index.uses('minecraft:iron_ingot').some(r=>r.outputs.some(o=>o.itemId==='bedrockworks:shaft_component')));
 assert.ok(index.produces('java:create:andesite_alloy').length>1);
 const sequence=index.recipes.get('java:create:sequenced_assembly/precision_mechanism');
 assert.ok(index.uses('java:create:cogwheel').includes(sequence));
 assert.ok(index.related(index.produces('java:create:andesite_alloy')[0].id).length>0);
});
test('sequence weights remain weights, not impossible percentages; fluids retain Java units',()=>{
 const sequence=index.recipes.get('java:create:sequenced_assembly/precision_mechanism');
 assert.equal(sequence.loops,5);assert.equal(sequence.steps.length,3);
 const output=sequence.outputs.find(o=>o.itemId==='java:create:precision_mechanism');
 assert.equal(output.chanceMode,'weight');assert.equal(output.chance,120);
 const rendered=messages(recipeBody(sequence,index));assert.ok(rendered.some(m=>m.translate==='manual.weight'&&m.with[0]==='120'));
 const filling=index.recipes.get('java:create:filling/honeyed_apple');
 assert.ok(filling.inputs.some(i=>i.unit==='mB'&&i.count===250));
 assert.ok(filling.inputs.flatMap(i=>i.options).some(i=>i.startsWith('java:fluid_tag:')));
});
test('reference includes every materialized type and declares runtime incompleteness',()=>{
 assert.equal(DATA.reference.count,1884);assert.equal(new Set(DATA.recipes.filter(r=>r.scope==='java').map(r=>r.type)).size,25);
 assert.equal(DATA.reference.runtimeFullyEnumerated,false);assert.equal(DATA.reference.dynamicFamilies.length,8);
});
test('every item, recipe and tutorial renders with working item/machine links',()=>{
 for(const entry of DATA.items)assert.ok(renderScreen({kind:'item',id:entry.id},index).buttons.length>0);
 for(const recipe of DATA.recipes){const screen=renderScreen({kind:'recipe',id:recipe.id},index);assert.ok(screen.body.rawtext.length>0);
  for(const button of screen.buttons)if(button.action.kind==='push'&&button.action.route.kind==='item')assert.ok(index.items.has(button.action.route.id));}
 for(const tutorial of DATA.tutorials)for(let step=0;step<tutorial.steps.length;step++)assert.ok(renderScreen({kind:'tutorial',id:tutorial.id,step},index).buttons.length>0);
});
test('history preserves query/page across related item and recipe navigation',()=>{
 const nav=new Navigation(),query={name:'eje',scope:'bedrock',category:'transmission'};
 nav.push({kind:'items',query,page:2});nav.push({kind:'item',id:'bedrockworks:shaft'});nav.push({kind:'recipes',mode:'uses',itemId:'bedrockworks:shaft',page:0});
 nav.replace({...nav.current,page:1});nav.back();assert.equal(nav.current.kind,'item');nav.back();assert.deepEqual(nav.current,{kind:'items',query,page:2});nav.back();assert.equal(nav.back(),false);
});
test('history is bounded and technical pages have no recursive UI calls',()=>{
 const nav=new Navigation();for(let i=0;i<500;i++)nav.push({kind:'technical',id:DATA.recipes[0].id,page:i});
 assert.equal(nav.depth,64);for(let i=0;i<100;i++)nav.back();assert.equal(nav.current.kind,'home');
 const body=renderScreen({kind:'technical',id:'java:create:sequenced_assembly/precision_mechanism',page:999},index);assert.ok(body.buttons.some(b=>b.action.kind==='back'));
});
test('tutorial checks require real matching type, state and exact specified RPM',()=>{
 const step=DATA.tutorials[0].steps.find(s=>s.check?.itemId==='bedrockworks:gear');
 assert.equal(matchesTutorial(step,{itemId:'bedrockworks:gear',axis:'x',rpm:-16,status:'running'}),true);
 for(const value of [{itemId:'bedrockworks:gear',axis:'x',rpm:8,status:'running'},{itemId:'bedrockworks:gear',axis:'x',rpm:0,status:'pending'},{itemId:'bedrockworks:shaft',rpm:-16,status:'running'},{itemId:'bedrockworks:gear',axis:'x',rpm:NaN,status:'running'}])assert.equal(matchesTutorial(step,value),false);
});
test('overload tutorial checks actual demand/capacity, not a fake success flag',()=>{
 const step=DATA.tutorials[1].steps.find(s=>s.check?.mode==='overloaded');
 assert.equal(matchesTutorial(step,{itemId:'bedrockworks:stress_meter',rpm:0,status:'overloaded',stress:1024,capacity:256}),true);
 assert.equal(matchesTutorial(step,{itemId:'bedrockworks:stress_meter',rpm:0,status:'overloaded',stress:512,capacity:128}),false);
});
test('session ownership isolates players and rejects obsolete asynchronous responses',()=>{
 const s=new Sessions(),a=s.acquire('a'),b=s.acquire('b');assert.ok(s.owns('a',a)&&s.owns('b',b));
 s.clear('a');const current=s.acquire('a');assert.equal(s.owns('a',a),false);s.release('a',a);assert.equal(s.owns('a',current),true);
});
test('6.0.10 snake_case fields preserve held catalysts, heat and processing times',()=>{
 const retained=DATA.recipes.filter(r=>r.scope==='java'&&r.technical.keep_held_item===true);
 assert.equal(retained.length,165);
 for(const r of retained)assert.ok(r.inputs.some(i=>i.role==='catalyst'),r.id);
 const timed=DATA.recipes.filter(r=>r.scope==='java'&&r.technical.processing_time!==undefined);
 assert.equal(timed.length,489);
 for(const r of timed)assert.ok(r.conditions.some(c=>c.key==='manual.processing_ticks'&&c.value===String(r.technical.processing_time)),r.id);
 const heated=DATA.recipes.filter(r=>r.scope==='java'&&r.technical.heat_requirement!==undefined);
 assert.equal(heated.length,6);
 for(const r of heated)assert.ok(r.conditions.some(c=>c.key==='manual.heat.'+r.technical.heat_requirement));
 for(const r of DATA.recipes.filter(r=>r.type==='create:sequenced_assembly'&&r.technical.loops===undefined))assert.equal(r.loops,1);
});
test('Java actions and sequences are not mislabeled as one crafting/deployer machine',()=>{
 const application=DATA.recipes.find(r=>r.type==='create:item_application');
 assert.equal(DATA.machines.find(m=>m.id===application.machineId).itemId,'java:action:manual_application');
 const sturdy=DATA.recipes.find(r=>r.type==='create:sequenced_assembly'&&r.outputs.some(o=>o.itemId==='java:create:sturdy_sheet'));
 assert.equal(DATA.machines.find(m=>m.id===sturdy.machineId).itemId,'java:action:sequenced_line');
 assert.ok(sturdy.steps.some(s=>s.machineId==='java:process:create:filling'));
 assert.ok(sturdy.steps.some(s=>s.machineId==='java:process:create:pressing'));
 const campfire=DATA.recipes.find(r=>r.type==='minecraft:campfire_cooking');
 assert.equal(DATA.machines.find(m=>m.id===campfire.machineId).itemId,'java:minecraft:campfire');
});
test('orientation tutorial does not approve a real wheel with the wrong axle',()=>{
 const step=DATA.tutorials[0].steps[1];
 assert.equal(matchesTutorial(step,{itemId:'bedrockworks:water_wheel',status:'idle',rpm:0,axis:'y'}),false);
 assert.equal(matchesTutorial(step,{itemId:'bedrockworks:water_wheel',status:'idle',rpm:0,axis:'x'}),true);
});
