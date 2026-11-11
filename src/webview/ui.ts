import type { Action } from '../core/types';
import type { Speech } from '../core/machine/model';
import type { RenderSpec } from '../core/machine/renderSpec';
import { PIXEL_SCALE, FEET_Y, SPRITE_SCALE } from '../core/types';
export function bindUI(canvas: HTMLCanvasElement, action: (action: Action) => void, click: (event?: MouseEvent) => void): () => void {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('button[data-action]')];
  const handlers = buttons.map(button => {
    const handler = () => {
      const value = button.dataset.action;
      if (value === 'greet' || value === 'beam' || value === 'wiggle' || value === 'sleep') action(value);
    };
    button.addEventListener('click', handler);
    return () => button.removeEventListener('click', handler);
  });
  const mouse = (event: MouseEvent) => click(event);
  const key = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (!event.repeat) click(); }
  };
  canvas.addEventListener('click', mouse); canvas.addEventListener('keydown', key);
  return () => { handlers.forEach(dispose => dispose()); canvas.removeEventListener('click', mouse); canvas.removeEventListener('keydown', key); };
}
/** CSS px between the top of Shin-chan's head and the bottom of the bubble box (the tail sits in this gap). */
const BUBBLE_GAP_PX = 10;
export function updateSpeech(element: HTMLElement, speech: Speech | null, spec: RenderSpec, sceneWidth: number, bubbleWidth: number): void {
  element.hidden = speech === null;
  const text = speech?.text ?? '';
  if (element.textContent !== text) element.textContent = text;
  const center = spec.x * PIXEL_SCALE;
  const halfWidth = bubbleWidth / 2;
  element.style.left = `${Math.max(halfWidth + 8, Math.min(sceneWidth * PIXEL_SCALE - halfWidth - 8, center))}px`;
  element.style.top = `${(FEET_Y + 1 - 31 * SPRITE_SCALE) * PIXEL_SCALE - BUBBLE_GAP_PX}px`;
}
