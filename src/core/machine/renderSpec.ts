import { clips, clipDuration, frameAt, JUMP_MS } from '../clips';
import { spriteSets, type SpriteSetId } from '../sprites';
import { spritePlacement, type SpritePlacement } from '../geometry';
import type { Facing } from '../types';
import { positionAt, walkAt } from './idle';
import type { Model } from './model';
export type RenderSpec = Readonly<SpritePlacement & {
  set: SpriteSetId; frame: number; x: number; dx: number; dy: number; facing: Facing; night: boolean;
}>;
export function renderSpec(model: Model, now: number): RenderSpec {
  const elapsed = Math.max(0, now - model.modeStartedAt);
  const active = model.mode !== 'idle' && model.mode !== 'sleep';
  const mode = active && elapsed >= clipDuration(clips[model.mode]) ? 'idle' : model.mode;
  const walk = walkAt(model, now);
  const clip = mode === 'idle' && walk ? clips.walk : clips[mode];
  const clipElapsed = mode === 'idle' && walk ? now - walk.startedAt : mode === model.mode ? elapsed : 0;
  const jumpElapsed = model.jumpStartedAt === null ? JUMP_MS : now - model.jumpStartedAt;
  const frame = mode === 'idle' && jumpElapsed >= 0 && jumpElapsed < JUMP_MS ? frameAt(clips.jump, jumpElapsed) : frameAt(clip, clipElapsed);
  const facing = walk ? (walk.to > walk.from ? 'right' : 'left') : model.facing;
  const pose = { x: positionAt(model, now), dx: frame.dx ?? 0, dy: frame.dy ?? 0, facing };
  return {
    set: frame.set, frame: frame.frame, ...pose,
    ...spritePlacement(spriteSets[frame.set], pose), night: mode === 'sleep',
  };
}
