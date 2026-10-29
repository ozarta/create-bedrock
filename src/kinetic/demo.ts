import { KineticController, type Cell } from './controller.js';
import { key, type Position, type Axis, type Kind } from './model.js';
export interface DemoFixture {
  blocks: (Omit<Position,'dimension'> & {kind:Kind;axis:Axis;impact?:number})[];
  water: (Omit<Position,'dimension'> & {depth:number})[];
  expected: {wheel_rpm:number;output_rpm:number;capacity:number;stress:number};
}
export function createDemo(fixture:DemoFixture):{controller:KineticController;cells:Map<string,Cell>;positions:Position[]} {
  const dimension='minecraft:overworld', cells=new Map<string,Cell>();
  const positions=fixture.blocks.map(p=>({...p,dimension}));
  for(const p of positions)cells.set(key(p),{kind:p.kind,axis:p.axis,impact:p.impact});
  for(const p of fixture.water)cells.set(key({...p,dimension}),{water:true,depth:p.depth});
  const controller=new KineticController({read:p=>cells.get(key(p))??{}});
  for(const p of positions)controller.touch(p);
  return {controller,cells,positions};
}
export function settleDemo(controller:KineticController):void {
  // Simulates periodic block callbacks plus the budgeted world pump, not a Minecraft execution.
  for(let tick=0;tick<100;tick++) {
    controller.advance(controller.tick+1);controller.poll();controller.drain(3);controller.graph.step(128);
  }
}
