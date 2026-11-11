import type { EditorEventKind } from './types';
export type ReduceMotion = 'on' | 'off' | 'auto';
export type HostMessage = Readonly<
  { v: 1; type: 'config'; reduceMotion: ReduceMotion } |
  { v: 1; type: 'editorEvent'; kind: EditorEventKind }
>;
export type WebviewMessage = Readonly<{ v: 1; type: 'ready' }>;
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function parseHostMessage(value: unknown): HostMessage | undefined {
  if (!record(value) || value.v !== 1) return undefined;
  if (value.type === 'config' && (value.reduceMotion === 'on' || value.reduceMotion === 'off' || value.reduceMotion === 'auto')) {
    return { v: 1, type: 'config', reduceMotion: value.reduceMotion };
  }
  if (value.type === 'editorEvent' && (value.kind === 'save' || value.kind === 'errorsIncreased')) {
    return { v: 1, type: 'editorEvent', kind: value.kind };
  }
  return undefined;
}
export function parseWebviewMessage(value: unknown): WebviewMessage | undefined {
  return record(value) && value.v === 1 && value.type === 'ready' ? { v: 1, type: 'ready' } : undefined;
}
