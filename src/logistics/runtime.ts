import { BlockPermutation,EquipmentSlot,system,world,type Block,type EntityEquippableComponent } from '@minecraft/server';
import { key,type Position } from '../kinetic/model.js';
import { barrel,inventoryLocks,stock } from '../machines/runtime.js';
import { PROCESS_RECIPES } from '../recipes/generated.js';
import { FilteredTransfer } from './transfer.js';
const id='bedrockworks:mechanical_funnel';
const positions=new Map<string,Position>(),workers=new Map<string,FilteredTransfer>();let cursor:Iterator<Position>|undefined;
const directions=['north','east','south','west'] as const;
const delta={north:{x:0,z:-1},east:{x:1,z:0},south:{x:0,z:1},west:{x:-1,z:0}};
const raw=new Set(PROCESS_RECIPES.flatMap(r=>r.inputs.map(i=>i.item))),products=new Set(PROCESS_RECIPES.flatMap(r=>r.outputs.map(i=>i.item)));
const p=(block:Block):Position=>({...block.location,dimension:block.dimension.id});
function state(block:Block,name:string,value:string|boolean):void{block.setPermutation(BlockPermutation.resolve(id,{...block.permutation.getAllStates(),[name]:value}));}
export function registerLogistics():void{
 system.beforeEvents.startup.subscribe(event=>event.blockComponentRegistry.registerCustomComponent('bedrockworks:filtered_funnel',{
  beforeOnPlayerPlace:e=>{
   const face=String(e.face).toLowerCase(),facing=face==='east'?'west':face==='west'?'east':face==='north'?'south':face==='south'?'north':'west';
   e.permutationToPlace=BlockPermutation.resolve(id,{...e.permutationToPlace.getAllStates(),'bedrockworks:facing':facing});
  },
  onPlace:e=>{const location=p(e.block);positions.set(key(location),location);},
  onTick:e=>{const location=p(e.block);positions.set(key(location),location);},
  onBreak:e=>{const location=p(e.block);positions.delete(key(location));workers.delete(key(location));},
  onPlayerInteract:e=>{
   if(!e.player?.isValid)return;
   if((e.player.getComponent('minecraft:equippable') as EntityEquippableComponent|undefined)?.getEquipment(EquipmentSlot.Mainhand))return;
   const s=e.block.permutation.getAllStates(),facing=s['bedrockworks:facing'] as typeof directions[number];
   if(e.player.isSneaking)state(e.block,'bedrockworks:facing',directions[(directions.indexOf(facing)+1)%4]!);
   else state(e.block,'bedrockworks:role',s['bedrockworks:role']==='output'?'input':'output');
   const updated=e.block.permutation.getAllStates();e.player.onScreenDisplay.setActionBar({rawtext:[{translate:'factory.funnel.role.'+updated['bedrockworks:role']},{text:' · '},{translate:'factory.funnel.direction.'+updated['bedrockworks:facing']}]});
  },
 }));
 system.runInterval(()=>{
  const deadline=Date.now()+2,visited=new Set<string>();
  for(let i=0;i<8&&Date.now()<deadline;i++){
   cursor??=positions.values();let next=cursor.next();if(next.done){cursor=positions.values();next=cursor.next();}if(next.done)break;
   const location=next.value,k=key(location);if(visited.has(k))break;visited.add(k);
   try{
    let block:Block|undefined;try{block=world.getDimension(location.dimension).getBlock(location);}catch{block=undefined;}
    if(!block){positions.delete(k);workers.delete(k);continue;}
    if(block.typeId!==id){positions.delete(k);workers.delete(k);continue;}
    const states=block.permutation.getAllStates(),facing=states['bedrockworks:facing'] as typeof directions[number],d=delta[facing];
    if(!d)continue;
    const sourcePosition={...location,x:location.x-d.x,z:location.z-d.z},destinationPosition={...location,x:location.x+d.x,z:location.z+d.z};
    const source=barrel(sourcePosition),destination=barrel(destinationPosition);
    let moved=false;
    if(source&&destination){
     let worker=workers.get(k);if(!worker){worker=new FilteredTransfer(inventoryLocks);workers.set(k,worker);}
     moved=worker.tick({sourceId:key(sourcePosition),destinationId:key(destinationPosition),sourceSize:source.container.size,destinationSize:destination.container.size,readSource:i=>stock(source.container.getItem(i)),readDestination:i=>stock(destination.container.getItem(i)),move:(from,to,expected)=>{
      const current=stock(source.container.getItem(from));
      if(!current?.plain||current.item!==expected.item||current.count!==expected.count||destination.container.getItem(to))return false;
      source.container.moveItem(from,to,destination.container);return true;
     }},states['bedrockworks:role']==='input'?raw:products)==='moved';
    }
    if(states['bedrockworks:active']!==moved)state(block,'bedrockworks:active',moved);
   }catch(error){world.setDynamicProperty('bedrockworks:logistics_error',String(error).slice(0,1000));}
  }
 },20);
}
