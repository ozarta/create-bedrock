import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemo,settleDemo } from '../build/scripts/kinetic/demo.js';
import { key } from '../build/scripts/kinetic/model.js';
const fixture=JSON.parse(readFileSync('config/kinetic-demo.json','utf8'));
test('water wheel demo transmits through shafts, gears, gearbox and gauges',()=>{
 const {controller,positions}=createDemo(fixture);settleDemo(controller);
 assert.equal(controller.graph.state(key(positions[0])).rpm,8);
 const out=controller.graph.state(key(positions.at(-1)));
 assert.deepEqual([out.rpm,out.capacity,out.stress,out.status],[-16,256,128,'running']);
});
test('demo overload, fluid loss and a broken shaft change the actual graph result',()=>{
 const {controller,cells,positions}=createDemo(fixture);settleDemo(controller);
 const brake=positions.find(p=>p.kind==='stress_meter');
 cells.set(key(brake),{...cells.get(key(brake)),impact:64});controller.touch(brake);settleDemo(controller);
 assert.equal(controller.graph.state(key(positions.at(-1))).status,'overloaded');
 cells.set(key(brake),{...cells.get(key(brake)),impact:8});
 cells.delete(key({...fixture.water[0],dimension:'minecraft:overworld'}));
 controller.touch(brake);controller.touch(positions[0]);settleDemo(controller);
 assert.equal(controller.graph.state(key(positions.at(-1))).rpm,0);
 cells.set(key({...fixture.water[0],dimension:'minecraft:overworld'}),{water:true,depth:8});
 cells.delete(key(positions[2]));controller.changed(positions[2]);settleDemo(controller);
 assert.equal(controller.graph.state(key(positions[0])).rpm,8);
 assert.equal(controller.graph.state(key(positions.at(-1))).status,'idle');
});
