import type { Action } from './types';
import { spriteSets, type SpriteSetId } from './sprites';
export type Frame = Readonly<{ set: SpriteSetId; frame: number; ms: number; dx?: number; dy?: number }>;
export type Clip = Readonly<{ frames: readonly Frame[]; loop: boolean }>;
const WALK_PASSING_FRAME_INDICES: readonly number[] = [0, 4];
function sequence(set: SpriteSetId, multiplier = 1, repetitions = 1): readonly Frame[] {
  return Array.from({ length: repetitions }, () => spriteSets[set].durations.map((ms, frame) => ({
    set, frame, ms: Math.round(ms * multiplier),
  }))).flat();
}
export const clips = {
  idle: { loop: true, frames: [{ set: 'front34', frame: 0, ms: 700 }, { set: 'front34', frame: 0, ms: 700, dy: 1 }] },
  walk: { loop: true, frames: sequence('walk').map(frame => WALK_PASSING_FRAME_INDICES.includes(frame.frame) ? { ...frame, dy: -1 } : frame) },
  greet: { loop: false, frames: sequence('greet', 1, 2) },
  beam: { loop: false, frames: sequence('beam', 1.5) },
  wiggle: { loop: false, frames: Array.from({ length: 12 }, (_, i) => ({ set: 'butt', frame: 0, ms: 200, dx: i % 2 ? 1 : -1 })) },
  sleep: { loop: true, frames: sequence('sleep', 1.4) },
  jump: { loop: false, frames: [-2, -4, -2, 0].map(dy => ({ set: 'wave', frame: 0, ms: 120, dy })) },
  waking: { loop: false, frames: [{ set: 'front', frame: 0, ms: 900 }] },
} as const satisfies Readonly<Record<string, Clip>>;
export function clipDuration(clip: Clip): number { return clip.frames.reduce((sum, frame) => sum + frame.ms, 0); }
export const JUMP_MS = clipDuration(clips.jump);
export function actionClip(action: Action): Clip { return clips[action]; }
export function frameAt(clip: Clip, elapsed: number): Frame {
  if (clip.frames.length === 0) throw new Error('A clip needs at least one frame');
  const duration = clipDuration(clip);
  let cursor = Math.max(0, elapsed);
  cursor = clip.loop ? cursor % duration : Math.min(cursor, duration - 1);
  for (const frame of clip.frames) {
    if (cursor < frame.ms) return frame;
    cursor -= frame.ms;
  }
  return clip.frames[clip.frames.length - 1]!;
}
