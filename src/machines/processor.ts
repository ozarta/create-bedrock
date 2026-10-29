import { pressWorkPerTick,validateAtomicRecipe,type ProcessRecipe } from '../recipes/types.js';
import { InventoryLocks } from '../multiplayer/inventory-locks.js';
export interface Stock {item:string;count:number;plain:boolean;max:number}
export interface SlotPort {
 identity:string;size:number;read(slot:number):Stock|undefined;
 /** Revalidate and replace exactly one native slot. Never emulate with remove + add. */
 replace(slot:number,expected:Stock,output:Stock):boolean;
}
export interface Job {v:1;phase:'working'|'committing';recipe:string;slot:number;input:Stock;work:number}
export interface JobStore {load():unknown;save(job:Job):void;clear():void}
export interface Power {status:string;rpm:number}
export type ProcessStatus='working'|'completed'|'unpowered'|'no_input'|'changed'|'capacity'|'condition'|'recovered'|'fault'|'busy';
export interface ProcessResult {status:ProcessStatus;progress:number;work:number;total:number}
const result=(status:ProcessStatus,work=0,total=0,cycle=240):ProcessResult=>({status,work,total,progress:total?work%cycle/cycle:0});
const same=(a:Stock|undefined,b:Stock):boolean=>!!a&&a.plain&&b.plain&&a.item===b.item&&a.count===b.count&&a.max===b.max;
function validJob(value:unknown,recipes:readonly ProcessRecipe[],size:number):value is Job{
 if(!value||typeof value!=='object')return false;
 const j=value as Partial<Job>,r=recipes.find(r=>r.id===j.recipe);
 return j.v===1&&(j.phase==='working'||j.phase==='committing')&&!!r&&Number.isInteger(j.slot)&&j.slot!>=0&&j.slot!<size&&!!j.input&&j.input.plain===true&&j.input.item===r.inputs[0]!.item&&Number.isInteger(j.input.count)&&j.input.count>0&&j.input.count<=64&&j.input.count%r.inputs[0]!.count===0&&Number.isInteger(j.input.max)&&j.input.max>=j.input.count&&j.input.max<=64&&Number.isFinite(j.work)&&j.work!>=0&&j.work!<=r.work*(j.input.count/r.inputs[0]!.count);
}
/** No inventory ownership or rollback copies: only progress is stored. All callbacks are synchronous. */
export class AtomicSlotProcessor {
 private scan=0;
 constructor(readonly machine:string,readonly recipes:readonly ProcessRecipe[],private readonly locks:InventoryLocks){for(const r of recipes)validateAtomicRecipe(r);}
 tick(port:SlotPort,store:JobStore,power:Power,heat='none'):ProcessResult{
  try{return this.locks.run([port.identity],()=>this.step(port,store,power,heat))??result('busy');}
  catch{return result('fault');} // A write may have happened. Never restore or replay a copied stack.
 }
 private step(port:SlotPort,store:JobStore,power:Power,heat:string):ProcessResult{
  const value=store.load();let job:Job|undefined;
  if(value!==undefined){
   if(!validJob(value,this.recipes,port.size)){store.clear();return result('recovered');}
   job=value;
   // At-most-once attempt. Ambiguous completion loses time, never grants/replays an output.
   if(job.phase==='committing'){store.clear();return result('recovered');}
   if(!same(port.read(job.slot),job.input)){store.clear();return result('changed');}
  }
  if(power.status!=='running'||!Number.isFinite(power.rpm)||power.rpm===0){const r=job?this.recipes.find(r=>r.id===job!.recipe):undefined;return result('unpowered',job?.work??0,job&&r?r.work*job.input.count/r.inputs[0]!.count:0,r?.work??240);}
  if(!job){
   for(let i=0;i<Math.min(4,port.size);i++){
    const slot=this.scan++%port.size,input=port.read(slot);
    if(!input?.plain||!Number.isSafeInteger(input.count)||input.count<1||input.count>64||input.count>input.max)continue;
    const recipe=this.recipes.find(r=>r.machine===this.machine&&r.inputs[0]!.item===input.item&&input.count%r.inputs[0]!.count===0);
    if(!recipe)continue;
    job={v:1,phase:'working',recipe:recipe.id,slot,input:{...input},work:0};break;
   }
   if(!job)return result('no_input');
  }
  const recipe=this.recipes.find(r=>r.id===job!.recipe)!,batches=job.input.count/recipe.inputs[0]!.count;
  const total=recipe.work*batches,output:Stock={item:recipe.outputs[0]!.item,count:recipe.outputs[0]!.count*batches,plain:true,max:64};
  if(output.count>output.max)return result('capacity',job.work,total,recipe.work);
  if(Math.abs(power.rpm)<recipe.minRpm||Math.abs(power.rpm)>recipe.maxRpm||heat!==recipe.heat)return result('condition',job.work,total,recipe.work);
  job={...job,work:Math.min(total,job.work+pressWorkPerTick(power.rpm))};
  store.save(job); // Progress only. Ingredients remain in their native slot.
  if(job.work<total)return result('working',job.work,total,recipe.work);
  if(!same(port.read(job.slot),job.input)){store.clear();return result('changed');}
  store.save({...job,phase:'committing'});
  const changed=port.replace(job.slot,job.input,output);
  store.clear();return result(changed?'completed':'changed');
 }
}
