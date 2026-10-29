import test from 'node:test';
import assert from 'node:assert/strict';
import { KineticGraph } from '../build/scripts/kinetic/network.js';
import { ratio,key } from '../build/scripts/kinetic/model.js';
import { wheelFlow } from '../build/scripts/kinetic/water.js';
import { KineticController } from '../build/scripts/kinetic/controller.js';
const node=(x,y=0,z=0,extra={})=>({dimension:'minecraft:overworld',x,y,z,kind:'shaft',axis:'x',sourceRpm:0,capacity:0,impact:0,available:true,boundary:false,...extra});
const source=(x=0,extra={})=>node(x,0,0,{kind:'test_source',sourceRpm:8,capacity:32,...extra});
function finish(g){let turns=0;while(g.pending&&turns++<100000)g.step(31);assert.ok(!g.pending,'graph must finish');}
function make(...nodes){const g=new KineticGraph();for(const n of nodes)g.upsert(n);finish(g);return g;}
test('shaft ports require alignment, axis and dimension',()=>{
 assert.equal(ratio(node(0),node(1)),1);
 assert.equal(ratio(node(0),node(0,1)),0);
 assert.equal(ratio(node(0),node(1,0,0,{axis:'z'})),0);
 assert.equal(ratio(node(0),node(1,0,0,{dimension:'minecraft:nether'})),0);
});
test('small gears reverse only coplanar side connections',()=>{
 const a=node(0,0,0,{kind:'gear',axis:'y'});
 assert.equal(ratio(a,node(1,0,0,{kind:'gear',axis:'y'})),-1);
 assert.equal(ratio(a,node(0,1,0,{kind:'gear',axis:'y'})),1);
 assert.equal(ratio(a,node(1,0,0,{kind:'gear',axis:'z'})),0);
});
test('large-small gears require a plane diagonal and use reciprocal signed ratios',()=>{
 const a=node(0,0,0,{kind:'large_gear',axis:'y'}),b=node(1,0,1,{kind:'gear',axis:'y'});
 assert.equal(ratio(a,b),-2);assert.equal(ratio(b,a),-.5);
 assert.equal(ratio(a,node(1,0,0,{kind:'gear',axis:'y'})),0);
 assert.equal(ratio(a,node(1,1,1,{kind:'gear',axis:'y'})),0);
});
test('large perpendicular gears preserve Java sign rule and reject parallel neighbors',()=>{
 const a=node(0,0,0,{kind:'large_gear',axis:'x'});
 assert.equal(ratio(a,node(1,1,0,{kind:'large_gear',axis:'y'})),1);
 assert.equal(ratio(a,node(1,-1,0,{kind:'large_gear',axis:'y'})),-1);
 assert.equal(ratio(a,node(1,1,0,{kind:'large_gear',axis:'x'})),0);
});
test('gearbox blocks its axis and resolves opposite/perpendicular port handedness',()=>{
 const a=source(),box=node(1,0,0,{kind:'gearbox',axis:'y'}),straight=node(2),turn=node(1,0,1,{axis:'z'});
 const g=make(a,box,straight,turn);
 assert.equal(g.state(key(straight)).rpm,-8);
 assert.equal(g.state(key(turn)).rpm,8);
 assert.equal(ratio(box,node(1,1,0,{axis:'y'})),0);
});
test('speed conversion affects consumption without inventing source capacity',()=>{
 const s=source(),large=node(1,0,0,{kind:'large_gear'}),small=node(1,1,1,{kind:'gear'}),load=node(2,1,1,{impact:8});
 const g=make(s,large,small,load),state=g.state(key(load));
 assert.equal(state.rpm,-16);assert.equal(state.capacity,256);assert.equal(state.stress,128);
});
test('capacity boundary runs; overload stops every member and recovers',()=>{
 const s=source(),load=node(1,0,0,{impact:32}),g=make(s,load);
 assert.equal(g.state(key(load)).rpm,8);
 g.upsert({...load,impact:64});assert.equal(g.state(key(s)).rpm,0);
 finish(g);assert.equal(g.state(key(load)).status,'overloaded');assert.equal(g.state(key(s)).rpm,0);
 assert.equal(g.state(key(load)).stress,512);
 g.upsert(load);finish(g);assert.equal(g.state(key(load)).rpm,8);
});
test('matching sources add capacity; conflicting speeds stop rather than destroy blocks',()=>{
 const a=source(),b=source(1),load=node(2,0,0,{impact:64}),g=make(a,b,load);
 assert.equal(g.state(key(load)).capacity,512);assert.equal(g.state(key(load)).rpm,8);
 g.upsert({...b,sourceRpm:-8});finish(g);assert.equal(g.state(key(a)).status,'conflict');
 assert.equal(g.size,3);
 g.upsert({...b,sourceRpm:16});finish(g);assert.equal(g.state(key(a)).status,'conflict');
});
test('splitting a network leaves the disconnected half idle and reconnects correctly',()=>{
 const a=source(),b=node(1),c=node(2),d=node(3),g=make(a,b,c,d);
 g.remove(key(b));assert.equal(g.state(key(d)).rpm,0);finish(g);
 assert.equal(g.state(key(a)).members,1);assert.equal(g.state(key(c)).status,'idle');assert.equal(g.state(key(d)).members,2);
 g.upsert(b);finish(g);assert.equal(g.state(key(d)).rpm,8);assert.equal(g.state(key(d)).members,4);
});
test('consistent square gear loop terminates',()=>{
 const gears=[[0,0],[1,0],[1,1],[0,1]].map(([x,z])=>node(x,0,z,{kind:'gear',axis:'y'}));
 gears[0].sourceRpm=8;gears[0].capacity=32;
 const g=make(...gears);assert.equal(g.state(key(gears[2])).rpm,8);assert.equal(g.state(key(gears[1])).rpm,-8);
});
test('odd perpendicular gear loop stops as inconsistent',()=>{
 const a=node(0,0,0,{kind:'large_gear',axis:'x',sourceRpm:8,capacity:32});
 const b=node(1,1,0,{kind:'large_gear',axis:'y'}),c=node(1,0,1,{kind:'large_gear',axis:'z'});
 const g=make(a,b,c);assert.equal(g.state(key(c)).status,'conflict');assert.equal(g.state(key(c)).rpm,0);
});
test('mutation during solve cannot publish stale topology',()=>{
 const nodes=Array.from({length:30},(_,i)=>i===0?source():node(i));
 const g=new KineticGraph();for(const n of nodes)g.upsert(n);
 g.step(8);g.remove(key(nodes[2]));finish(g);
 assert.equal(g.state(key(nodes.at(-1))).status,'idle');assert.equal(g.state(key(nodes[0])).members,2);
});
test('unrelated network remains valid during selective invalidation',()=>{
 const a=source(),b=node(1),c=source(100),d=node(101),g=make(a,b,c,d);
 g.remove(key(b));assert.equal(g.state(key(d)).rpm,8);finish(g);
 assert.equal(g.state(key(d)).rpm,8);
});
test('unavailable members or boundary pause entire connected graph and recover',()=>{
 const a=source(),b=node(1),g=make(a,b);
 g.upsert({...b,available:false});finish(g);assert.equal(g.state(key(a)).status,'unloaded');
 g.upsert({...b,boundary:true});finish(g);assert.equal(g.state(key(a)).rpm,0);
 g.upsert(b);finish(g);assert.equal(g.state(key(a)).rpm,8);
});
test('overspeed stops without deleting topology; nonfinite inputs are rejected',()=>{
 const a=source(0,{sourceRpm:512}),g=make(a,node(1));
 assert.equal(g.state(key(a)).status,'overspeed');assert.equal(g.size,2);
 assert.throws(()=>g.upsert({...a,sourceRpm:NaN}),RangeError);
});
test('3000 nodes are processed under operation and deadline budgets without recursion',()=>{
 const g=new KineticGraph();for(let i=0;i<3000;i++)g.upsert(i===0?source():node(i));
 assert.equal(g.step(100,0,()=>1),0);
 for(let i=0;i<10;i++)assert.ok(g.step(7)<=7);
 assert.equal(g.state(key(node(2999))).rpm,0);
 finish(g);assert.equal(g.state(key(node(2999))).rpm,8);assert.equal(g.state(key(node(2999))).members,3000);
});
test('falling water requires depth and water above; opposite sides cancel',()=>{
 const fall={side:1,water:true,depth:8,waterAbove:true,loaded:true};
 assert.deepEqual(wheelFlow('x',[fall]),{rpm:8,complete:true});
 assert.equal(wheelFlow('z',[fall]).rpm,-8);
 assert.equal(wheelFlow('y',[fall]).rpm,0);
 for(const change of [{depth:0},{waterAbove:false},{water:false},{depth:undefined}])assert.equal(wheelFlow('x',[{...fall,...change}]).rpm,0);
 assert.equal(wheelFlow('x',[fall,{...fall,side:-1}]).rpm,0);
 assert.equal(wheelFlow('x',[{...fall,loaded:false}]).complete,false);
});
test('world adapter detects fluid removal, block replacement, unload and reconstruction',()=>{
 const cells=new Map(),unloaded=new Set();
 const port={read:p=>unloaded.has(key(p))?undefined:cells.get(key(p))??{}};
 const wheel=node(0,0,0,{kind:'water_wheel'}),shaft=node(1),water=node(0,0,1),above=node(0,1,1);
 cells.set(key(wheel),{kind:'water_wheel',axis:'x'});cells.set(key(shaft),{kind:'shaft',axis:'x'});
 cells.set(key(water),{water:true,depth:8});cells.set(key(above),{water:true,depth:0});
 function settle(c){for(let i=0;i<15;i++){c.poll();c.drain(40);c.graph.step(1000);}finish(c.graph);}
 let c=new KineticController(port);c.touch(wheel);settle(c);assert.equal(c.graph.state(key(shaft)).rpm,8);
 cells.delete(key(water));c.touch(wheel);settle(c);assert.equal(c.graph.state(key(shaft)).rpm,0);
 cells.set(key(water),{water:true,depth:8});settle(c);assert.equal(c.graph.state(key(shaft)).rpm,8);
 unloaded.add(key(shaft));c.touch(shaft);settle(c);assert.equal(c.graph.state(key(wheel)).status,'unloaded');
 unloaded.clear();settle(c);assert.equal(c.graph.state(key(shaft)).rpm,8);
 c=new KineticController(port);c.touch(wheel);settle(c);assert.equal(c.graph.state(key(shaft)).rpm,8);
 cells.delete(key(shaft));c.changed(shaft);settle(c);assert.equal(c.graph.size,1);
});

