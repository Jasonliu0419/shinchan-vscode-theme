export type Action = 'greet' | 'beam' | 'wiggle' | 'sleep';
export type Mode = 'idle' | Action | 'waking';
export type Facing = 'left' | 'right';
export type EditorEventKind = 'save' | 'errorsIncreased';
export const VIEW_ID = 'shinchanBuddy.buddyView';
export const PIXEL_SCALE = 3;
/** Scene logical pixels per sprite pixel. */
export const SPRITE_SCALE = 0.5;
export const SCENE_HEIGHT = 64;
export const ROAD_TOP = 49;
export const FEET_Y = 60;
