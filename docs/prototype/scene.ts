export type Rect = { x: number; y: number; w: number; h: number; c: string };
export const SCENE_H = 64;
export const ROAD_TOP = 49;
export const FEET_Y = 60;
const DAY = {
  sky: ['#3E8FD8', '#5AA6E2', '#7BBBE9', '#9DCFEF', '#BFE1F4'], cloud: '#FFFFFF', cloudShade: '#DCEAF6',
  bldg: '#C9CCEA', bldgShade: '#B3B7DD', bldgWin: '#A7B2DE', tree: '#62B25C', treeDark: '#3F8C45', treeLight: '#8ACB6E',
  wall: '#F6F4EF', wallShade: '#D9D5E3', roof: '#D9533F', roofDark: '#A83B2D', win: '#9ED6EA', winFrame: '#7A8AA6', winLight: '#CDEEF6',
  door: '#C2702F', doorDark: '#8E4E1F', block: '#EBCB63', blockLine: '#C7A443', hedge: '#4FA34A', hedgeDark: '#357A35',
  brick: '#B9553B', fence: '#CFA54C', carport: '#9FB0C6', pole: '#8C8FA3', side: '#C9C4DD', road: '#B7B2D1', roadLine: '#D9D5E8', curb: '#A49FBF',
};
const NIGHT = {
  ...DAY, sky: ['#141B3D', '#1A2350', '#202B5E', '#27346B', '#2F3D77'], cloud: '#5A6390', cloudShade: '#454E7C',
  bldg: '#3C4270', bldgShade: '#30365F', bldgWin: '#E9C960', tree: '#2D5A3A', treeDark: '#1E4029', treeLight: '#3D6E47',
  wall: '#9298B8', wallShade: '#7A80A2', roof: '#7D3A3A', roofDark: '#5B2A2C', win: '#F3D46E', winFrame: '#4A4F70', winLight: '#FFE9A6',
  door: '#6E4A33', doorDark: '#4F3424', block: '#8E845A', blockLine: '#6F6745', hedge: '#2D5A3A', hedgeDark: '#1E4029',
  brick: '#6E3B33', fence: '#7A6A45', carport: '#5D6688', pole: '#5A5E7A', side: '#6B6889', road: '#585676', roadLine: '#7A7898', curb: '#4A4866',
};
export function buildScene(width: number, night: boolean): Rect[] {
  const p = night ? NIGHT : DAY; const out: Rect[] = [];
  const add = (x: number, y: number, w: number, h: number, c: string) => {
    const l = Math.max(0, x), t = Math.max(0, y), r = Math.min(width, x + w), b = Math.min(SCENE_H, y + h);
    if (r > l && b > t) out.push({ x: l, y: t, w: r - l, h: b - t, c });
  };
  // sky bands
  const bands = [0, 8, 16, 24, 34];
  bands.forEach((y, i) => add(0, y, width, (bands[i + 1] ?? ROAD_TOP) - y, p.sky[i]!));
  if (night) {
    let s = 7;
    for (let i = 0; i < Math.floor(width / 7); i++) { s = (s * 1103515245 + 12345) % 2147483648; add(s % width, 1 + (s >> 8) % 20, 1, 1, '#FFF3C4'); }
    add(width - 14, 3, 5, 5, '#FFF0B8'); add(width - 12, 2, 4, 5, p.sky[0]!);
  }
  // clouds
  const cloud = (x: number, y: number, w: number) => {
    add(x + 2, y, w - 4, 1, p.cloud); add(x, y + 1, w, 2, p.cloud); add(x + 1, y + 3, w - 2, 1, p.cloudShade);
    add(x + Math.floor(w / 3), y - 1, Math.floor(w / 3), 1, p.cloud);
  };
  cloud(4, 6, 14); if (width > 70) cloud(width - 26, 9, 12); cloud(Math.floor(width / 2) + 14, 4, 7);
  const cx = Math.floor(width / 2);
  // background buildings
  const bldg = (x: number, y: number, w: number) => {
    add(x, y, w, ROAD_TOP - y, p.bldg); add(x + w - 2, y, 2, ROAD_TOP - y, p.bldgShade);
    for (let wy = y + 3; wy < 40; wy += 5) for (let wx = x + 2; wx < x + w - 4; wx += 5) add(wx, wy, 3, 2, p.bldgWin);
  };
  bldg(cx - 46, 17, 14); bldg(cx + 22, 22, 18); bldg(cx - 60, 24, 12); bldg(cx + 44, 18, 14);
  // trees
  const tree = (x: number, y: number, w: number) => {
    add(x + 2, y, w - 4, 1, p.treeLight); add(x + 1, y + 1, w - 2, 2, p.tree); add(x, y + 3, w, ROAD_TOP - y - 3, p.tree);
    add(x, y + 6, w, 2, p.treeDark); add(x + 2, y + 1, 2, 1, p.treeLight);
  };
  for (let x = cx - 70; x < cx - 26; x += 9) tree(x, 34 + (x & 3), 10);
  for (let x = cx + 30; x < width + 10; x += 9) tree(x, 33 + (x & 3), 10);
  add(cx + 27, 24, 3, 18, p.treeDark); add(cx + 26, 28, 5, 14, p.tree); add(cx + 31, 27, 3, 15, p.treeDark); // cypress
  // upper floor
  add(cx - 13, 15, 26, 16, p.wall); add(cx + 11, 15, 2, 16, p.wallShade);
  // upper gable roof
  for (let i = 0; i < 8; i++) add(cx - 2 - i * 2, 8 + i, 4 + i * 4, 1, i === 7 ? p.roofDark : p.roof);
  add(cx - 1, 2, 1, 6, p.pole); add(cx - 4, 3, 7, 1, p.pole); add(cx - 3, 5, 5, 1, p.pole);
  // upper windows + balcony
  add(cx - 9, 17, 2, 6, p.winFrame); add(cx - 7, 17, 9, 6, p.win); add(cx - 7, 17, 9, 1, p.winLight); add(cx - 3, 17, 1, 6, p.winFrame);
  add(cx + 5, 17, 4, 5, p.win); add(cx + 5, 17, 4, 1, p.winLight);
  add(cx - 11, 23, 18, 1, p.wallShade); add(cx - 11, 24, 18, 4, p.wall); add(cx - 11, 27, 18, 1, p.wallShade);
  for (let x = cx - 10; x < cx + 6; x += 2) add(x, 24, 1, 3, p.winFrame);
  // lower eave
  add(cx - 18, 31, 38, 1, p.roof); add(cx - 20, 32, 42, 2, p.roof); add(cx - 21, 34, 44, 1, p.roofDark);
  // lower floor
  add(cx - 18, 35, 34, 12, p.wall); add(cx + 14, 35, 2, 12, p.wallShade);
  add(cx - 16, 37, 4, 7, p.wallShade); add(cx - 16, 38, 4, 1, p.winFrame);
  add(cx - 10, 37, 12, 7, p.win); add(cx - 10, 37, 12, 1, p.winLight); add(cx - 4, 37, 1, 7, p.winFrame);
  add(cx + 6, 37, 5, 10, p.door); add(cx + 6, 37, 5, 1, p.doorDark); add(cx + 9, 42, 1, 1, '#F2D16B');
  add(cx + 4, 38, 1, 2, '#F2D16B');
  // carport
  add(cx + 16, 33, 14, 1, p.carport); add(cx + 17, 34, 12, 1, p.carport); add(cx + 28, 34, 1, 13, p.pole);
  // front wall: blocks + hedges + gate
  add(0, 43, cx + 3, 6, p.block);
  for (let x = 0; x < cx + 3; x += 4) add(x, 43, 1, 6, p.blockLine);
  add(0, 46, cx + 3, 1, p.blockLine);
  for (let x = 1; x < cx - 2; x += 12) { add(x, 40, 9, 3, p.hedge); add(x + 1, 39, 7, 1, p.hedge); add(x, 42, 9, 1, p.hedgeDark); }
  add(cx + 3, 41, 3, 8, p.brick); add(cx + 3, 41, 3, 1, p.roofDark);
  add(cx + 12, 41, 3, 8, p.brick); add(cx + 12, 41, 3, 1, p.roofDark);
  add(cx + 15, 42, 14, 7, p.fence);
  for (let x = cx + 15; x < cx + 29; x += 2) add(x, 42, 1, 7, p.blockLine);
  add(cx + 29, 43, width, 6, p.block); for (let x = cx + 29; x < width; x += 4) add(x, 43, 1, 6, p.blockLine);
  // sidewalk + road
  add(0, ROAD_TOP, width, 2, p.side); add(0, ROAD_TOP + 2, width, 1, p.curb);
  add(0, ROAD_TOP + 3, width, SCENE_H - ROAD_TOP - 3, p.road);
  for (let x = 2; x < width; x += 10) add(x, 58, 5, 1, p.roadLine);
  return out;
}