test('stale world readings expire, pause the graph and recover on a real read',()=>{
 const s=source(),cells=new Map([[key(s),{kind:'test_source',axis:'x',rpm:8}]]);
 const controller=new KineticController({read:p=>cells.get(key(p))??{}},10);
 controller.touch(s);controller.drain();finish(controller.graph);
 assert.equal(controller.graph.state(key(s)).rpm,8);
 controller.advance(11);finish(controller.graph);assert.equal(controller.graph.state(key(s)).rpm,0);
 controller.drain();finish(controller.graph);assert.equal(controller.graph.state(key(s)).rpm,8);
});
test('numeric extremes stop with finite diagnostics rather than leaking NaN to entity properties',()=>{
 const s=source(0,{sourceRpm:Number.MAX_VALUE,capacity:Number.MAX_VALUE}),g=make(s,node(1,0,0,{impact:Number.MAX_VALUE}));
 const state=g.state(key(s));assert.equal(state.rpm,0);assert.ok(Number.isFinite(state.stress));assert.ok(Number.isFinite(state.capacity));
});
test('mutation during staged publication never exposes a partially valid network',()=>{
 const nodes=Array.from({length:6},(_,i)=>i===0?source():node(i));
 const g=new KineticGraph();for(const n of nodes)g.upsert(n);
 g.step(1+3*nodes.length+2);
 for(const n of nodes)assert.equal(g.state(key(n)).rpm,0);
 g.remove(key(nodes[2]));finish(g);
 assert.equal(g.state(key(nodes[0])).rpm,8);assert.equal(g.state(key(nodes[5])).status,'idle');
});
test('world liveness clock rejects backwards or nonfinite time',()=>{
 const c=new KineticController({read:()=>({})});c.advance(10);
 assert.throws(()=>c.advance(9),RangeError);assert.throws(()=>c.advance(NaN),RangeError);
});

