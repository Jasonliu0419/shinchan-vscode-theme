import type { SpriteSet } from './sprites';
import { spritePlacement, type SpritePose } from './geometry';
export function hitTest(set: SpriteSet, frame: number, pose: SpritePose, sceneX: number, sceneY: number): boolean {
  const { left, top, flip, scale } = spritePlacement(set, pose);
  const localX = Math.floor((sceneX - left) / scale), localY = Math.floor((sceneY - top) / scale);
  if (localX < 0 || localY < 0 || localX >= set.width || localY >= set.height) return false;
  const x = flip ? set.width - 1 - localX : localX;
  return set.frames[frame]![localY]![x] !== '.';
}
