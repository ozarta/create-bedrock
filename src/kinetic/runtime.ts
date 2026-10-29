import { MACHINE_SPECS } from '../recipes/generated.js';
import { BlockPermutation, system, world, type Block, type Entity, type Player } from '@minecraft/server';
import { KineticController, type Cell } from './controller.js';
import { AXES, KINDS, key, type Axis, type Kind, type Node, type Position } from './model.js';
const prefix='bedrockworks:';
interface Lifecycle {placed?:(block:Block)=>void;broken?:(block:Block)=>void;tick?:(block:Block)=>void}
const listeners=new Set<Lifecycle>();
export function onKineticLifecycle(listener:Lifecycle):void{listeners.add(listener);}
export function setKineticVisualProperty(p:Position,name:string,value:number):void{const e=visuals.get(key(p));if(e?.isValid)e.setProperty(name,value);}

function withState(p:BlockPermutation,name:string,value:string|number):BlockPermutation {
  return BlockPermutation.resolve(p.type.id,{...p.getAllStates(),[name]:value});
}
const position=(block:Block):Position=>({...block.location,dimension:block.dimension.id});
function read(p:Position):Cell|undefined {
  try {
    const dim=world.getDimension(p.dimension);
    if (p.y<dim.heightRange.min || p.y>=dim.heightRange.max) return {};
    const block=dim.getBlock(p);
    if (!block) return undefined;
    const suffix=block.typeId.slice(prefix.length);
    const states=block.permutation.getAllStates();
    if (block.typeId.startsWith(prefix) && KINDS.includes(suffix as Kind)) {
      return {kind:suffix as Kind,axis:states['bedrockworks:axis'] as Axis,
        rpm:Number(states['bedrockworks:source_rpm'] ?? 0),impact:MACHINE_SPECS.find(s=>s.kind===suffix)?.impact ?? Number(states['bedrockworks:brake'] ?? 0)};
    }
    return {water:block.typeId==='minecraft:water'||block.typeId==='minecraft:flowing_water',depth:block.permutation.getState('liquid_depth') as number|undefined};
  } catch { return undefined; } // Unavailable chunks are not air and never supply capacity.
}
export const kinetics=new KineticController({read});
const visuals=new Map<string,Entity>();
let visualCursor:Iterator<Node>|undefined;
let cleanupCursor:Iterator<[string,Entity]>|undefined;
let lastError=0;
function visualize(n:Node):void {
  const id=key(n), state=kinetics.graph.state(id);
  let entity=visuals.get(id);
  if (!n.available) { if (entity?.isValid) entity.setProperty(prefix+'rpm',0); visuals.delete(id); return; }
  const cell=read(n);
  if (!cell || cell.kind!==n.kind || cell.axis!==n.axis) { kinetics.changed(n); if (entity?.isValid) entity.remove(); visuals.delete(id); return; }
  const dimension=world.getDimension(n.dimension), location={x:n.x+.5,y:n.y,z:n.z+.5};
  const type=prefix+'visual_'+n.kind;
  if (entity?.isValid && entity.typeId!==type) { entity.remove(); visuals.delete(id); entity=undefined; }
  if (!entity?.isValid) {
    if (visuals.size>=256) return; // Physics continues; visuals deliberately capped.
    const existing=dimension.getEntities({type,location,maxDistance:.2});
    entity=existing[0];
    for (const extra of existing.slice(1)) extra.remove();
    entity ??= dimension.spawnEntity(type,location);
    visuals.set(id,entity);
  }
  entity.setProperty(prefix+'rpm',state.rpm);
  entity.setProperty(prefix+'axis',AXES.indexOf(n.axis));
  entity.setProperty(prefix+'load',state.capacity>0?Math.min(1,state.stress/state.capacity):0);
}
function change(block:Block):void {
  const p=position(block);kinetics.changed(p);
  const entity=visuals.get(key(p));
  if (entity?.isValid) entity.setProperty(prefix+'rpm',0);
}
function broken(block:Block):void {
  change(block);
  const id=key(position(block)),entity=visuals.get(id);
  if(entity?.isValid)entity.remove();visuals.delete(id);
  for(const listener of listeners)listener.broken?.(block);
}
function cleanup():void {
  cleanupCursor ??= visuals.entries();
  let entry=cleanupCursor.next();
  if(entry.done){cleanupCursor=visuals.entries();entry=cleanupCursor.next();}
  if(entry.done)return;
  const [id,entity]=entry.value;
  if(!entity.isValid){visuals.delete(id);return;}
  const p={x:Math.floor(entity.location.x),y:Math.floor(entity.location.y),z:Math.floor(entity.location.z),dimension:entity.dimension.id};
  const cell=read(p);
  if(!cell){entity.setProperty(prefix+'rpm',0);visuals.delete(id);return;}
  if(entity.typeId!==prefix+'visual_'+cell.kind){entity.remove();visuals.delete(id);return;}
  entity.setProperty(prefix+'rpm',kinetics.graph.state(id).rpm);
}
function interact(block:Block,player:Player|undefined):void {
  if (!player) return;
  const kind=read(position(block))?.kind;
  if (player.isSneaking) {
    const axis=block.permutation.getAllStates()[prefix+'axis'] as Axis;
    block.setPermutation(withState(block.permutation,prefix+'axis',(kind==='mechanical_press'?(axis==='x'?'z':'x'):AXES[(AXES.indexOf(axis)+1)%3]!)));change(block);
  } else if (kind==='test_source') {
    const values=[0,8,16,32,64,-8,-16,-32,-64], current=Number(block.permutation.getAllStates()[prefix+'source_rpm']);
    block.setPermutation(withState(block.permutation,prefix+'source_rpm',values[(values.indexOf(current)+1)%values.length]!));change(block);
  } else if (kind==='stress_meter') {
    const values=[0,8,64], current=Number(block.permutation.getAllStates()[prefix+'brake']);
    block.setPermutation(withState(block.permutation,prefix+'brake',values[(values.indexOf(current)+1)%values.length]!));change(block);
  }
}
export function registerKinetics():void {
  system.beforeEvents.startup.subscribe(event=>event.blockComponentRegistry.registerCustomComponent(prefix+'kinetic',{
    beforeOnPlayerPlace:e=> {
      const face=String(e.face).toLowerCase();
      let axis=face==='up'||face==='down'?'y':face==='east'||face==='west'?'x':'z';
      if(e.permutationToPlace.type.id==='bedrockworks:mechanical_press'&&axis==='y')axis='x';
      e.permutationToPlace=withState(e.permutationToPlace,prefix+'axis',axis);
    },
    onPlace:e=>{change(e.block);for(const listener of listeners)listener.placed?.(e.block);},onBreak:e=>broken(e.block),
    onTick:e=>{kinetics.touch(position(e.block));for(const listener of listeners)listener.tick?.(e.block);},
    onPlayerInteract:e=>interact(e.block,e.player),
  }));
  // Native fluid updates and /setblock replacement are additionally caught by bounded sampling.
  world.afterEvents.playerPlaceBlock.subscribe(e=>kinetics.changed(position(e.block)));
  world.afterEvents.playerBreakBlock.subscribe(e=>broken(e.block));
  world.afterEvents.entityLoad.subscribe(({entity})=> {
    if (!entity.typeId.startsWith(prefix+'visual_')) return;
    entity.setProperty(prefix+'rpm',0);
    const p={x:Math.floor(entity.location.x),y:Math.floor(entity.location.y),z:Math.floor(entity.location.z),dimension:entity.dimension.id};
    kinetics.touch(p,true);
    const cell=read(p);
    if (!cell || entity.typeId!==prefix+'visual_'+cell.kind) {entity.remove();return;}
    const id=key(p),previous=visuals.get(id);
    if(previous?.isValid&&previous.id!==entity.id){entity.remove();return;}
    if(!visuals.has(id)&&visuals.size>=256){entity.remove();return;}
    visuals.set(id,entity); // Adopt restored entities under the same cap; do not accumulate loaded orphans.
  });
  system.runInterval(()=> {
    try {
      const start=Date.now();
      kinetics.advance(system.currentTick);
      kinetics.poll(); kinetics.drain(3,start+2);
      kinetics.graph.step(128,start+4);
      for (let i=0;i<4 && Date.now()<start+6;i++) {
        visualCursor ??= kinetics.graph.nodes.values();
        let next=visualCursor.next();
        if (next.done) { visualCursor=kinetics.graph.nodes.values();next=visualCursor.next(); }
        if (next.done) break;
        visualize(next.value);
      }
      for(let i=0;i<4 && Date.now()<start+6;i++)cleanup();
    } catch (error) {
      if (system.currentTick-lastError>200) { try { world.setDynamicProperty(prefix+'last_error',String(error).slice(0,1000)); } catch { /* Shutdown. */ } lastError=system.currentTick; }
    }
  },1);
  system.runInterval(()=> {
    for (const player of world.getAllPlayers()) {
      try {
        const block=player.getBlockFromViewDirection({maxDistance:6})?.block;
        if (!block || !['bedrockworks:speed_meter','bedrockworks:stress_meter'].includes(block.typeId)) continue;
        const state=kinetics.graph.state(key(position(block)));
        player.onScreenDisplay.setActionBar({rawtext:[{translate:'kinetic.reading',with:[state.rpm.toFixed(1),state.stress.toFixed(0),state.capacity.toFixed(0)]},{translate:'kinetic.status.'+state.status}]});
      } catch { /* Player or chunk disappeared between ticks. */ }
    }
  },5);
}
