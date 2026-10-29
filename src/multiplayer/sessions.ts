/** Per-player exclusion for asynchronous UI. No inventory transactions. */
export class Sessions {
  private readonly active = new Map<string, symbol>();
  acquire(playerId: string): symbol | undefined {
    if (this.active.has(playerId)) return undefined;
    const token = Symbol(playerId);
    this.active.set(playerId, token);
    return token;
  }
  release(playerId: string, token: symbol): void {
    if (this.active.get(playerId) === token) this.active.delete(playerId);
  }
  owns(playerId: string, token: symbol): boolean { return this.active.get(playerId) === token; }
  clear(playerId: string): void { this.active.delete(playerId); }
}
