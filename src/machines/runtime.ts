import { ItemStack,system,world,type BlockInventoryComponent,type Block } from '@minecraft/server';
import { key,type Position } from '../kinetic/model.js';
import { kinetics,onKineticLifecycle,setKineticVisualProperty } from '../kinetic/runtime.js';
import { PROCESS_RECIPES } from '../recipes/generated.js';
import { InventoryLocks } from '../multiplayer/inventory-locks.js';
import { AtomicSlotProcessor,type JobStore,type Stock,type SlotPort,type ProcessResult } from './processor.js';
import { decodeProgress } from '../persistence/progress.js';
export const inventoryLocks=new InventoryLocks();
const known=new Map<string,Position>();let cursor:Iterator<Position>|undefined;
const processors=new Map<string,AtomicSlotProcessor>(),states=new Map<string,ProcessResult>();
const property=(p:Position)=>'bedrockworks:press.'+p.dimension.replace(/[^a-zA-Z0-9_]/g,'_')+'.'+p.x+'.'+p.y+'.'+p.z;
const position=(block:Block):Position=>({...block.location,dimension:block.dimension.id});
function store(p:Position):JobStore{return {
 load:()=>decodeProgress(world.getDynamicProperty(property(p))),
 save:job=>world.setDynamicProperty(property(p),JSON.stringify(job)),
 clear:()=>world.setDynamicProperty(property(p),undefined),
};}
export function stock(item:ItemStack|undefined):Stock|undefined{
 if(!item)return undefined;
 return {item:item.typeId,count:item.amount,max:item.maxAmount,plain:item.getDynamicPropertyIds().length===0&&item.isStackableWith(new ItemStack(item.typeId))};
}
export function barrel(p:Position):{block:Block;container:NonNullable<BlockInventoryComponent['container']>}|undefined{
 let block:Block|undefined;try{block=world.getDimension(p.dimension).getBlock(p);}catch{return undefined;}
 if(block?.typeId!=='minecraft:barrel')return undefined;
 const container=(block.getComponent('minecraft:inventory') as BlockInventoryComponent|undefined)?.container;
 return container?{block,container}:undefined;
}
function port(p:Position):SlotPort|undefined{
 const bp={...p,y:p.y-1},native=barrel(bp);if(!native)return undefined;
 return {identity:key(bp),size:native.container.size,read:slot=>stock(native.container.getItem(slot)),replace:(slot,expected,out)=>{
  // No await, no slot removal, no ItemEntity spawn, no cross-container fabrication.
  const machine=world.getDimension(p.dimension).getBlock(p),energy=kinetics.graph.state(key(p));
  if(machine?.typeId!=='bedrockworks:mechanical_press'||energy.status!=='running'||energy.rpm===0)return false;
  const current=stock(native.container.getItem(slot));
  if(!current?.plain||current.item!==expected.item||current.count!==expected.count||current.max!==expected.max)return false;
  const output=new ItemStack(out.item,out.count);if(output.maxAmount<out.count)return false;
  native.container.setItem(slot,output);return true;
 }};
}
function forget(p:Position):void{
 const id=key(p);known.delete(id);processors.delete(id);states.delete(id);
 // This property never contains items, only disposable progress.
 world.setDynamicProperty(property(p),undefined);
}
export function machineState(p:Position):ProcessResult|undefined{return states.get(key(p));}
export function registerMachines():void{
 onKineticLifecycle({
  placed:block=>{if(block.typeId==='bedrockworks:mechanical_press'){const p=position(block);forget(p);known.set(key(p),p);}},
  tick:block=>{if(block.typeId==='bedrockworks:mechanical_press'){const p=position(block);known.set(key(p),p);}},
  broken:block=>{const p=position(block);if(known.has(key(p)))forget(p);},
 });
 system.runInterval(()=>{
  const deadline=Date.now()+3,visited=new Set<string>();
  for(let i=0;i<8&&Date.now()<deadline;i++){
   cursor??=known.values();let next=cursor.next();if(next.done){cursor=known.values();next=cursor.next();}if(next.done)break;
   const p=next.value,id=key(p);if(visited.has(id))break;visited.add(id);
   try{
    let block:Block|undefined;try{block=world.getDimension(p.dimension).getBlock(p);}catch{block=undefined;}
    if(!block){known.delete(id);processors.delete(id);states.delete(id);continue;}
    if(block.typeId!=='bedrockworks:mechanical_press'){forget(p);continue;}
    const native=port(p);if(!native){states.set(id,{status:'no_input',progress:0,work:0,total:0});continue;}
    let processor=processors.get(id);if(!processor){processor=new AtomicSlotProcessor('bedrockworks:mechanical_press',PROCESS_RECIPES.filter(r=>r.machine==='bedrockworks:mechanical_press'),inventoryLocks);processors.set(id,processor);}
    const output=processor.tick(native,store(p),kinetics.graph.state(id));states.set(id,output);
    setKineticVisualProperty(p,'bedrockworks:progress',output.progress);
   }catch(error){world.setDynamicProperty('bedrockworks:factory_error',String(error).slice(0,1000));}
  }
 },1);
}
