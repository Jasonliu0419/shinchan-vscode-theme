import type { SpriteSet } from './sprites';
import { FEET_Y, SPRITE_SCALE, type Facing } from './types';
export type SpritePose = Readonly<{ x: number; facing: Facing; dx?: number; dy?: number }>;
export type SpritePlacement = Readonly<{ left: number; top: number; flip: boolean; scale: number; width: number; height: number }>;
const snap = (value: number): number => Math.round(value / SPRITE_SCALE) * SPRITE_SCALE;
/** One geometry source for painting, beam edges and opaque-pixel hit testing. */
export function spritePlacement(set: SpriteSet, pose: SpritePose): SpritePlacement {
  const flip = (set.faces === 'left' && pose.facing === 'right') || (set.faces === 'right' && pose.facing === 'left');
  const anchor = flip ? set.width - 1 - set.anchor : set.anchor;
  return {
    left: snap(pose.x - anchor * SPRITE_SCALE + (pose.dx ?? 0) * SPRITE_SCALE),
    top: FEET_Y + 1 - set.height * SPRITE_SCALE + (pose.dy ?? 0) * SPRITE_SCALE,
    scale: SPRITE_SCALE,
    width: set.width * SPRITE_SCALE,
    height: set.height * SPRITE_SCALE,
    flip,
  };
}
