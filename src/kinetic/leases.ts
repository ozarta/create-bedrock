/** Indexed min-heap: one liveness deadline per known block, O(log N) refresh/pop. */
export class Leases {
  private readonly heap:{id:string;due:number}[]=[];
  private readonly index=new Map<string,number>();
  get size():number {return this.heap.length;}
  has(id:string):boolean {return this.index.has(id);}
  private swap(a:number,b:number):void {
    [this.heap[a],this.heap[b]]=[this.heap[b]!,this.heap[a]!];
    this.index.set(this.heap[a]!.id,a);this.index.set(this.heap[b]!.id,b);
  }
  private up(i:number):number {
    while(i>0){const p=Math.floor((i-1)/2);if(this.heap[p]!.due<=this.heap[i]!.due)break;this.swap(i,p);i=p;}return i;
  }
  private down(i:number):void {
    for(;;){const l=i*2+1,r=l+1;let best=i;
      if(l<this.heap.length&&this.heap[l]!.due<this.heap[best]!.due)best=l;
      if(r<this.heap.length&&this.heap[r]!.due<this.heap[best]!.due)best=r;
      if(best===i)return;this.swap(i,best);i=best;}
  }
  set(id:string,due:number):void {
    const old=this.index.get(id);
    if(old!==undefined){this.heap[old]!.due=due;this.down(this.up(old));return;}
    this.heap.push({id,due});const i=this.heap.length-1;this.index.set(id,i);this.up(i);
  }
  remove(id:string):void {
    const i=this.index.get(id);if(i===undefined)return;
    const last=this.heap.pop()!;this.index.delete(id);
    if(i<this.heap.length){this.heap[i]=last;this.index.set(last.id,i);this.down(this.up(i));}
  }
  expired(now:number,limit:number):string[]{
    const result:string[]=[];
    while(result.length<limit&&this.heap[0]&&this.heap[0].due<=now){const id=this.heap[0].id;this.remove(id);result.push(id);}
    return result;
  }
}
