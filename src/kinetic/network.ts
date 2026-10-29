/** Create 6.0.10 kinetic rules studied/reimplemented; MIT notice: licenses/Create-code-MIT.txt.
 * Upstream SHA ac0c444d9828da3453ae8cc65338e8de063286fb. No upstream artwork included. */
import { key, nearby, nodeSignature, ratio, type Node, type State, type Status, type Position } from './model.js';
interface Network { valid: boolean; members: Set<string>; values: Map<string,State> }
interface Task { seen: Set<string>; canceled: boolean; work: Generator<void,void,void> }
const zero = (status: Status = 'pending'): State => ({rpm:0,theoreticalRpm:0,capacity:0,stress:0,status,members:0});
const equal = (a:number,b:number): boolean => Math.abs(a-b) <= 1e-9*Math.max(1,Math.abs(a),Math.abs(b));
/** Incremental server-independent graph. Every yield is bounded to one node/edge neighborhood. */
export class KineticGraph {
  readonly nodes = new Map<string,Node>();
  private readonly membership = new Map<string,Network>();
  private readonly dirty = new Set<string>();
  private readonly invalid = new Set<Network>();
  private readonly invalidIterators: Iterator<string>[] = [];
  private task?: Task;
  get size(): number { return this.nodes.size; }
  get pending(): boolean { return !!this.task || this.dirty.size > 0 || this.invalidIterators.length > 0; }
  upsert(n: Node): boolean {
    for (const v of [n.x,n.y,n.z,n.sourceRpm,n.capacity,n.impact]) if (!Number.isFinite(v)) throw new RangeError('Nonfinite kinetic node');
    if (n.capacity < 0 || n.impact < 0 || ![n.x,n.y,n.z].every(Number.isInteger)) throw new RangeError('Invalid kinetic node');
    const id = key(n), old = this.nodes.get(id);
    if (old && nodeSignature(old) === nodeSignature(n)) return false;
    this.invalidate(n);
    this.nodes.set(id,{...n});
    this.dirty.add(id);
    return true;
  }
  remove(id: string): void {
    const n = this.nodes.get(id);
    if (!n) return;
    this.invalidate(n);
    this.nodes.delete(id); this.membership.delete(id);
  }
  invalidateAt(n: Position): void { this.invalidate(n); }
  private invalidate(n: Position): void {
    const ids = [key(n),...nearby(n).map(key)];
    for (const id of ids) {
      if (this.task?.seen.has(id)) this.task.canceled = true;
      const network = this.membership.get(id);
      if (network) {
        network.valid = false;
        if (!this.invalid.has(network)) {
          this.invalid.add(network); this.invalidIterators.push(network.members.values());
        }
      }
      if (this.nodes.has(id)) this.dirty.add(id);
    }
  }
  state(id: string): State {
    const network = this.membership.get(id);
    return network?.valid ? network.values.get(id) ?? zero() : zero();
  }
  /** At most maxOperations bounded operations and a wall-clock deadline. */
  step(maxOperations = 128, deadline = Infinity, clock: () => number = () => Date.now()): number {
    let used=0;
    while (used < maxOperations && clock() < deadline) {
      used++;
      if (this.task) {
        if (this.task.canceled) { this.task=undefined; continue; }
        if (this.task.work.next().done) this.task=undefined;
        continue;
      }
      // Drain one old member per operation; split components are seeded without an O(N) event callback.
      const it = this.invalidIterators[0];
      if (it) {
        const entry=it.next();
        if (entry.done) { this.invalidIterators.shift(); if (!this.invalidIterators.length) this.invalid.clear(); }
        else if (this.nodes.has(entry.value) && !this.membership.get(entry.value)?.valid) this.dirty.add(entry.value);
        continue;
      }
      const seed = this.dirty.values().next().value as string | undefined;
      if (!seed) break;
      this.dirty.delete(seed);
      if (!this.nodes.has(seed) || this.membership.get(seed)?.valid) continue;
      const task: Task={seen:new Set(),canceled:false,work:(function*(){})()};
      task.work=this.solve(seed,task); this.task=task;
    }
    return used;
  }
  private *solve(seed: string, task: Task): Generator<void,void,void> {
    const factors=new Map<string,number>([[seed,1]]), queue=[seed];
    let conflict=false, unavailable=false;
    for (let i=0;i<queue.length;i++) {
      const id=queue[i]!, n=this.nodes.get(id);
      if (!n) { task.canceled=true; return; }
      task.seen.add(id);
      unavailable ||= !n.available || n.boundary;
      const factor=factors.get(id)!;
      for (const pos of nearby(n)) {
        const other=this.nodes.get(key(pos));
        if (!other) continue;
        const r=ratio(n,other);
        if (!r) continue;
        const expected=factor*r, oid=key(other), known=factors.get(oid);
        if (!Number.isFinite(expected) || expected === 0) conflict=true;
        if (known === undefined) { factors.set(oid,Number.isFinite(expected)&&expected!==0?expected:1); queue.push(oid); }
        else if (!equal(known,expected)) conflict=true;
      }
      yield;
    }
    let rootRpm: number | undefined;
    for (const id of queue) {
      const n=this.nodes.get(id)!;
      if (n.available && n.sourceRpm) {
        const requested=n.sourceRpm/factors.get(id)!;
        if (rootRpm === undefined) rootRpm=requested;
        else if (!equal(rootRpm,requested)) conflict=true;
      }
      yield;
    }
    let capacity=0, stress=0, overspeed=false;
    for (const id of queue) {
      const n=this.nodes.get(id)!, rpm=(rootRpm ?? 0)*factors.get(id)!;
      overspeed ||= !Number.isFinite(rpm) || Math.abs(rpm)>256;
      capacity = Math.min(Number.MAX_VALUE,capacity+(n.available ? n.capacity*Math.abs(n.sourceRpm) : 0));
      stress = Math.min(Number.MAX_VALUE,stress+(n.impact===0?0:n.impact*Math.abs(rpm)));
      yield;
    }
    const status: Status=unavailable ? 'unloaded' : conflict ? 'conflict' : overspeed ? 'overspeed' : rootRpm === undefined ? 'idle' : stress>capacity+1e-9 ? 'overloaded' : 'running';
    const network: Network={valid:false,members:new Set(),values:new Map()};
    for (const id of queue) {
      if (task.canceled || !this.nodes.has(id)) return;
      const rawRpm=(rootRpm ?? 0)*factors.get(id)!;
      const theoreticalRpm=Number.isFinite(rawRpm)?rawRpm:0;
      network.members.add(id);
      network.values.set(id,{rpm:status==='running'?theoreticalRpm:0,theoreticalRpm,capacity,stress,status,members:queue.length});
      this.membership.set(id,network); this.dirty.delete(id);
      yield;
    }
    if (!task.canceled) network.valid=true; // Publish only after every node is staged.
  }
}
