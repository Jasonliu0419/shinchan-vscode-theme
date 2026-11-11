import type { Facing, Mode } from '../types';
import type { LastReaction } from '../reactionPolicy';
import type { PoolName } from '../lines';
import { future, clampX, scheduleWalk } from './idle';
export type Walk = Readonly<{ from: number; to: number; startedAt: number; duration: number }>;
export type Speech = Readonly<{ text: string; expiresAt: number }>;
export type Model = Readonly<{
  now: number; seed: number; mode: Mode; modeStartedAt: number; x: number; facing: Facing;
  sceneWidth: number; reduced: boolean; walk: Walk | null; nextWalkAt: number;
  nextIdleLineAt: number; jumpStartedAt: number | null;
  speech: Speech | null; lastLineIndex: Readonly<Record<PoolName, number>>; lastReactionAt: LastReaction;
}>;
export type InitialOptions = Readonly<{ now: number; seed: number; width: number; sleeping?: boolean; reduced?: boolean }>;
export function createModel(options: InitialOptions): Model {
  const { now } = options;
  const line = future(options.seed, now, 60000, 120000);
  const width = Math.max(0, Math.floor(options.width));
  return scheduleWalk({
    now, seed: line.seed, mode: options.sleeping ? 'sleep' : 'idle', modeStartedAt: now,
    x: clampX(Math.floor(width / 2), width), facing: 'right', sceneWidth: width,
    reduced: options.reduced ?? false, walk: null, nextWalkAt: Infinity,
    nextIdleLineAt: line.at, jumpStartedAt: null, speech: null,
    lastLineIndex: { greeting: -1, idle: -1, save: -1, error: -1 },
    lastReactionAt: { save: -Infinity, errorsIncreased: -Infinity },
  }, now);
}
