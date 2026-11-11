import type { EditorEventKind, Mode } from './types';
export const COOLDOWN: Readonly<Record<EditorEventKind, number>> = { save: 20_000, errorsIncreased: 30_000 };
export type LastReaction = Readonly<Record<EditorEventKind, number>>;
export function canReact(kind: EditorEventKind, mode: Mode, now: number, last: LastReaction): boolean {
  return mode !== 'sleep' && mode !== 'waking' && now - last[kind] >= COOLDOWN[kind];
}
