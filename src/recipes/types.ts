/** Declarative manufacturing format. Executors must explicitly validate their supported subset. */
export interface Amount {item:string;count:number}
export interface ProcessRecipe {
 id:string;process:string;machine:string;inputs:Amount[];outputs:Amount[];
 work:number;minRpm:number;maxRpm:number;heat:'none'|'heated'|'superheated';source:string;
}
export interface MachineSpec {id:string;kind:string;impact:number;container:string;axes:string[]}
export function validateAtomicRecipe(r:ProcessRecipe):void{
 if(!r.id||r.inputs.length!==1||r.outputs.length!==1)throw new Error('Atomic-slot executor requires one input type and one output');
 for(const a of [...r.inputs,...r.outputs])if(!a.item||!Number.isSafeInteger(a.count)||a.count<1||a.count>64)throw new Error('Invalid process amount');
 if(r.inputs[0]!.item===r.outputs[0]!.item)throw new Error('Identity transformations are not supported');
 if(!Number.isSafeInteger(r.work)||r.work<1||!Number.isFinite(r.minRpm)||r.minRpm<=0||!Number.isFinite(r.maxRpm)||r.maxRpm>256||r.maxRpm<r.minRpm)throw new Error('Invalid energy/work requirements');
}
/** Create 6.0.10 PressingBehaviour.getRunningTickSpeed; absolute speed, truncated lerp. */
export function pressWorkPerTick(rpm:number):number{
 if(!Number.isFinite(rpm)||rpm===0)return 0;
 return Math.floor(1+59*Math.min(1,Math.abs(rpm)/512));
}
