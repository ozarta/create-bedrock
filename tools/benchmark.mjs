/** V8 synthetic measurements only; no Minecraft TPS/Realms performance claim. */
import { performance } from 'node:perf_hooks';
import { readFileSync,writeFileSync } from 'node:fs';
import { KineticGraph } from '../build/scripts/kinetic/network.js';
import { CatalogIndex } from '../build/scripts/guidebook/model.js';
import { key } from '../build/scripts/kinetic/model.js';
const samples=[];
for(const count of [100,1000,3000]){
 global.gc?.();const heapBefore=process.memoryUsage().heapUsed,graph=new KineticGraph(),start=performance.now();
 for(let x=0;x<count;x++)graph.upsert({dimension:'minecraft:overworld',x,y:0,z:0,kind:x===0?'test_source':'shaft',axis:'x',sourceRpm:x===0?8:0,capacity:x===0?32:0,impact:0,available:true,boundary:false});
 const seeded=performance.now();let calls=0,operations=0,maxStepMs=0;
 while(graph.pending){const t=performance.now();operations+=graph.step(128);maxStepMs=Math.max(maxStepMs,performance.now()-t);calls++;if(calls>100000)throw Error('Unbounded solve');}
 const end=performance.now();global.gc?.();
 if(graph.state(key({dimension:'minecraft:overworld',x:count-1,y:0,z:0})).rpm!==8)throw Error('Wrong graph result');
 samples.push({nodes:count,seedMs:seeded-start,solveMs:end-seeded,maxStepMs,operations,calls,retainedHeapDeltaBytes:process.memoryUsage().heapUsed-heapBefore});
}
global.gc?.();const before=process.memoryUsage().heapUsed,start=performance.now(),raw=readFileSync('build/guide-catalog.json'),data=JSON.parse(raw),index=new CatalogIndex(data),built=performance.now();
for(let i=0;i<100;i++)index.search({name:i%2?'shaft':'cobre',scope:'all'});
const searched=performance.now();global.gc?.();
const result={runtime:process.version,platform:process.platform,scope:'Synthetic V8/Node; NOT Minecraft or Realms; single run, includes JIT/GC noise; heap deltas approximate',graph:samples,catalog:{jsonBytes:raw.length,items:data.items.length,recipes:data.recipes.length,parseAndIndexMs:built-start,searches:100,searchMs:searched-built,retainedHeapDeltaBytes:process.memoryUsage().heapUsed-before},nativeCpuMemory:'not measured',nativeTps:'not measured'};
writeFileSync('dist/qa-performance.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
