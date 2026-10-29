import type { Axis } from './model.js';
export interface WaterSample { side: -1 | 1; water: boolean; depth: number | undefined; waterAbove: boolean; loaded: boolean }
/** Bedrock alternative: descending water on opposing tangential sides of a horizontal axle. */
export function wheelFlow(axis: Axis, samples: readonly WaterSample[]): { rpm:number; complete:boolean } {
  if (samples.some(s => !s.loaded)) return {rpm:0,complete:false};
  if (axis==='y') return {rpm:0,complete:true};
  const score=samples.reduce((sum,s) => sum+(s.water && s.waterAbove && s.depth !== undefined && s.depth >= 8 ? s.side : 0),0);
  return {rpm:Math.sign(score)*8*(axis==='z'?-1:1),complete:true};
}
