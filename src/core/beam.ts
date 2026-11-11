import type { SpriteSet } from './sprites';
import { SCENE_HEIGHT, SPRITE_SCALE } from './types';
export type Placement = Readonly<{ left: number; top: number; flip: boolean }>;
export type BeamRect = Readonly<{ x: number; y: number; w: number; h: number; color: string }>;

/** Continue opaque beam colors at unflipped column zero, excluding the darkest outline. */
export function beamExtensions(set: SpriteSet, frame: number, pose: Placement, sceneWidth: number): readonly BeamRect[] {
  const brightness = (hex: string) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16);
  const outline = Object.entries(set.legend).reduce((darkest, entry) => brightness(entry[1]) < brightness(darkest[1]) ? entry : darkest)[0];
  const start = pose.flip ? Math.max(0, Math.min(sceneWidth, pose.left + set.width * SPRITE_SCALE)) : 0;
  const end = pose.flip ? sceneWidth : Math.max(0, Math.min(sceneWidth, pose.left));
  if (end <= start) return [];
  return set.frames[frame]!.flatMap((row, i): BeamRect[] => {
    const char = row[0]!, y = pose.top + i * SPRITE_SCALE;
    return char === '.' || char === outline || y < 0 || y >= SCENE_HEIGHT ? [] : [
      { x: start, y, w: end - start, h: SPRITE_SCALE, color: set.legend[char]! },
    ];
  });
}
