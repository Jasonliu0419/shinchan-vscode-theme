import { buildScene } from '../core/scene';
import { PIXEL_SCALE, SCENE_HEIGHT, FEET_Y } from '../core/types';
import { spriteSets } from '../core/sprites';
import { beamExtensions } from '../core/beam';
import type { RenderSpec } from '../core/machine/renderSpec';
import { SpriteCache } from './spriteCache';
const SCENE_SEED = 1209;
export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly background = document.createElement('canvas');
  private readonly sprites = new SpriteCache();
  private width = 0;
  private backgroundWidth = -1;
  private backgroundNight = false;
  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is unavailable');
    this.ctx = ctx;
  }
  resize(clientWidth: number, devicePixelRatio: number): number {
    this.width = Math.max(0, Math.floor(clientWidth / PIXEL_SCALE));
    const scale = PIXEL_SCALE * Math.max(1, devicePixelRatio);
    this.canvas.width = Math.round(this.width * scale);
    this.canvas.height = Math.round(SCENE_HEIGHT * scale);
    this.canvas.style.width = `${this.width * PIXEL_SCALE}px`;
    this.canvas.style.height = `${SCENE_HEIGHT * PIXEL_SCALE}px`;
    this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
    return this.width;
  }
  private scene(night: boolean): void {
    if (this.backgroundWidth === this.width && this.backgroundNight === night) return;
    this.background.width = this.width; this.background.height = SCENE_HEIGHT;
    const ctx = this.background.getContext('2d');
    if (!ctx) throw new Error('Background canvas is unavailable');
    ctx.imageSmoothingEnabled = false;
    for (const rect of buildScene(this.width, night, SCENE_SEED)) {
      ctx.fillStyle = rect.color; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    this.backgroundWidth = this.width; this.backgroundNight = night;
  }
  render(spec: RenderSpec): void {
    if (this.width === 0) return;
    this.scene(spec.night);
    this.ctx.clearRect(0, 0, this.width, SCENE_HEIGHT);
    this.ctx.drawImage(this.background, 0, 0);
    this.ctx.fillStyle = 'rgba(40,30,60,.18)';
    this.ctx.fillRect(spec.x - 3.5, FEET_Y + 1, 7, 0.5);
    this.ctx.drawImage(this.sprites.get(spec.set, spec.frame, spec.flip), spec.left, spec.top, spec.width, spec.height);
    if (spec.set === 'beam') {
      for (const rect of beamExtensions(spriteSets.beam, spec.frame, spec, this.width)) {
        this.ctx.fillStyle = rect.color; this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      }
    }
  }
}
