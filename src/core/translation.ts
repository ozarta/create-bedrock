import type { RawMessage } from '@minecraft/server';
export function translated(key: string): RawMessage { return { translate: key }; }
