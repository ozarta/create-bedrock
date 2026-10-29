import assert from 'node:assert/strict';
import { createDemo,settleDemo } from '../build/scripts/kinetic/demo.js';
import { key } from '../build/scripts/kinetic/model.js';
import { AtomicSlotProcessor } from '../build/scripts/machines/processor.js';
import { FilteredTransfer } from '../build/scripts/logistics/transfer.js';
import { InventoryLocks } from '../build/scripts/multiplayer/inventory-locks.js';
import { PROCESS_RECIPES } from '../build/scripts/recipes/generated.js';
const {controller,positions}=createDemo({blocks:[
 {x:3,y:2,z:0,kind:'water_wheel',axis:'x'},
 {x:2,y:2,z:0,kind:'shaft',axis:'x'},{x:1,y:2,z:0,kind:'shaft',axis:'x'},
 {x:0,y:2,z:0,kind:'mechanical_press',axis:'x',impact:8}],
 water:[{x:3,y:2,z:1,depth:8},{x:3,y:3,z:1,depth:0}],
 expected:{wheel_rpm:8,output_rpm:8,capacity:256,stress:64}});
settleDemo(controller);const energy=controller.graph.state(key(positions.at(-1)));
assert.equal(energy.status,'running');assert.equal(energy.rpm,8);assert.equal(energy.capacity,256);assert.equal(energy.stress,64);
const locks=new InventoryLocks(),input=Array(27),barrel=Array(27),output=Array(27);
for(const [i,r] of PROCESS_RECIPES.entries())input[i]={item:r.inputs[0].item,count:i===0?2:1,max:64,plain:true};
let job;const journal={load:()=>job,save:j=>{job=structuredClone(j);},clear:()=>{job=undefined;}};
const press=new AtomicSlotProcessor('bedrockworks:mechanical_press',PROCESS_RECIPES,locks),inlet=new FilteredTransfer(locks),outlet=new FilteredTransfer(locks);
const allowedInputs=new Set(PROCESS_RECIPES.map(r=>r.inputs[0].item)),allowedOutputs=new Set(PROCESS_RECIPES.map(r=>r.outputs[0].item));
const read=(slots,i)=>slots[i]?{...slots[i]}:undefined;
const port=(source,destination,sourceId,destinationId)=>({sourceId,destinationId,sourceSize:27,destinationSize:27,readSource:i=>read(source,i),readDestination:i=>read(destination,i),move:(from,to,expected)=>{if(destination[to]||JSON.stringify(source[from])!==JSON.stringify(expected))return false;destination[to]=source[from];source[from]=undefined;return true;}});
const processing={identity:'processing',size:27,read:i=>read(barrel,i),replace:(i,expected,out)=>{if(JSON.stringify(barrel[i])!==JSON.stringify(expected))return false;barrel[i]={...out};return true;}};
for(let tick=0;tick<1400;tick++){
 if(tick%20===0){inlet.tick(port(input,barrel,'input','processing'),allowedInputs);outlet.tick(port(barrel,output,'processing','output'),allowedOutputs);}
 press.tick(processing,journal,energy);
}
assert.equal(input.filter(Boolean).length,0);assert.equal(barrel.filter(Boolean).length,0);
const results=Object.fromEntries(output.filter(Boolean).map(s=>[s.item,s.count]));
assert.deepEqual(results,{'bedrockworks:iron_sheet':2,'bedrockworks:copper_sheet':1,'bedrockworks:golden_sheet':1});
console.log(JSON.stringify({simulation:'Node inventory and water ports; Minecraft NOT executed',ticks:1400,energy,results},null,2));
