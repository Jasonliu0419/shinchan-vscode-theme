import { randomInt } from '../rng';
import { spriteSets } from '../sprites';
import { SPRITE_SCALE } from '../types';
import type { Model, Walk } from './model';
export const WALK_SPEED = 4;
export const IDLE_BEFORE_WALK_MS = 3000;
// Reserve both orientations of every body, excluding the beam's effect pixels.
export const WALK_MIN_X = Math.max(...Object.entries(spriteSets)
  .filter(([name]) => name !== 'beam')
  .flatMap(([, set]) => [set.anchor, set.width - 1 - set.anchor])) * SPRITE_SCALE + 1;
export const WALK_MAX_MARGIN = WALK_MIN_X;
export { JUMP_MS } from '../clips';
export function future(seed: number, now: number, min: number, max: number): Readonly<{ seed: number; at: number }> {
  const random = randomInt(seed, min, max);
  return { seed: random.seed, at: now + random.value };
}
export function clampX(x: number, width: number): number {
  return width < WALK_MIN_X + WALK_MAX_MARGIN ? Math.floor(width / 2) : Math.max(WALK_MIN_X, Math.min(width - WALK_MAX_MARGIN, x));
}
/** Project the current patrol leg, retaining elapsed travel across any number of turns. */
export function walkAt(model: Model, now: number): Walk | null {
  const walk = model.walk;
  if (!walk || now < walk.startedAt + walk.duration) return walk;
  const arrivedAt = walk.startedAt + walk.duration;
  const opposite = walk.to === WALK_MIN_X ? model.sceneWidth - WALK_MAX_MARGIN : WALK_MIN_X;
  const duration = Math.abs(walk.to - opposite) / WALK_SPEED * 1000;
  const legs = Math.floor((now - arrivedAt) / duration);
  const from = legs % 2 === 0 ? walk.to : opposite;
  const to = legs % 2 === 0 ? opposite : walk.to;
  return { from, to, startedAt: arrivedAt + legs * duration, duration };
}
export function positionAt(model: Model, now: number): number {
  const walk = walkAt(model, now);
  if (!walk) return model.x;
  const { from, to, startedAt, duration } = walk;
  const progress = Math.max(0, Math.min(1, (now - startedAt) / duration));
  return from + (to - from) * progress;
}
export function scheduleWalk(model: Model, now: number): Model {
  const disabled = model.reduced || model.sceneWidth - WALK_MIN_X - WALK_MAX_MARGIN < 6;
  return { ...model, nextWalkAt: disabled ? Infinity : now + IDLE_BEFORE_WALK_MS };
}
export function startWalk(model: Model, now: number): Model {
  const left = model.x - WALK_MIN_X, right = model.sceneWidth - WALK_MAX_MARGIN - model.x;
  if (model.reduced || left + right < 6) return scheduleWalk(model, now);
  const to = right >= left ? model.sceneWidth - WALK_MAX_MARGIN : WALK_MIN_X;
  return {
    ...model, facing: to > model.x ? 'right' : 'left',
    walk: { from: model.x, to, startedAt: now, duration: Math.abs(to - model.x) / WALK_SPEED * 1000 },
  };
}
