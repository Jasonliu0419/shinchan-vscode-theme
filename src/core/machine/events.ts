import type { Action, EditorEventKind } from '../types';
export type Event = Readonly<{ now: number } & (
  { type: 'tick' } | { type: 'action'; action: Action } | { type: 'click' } |
  { type: 'editorEvent'; kind: EditorEventKind } | { type: 'resize'; width: number } |
  { type: 'motion'; reduced: boolean }
)>;
