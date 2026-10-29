import { InventoryLocks } from '../multiplayer/inventory-locks.js';
import type { Stock } from '../machines/processor.js';
export interface TransferPort {
 sourceId:string;destinationId:string;sourceSize:number;destinationSize:number;
 readSource(slot:number):Stock|undefined;readDestination(slot:number):Stock|undefined;
 /** Exactly one native moveItem call into an empty slot; no JS copy/remove sequence. */
 move(sourceSlot:number,destinationSlot:number,expected:Stock):boolean;
}
export type TransferResult='moved'|'no_input'|'full'|'changed'|'busy'|'fault'|'same_inventory';
export class FilteredTransfer {
 private sourceCursor=0;private destinationCursor=0;
 constructor(private readonly locks:InventoryLocks){}
 tick(port:TransferPort,allowed:ReadonlySet<string>):TransferResult{
  if(port.sourceId===port.destinationId)return 'same_inventory';
  try{return this.locks.run([port.sourceId,port.destinationId],()=>{
   let from:number|undefined,input:Stock|undefined;
   for(let i=0;i<Math.min(4,port.sourceSize);i++){
    const slot=this.sourceCursor++%port.sourceSize,value=port.readSource(slot);
    if(value?.plain&&Number.isSafeInteger(value.count)&&value.count>0&&value.count<=value.max&&allowed.has(value.item)){from=slot;input=value;break;}
   }
   if(from===undefined||!input)return 'no_input';
   for(let i=0;i<Math.min(4,port.destinationSize);i++){
    const to=this.destinationCursor++%port.destinationSize;
    if(!port.readDestination(to))return port.move(from,to,input)?'moved':'changed';
   }
   return 'full';
  })??'busy';}catch{return 'fault';} // An ambiguous native move is never rolled back by spawning/restoring items.
 }
}
