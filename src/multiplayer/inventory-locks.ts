/** Synchronous, non-reentrant critical sections. Never hold these across an await. */
export class InventoryLocks {
 private readonly held=new Set<string>();
 run<T>(ids:readonly string[],action:()=>T):T|undefined{
  const keys=[...new Set(ids)].sort();if(keys.some(id=>this.held.has(id)))return undefined;
  for(const id of keys)this.held.add(id);
  try{return action();}finally{for(const id of keys)this.held.delete(id);}
 }
}
