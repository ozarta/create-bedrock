/** Create 6.0.10 kinetic rules studied/reimplemented; MIT notice: licenses/Create-code-MIT.txt.
 * Upstream SHA ac0c444d9828da3453ae8cc65338e8de063286fb. No upstream artwork included. */
export type Axis = 'x' | 'y' | 'z';
export type Kind = 'shaft' | 'gear' | 'large_gear' | 'gearbox' | 'water_wheel' | 'test_source' | 'speed_meter' | 'stress_meter' | 'mechanical_press';
export const KINDS: readonly Kind[] = ['shaft','gear','large_gear','gearbox','water_wheel','test_source','speed_meter','stress_meter','mechanical_press'];
export interface Position { x: number; y: number; z: number; dimension: string }
export interface Node extends Position {
  kind: Kind; axis: Axis; sourceRpm: number; capacity: number; impact: number;
  available: boolean; boundary: boolean;
}
export type Status = 'pending' | 'running' | 'idle' | 'overloaded' | 'conflict' | 'overspeed' | 'unloaded';
export interface State { rpm: number; theoreticalRpm: number; capacity: number; stress: number; status: Status; members: number }
export const AXES: readonly Axis[] = ['x','y','z'];
export const key = (p: Position): string => `${p.dimension}|${p.x},${p.y},${p.z}`;
export const OFFSETS = [-1,0,1].flatMap(x => [-1,0,1].flatMap(y => [-1,0,1].map(z => ({x,y,z}))))
  .filter(p => Math.abs(p.x)+Math.abs(p.y)+Math.abs(p.z) > 0 && Math.abs(p.x)+Math.abs(p.y)+Math.abs(p.z) <= 2);
export function nearby(p: Position): Position[] { return OFFSETS.map(o => ({dimension:p.dimension,x:p.x+o.x,y:p.y+o.y,z:p.z+o.z})); }
const cog = (n: Node): boolean => n.kind === 'gear' || n.kind === 'large_gear';
function port(n: Node, axis: Axis, sign: number): number {
  if (n.kind !== 'gearbox') return n.axis === axis ? 1 : 0;
  const axes = AXES.filter(a => a !== n.axis);
  // The box's axis is the blocked pair of faces. Opposite ports invert;
  // perpendicular ports use opposite handedness, matching the Java gearbox rule.
  return axis === n.axis ? 0 : sign * (axis === axes[0] ? 1 : -1);
}
/** Signed ratio rpm(to)/rpm(from). Zero denotes no mechanical connection. */
export function ratio(from: Node, to: Node): number {
  if (from.dimension !== to.dimension) return 0;
  const d = {x:to.x-from.x,y:to.y-from.y,z:to.z-from.z};
  const changed = AXES.filter(a => d[a] !== 0);
  if (changed.length === 0 || AXES.some(a => Math.abs(d[a]) > 1)) return 0;
  if (changed.length === 1) {
    const axis = changed[0]!;
    const a = port(from,axis,Math.sign(d[axis])), b = port(to,axis,-Math.sign(d[axis]));
    if (a && b) return a/b;
    if (from.kind === 'gear' && to.kind === 'gear' && from.axis === to.axis && axis !== from.axis) return -1;
  }
  if (!cog(from) || !cog(to)) return 0;
  if (from.kind !== to.kind && from.axis === to.axis && d[from.axis] === 0 && changed.length === 2) {
    return from.kind === 'large_gear' ? -2 : -0.5;
  }
  if (from.kind === 'large_gear' && to.kind === 'large_gear' && from.axis !== to.axis && changed.length === 2 && d[from.axis] && d[to.axis]) {
    return (d[from.axis] > 0) !== (d[to.axis] > 0) ? -1 : 1;
  }
  return 0;
}
export function nodeSignature(n: Node): string {
  return [n.kind,n.axis,n.sourceRpm,n.capacity,n.impact,n.available,n.boundary].join(':');
}
