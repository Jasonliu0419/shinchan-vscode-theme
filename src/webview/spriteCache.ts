import { spriteSets, type SpriteSetId } from '../core/sprites';
/** Each set/frame/flip is painted once in logical pixels with its own legend. */
export class SpriteCache {
  private readonly cache = new Map<string, HTMLCanvasElement>();
  get(id: SpriteSetId, frame: number, flip: boolean): HTMLCanvasElement {
    const key = `${id}:${frame}:${flip}`;
    const cached = this.cache.get(key);
    if (cached) return cached;
    const set = spriteSets[id];
    const canvas = document.createElement('canvas');
    canvas.width = set.width; canvas.height = set.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is unavailable');
    ctx.imageSmoothingEnabled = false;
    set.frames[frame]!.forEach((row, y) => [...row].forEach((char, x) => {
      if (char === '.') return;
      ctx.fillStyle = set.legend[char]!;
      ctx.fillRect(flip ? set.width - 1 - x : x, y, 1, 1);
    }));
    this.cache.set(key, canvas);
    return canvas;
  }
}