test('unloaded tombstones age out under a bounded eviction budget and rediscover safely',()=>{
 let loaded=true;
 const positions=Array.from({length:40},(_,i)=>node(i*4));
 const cells=new Map(positions.map(p=>[key(p),{kind:'shaft',axis:'x'}]));
 const c=new KineticController({read:p=>loaded?(cells.get(key(p))??{}):undefined},10,30);
 for(const p of positions)c.sample(p);assert.equal(c.graph.size,40);
 loaded=false;for(const p of positions)c.sample(p);finish(c.graph);
 c.advance(29);assert.equal(c.graph.size,40);
 c.advance(30);assert.equal(c.graph.size,24);
 c.advance(31);assert.equal(c.graph.size,8);
 c.advance(32);assert.equal(c.graph.size,0);finish(c.graph);
 loaded=true;c.touch(positions[0]);c.drain();finish(c.graph);
 assert.equal(c.graph.size,1);assert.equal(c.graph.state(key(positions[0])).status,'idle');
});
test('returning chunk cancels eviction instead of deleting a live node later',()=>{
 const p=node(0);let loaded=true;
 const c=new KineticController({read:pos=>!loaded?undefined:key(pos)===key(p)?{kind:'test_source',axis:'x',rpm:8}:{}},100,30);
 c.sample(p);loaded=false;c.sample(p);c.advance(20);loaded=true;c.sample(p);
 c.advance(31);finish(c.graph);assert.equal(c.graph.size,1);assert.equal(c.graph.state(key(p)).rpm,8);
});
test('evicting an unloaded bridge cannot energize a network across unknown chunks',()=>{
 const a=source(),b=node(1);const cells=new Map([[key(a),{kind:'test_source',axis:'x',rpm:8}],[key(b),{kind:'shaft',axis:'x'}]]);let unavailable=false;
 const c=new KineticController({read:p=>unavailable&&p.x>=1?undefined:cells.get(key(p))??{}},100,30);
 c.sample(a);c.sample(b);c.sample(a);finish(c.graph);assert.equal(c.graph.state(key(a)).rpm,8);
 unavailable=true;c.sample(b);finish(c.graph);assert.equal(c.graph.state(key(a)).rpm,0);
 c.advance(30);finish(c.graph);assert.equal(c.graph.nodes.has(key(b)),false);assert.equal(c.graph.state(key(a)).rpm,0);
 c.drain(100);finish(c.graph);assert.equal(c.graph.state(key(a)).status,'unloaded');
});
