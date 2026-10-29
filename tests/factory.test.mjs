import test from 'node:test';
import assert from 'node:assert/strict';
import { FilteredTransfer } from '../build/scripts/logistics/transfer.js';
import { AtomicSlotProcessor } from '../build/scripts/machines/processor.js';
import { InventoryLocks } from '../build/scripts/multiplayer/inventory-locks.js';
import { PROCESS_RECIPES } from '../build/scripts/recipes/generated.js';
const plain=(item,count=1)=>({item,count,plain:true,max:64});
function transferPort(source,destination,ids=['source','destination']){
 return {sourceId:ids[0],destinationId:ids[1],sourceSize:source.length,destinationSize:destination.length,
 readSource:i=>source[i]?{...source[i]}:undefined,readDestination:i=>destination[i]?{...destination[i]}:undefined,
 move:(from,to,expected)=>{if(destination[to]||JSON.stringify(source[from])!==JSON.stringify(expected))return false;destination[to]=source[from];source[from]=undefined;return true;}};
}
function processorPort(slots){return {identity:'processing',size:slots.length,read:i=>slots[i]?{...slots[i]}:undefined,replace:(i,expected,out)=>{if(JSON.stringify(slots[i])!==JSON.stringify(expected))return false;slots[i]={...out};return true;}};}
test('native-style whole-stack transfer conserves counts and filters raw vs products',()=>{
 const input=[plain('minecraft:iron_ingot',23)],output=[undefined],worker=new FilteredTransfer(new InventoryLocks()),p=transferPort(input,output);
 assert.equal(worker.tick(p,new Set(['bedrockworks:iron_sheet'])),'no_input');
 assert.equal(worker.tick(p,new Set(['minecraft:iron_ingot'])),'moved');assert.equal(input[0],undefined);assert.equal(output[0].count,23);
 assert.equal(worker.tick(p,new Set(['minecraft:iron_ingot'])),'no_input');
});
test('full destination, custom metadata, aliasing and changed source never copy or overwrite',()=>{
 const locks=new InventoryLocks(),w=new FilteredTransfer(locks),source=[plain('minecraft:iron_ingot')],destination=[plain('minecraft:diamond',64)],allow=new Set(['minecraft:iron_ingot']);
 assert.equal(w.tick(transferPort(source,destination),allow),'full');assert.equal(source[0].count,1);assert.equal(destination[0].item,'minecraft:diamond');
 destination[0]=undefined;source[0].plain=false;assert.equal(w.tick(transferPort(source,destination),allow),'no_input');
 source[0].plain=true;assert.equal(w.tick(transferPort(source,destination,['same','same']),allow),'same_inventory');
 const p=transferPort(source,destination);p.move=()=>false;assert.equal(w.tick(p,allow),'changed');assert.equal(destination[0],undefined);
});
test('ambiguous transfer errors do not restore items or duplicate a successful native move',()=>{
 const source=[plain('minecraft:iron_ingot',64)],destination=[undefined],p=transferPort(source,destination),w=new FilteredTransfer(new InventoryLocks());
 const move=p.move;p.move=(...args)=>{move(...args);throw Error('after native move');};
 assert.equal(w.tick(p,new Set(['minecraft:iron_ingot'])),'fault');p.move=move;
 assert.equal(w.tick(p,new Set(['minecraft:iron_ingot'])),'no_input');assert.equal(destination[0].count,64);
});
test('slot scanning is bounded yet eventually discovers material outside the first four slots',()=>{
 const source=Array(27),destination=Array(27),w=new FilteredTransfer(new InventoryLocks());source[24]=plain('minecraft:iron_ingot');
 let reads=0;const p=transferPort(source,destination),read=p.readSource;p.readSource=i=>{reads++;return read(i);};
 for(let i=0;i<6;i++){const before=reads;assert.equal(w.tick(p,new Set(['minecraft:iron_ingot'])),'no_input');assert.ok(reads-before<=4);}
 assert.equal(w.tick(p,new Set(['minecraft:iron_ingot'])),'moved');assert.equal(destination[0].count,1);
});
test('shared native inventory locks serialize simultaneous press and funnel callbacks',()=>{
 const locks=new InventoryLocks(),worker=new FilteredTransfer(locks),p=transferPort([plain('minecraft:iron_ingot')],[undefined],['processing','output']);
 locks.run(['processing'],()=>assert.equal(worker.tick(p,new Set(['minecraft:iron_ingot'])),'busy'));
 assert.equal(worker.tick(p,new Set(['minecraft:iron_ingot'])),'moved');
});
test('every enabled pressing recipe delivers its real metal sheet',()=>{
 assert.equal(PROCESS_RECIPES.length,3);
 for(const recipe of PROCESS_RECIPES){const slots=[plain(recipe.inputs[0].item)];let record;const store={load:()=>record,save:j=>{record=structuredClone(j);},clear:()=>{record=undefined;}};
  const processor=new AtomicSlotProcessor(recipe.machine,PROCESS_RECIPES,new InventoryLocks());for(let i=0;i<240;i++)processor.tick(processorPort(slots),store,{status:'running',rpm:8});
  assert.equal(slots[0].item,recipe.outputs[0].item);assert.equal(slots[0].count,1);
 }
});
test('automated three-barrel factory processes and collects without any direct player-inventory write',()=>{
 const lock=new InventoryLocks(),source=Array(27),processing=Array(27),destination=Array(27);
 source[0]=plain('minecraft:iron_ingot',2);source[1]=plain('minecraft:copper_ingot');source[2]=plain('minecraft:gold_ingot');
 const inlet=new FilteredTransfer(lock),outlet=new FilteredTransfer(lock),press=new AtomicSlotProcessor('bedrockworks:mechanical_press',PROCESS_RECIPES,lock);
 let record;const journal={load:()=>record,save:j=>{record=structuredClone(j);},clear:()=>{record=undefined;}};
 const raw=new Set(PROCESS_RECIPES.map(r=>r.inputs[0].item)),products=new Set(PROCESS_RECIPES.map(r=>r.outputs[0].item));
 for(let tick=0;tick<1400;tick++){
  if(tick%20===0){inlet.tick(transferPort(source,processing,['source','processing']),raw);outlet.tick(transferPort(processing,destination,['processing','output']),products);}
  press.tick(processorPort(processing),journal,{status:'running',rpm:8});
 }
 assert.equal(source.filter(Boolean).length,0);assert.equal(processing.filter(Boolean).length,0);
 const counts=new Map();for(const s of destination.filter(Boolean))counts.set(s.item,(counts.get(s.item)??0)+s.count);
 assert.deepEqual(Object.fromEntries(counts),{'bedrockworks:iron_sheet':2,'bedrockworks:copper_sheet':1,'bedrockworks:golden_sheet':1});
});
test('failed journal cleanup followed by extraction and identical refill cannot reuse completed work',()=>{
 const lock=new InventoryLocks(),slots=[plain('minecraft:iron_ingot')],out=[undefined],press=new AtomicSlotProcessor('bedrockworks:mechanical_press',PROCESS_RECIPES,lock);
 let record,fail=false;const store={load:()=>record,save:j=>{record=structuredClone(j);},clear:()=>{if(fail)throw Error('fail');record=undefined;}};
 const p=processorPort(slots);for(let i=0;i<239;i++)press.tick(p,store,{status:'running',rpm:8});fail=true;press.tick(p,store,{status:'running',rpm:8});
 const funnel=new FilteredTransfer(lock);assert.equal(funnel.tick(transferPort(slots,out,['processing','out']),new Set(['bedrockworks:iron_sheet'])),'moved');
 slots[0]=plain('minecraft:iron_ingot');fail=false;assert.equal(press.tick(p,store,{status:'running',rpm:8}).status,'recovered');
 for(let i=0;i<239;i++)press.tick(p,store,{status:'running',rpm:8});assert.equal(slots[0].item,'minecraft:iron_ingot');assert.equal(out[0].count,1);
});
