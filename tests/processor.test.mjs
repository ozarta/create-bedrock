import test from 'node:test';
import assert from 'node:assert/strict';
import { AtomicSlotProcessor } from '../build/scripts/machines/processor.js';
import { InventoryLocks } from '../build/scripts/multiplayer/inventory-locks.js';
import { pressWorkPerTick,validateAtomicRecipe } from '../build/scripts/recipes/types.js';
import { PROCESS_RECIPES } from '../build/scripts/recipes/generated.js';
import { KineticGraph } from '../build/scripts/kinetic/network.js';
import { key } from '../build/scripts/kinetic/model.js';
const power={status:'running',rpm:8},recipe=PROCESS_RECIPES[0];
function fixture(count=1,recipeOverride=recipe){
 const slots=[{item:recipeOverride.inputs[0].item,count,plain:true,max:64},undefined,undefined,undefined];let saved;
 const log={writes:0,failBefore:false,failAfter:false,failClear:false};
 const store={load:()=>saved,save:j=>{saved=structuredClone(j);},clear:()=>{if(log.failClear)throw Error('clear failed');saved=undefined;}};
 const port={identity:'world|barrel:0',size:4,read:i=>slots[i]?{...slots[i]}:undefined,replace:(i,expected,out)=>{
  if(log.failBefore)throw Error('failed before native write');
  if(!slots[i]||JSON.stringify(slots[i])!==JSON.stringify(expected))return false;
  slots[i]={...out};log.writes++;if(log.failAfter)throw Error('failed after native write');return true;
 }};
 const processor=new AtomicSlotProcessor(recipeOverride.machine,[recipeOverride],new InventoryLocks());
 return {slots,store,port,log,processor,readJob:()=>saved};
}
function run(f,ticks,p=power){let last;for(let i=0;i<ticks;i++)last=f.processor.tick(f.port,f.store,p);return last;}
test('press follows Java work speed and retains input until one native replacement',()=>{
 assert.equal(pressWorkPerTick(0),0);assert.equal(pressWorkPerTick(8),1);assert.equal(pressWorkPerTick(64),8);assert.equal(pressWorkPerTick(-64),8);
 const f=fixture();run(f,239);assert.equal(f.slots[0].item,recipe.inputs[0].item);assert.equal(f.log.writes,0);
 assert.equal(run(f,1).status,'completed');assert.deepEqual(f.slots[0],{item:recipe.outputs[0].item,count:1,plain:true,max:64});assert.equal(f.log.writes,1);
 run(f,300);assert.equal(f.log.writes,1);
});
test('stack batches preserve counts and charge work for every ingredient',()=>{
 const f=fixture(3);run(f,719);assert.equal(f.slots[0].count,3);assert.equal(f.slots[0].item,recipe.inputs[0].item);
 run(f,1);assert.equal(f.slots[0].count,3);assert.equal(f.slots[0].item,recipe.outputs[0].item);
});
test('no power, overload and invalid RPM never consume ingredients or advance work',()=>{
 const f=fixture();run(f,100);const work=f.readJob().work;
 for(const p of [{status:'overloaded',rpm:0},{status:'pending',rpm:8},{status:'idle',rpm:0},{status:'running',rpm:NaN},{status:'running',rpm:512}])run(f,100,p);
 assert.equal(f.readJob().work,work);assert.equal(f.log.writes,0);assert.equal(f.slots[0].item,recipe.inputs[0].item);
 run(f,140);assert.equal(f.log.writes,1);
});
test('named/custom-data items are rejected and other slots stay unchanged',()=>{
 const f=fixture();f.slots[0].plain=false;f.slots[1]={item:'minecraft:diamond',count:16,plain:true,max:64};const before=structuredClone(f.slots);
 run(f,500);assert.deepEqual(f.slots,before);assert.equal(f.log.writes,0);
});
test('player changes reset time without copying or restoring an old stack',()=>{
 const f=fixture();run(f,200);f.slots[0].count=2;assert.equal(run(f,1).status,'changed');
 run(f,479);assert.equal(f.log.writes,0);run(f,1);assert.equal(f.slots[0].count,2);assert.equal(f.log.writes,1);
});
test('progress survives processor reconstruction but never owns inventory',()=>{
 const f=fixture();run(f,120);f.processor=new AtomicSlotProcessor(recipe.machine,[recipe],new InventoryLocks());run(f,120);
 assert.equal(f.log.writes,1);assert.equal(f.slots[0].count,1);
});
test('native failure before writing cancels ambiguous attempt and redoes work without material loss',()=>{
 const f=fixture();run(f,239);f.log.failBefore=true;assert.equal(run(f,1).status,'fault');assert.equal(f.readJob().phase,'committing');
 f.log.failBefore=false;assert.equal(run(f,1).status,'recovered');assert.equal(f.log.writes,0);assert.equal(f.slots[0].item,recipe.inputs[0].item);
 run(f,239);assert.equal(f.log.writes,0);run(f,1);assert.equal(f.log.writes,1);
});
test('native exception after writing never replays output, even if input is refilled identically',()=>{
 const f=fixture();run(f,239);f.log.failAfter=true;assert.equal(run(f,1).status,'fault');assert.equal(f.log.writes,1);
 f.log.failAfter=false;const product={...f.slots[0]};f.slots[0]={item:recipe.inputs[0].item,count:1,plain:true,max:64};
 assert.equal(run(f,1).status,'recovered');run(f,239);assert.equal(f.log.writes,1);run(f,1);assert.equal(f.log.writes,2);assert.equal(product.count,1);
});
test('journal cleanup failure after commit does not grant a second batch',()=>{
 const f=fixture();run(f,239);f.log.failClear=true;assert.equal(run(f,1).status,'fault');assert.equal(f.log.writes,1);
 f.log.failClear=false;run(f,1);run(f,400);assert.equal(f.log.writes,1);
});
test('read/storage failures never remove or emit items; locks release after exceptions',()=>{
 const f=fixture();const before=structuredClone(f.slots);const read=f.port.read;
 f.port.read=()=>{throw Error('chunk unloaded');};assert.equal(run(f,1).status,'fault');f.port.read=read;
 const save=f.store.save;f.store.save=()=>{throw Error('storage failure');};assert.equal(run(f,1).status,'fault');assert.deepEqual(f.slots,before);
 f.store.save=save;run(f,240);assert.equal(f.log.writes,1);
});
test('full single-slot output capacity and heat conditions pause safely',()=>{
 const r={...recipe,outputs:[{item:recipe.outputs[0].item,count:6}]},f=fixture(11,r);
 assert.equal(run(f,1).status,'capacity');assert.equal(f.log.writes,0);assert.equal(f.slots[0].count,11);
 const heated=fixture(1,{...recipe,heat:'heated'});assert.equal(run(heated,10).status,'condition');assert.equal(heated.log.writes,0);
});
test('corrupt progress recovers without trusting saved output claims',()=>{
 const f=fixture();f.store.save({v:1,phase:'working',recipe:recipe.id,slot:999,input:f.slots[0],work:1e99});assert.equal(run(f,1).status,'recovered');assert.equal(f.log.writes,0);assert.equal(f.slots[0].count,1);
});
test('reentrant competing processors cannot both write the same inventory',()=>{
 const lock=new InventoryLocks();let invoked=false;
 const value=lock.run(['a','b'],()=>{assert.equal(lock.run(['b'],()=>{invoked=true;}),undefined);return true;});
 assert.equal(value,true);assert.equal(invoked,false);assert.equal(lock.run(['a'],()=>42),42);
});
test('unsupported multi-input/multi-output and identity transformations are rejected',()=>{
 for(const r of [{...recipe,inputs:[...recipe.inputs,...recipe.inputs]},{...recipe,outputs:[...recipe.outputs,...recipe.outputs]},{...recipe,outputs:recipe.inputs}])assert.throws(()=>validateAtomicRecipe(r));
});
test('press integrates with real graph stress and overload without bypassing its state',()=>{
 const g=new KineticGraph(),base={dimension:'minecraft:overworld',y:0,z:0,axis:'x',capacity:0,impact:0,sourceRpm:0,available:true,boundary:false};
 const source={...base,x:0,kind:'water_wheel',capacity:32,sourceRpm:8},press={...base,x:1,kind:'mechanical_press',impact:8};g.upsert(source);g.upsert(press);while(g.pending)g.step();
 const state=g.state(key(press));assert.equal(state.rpm,8);assert.equal(state.stress,64);assert.equal(state.capacity,256);
 const f=fixture();run(f,120,state);g.upsert({...base,x:2,kind:'stress_meter',impact:64});while(g.pending)g.step();
 const stopped=g.state(key(press));assert.equal(stopped.status,'overloaded');run(f,200,stopped);assert.equal(f.log.writes,0);assert.equal(f.readJob().work,120);
 g.remove(key({...base,x:2}));while(g.pending)g.step();run(f,120,g.state(key(press)));assert.equal(f.log.writes,1);
});

test('malformed native JSON progress is discarded rather than permanently faulting the press',async()=>{
 const {decodeProgress}=await import('../build/scripts/persistence/progress.js');
 const f=fixture();let raw='{broken';
 const store={load:()=>decodeProgress(raw),save:j=>{raw=JSON.stringify(j);},clear:()=>{raw=undefined;}};
 assert.equal(f.processor.tick(f.port,store,power).status,'recovered');assert.equal(f.log.writes,0);assert.equal(raw,undefined);
 for(let i=0;i<240;i++)f.processor.tick(f.port,store,power);
 assert.equal(f.log.writes,1);assert.equal(f.slots[0].item,recipe.outputs[0].item);
});
