import data from '../../assets/sprites.json';

export type SpriteSet = Readonly<{
  legend: Readonly<Record<string, string>>;
  faces: 'left' | 'right' | 'front';
  frames: readonly (readonly string[])[];
  durations: readonly number[];
  anchor: number;
  width: number;
  height: number;
}>;
export type SpriteSetId = keyof typeof data;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Validate untrusted JSON once and retain immutable, independent palette/frame data. */
export function loadSpriteSets(value: unknown): Readonly<Record<string, SpriteSet>> {
  if (!record(value) || Object.keys(value).length === 0) throw new Error('Expected sprite sets');
  const sets: Record<string, SpriteSet> = {};
  for (const [name, input] of Object.entries(value)) {
    if (!record(input) || !record(input.legend) || Object.keys(input.legend).length === 0) throw new Error(`Invalid legend: ${name}`);
    const legend: Record<string, string> = {};
    for (const [char, color] of Object.entries(input.legend)) {
      if (char.length !== 1 || typeof color !== 'string' || !/^#[\da-f]{6}$/i.test(color)) throw new Error(`Invalid legend color: ${name}`);
      legend[char] = color;
    }
    if (input.faces !== 'left' && input.faces !== 'right' && input.faces !== 'front') throw new Error(`Invalid facing: ${name}`);
    if (!Array.isArray(input.frames) || input.frames.length === 0) throw new Error(`Missing frames: ${name}`);
    const first: unknown = input.frames[0];
    if (!Array.isArray(first) || first.length === 0 || typeof first[0] !== 'string' || first[0].length === 0) throw new Error(`Invalid frame dimensions: ${name}`);
    const width = first[0].length, height = first.length;
    const frames = input.frames.map((rows: unknown) => {
      if (!Array.isArray(rows) || rows.length !== height) throw new Error(`Invalid frame height: ${name}`);
      return Object.freeze(rows.map((row: unknown) => {
        if (typeof row !== 'string' || row.length !== width) throw new Error(`Invalid row width: ${name}`);
        for (const char of row) if (char !== '.' && !Object.hasOwn(legend, char)) throw new Error(`Unknown legend character: ${name}`);
        return row;
      }));
    });
    if (!Array.isArray(input.durations) || input.durations.length !== frames.length ||
      input.durations.some((ms: unknown) => typeof ms !== 'number' || !Number.isFinite(ms) || ms <= 0)) throw new Error(`Invalid durations: ${name}`);
    if (typeof input.anchor !== 'number' || !Number.isFinite(input.anchor) || input.anchor < 0 || input.anchor > width - 1) throw new Error(`Invalid anchor: ${name}`);
    Object.defineProperty(sets, name, { enumerable: true, value: Object.freeze({
      legend: Object.freeze(legend), faces: input.faces, anchor: input.anchor, width, height,
      frames: Object.freeze(frames), durations: Object.freeze([...input.durations] as number[]),
    }) });
  }
  return Object.freeze(sets);
}

// Reference pixel art by a_cute_tattoo + user-supplied GIFs. Personal use only; do not redistribute.
export const spriteSets = loadSpriteSets(data) as Readonly<Record<SpriteSetId, SpriteSet>>;
