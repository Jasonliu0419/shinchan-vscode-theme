import { clips, clipDuration } from '../clips';
import { actions, pools, wake, type PoolName } from '../lines';
import { pickLine } from '../linePicker';
import { canReact } from '../reactionPolicy';
import { JUMP_MS, clampX, future, positionAt, scheduleWalk, startWalk, walkAt } from './idle';
import type { Model } from './model';
import type { Event } from './events';
function speak(model: Model, text: string, now: number): Model {
  return { ...model, speech: { text, expiresAt: now + 2500 + 120 * [...text].length } };
}
function speakPool(model: Model, pool: PoolName, now: number): Model {
  const pick = pickLine(pools[pool], model.lastLineIndex[pool], model.seed);
  return speak({ ...model, seed: pick.seed, lastLineIndex: { ...model.lastLineIndex, [pool]: pick.index } }, pick.line, now);
}
/** Settle elapsed clips and interpolate walks before handling any new input. */
function advance(model: Model, now: number): Model {
  const walk = walkAt(model, now);
  let next: Model = {
    ...model, now, walk, x: positionAt(model, now),
    facing: walk ? (walk.to > walk.from ? 'right' : 'left') : model.facing,
    speech: model.speech && now >= model.speech.expiresAt ? null : model.speech,
    jumpStartedAt: model.jumpStartedAt !== null && now - model.jumpStartedAt >= JUMP_MS ? null : model.jumpStartedAt,
  };
  if (model.mode !== 'idle' && model.mode !== 'sleep' && now - model.modeStartedAt >= clipDuration(clips[model.mode])) {
    const endedAt = model.modeStartedAt + clipDuration(clips[model.mode]);
    next = scheduleWalk({ ...next, mode: 'idle', modeStartedAt: now }, endedAt);
  }
  if (model.mode !== 'idle' && (next.mode === 'idle' || now >= next.nextIdleLineAt)) {
    const line = future(next.seed, now, 60000, 120000);
    next = { ...next, seed: line.seed, nextIdleLineAt: line.at };
  }
  return next;
}
function idleTick(model: Model, now: number): Model {
  if (model.mode !== 'idle') return model;
  let next = model;
  if (now >= next.nextIdleLineAt) {
    if (next.speech === null) next = speakPool(next, 'idle', now);
    const line = future(next.seed, now, 60000, 120000);
    next = { ...next, seed: line.seed, nextIdleLineAt: line.at };
  }
  if (!next.reduced && !next.walk && next.jumpStartedAt === null && now >= next.nextWalkAt) {
    next = advance(startWalk(next, next.nextWalkAt), now);
  }
  return next;
}
export function step(model: Model, event: Event): Model {
  let next = advance(model, event.now);
  switch (event.type) {
    case 'tick': return idleTick(next, event.now);
    case 'action':
      return speak({ ...next, x: clampX(next.x, next.sceneWidth), mode: event.action, modeStartedAt: event.now, walk: null, jumpStartedAt: null }, actions[event.action], event.now);
    case 'click':
      if (next.mode === 'waking') return next;
      if (next.mode === 'sleep') return speak({ ...next, mode: 'waking', modeStartedAt: event.now, walk: null }, wake[0], event.now);
      if (next.mode !== 'idle') return speakPool(next, 'greeting', event.now);
      next = scheduleWalk(next, event.now);
      return speakPool({ ...next, walk: null, jumpStartedAt: event.now }, 'greeting', event.now);
    case 'editorEvent':
      if (!canReact(event.kind, next.mode, event.now, next.lastReactionAt)) return next;
      next = speakPool(next, event.kind === 'save' ? 'save' : 'error', event.now);
      return { ...next, lastReactionAt: { ...next.lastReactionAt, [event.kind]: event.now } };
    case 'resize': {
      const width = Math.max(0, Math.floor(event.width));
      return scheduleWalk({ ...next, sceneWidth: width, x: clampX(next.x, width), walk: null }, event.now);
    }
    case 'motion':
      if (next.reduced === event.reduced) return next;
      return scheduleWalk({ ...next, reduced: event.reduced, walk: null }, event.now);
  }
}
