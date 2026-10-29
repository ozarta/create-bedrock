import { Leases } from './leases.js';
import { KineticGraph } from './network.js';
import { nearby, key, type Position, type Axis, type Kind, type Node } from './model.js';
import { wheelFlow } from './water.js';
export interface Cell { kind?: Kind; axis?: Axis; rpm?: number; impact?: number; water?: boolean; depth?: number }
export interface WorldPort { read(position:Position): Cell | undefined }
/** Only reads explicit queued/known coordinates. undefined means unavailable, never air. */
export class KineticController {
  readonly graph=new KineticGraph();
  private readonly queue=new Map<string,Position>();
  private cursor?: Iterator<Node>;
  private now=0;
  private readonly leases=new Leases();
  private readonly unloaded=new Leases();
  constructor(private readonly port:WorldPort, private readonly leaseTicks=200, private readonly unloadRetentionTicks=1200) {}
  get tick():number {return this.now;}
  advance(tick:number):void {
    if(!Number.isFinite(tick)||tick<this.now)throw new RangeError('Clock must be monotonic');
    this.now=tick;
    // Tombstones pause connected networks first, then age out without retaining every visited chunk.
    // Native block ticks rediscover returning chunks; never accrue offline production.
    for(const id of this.unloaded.expired(tick,16)) {
      const node=this.graph.nodes.get(id);
      if(node&&!node.available) {
        this.graph.remove(id);this.leases.remove(id);this.queue.delete(id);
        for(const p of nearby(node)) {
          const neighbor=this.graph.nodes.get(key(p));
          if(neighbor){this.graph.upsert({...neighbor,boundary:true});this.touch(neighbor);}
        }
      }
    }
    for (const id of this.leases.expired(tick,16)) {
      const node=this.graph.nodes.get(id);
      if (node?.available) { this.graph.upsert({...node,available:false,boundary:true});this.touch(node); }
    }
  }
  touch(position:Position, urgent=false):void {
    this.queue.set(key(position),position);
    if (urgent) this.graph.invalidateAt(position);
  }
  changed(position:Position):void {
    this.touch(position,true);
    for (const p of nearby(position)) this.touch(p);
  }
  sample(position:Position):void {
    const old=this.graph.nodes.get(key(position)), cell=this.port.read(position);
    if (!cell) {
      if (old) {
        this.graph.upsert({...old,available:false,boundary:true});
        if(!this.unloaded.has(key(position)))this.unloaded.set(key(position),this.now+this.unloadRetentionTicks);
      }
      return;
    }
    this.unloaded.remove(key(position));
    if (!cell.kind) { this.graph.remove(key(position));this.leases.remove(key(position));return; }
    this.leases.set(key(position),this.now+this.leaseTicks);
    const axis=cell.axis ?? 'y';
    let boundary=false;
    for (const p of nearby(position)) {
      const neighbor=this.port.read(p);
      if (!neighbor) boundary=true;
      else if (neighbor.kind && !this.graph.nodes.has(key(p))) { this.touch(p); boundary=true; }
    }
    let sourceRpm=cell.kind==='test_source' ? cell.rpm ?? 0 : 0;
    if (cell.kind==='water_wheel') {
      const samples=([-1,1] as const).map(side => {
        const p={...position,x:position.x+(axis==='z'?side:0),z:position.z+(axis==='x'?side:0)};
        const water=this.port.read(p), above=this.port.read({...p,y:p.y+1});
        return {side,water:water?.water ?? false,depth:water?.depth,waterAbove:above?.water ?? false,loaded:!!water&&!!above};
      });
      const flow=wheelFlow(axis,samples); sourceRpm=flow.rpm; boundary ||= !flow.complete;
    }
    this.graph.upsert({...position,kind:cell.kind,axis,sourceRpm,capacity:cell.kind==='water_wheel'?32:cell.kind==='test_source'?32:0,impact:cell.impact ?? 0,available:true,boundary});
  }
  /** One known-node revalidation always gets a turn, even if discovery queues are busy. */
  poll():void {
    this.cursor ??= this.graph.nodes.values();
    let next=this.cursor.next();
    if (next.done) { this.cursor=this.graph.nodes.values(); next=this.cursor.next(); }
    if (!next.done) this.sample(next.value);
  }
  drain(limit=3,deadline=Infinity,clock:()=>number=()=>Date.now()):number {
    let count=0;
    while (count<limit && clock()<deadline) {
      const first=this.queue.entries().next().value as [string,Position] | undefined;
      if (!first) break;
      this.queue.delete(first[0]);this.sample(first[1]);count++;
    }
    return count;
  }
}
