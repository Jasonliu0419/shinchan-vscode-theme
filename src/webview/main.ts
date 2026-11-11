import { createModel } from '../core/machine/model';
import { step } from '../core/machine/step';
import type { Event } from '../core/machine/events';
import { renderSpec } from '../core/machine/renderSpec';
import { spriteSets } from '../core/sprites';
import { hitTest } from '../core/hitTest';
import { PIXEL_SCALE } from '../core/types';
import { Renderer } from './renderer';
import { startLoop } from './loop';
import { bindUI, updateSpeech } from './ui';
import { watchMotion } from './motion';
import { connectMessaging, restoreSleeping, type WebviewApi } from './messaging';
declare const acquireVsCodeApi: () => WebviewApi;
function boot(api: WebviewApi): () => void {
  const canvas = document.querySelector<HTMLCanvasElement>('#buddy');
  const scene = document.querySelector<HTMLElement>('#scene');
  const speech = document.querySelector<HTMLElement>('#speech');
  if (!canvas || !scene || !speech) throw new Error('Missing buddy view elements');
  const renderer = new Renderer(canvas);
  let cssWidth = scene.clientWidth, lastDpr = window.devicePixelRatio, bubbleWidth = 0;
  const width = renderer.resize(cssWidth, lastDpr);
  const motion = watchMotion(reduced => dispatch({ type: 'motion', reduced, now: performance.now() }));
  const seed = crypto.getRandomValues(new Uint32Array(1))[0]!;
  let model = createModel({ now: performance.now(), seed, width, sleeping: restoreSleeping(api.getState()), reduced: motion.initial });
  const draw = (now: number) => {
    const spec = renderSpec(model, now);
    renderer.render(spec); updateSpeech(speech, model.speech, spec, model.sceneWidth, bubbleWidth);
  };
  function dispatch(event: Event): void {
    const wasSleeping = model.mode === 'sleep';
    model = step(model, event);
    if (wasSleeping !== (model.mode === 'sleep')) api.setState({ sleeping: model.mode === 'sleep' });
  }
  const unbind = bindUI(canvas, action => dispatch({ type: 'action', action, now: performance.now() }), event => {
    const now = performance.now(), spec = renderSpec(model, now);
    if (event) {
      const rect = canvas.getBoundingClientRect();
      if (!hitTest(spriteSets[spec.set], spec.frame, spec, (event.clientX - rect.left) / PIXEL_SCALE, (event.clientY - rect.top) / PIXEL_SCALE)) return;
    }
    dispatch({ type: 'click', now });
  });
  const disconnect = connectMessaging(api, message => {
    if (message.type === 'config') motion.setHost(message.reduceMotion);
    else dispatch({ type: 'editorEvent', kind: message.kind, now: performance.now() });
  });
  const resize = (newWidth = cssWidth) => {
    const dpr = window.devicePixelRatio;
    if (newWidth === cssWidth && dpr === lastDpr) return;
    cssWidth = newWidth; lastDpr = dpr;
    dispatch({ type: 'resize', width: renderer.resize(newWidth, dpr), now: performance.now() });
  };
  const observer = new ResizeObserver(entries => {
    for (const entry of entries) {
      if (entry.target === scene) resize(entry.contentRect.width);
      if (entry.target === speech) bubbleWidth = entry.borderBoxSize[0]?.inlineSize ?? speech.getBoundingClientRect().width;
    }
  });
  observer.observe(scene); observer.observe(speech);
  const windowResize = () => resize();
  window.addEventListener('resize', windowResize);
  const stop = startLoop(now => dispatch({ type: 'tick', now }), draw);
  return () => { stop(); unbind(); disconnect(); motion.dispose(); observer.disconnect(); window.removeEventListener('resize', windowResize); };
}
try {
  const api = acquireVsCodeApi();
  const dispose = boot(api);
  window.addEventListener('pagehide', dispose, { once: true });
} catch {
  const error = document.querySelector<HTMLElement>('#error');
  if (error) { error.hidden = false; error.textContent = '小新暫時迷路了，請重新開啟面板。'; }
}
