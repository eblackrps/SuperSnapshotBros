// world.js — tile grid, level data, rendering

const TILE_SIZE = 32;
const LEVEL_ROWS = 14;
const WORLD_1_1_COLS = 188;
const WORLD_1_2_COLS = 196;
const WORLD_1_3_COLS = 208;
const WORLD_1_4_COLS = 216;
const WORLD_1_5_COLS = 220;
const WORLD_1_6_COLS = 228;
const WORLD_1_7_COLS = 232;
const WORLD_1_8_COLS = 240;
const WORLD_2_1_COLS = 212;

const THEMES = {
  datacenter: {
    id: 'datacenter',
    bgTop: '#050e05',
    bgBottom: '#0a180a',
    far: ['#0c1e0c', '#0a180a', '#0d220d', '#0b1c0b'],
    mid: '#0e260e',
    midLedOn: '#003310',
    midLedOff: '#001a08',
    tile: { body: '#152d15', panel: '#1e421e', top: '#3aaa3a', ledOn: '#00ff41', ledOff: '#003310' },
    breakable: { body: '#6b4a16', panel: '#9a6a22', detail: '#c79133', top: '#ffd27a' },
    platform: { rail: 'rgba(0, 255, 200, 0.08)', body: '#15463a', top: '#2be8c1', inset: '#0d221c', light: '#9affea', label: '#062018', text: 'SYNC' },
    goal: { openBase: '255, 200, 0', lockedBase: '255, 80, 120', label: '#000000', lockedStroke: 'rgba(255, 170, 190, 0.75)' },
    hazards: {
      emp: { fillBase: '255, 80, 0', strokeBase: '255, 170, 0', stripeBase: '255, 220, 120', label: '#ffdd88', text: 'EMP' },
      corruption: { fillBase: '255, 30, 80', strokeBase: '255, 90, 140', stripeBase: '255, 180, 210', label: '#ffd6e3', text: 'CRC' },
      undertow: { fillBase: '70, 180, 255', strokeBase: '120, 220, 255', stripeBase: '180, 240, 255', label: '#d5f8ff', text: 'TIDE' },
    },
  },
  fortress: {
    id: 'fortress',
    bgTop: '#130607',
    bgBottom: '#241112',
    far: ['#1d0b0d', '#18080a', '#2a1216', '#120507'],
    mid: '#2a1216',
    midLedOn: '#3a191f',
    midLedOff: '#160709',
    tile: { body: '#352b33', panel: '#493842', top: '#d0744e', ledOn: '#ffbb77', ledOff: '#2a1511' },
    breakable: { body: '#5a4632', panel: '#7a5b40', detail: '#bb8b5b', top: '#ffd39c' },
    platform: { rail: 'rgba(255, 180, 140, 0.08)', body: '#5a2d32', top: '#ff9966', inset: '#2f1014', light: '#ffd3ae', label: '#1a0608', text: 'LIFT' },
    goal: { openBase: '255, 205, 90', lockedBase: '255, 90, 120', label: '#170406', lockedStroke: 'rgba(255, 190, 160, 0.75)' },
    hazards: {
      emp: { fillBase: '255, 120, 40', strokeBase: '255, 190, 90', stripeBase: '255, 220, 160', label: '#ffe1ad', text: 'EMP' },
      corruption: { fillBase: '220, 30, 70', strokeBase: '255, 110, 140', stripeBase: '255, 200, 210', label: '#ffd4dc', text: 'CRC' },
      undertow: { fillBase: '110, 140, 255', strokeBase: '170, 190, 255', stripeBase: '210, 220, 255', label: '#e1e8ff', text: 'FLOW' },
    },
  },
  water: {
    id: 'water',
    bgTop: '#041622',
    bgBottom: '#09314a',
    far: ['#08263a', '#0b3147', '#0a1f31', '#103a52'],
    mid: '#0d4263',
    midLedOn: '#0b5b85',
    midLedOff: '#082638',
    tile: { body: '#12415a', panel: '#1a5f7e', top: '#7ce6ff', ledOn: '#c6fbff', ledOff: '#0a2230' },
    breakable: { body: '#6a512f', panel: '#8d6a3e', detail: '#c29a62', top: '#ffe2a8' },
    platform: { rail: 'rgba(120, 230, 255, 0.10)', body: '#1b5d75', top: '#7ce6ff', inset: '#0c2f41', light: '#d8fbff', label: '#06202b', text: 'BUOY' },
    goal: { openBase: '255, 230, 120', lockedBase: '255, 100, 150', label: '#04202e', lockedStroke: 'rgba(180, 240, 255, 0.8)' },
    hazards: {
      emp: { fillBase: '100, 180, 255', strokeBase: '170, 220, 255', stripeBase: '220, 245, 255', label: '#eefcff', text: 'ARC' },
      corruption: { fillBase: '200, 40, 90', strokeBase: '255, 110, 150', stripeBase: '255, 205, 225', label: '#ffe3ef', text: 'CRC' },
      undertow: { fillBase: '40, 170, 255', strokeBase: '120, 230, 255', stripeBase: '180, 240, 255', label: '#d7fbff', text: 'TIDE' },
    },
  },
};

function cloneTheme(id = 'datacenter') {
  const source = THEMES[id] || THEMES.datacenter;
  return {
    ...source,
    far: [...source.far],
    tile: { ...source.tile },
    breakable: { ...source.breakable },
    platform: { ...source.platform },
    goal: { ...source.goal },
    hazards: {
      emp: { ...source.hazards.emp },
      corruption: { ...source.hazards.corruption },
      undertow: { ...source.hazards.undertow },
    },
  };
}

// ─── Level Data ───────────────────────────────────────────────────────────────
// 0 = empty, 1 = solid
// World 1-1 is intentionally Mario-length now: a longer datacenter run with
// a warm-up, an early staircase, a summit, a quieter midpoint, a bonus route,
// and a final vault approach.

function createTileGrid(cols, rows) {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

function paintRect(tiles, colStart, colEnd, rowStart, rowEnd, value) {
  const maxRow = tiles.length - 1;
  const maxCol = tiles[0].length - 1;
  const safeColStart = Math.max(0, colStart);
  const safeColEnd   = Math.min(maxCol, colEnd);
  const safeRowStart = Math.max(0, rowStart);
  const safeRowEnd   = Math.min(maxRow, rowEnd);

  for (let row = safeRowStart; row <= safeRowEnd; row++) {
    for (let col = safeColStart; col <= safeColEnd; col++) {
      tiles[row][col] = value;
    }
  }
}

function fillRect(tiles, colStart, colEnd, rowStart, rowEnd) {
  paintRect(tiles, colStart, colEnd, rowStart, rowEnd, 1);
}

function fillBreakableRect(tiles, colStart, colEnd, rowStart, rowEnd) {
  paintRect(tiles, colStart, colEnd, rowStart, rowEnd, 2);
}

function clearRect(tiles, colStart, colEnd, rowStart, rowEnd) {
  paintRect(tiles, colStart, colEnd, rowStart, rowEnd, 0);
}

function fillRow(tiles, row, colStart, colEnd) {
  fillRect(tiles, colStart, colEnd, row, row);
}

function buildWorld11Tiles() {
  const tiles = createTileGrid(WORLD_1_1_COLS, LEVEL_ROWS);

  // Ground backbone
  fillRow(tiles, 13, 0, WORLD_1_1_COLS - 1);

  // Forced jumps and broken rack spans
  const groundGaps = [
    [6, 7],      // boot corridor
    [22, 24],    // first staircase
    [33, 35],    // second staircase
    [44, 46],    // third staircase
    [55, 58],    // summit jump
    [130, 133],  // broken shelf ascent
    [141, 144],  // service rupture
    [152, 155],  // degraded spine
    [164, 166],  // vault approach
  ];
  for (const [start, end] of groundGaps) clearRect(tiles, start, end, 13, 13);

  // Beat 1-2: early staircase into the first summit
  fillRow(tiles, 10, 14, 20);
  fillRow(tiles, 8, 25, 31);
  fillRow(tiles, 6, 36, 42);
  fillRow(tiles, 4, 47, 54);
  fillRow(tiles, 3, 59, 71);

  // Summit support towers to make the midpoint feel like a destination
  fillRect(tiles, 59, 61, 4, 12);
  fillRect(tiles, 69, 71, 4, 12);

  // Beat 3: descent toward the quiet checkpoint plateau
  fillRow(tiles, 4, 75, 82);
  fillRow(tiles, 6, 86, 93);
  fillRow(tiles, 8, 97, 103);

  // Beat 4-5: optional reward route over the quiet service floor
  fillRow(tiles, 9, 108, 114);
  fillRow(tiles, 7, 118, 124);
  fillRow(tiles, 5, 128, 134);

  // Beat 6: second broken ascent into the vault
  fillRow(tiles, 10, 122, 129);
  fillRow(tiles, 8, 134, 140);
  fillRow(tiles, 6, 145, 151);
  fillRow(tiles, 4, 156, 163);
  fillRow(tiles, 3, 167, 171);
  fillRow(tiles, 2, 174, 186);

  // Final vault pillars
  fillRect(tiles, 174, 176, 3, 12);
  fillRect(tiles, 184, 186, 3, 12);

  // Midpoint service bay landmark
  fillRect(tiles, 103, 104, 10, 12);
  fillRect(tiles, 117, 118, 10, 12);
  fillRow(tiles, 9, 104, 117);
  clearRect(tiles, 103, 104, 11, 12);
  clearRect(tiles, 117, 118, 11, 12);

  // Breakable maintenance bricks for big-form reward routes
  fillBreakableRect(tiles, 109, 113, 11, 11);
  fillBreakableRect(tiles, 148, 151, 11, 11);
  fillBreakableRect(tiles, 168, 170, 11, 11);

  // Final backup vault shell
  fillRect(tiles, 172, 173, 8, 12);
  fillRect(tiles, 187, 187, 8, 12);
  fillRow(tiles, 8, 173, 186);

  return tiles;
}

function buildWorld12Tiles() {
  const tiles = createTileGrid(WORLD_1_2_COLS, LEVEL_ROWS);

  // Ground backbone
  fillRow(tiles, 13, 0, WORLD_1_2_COLS - 1);

  // Replication lag ruptures across the floor
  const groundGaps = [
    [8, 10],
    [23, 25],
    [39, 41],
    [58, 60],
    [74, 76],
    [94, 97],
    [120, 123],
    [142, 145],
    [167, 169],
    [184, 186],
  ];
  for (const [start, end] of groundGaps) clearRect(tiles, start, end, 13, 13);

  // Early relay staircase
  fillRow(tiles, 10, 14, 21);
  fillRow(tiles, 8, 27, 34);
  fillRow(tiles, 6, 43, 50);

  // Jitter shelves
  fillRow(tiles, 9, 54, 62);
  fillRow(tiles, 7, 66, 73);
  fillRow(tiles, 5, 78, 85);

  // Mid-lag basin
  fillRow(tiles, 10, 100, 107);
  fillRow(tiles, 8, 111, 118);
  fillRow(tiles, 6, 124, 131);

  // Commit spine to the final uplink
  fillRow(tiles, 10, 136, 143);
  fillRow(tiles, 8, 148, 155);
  fillRow(tiles, 6, 160, 167);
  fillRow(tiles, 4, 172, 179);
  fillRow(tiles, 3, 184, 191);

  // Relay towers and uplink shell
  fillRect(tiles, 54, 55, 10, 12);
  fillRect(tiles, 61, 62, 10, 12);
  fillRect(tiles, 184, 186, 4, 12);
  fillRect(tiles, 191, 193, 4, 12);

  // Breakable cache blocks
  fillBreakableRect(tiles, 113, 116, 9, 9);
  fillBreakableRect(tiles, 162, 164, 7, 7);

  // Small uplink roof
  fillRow(tiles, 4, 186, 193);

  return tiles;
}

function buildWorld13Tiles() {
  const tiles = createTileGrid(WORLD_1_3_COLS, LEVEL_ROWS);

  // Ground backbone
  fillRow(tiles, 13, 0, WORLD_1_3_COLS - 1);

  // Broken archive floor
  const groundGaps = [
    [9, 11],
    [24, 26],
    [40, 42],
    [63, 66],
    [87, 89],
    [112, 115],
    [136, 138],
    [161, 164],
    [183, 186],
  ];
  for (const [start, end] of groundGaps) clearRect(tiles, start, end, 13, 13);

  // Warm-up shelves
  fillRow(tiles, 10, 14, 21);
  fillRow(tiles, 8, 28, 35);
  fillRow(tiles, 6, 44, 51);

  // Redacted archive zone
  fillRow(tiles, 9, 56, 63);
  fillRow(tiles, 7, 68, 75);
  fillRow(tiles, 5, 80, 87);

  // Midpoint backup corridor
  fillRow(tiles, 10, 96, 103);
  fillRow(tiles, 8, 108, 115);
  fillRow(tiles, 6, 120, 127);
  fillRow(tiles, 4, 132, 139);

  // Final immutable spine
  fillRow(tiles, 9, 145, 152);
  fillRow(tiles, 7, 157, 164);
  fillRow(tiles, 5, 169, 176);
  fillRow(tiles, 4, 181, 188);
  fillRow(tiles, 3, 192, 205);

  // Visual anchor towers
  fillRect(tiles, 56, 57, 10, 12);
  fillRect(tiles, 62, 63, 10, 12);
  fillRect(tiles, 96, 97, 11, 12);
  fillRect(tiles, 114, 115, 9, 12);
  fillRect(tiles, 192, 194, 4, 12);
  fillRect(tiles, 203, 205, 4, 12);

  // Breakable vault caches
  fillBreakableRect(tiles, 108, 111, 9, 9);
  fillBreakableRect(tiles, 170, 172, 6, 6);

  // Final roof
  fillRow(tiles, 4, 194, 205);

  return tiles;
}

function buildWorld14Tiles() {
  const tiles = createTileGrid(WORLD_1_4_COLS, LEVEL_ROWS);

  fillRow(tiles, 13, 0, WORLD_1_4_COLS - 1);

  const groundGaps = [
    [8, 10],
    [24, 26],
    [42, 44],
    [61, 63],
    [83, 86],
    [104, 107],
    [126, 129],
    [148, 151],
    [171, 174],
    [194, 197],
  ];
  for (const [start, end] of groundGaps) clearRect(tiles, start, end, 13, 13);

  fillRow(tiles, 10, 14, 21);
  fillRow(tiles, 8, 28, 35);
  fillRow(tiles, 6, 40, 47);

  fillRow(tiles, 10, 56, 63);
  fillRow(tiles, 7, 58, 65);
  fillRow(tiles, 5, 70, 77);
  fillRow(tiles, 9, 82, 89);

  fillRow(tiles, 10, 96, 103);
  fillRow(tiles, 8, 108, 115);
  fillRow(tiles, 6, 120, 127);
  fillRow(tiles, 4, 132, 139);

  fillRow(tiles, 9, 146, 153);
  fillRow(tiles, 7, 158, 165);
  fillRow(tiles, 5, 170, 177);

  fillRow(tiles, 10, 186, 193);
  fillRow(tiles, 8, 198, 204);
  fillRow(tiles, 6, 206, 214);

  fillRect(tiles, 56, 57, 11, 12);
  fillRect(tiles, 64, 65, 8, 12);
  fillRect(tiles, 96, 97, 11, 12);
  fillRect(tiles, 138, 139, 5, 12);
  fillRect(tiles, 206, 207, 7, 12);
  fillRect(tiles, 213, 214, 7, 12);

  fillBreakableRect(tiles, 109, 112, 9, 9);
  fillBreakableRect(tiles, 172, 175, 6, 6);

  fillRow(tiles, 7, 206, 214);

  return tiles;
}

function buildWorld15Tiles() {
  const tiles = createTileGrid(WORLD_1_5_COLS, LEVEL_ROWS);

  fillRow(tiles, 13, 0, WORLD_1_5_COLS - 1);

  const groundGaps = [
    [10, 12],
    [26, 28],
    [44, 46],
    [66, 69],
    [90, 93],
    [114, 117],
    [138, 141],
    [160, 163],
  ];
  for (const [start, end] of groundGaps) clearRect(tiles, start, end, 13, 13);

  fillRow(tiles, 10, 14, 21);
  fillRow(tiles, 8, 30, 37);
  fillRow(tiles, 6, 48, 55);

  fillRow(tiles, 10, 58, 66);
  fillRow(tiles, 8, 72, 80);
  fillRow(tiles, 6, 86, 94);

  fillRow(tiles, 9, 100, 107);
  fillRow(tiles, 7, 112, 119);
  fillRow(tiles, 5, 124, 131);
  fillRow(tiles, 4, 136, 143);

  fillRow(tiles, 10, 148, 155);
  fillRow(tiles, 8, 160, 167);
  fillRow(tiles, 6, 172, 179);

  fillRow(tiles, 11, 186, 214);
  fillRow(tiles, 10, 194, 198);
  fillRow(tiles, 8, 202, 207);
  fillRow(tiles, 6, 209, 214);

  fillRect(tiles, 58, 59, 11, 12);
  fillRect(tiles, 66, 67, 11, 12);
  fillRect(tiles, 100, 101, 10, 12);
  fillRect(tiles, 118, 119, 8, 12);
  fillRect(tiles, 186, 187, 8, 12);
  fillRect(tiles, 214, 215, 6, 12);
  fillRect(tiles, 208, 208, 7, 12);

  fillBreakableRect(tiles, 72, 74, 9, 9);
  fillBreakableRect(tiles, 160, 162, 9, 9);
  fillBreakableRect(tiles, 174, 176, 7, 7);

  fillRow(tiles, 7, 188, 214);

  return tiles;
}

function buildWorld16Tiles() {
  const tiles = createTileGrid(WORLD_1_6_COLS, LEVEL_ROWS);

  fillRow(tiles, 13, 0, WORLD_1_6_COLS - 1);

  const groundGaps = [
    [8, 10], [25, 27], [43, 45], [63, 66], [86, 89],
    [108, 111], [132, 135], [156, 159], [180, 183], [204, 206],
  ];
  for (const [start, end] of groundGaps) clearRect(tiles, start, end, 13, 13);

  fillRow(tiles, 10, 14, 21);
  fillRow(tiles, 8, 30, 37);
  fillRow(tiles, 6, 46, 53);
  fillRow(tiles, 10, 58, 66);
  fillRow(tiles, 8, 72, 80);
  fillRow(tiles, 6, 88, 96);
  fillRow(tiles, 10, 104, 111);
  fillRow(tiles, 8, 118, 125);
  fillRow(tiles, 6, 132, 139);
  fillRow(tiles, 4, 146, 153);
  fillRow(tiles, 9, 158, 165);
  fillRow(tiles, 7, 171, 178);
  fillRow(tiles, 5, 184, 191);
  fillRow(tiles, 10, 198, 205);
  fillRow(tiles, 8, 210, 217);
  fillRow(tiles, 6, 220, 227);

  fillRect(tiles, 58, 59, 11, 12);
  fillRect(tiles, 66, 67, 11, 12);
  fillRect(tiles, 104, 105, 11, 12);
  fillRect(tiles, 124, 125, 9, 12);
  fillRect(tiles, 146, 147, 5, 12);
  fillRect(tiles, 220, 221, 7, 12);
  fillRect(tiles, 226, 227, 7, 12);

  fillBreakableRect(tiles, 74, 77, 9, 9);
  fillBreakableRect(tiles, 135, 138, 7, 7);
  fillBreakableRect(tiles, 184, 187, 9, 9);

  fillRow(tiles, 7, 220, 227);

  return tiles;
}

function buildWorld17Tiles() {
  const tiles = createTileGrid(WORLD_1_7_COLS, LEVEL_ROWS);

  fillRow(tiles, 13, 0, WORLD_1_7_COLS - 1);

  const groundGaps = [
    [9, 12], [29, 31], [48, 50], [69, 72], [91, 94],
    [116, 119], [141, 144], [164, 167], [186, 189], [208, 210],
  ];
  for (const [start, end] of groundGaps) clearRect(tiles, start, end, 13, 13);

  fillRow(tiles, 10, 14, 22);
  fillRow(tiles, 8, 28, 35);
  fillRow(tiles, 6, 40, 47);
  fillRow(tiles, 9, 55, 62);
  fillRow(tiles, 7, 68, 76);
  fillRow(tiles, 5, 82, 89);
  fillRow(tiles, 10, 98, 106);
  fillRow(tiles, 8, 112, 120);
  fillRow(tiles, 6, 126, 134);
  fillRow(tiles, 4, 140, 148);
  fillRow(tiles, 9, 156, 163);
  fillRow(tiles, 7, 170, 177);
  fillRow(tiles, 5, 184, 191);
  fillRow(tiles, 4, 196, 203);
  fillRow(tiles, 3, 210, 231);

  fillRect(tiles, 55, 56, 10, 12);
  fillRect(tiles, 61, 62, 10, 12);
  fillRect(tiles, 98, 99, 11, 12);
  fillRect(tiles, 119, 120, 9, 12);
  fillRect(tiles, 140, 141, 5, 12);
  fillRect(tiles, 210, 212, 4, 12);
  fillRect(tiles, 229, 231, 4, 12);

  fillBreakableRect(tiles, 113, 116, 9, 9);
  fillBreakableRect(tiles, 171, 174, 8, 8);
  fillBreakableRect(tiles, 198, 200, 6, 6);

  fillRow(tiles, 4, 212, 231);

  return tiles;
}

function buildWorld18Tiles() {
  const tiles = createTileGrid(WORLD_1_8_COLS, LEVEL_ROWS);

  fillRow(tiles, 13, 0, WORLD_1_8_COLS - 1);

  const groundGaps = [
    [11, 13], [29, 31], [47, 49], [66, 69],
    [88, 91], [111, 114], [134, 137], [156, 159],
  ];
  for (const [start, end] of groundGaps) clearRect(tiles, start, end, 13, 13);

  fillRow(tiles, 10, 16, 23);
  fillRow(tiles, 8, 33, 40);
  fillRow(tiles, 6, 50, 57);
  fillRow(tiles, 10, 62, 70);
  fillRow(tiles, 8, 76, 84);
  fillRow(tiles, 6, 90, 98);
  fillRow(tiles, 10, 106, 114);
  fillRow(tiles, 8, 120, 128);
  fillRow(tiles, 6, 134, 142);
  fillRow(tiles, 4, 148, 156);
  fillRow(tiles, 11, 166, 176);
  fillRow(tiles, 9, 180, 190);
  fillRow(tiles, 11, 194, 236);
  fillRow(tiles, 8, 202, 210);
  fillRow(tiles, 6, 214, 222);
  fillRow(tiles, 4, 226, 234);
  fillRow(tiles, 3, 198, 236);

  for (let col = 198; col <= 236; col += 6) fillRect(tiles, col, Math.min(col + 1, 236), 2, 3);

  fillRect(tiles, 62, 63, 11, 12);
  fillRect(tiles, 70, 71, 9, 12);
  fillRect(tiles, 106, 107, 11, 12);
  fillRect(tiles, 156, 157, 5, 12);
  fillRect(tiles, 194, 196, 4, 12);
  fillRect(tiles, 234, 236, 4, 12);
  fillRect(tiles, 208, 209, 9, 12);
  fillRect(tiles, 220, 221, 7, 12);

  fillBreakableRect(tiles, 79, 81, 9, 9);
  fillBreakableRect(tiles, 138, 141, 7, 7);
  fillBreakableRect(tiles, 172, 175, 10, 10);

  return tiles;
}

function buildWorld21Tiles() {
  const tiles = createTileGrid(WORLD_2_1_COLS, LEVEL_ROWS);

  fillRow(tiles, 13, 0, WORLD_2_1_COLS - 1);

  const groundGaps = [
    [12, 16], [34, 38], [58, 61], [83, 86],
    [106, 109], [132, 136], [155, 159], [180, 184],
  ];
  for (const [start, end] of groundGaps) clearRect(tiles, start, end, 13, 13);

  fillRow(tiles, 11, 8, 16);
  fillRow(tiles, 9, 22, 30);
  fillRow(tiles, 7, 40, 48);
  fillRow(tiles, 10, 65, 73);
  fillRow(tiles, 8, 79, 87);
  fillRow(tiles, 6, 94, 101);
  fillRow(tiles, 10, 114, 122);
  fillRow(tiles, 8, 128, 136);
  fillRow(tiles, 6, 143, 151);
  fillRow(tiles, 9, 160, 168);
  fillRow(tiles, 7, 174, 182);
  fillRow(tiles, 5, 188, 206);

  fillRect(tiles, 8, 9, 12, 12);
  fillRect(tiles, 29, 30, 10, 12);
  fillRect(tiles, 65, 66, 11, 12);
  fillRect(tiles, 94, 95, 7, 12);
  fillRect(tiles, 128, 129, 9, 12);
  fillRect(tiles, 188, 189, 6, 12);
  fillRect(tiles, 204, 206, 6, 12);

  fillBreakableRect(tiles, 96, 98, 11, 11);
  fillBreakableRect(tiles, 146, 148, 9, 9);

  fillRow(tiles, 6, 190, 206);

  return tiles;
}

function positionPlatform(platform) {
  const travelPx = (platform.travelTiles || 0) * TILE_SIZE;
  const offset   = Math.sin(platform.t * Math.PI * 2) * travelPx;
  platform.x = platform.baseX + (platform.axis === 'x' ? offset : 0);
  platform.y = platform.baseY + (platform.axis === 'y' ? offset : 0);
}

function createPlatformState(def, index) {
  const platform = {
    ...def,
    id: index,
    axis: def.axis === 'y' ? 'y' : 'x',
    w: (def.wTiles || 2) * TILE_SIZE,
    h: def.h || 12,
    baseX: def.col * TILE_SIZE,
    baseY: def.row * TILE_SIZE,
    t: ((def.phase || 0) % 1 + 1) % 1,
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    dx: 0,
    dy: 0,
  };
  positionPlatform(platform);
  platform.prevX = platform.x;
  platform.prevY = platform.y;
  return platform;
}

function createHazardState(def, index) {
  return {
    ...def,
    id: index,
    w: (def.wTiles || 1) * TILE_SIZE,
    h: (def.hTiles || 1) * TILE_SIZE,
    x: def.col * TILE_SIZE,
    y: def.row * TILE_SIZE,
  };
}

const LEVELS = {
  '1-1': {
    name: 'World 1-1 — Hypervisor Crash',
    subtitle: 'Onboarding through the first cascading outage',
    cols: WORLD_1_1_COLS,
    rows: LEVEL_ROWS,
    rtoSeconds: 360,
    playerStart: { x: 48, y: 384 },
    goal: { col: 180, row: 1 },
    sections: [
      { startCol:   0, endCol:  21, label: 'Boot Corridor' },
      { startCol:  22, endCol:  58, label: 'Packet Stair' },
      { startCol:  59, endCol:  82, label: 'Summit Span' },
      { startCol:  83, endCol: 121, label: 'Service Bay' },
      { startCol: 122, endCol: 163, label: 'Degraded Spine' },
      { startCol: 164, endCol: 187, label: 'Backup Vault' },
    ],
    landmarks: [
      { col: 65,  color: '#00ff41' },  // summit
      { col: 108, color: '#00ddff' },  // midpoint restore bay
      { col: 147, color: '#ffaa00' },  // late degraded spine
      { col: 180, color: '#ffd700' },  // vault
    ],
    // Snapshot Orbs — also serve as restore-point checkpoints
    orbs: [
      // Boot corridor
      { col:  4, row: 12, checkpoint: true },
      { col: 10, row: 12 },
      // Packet ascent
      { col: 18, row:  9 },
      { col: 29, row:  7 },
      { col: 40, row:  5, checkpoint: true },
      { col: 52, row:  3 },
      // First summit
      { col: 65, row:  2, checkpoint: true },
      // Descent and midpoint
      { col: 79, row:  3 },
      { col: 90, row:  5 },
      { col: 108, row: 12, checkpoint: true },
      // Optional route and late climb
      { col: 121, row:  6 },
      { col: 137, row:  7 },
      { col: 148, row:  5, checkpoint: true },
      { col: 160, row:  3 },
      { col: 169, row:  2, checkpoint: true },
      // Vault finale
      { col: 180, row:  1 },
    ],
    powerups: [
      { type: 'speed',      col:   8, row: 12 },  // reward the early gap clear
      { type: 'grow',       col:  19, row:  9 },  // introduces brick-breaking form
      { type: 'doublejump', col:  41, row:  5 },  // supports the first big climb
      { type: 'shield',     col:  67, row:  2 },  // calm before the midpoint descent
      { type: 'fire',       col:  80, row:  3 },  // first ranged attack appears on the descent
      { type: 'freeze',     col:  91, row:  5 },  // cold shot shows up before the service bay
      { type: 'grow',       col: 104, row: 12 },  // makes the service-bay brick room readable
      { type: 'freeze',     col: 112, row: 10 },  // service-bay crowd control refresh
      { type: 'speed',      col: 112, row:  8 },  // bonus route lure
      { type: 'life',       col: 131, row:  4 },  // high-risk optional reward
      { type: 'grow',       col: 149, row: 12 },  // puts big-form access right before the late brick stack
      { type: 'doublejump', col: 150, row:  5 },  // helps the late staircase recover
      { type: 'fire',       col: 161, row:  3 },  // late-stage purge burst for the vault climb
      { type: 'freeze',     col: 170, row: 10 },  // final crowd-control refresh
      { type: 'shield',     col: 168, row:  2 },  // final vault approach buffer
    ],
    // Enemies — patrol between patrolLeft and patrolRight (tile cols)
    enemies: [
      { type: 'rogue-packet', col:  16, row: 10, patrolLeft:  14, patrolRight:  20 },
      { type: 'rogue-packet', col:  28, row:  8, patrolLeft:  25, patrolRight:  31 },
      { type: 'rogue-packet', col:  39, row:  6, patrolLeft:  36, patrolRight:  42 },
      { type: 'crypto-process', col:  52, row:  2, patrolLeft:  47, patrolRight:  57, amplitude: 12 },
      { type: 'rogue-packet', col:  78, row:  4, patrolLeft:  75, patrolRight:  82 },
      { type: 'rogue-packet', col: 118, row: 13, patrolLeft: 113, patrolRight: 124 },
      { type: 'crypto-process', col: 114, row:  8, patrolLeft: 108, patrolRight: 120, amplitude: 14 },
      { type: 'rogue-packet', col: 126, row: 10, patrolLeft: 122, patrolRight: 129 },
      { type: 'rogue-packet', col: 136, row:  8, patrolLeft: 134, patrolRight: 140 },
      { type: 'rogue-packet', col: 147, row:  6, patrolLeft: 145, patrolRight: 151 },
      { type: 'rogue-packet', col: 160, row:  4, patrolLeft: 156, patrolRight: 163 },
      { type: 'crypto-process', col: 171, row:  9, patrolLeft: 167, patrolRight: 178, amplitude: 10 },
    ],
    platforms: [
      { col: 131, row: 11, wTiles: 2, axis: 'y', travelTiles: 2, periodFrames: 220, phase: 0.72 },
      { col: 152, row: 8,  wTiles: 2, axis: 'x', travelTiles: 3, periodFrames: 200, phase: 0.18 },
    ],
    hazards: [
      { type: 'emp', col: 95, row: 11, wTiles: 3, hTiles: 2 },
      { type: 'emp', col: 155, row: 9, wTiles: 2, hTiles: 3 },
    ],
    tileBuilder: buildWorld11Tiles,
  },
  '1-2': {
    name: 'World 1-2 — Replication Lag',
    subtitle: 'Sync lifts, delayed routes, and unstable timing',
    cols: WORLD_1_2_COLS,
    rows: LEVEL_ROWS,
    rtoSeconds: 390,
    playerStart: { x: 48, y: 384 },
    goal: { col: 189, row: 2 },
    sections: [
      { startCol:   0, endCol:  35, label: 'Warm Cache' },
      { startCol:  36, endCol:  73, label: 'Jitter Steps' },
      { startCol:  74, endCol: 118, label: 'Lag Channel' },
      { startCol: 119, endCol: 155, label: 'Mirror Shelf' },
      { startCol: 156, endCol: 195, label: 'Commit Spine' },
    ],
    landmarks: [
      { col: 49,  color: '#00ff41' },
      { col: 89,  color: '#ffaa00' },
      { col: 124, color: '#00ddff' },
      { col: 170, color: '#ff8844' },
      { col: 189, color: '#ffd700' },
    ],
    orbs: [
      { col:  5, row: 12, checkpoint: true },
      { col: 12, row: 12 },
      { col: 20, row:  9 },
      { col: 31, row:  7 },
      { col: 47, row:  5, checkpoint: true },
      { col: 59, row:  8 },
      { col: 71, row:  6 },
      { col: 83, row:  4, checkpoint: true },
      { col: 98, row: 12 },
      { col: 112, row:  7 },
      { col: 125, row:  5, checkpoint: true },
      { col: 138, row:  9 },
      { col: 151, row:  7 },
      { col: 164, row:  5, checkpoint: true },
      { col: 177, row:  3 },
      { col: 189, row:  2 },
    ],
    powerups: [
      { type: 'speed',      col:   8, row: 12 },
      { type: 'grow',       col:  18, row:  9 },
      { type: 'doublejump', col:  43, row:  5 },
      { type: 'fire',       col:  60, row:  8 },
      { type: 'freeze',     col:  75, row:  5 },
      { type: 'shield',     col:  89, row:  7 },
      { type: 'speed',      col: 105, row: 10 },
      { type: 'life',       col: 116, row:  8 },
      { type: 'grow',       col: 127, row:  5 },
      { type: 'doublejump', col: 139, row:  9 },
      { type: 'freeze',     col: 154, row:  7 },
      { type: 'fire',       col: 165, row:  5 },
      { type: 'shield',     col: 181, row:  3 },
    ],
    enemies: [
      { type: 'rogue-packet', col:  16, row: 10, patrolLeft: 14, patrolRight: 21 },
      { type: 'rogue-packet', col:  29, row:  8, patrolLeft: 27, patrolRight: 34 },
      { type: 'rogue-packet', col:  45, row:  6, patrolLeft: 43, patrolRight: 50 },
      { type: 'crypto-process', col:  58, row:  8, patrolLeft: 54, patrolRight: 62, amplitude: 10 },
      { type: 'rogue-packet', col:  69, row:  7, patrolLeft: 66, patrolRight: 73 },
      { type: 'crypto-process', col:  82, row:  4, patrolLeft: 78, patrolRight: 85, amplitude: 12 },
      { type: 'rogue-packet', col: 102, row: 10, patrolLeft: 100, patrolRight: 107 },
      { type: 'rogue-packet', col: 114, row:  8, patrolLeft: 111, patrolRight: 118 },
      { type: 'crypto-process', col: 126, row:  6, patrolLeft: 124, patrolRight: 131, amplitude: 11 },
      { type: 'rogue-packet', col: 139, row: 10, patrolLeft: 136, patrolRight: 143 },
      { type: 'rogue-packet', col: 151, row:  8, patrolLeft: 148, patrolRight: 155 },
      { type: 'crypto-process', col: 163, row:  6, patrolLeft: 160, patrolRight: 167, amplitude: 10 },
      { type: 'rogue-packet', col: 176, row:  4, patrolLeft: 172, patrolRight: 179 },
    ],
    platforms: [
      { col: 88,  row: 11, wTiles: 2, axis: 'y', travelTiles: 3, periodFrames: 220, phase: 0.68 },
      { col: 104, row: 7,  wTiles: 2, axis: 'x', travelTiles: 4, periodFrames: 210, phase: 0.16 },
      { col: 132, row: 10, wTiles: 2, axis: 'y', travelTiles: 2, periodFrames: 190, phase: 0.38 },
      { col: 154, row: 5,  wTiles: 2, axis: 'x', travelTiles: 3, periodFrames: 180, phase: 0.52 },
      { col: 180, row: 6,  wTiles: 2, axis: 'y', travelTiles: 2, periodFrames: 170, phase: 0.82 },
    ],
    hazards: [
      { type: 'emp', col: 68,  row: 11, wTiles: 3, hTiles: 2 },
      { type: 'emp', col: 92,  row: 10, wTiles: 4, hTiles: 3 },
      { type: 'emp', col: 118, row:  9, wTiles: 3, hTiles: 2 },
      { type: 'emp', col: 166, row:  8, wTiles: 2, hTiles: 3 },
    ],
    tileBuilder: buildWorld12Tiles,
  },
  '1-3': {
    name: 'World 1-3 — Immutable Backup',
    subtitle: 'Hardened restore paths through corruption fields',
    cols: WORLD_1_3_COLS,
    rows: LEVEL_ROWS,
    rtoSeconds: 420,
    playerStart: { x: 48, y: 384 },
    goal: { col: 199, row: 2 },
    sections: [
      { startCol:   0, endCol:  39, label: 'Cold Archive' },
      { startCol:  40, endCol:  87, label: 'Redacted Shelf' },
      { startCol:  88, endCol: 139, label: 'Backup Corridor' },
      { startCol: 140, endCol: 179, label: 'Quarantine Mesh' },
      { startCol: 180, endCol: 207, label: 'Immutable Core' },
    ],
    landmarks: [
      { col: 47,  color: '#00ff41' },
      { col: 84,  color: '#ff5566' },
      { col: 112, color: '#66ff99' },
      { col: 168, color: '#ffaa00' },
      { col: 199, color: '#ffd700' },
    ],
    orbs: [
      { col:  6, row: 12, checkpoint: true },
      { col: 14, row: 12 },
      { col: 21, row:  9 },
      { col: 33, row:  7 },
      { col: 48, row:  5, checkpoint: true },
      { col: 60, row:  8 },
      { col: 73, row:  6 },
      { col: 85, row:  4, checkpoint: true },
      { col: 98, row: 10 },
      { col: 112, row:  7 },
      { col: 126, row:  5, checkpoint: true },
      { col: 144, row:  8 },
      { col: 159, row:  6 },
      { col: 172, row:  4, checkpoint: true },
      { col: 187, row:  3 },
      { col: 199, row:  2 },
    ],
    powerups: [
      { type: 'grow',       col:  18, row:  9 },
      { type: 'doublejump', col:  44, row:  5 },
      { type: 'immutable',  col:  66, row:  7 },
      { type: 'shield',     col:  79, row:  5 },
      { type: 'freeze',     col:  94, row: 10 },
      { type: 'immutable',  col: 113, row:  7 },
      { type: 'life',       col: 110, row:  8 },
      { type: 'fire',       col: 125, row:  5 },
      { type: 'speed',      col: 146, row:  8 },
      { type: 'immutable',  col: 160, row:  6 },
      { type: 'grow',       col: 171, row:  4 },
      { type: 'doublejump', col: 186, row:  3 },
      { type: 'shield',     col: 198, row:  2 },
    ],
    enemies: [
      { type: 'rogue-packet', col:  16, row: 10, patrolLeft: 14, patrolRight: 21 },
      { type: 'rogue-packet', col:  30, row:  8, patrolLeft: 28, patrolRight: 35 },
      { type: 'rogue-packet', col:  46, row:  6, patrolLeft: 44, patrolRight: 51 },
      { type: 'crypto-process', col:  59, row:  8, patrolLeft: 56, patrolRight: 63, amplitude: 10 },
      { type: 'rogue-packet', col:  71, row:  7, patrolLeft: 68, patrolRight: 75 },
      { type: 'crypto-process', col:  84, row:  4, patrolLeft: 80, patrolRight: 87, amplitude: 12 },
      { type: 'rogue-packet', col: 100, row: 10, patrolLeft: 96, patrolRight: 103 },
      { type: 'rogue-packet', col: 111, row:  8, patrolLeft: 108, patrolRight: 115 },
      { type: 'crypto-process', col: 124, row:  6, patrolLeft: 120, patrolRight: 127, amplitude: 11 },
      { type: 'rogue-packet', col: 147, row:  9, patrolLeft: 145, patrolRight: 152 },
      { type: 'rogue-packet', col: 159, row:  7, patrolLeft: 157, patrolRight: 164 },
      { type: 'crypto-process', col: 171, row:  5, patrolLeft: 169, patrolRight: 176, amplitude: 10 },
      { type: 'rogue-packet', col: 185, row:  4, patrolLeft: 181, patrolRight: 188 },
    ],
    platforms: [
      { col: 88,  row: 11, wTiles: 2, axis: 'y', travelTiles: 3, periodFrames: 210, phase: 0.22 },
      { col: 103, row: 7,  wTiles: 2, axis: 'x', travelTiles: 4, periodFrames: 200, phase: 0.52 },
      { col: 138, row: 9,  wTiles: 2, axis: 'y', travelTiles: 2, periodFrames: 190, phase: 0.68 },
      { col: 166, row: 6,  wTiles: 2, axis: 'x', travelTiles: 3, periodFrames: 180, phase: 0.14 },
      { col: 189, row: 5,  wTiles: 2, axis: 'y', travelTiles: 2, periodFrames: 170, phase: 0.44 },
    ],
    hazards: [
      { type: 'corruption', col: 52,  row: 11, wTiles: 3, hTiles: 2 },
      { type: 'corruption', col: 76,  row:  9, wTiles: 2, hTiles: 3 },
      { type: 'emp',        col: 92,  row: 10, wTiles: 2, hTiles: 2 },
      { type: 'corruption', col: 104, row:  8, wTiles: 3, hTiles: 2 },
      { type: 'corruption', col: 140, row: 10, wTiles: 3, hTiles: 2 },
      { type: 'emp',        col: 154, row:  9, wTiles: 2, hTiles: 3 },
      { type: 'corruption', col: 174, row:  7, wTiles: 2, hTiles: 3 },
    ],
    tileBuilder: buildWorld13Tiles,
  },
  '1-4': {
    name: 'World 1-4 — Failover Spine',
    subtitle: 'Split routes, mirrored shelves, and fallback transfers',
    cols: WORLD_1_4_COLS,
    rows: LEVEL_ROWS,
    rtoSeconds: 450,
    playerStart: { x: 48, y: 384 },
    goal: { col: 210, row: 5 },
    sections: [
      { startCol:   0, endCol:  43, label: 'Failover Boot' },
      { startCol:  44, endCol:  89, label: 'Mirror Route' },
      { startCol:  90, endCol: 139, label: 'Transfer Bus' },
      { startCol: 140, endCol: 183, label: 'Fallback Bridge' },
      { startCol: 184, endCol: 215, label: 'Spine Core' },
    ],
    landmarks: [
      { col: 34,  color: '#00ddff' },
      { col: 75,  color: '#ffaa00' },
      { col: 118, color: '#66ff99' },
      { col: 166, color: '#ffd27a' },
      { col: 210, color: '#ffd700' },
    ],
    orbs: [
      { col:   6, row: 12, checkpoint: true },
      { col:  15, row: 12 },
      { col:  22, row:  9 },
      { col:  34, row:  7 },
      { col:  57, row:  9, checkpoint: true },
      { col:  72, row:  4 },
      { col:  85, row:  8 },
      { col: 101, row: 10 },
      { col: 114, row:  7, checkpoint: true },
      { col: 129, row:  5 },
      { col: 145, row:  8 },
      { col: 159, row:  6, checkpoint: true },
      { col: 173, row:  4 },
      { col: 188, row:  9 },
      { col: 201, row:  7, checkpoint: true },
      { col: 210, row:  5 },
    ],
    powerups: [
      { type: 'grow',       col:  18, row:  9 },
      { type: 'rollback',   col:  31, row:  7 },
      { type: 'speed',      col:  60, row:  6 },
      { type: 'doublejump', col:  76, row:  4 },
      { type: 'immutable',  col:  98, row: 10 },
      { type: 'freeze',     col: 111, row:  7 },
      { type: 'shield',     col: 127, row:  5 },
      { type: 'rollback',   col: 149, row:  8 },
      { type: 'fire',       col: 162, row:  6 },
      { type: 'speed',      col: 176, row:  4 },
      { type: 'life',       col: 189, row:  9 },
      { type: 'grow',       col: 206, row:  5 },
    ],
    enemies: [
      { type: 'rogue-packet',   col:  16, row: 10, patrolLeft: 14, patrolRight: 21 },
      { type: 'rogue-packet',   col:  30, row:  8, patrolLeft: 28, patrolRight: 35 },
      { type: 'crypto-process', col:  44, row:  6, patrolLeft: 40, patrolRight: 47, amplitude: 10 },
      { type: 'rogue-packet',   col:  58, row: 10, patrolLeft: 56, patrolRight: 63 },
      { type: 'crypto-process', col:  73, row:  5, patrolLeft: 70, patrolRight: 77, amplitude: 11 },
      { type: 'rogue-packet',   col:  84, row:  9, patrolLeft: 82, patrolRight: 89 },
      { type: 'rogue-packet',   col: 100, row: 10, patrolLeft: 96, patrolRight: 103 },
      { type: 'crypto-process', col: 113, row:  8, patrolLeft: 108, patrolRight: 115, amplitude: 12 },
      { type: 'rogue-packet',   col: 124, row:  6, patrolLeft: 120, patrolRight: 127 },
      { type: 'rogue-packet',   col: 148, row:  9, patrolLeft: 146, patrolRight: 153 },
      { type: 'crypto-process', col: 161, row:  7, patrolLeft: 158, patrolRight: 165, amplitude: 10 },
      { type: 'rogue-packet',   col: 173, row:  5, patrolLeft: 170, patrolRight: 177 },
      { type: 'crypto-process', col: 200, row:  7, patrolLeft: 198, patrolRight: 204, amplitude: 8 },
    ],
    platforms: [
      { col: 49,  row: 11, wTiles: 2, axis: 'y', travelTiles: 3, periodFrames: 220, phase: 0.12 },
      { col: 68,  row:  8, wTiles: 2, axis: 'x', travelTiles: 4, periodFrames: 210, phase: 0.44 },
      { col: 91,  row: 10, wTiles: 2, axis: 'y', travelTiles: 2, periodFrames: 190, phase: 0.76 },
      { col: 118, row:  7, wTiles: 2, axis: 'x', travelTiles: 3, periodFrames: 195, phase: 0.34 },
      { col: 154, row:  8, wTiles: 2, axis: 'y', travelTiles: 2, periodFrames: 180, phase: 0.58 },
      { col: 183, row:  6, wTiles: 2, axis: 'x', travelTiles: 4, periodFrames: 170, phase: 0.18 },
    ],
    hazards: [
      { type: 'emp',        col:  51, row: 10, wTiles: 2, hTiles: 2 },
      { type: 'corruption', col:  67, row:  8, wTiles: 3, hTiles: 2 },
      { type: 'emp',        col:  92, row: 10, wTiles: 2, hTiles: 2 },
      { type: 'corruption', col: 116, row:  8, wTiles: 2, hTiles: 3 },
      { type: 'emp',        col: 154, row:  8, wTiles: 2, hTiles: 2 },
      { type: 'corruption', col: 182, row:  8, wTiles: 3, hTiles: 2 },
    ],
    tileBuilder: buildWorld14Tiles,
  },
  '1-5': {
    name: 'World 1-5 — Snapshot Bastion',
    subtitle: 'Vaulted restore paths and a ransomware warden',
    cols: WORLD_1_5_COLS,
    rows: LEVEL_ROWS,
    rtoSeconds: 480,
    playerStart: { x: 48, y: 384 },
    goal: { col: 212, row: 5 },
    requiresBossDefeat: true,
    sections: [
      { startCol:   0, endCol:  45, label: 'Ledger Gate' },
      { startCol:  46, endCol:  95, label: 'Mirror Cache' },
      { startCol:  96, endCol: 145, label: 'Restore Hall' },
      { startCol: 146, endCol: 185, label: 'Vault Mouth' },
      { startCol: 186, endCol: 219, label: 'Warden Arena' },
    ],
    landmarks: [
      { col: 33,  color: '#00ddff' },
      { col: 74,  color: '#55ffcc' },
      { col: 122, color: '#ffaa00' },
      { col: 168, color: '#66ff99' },
      { col: 212, color: '#ffd700' },
    ],
    orbs: [
      { col:   6, row: 12, checkpoint: true },
      { col:  14, row: 12 },
      { col:  21, row:  9 },
      { col:  33, row:  7 },
      { col:  52, row:  5, checkpoint: true },
      { col:  64, row:  9 },
      { col:  78, row:  7 },
      { col:  91, row:  5 },
      { col: 103, row:  8, checkpoint: true },
      { col: 118, row:  6 },
      { col: 132, row:  4 },
      { col: 149, row:  9, checkpoint: true },
      { col: 165, row:  7 },
      { col: 177, row:  5 },
      { col: 191, row: 10, checkpoint: true },
      { col: 198, row:  9 },
      { col: 205, row:  7 },
      { col: 212, row:  5 },
    ],
    powerups: [
      { type: 'grow',       col:  18, row:  9 },
      { type: 'rollback',   col:  36, row:  7 },
      { type: 'doublejump', col:  54, row:  5 },
      { type: 'immutable',  col:  73, row:  7 },
      { type: 'freeze',     col:  92, row:  5 },
      { type: 'shield',     col: 110, row:  8 },
      { type: 'rollback',   col: 128, row:  4 },
      { type: 'fire',       col: 150, row:  9 },
      { type: 'immutable',  col: 166, row:  6 },
      { type: 'life',       col: 176, row:  5 },
      { type: 'grow',       col: 194, row: 10 },
      { type: 'freeze',     col: 204, row:  7 },
      { type: 'fire',       col: 210, row:  5 },
    ],
    enemies: [
      { type: 'rogue-packet',      col:  17, row: 10, patrolLeft: 14, patrolRight: 21 },
      { type: 'crypto-process',    col:  34, row:  8, patrolLeft: 30, patrolRight: 37, amplitude: 10 },
      { type: 'rogue-packet',      col:  51, row:  6, patrolLeft: 48, patrolRight: 55 },
      { type: 'rogue-packet',      col:  60, row: 10, patrolLeft: 58, patrolRight: 66 },
      { type: 'crypto-process',    col:  76, row:  8, patrolLeft: 72, patrolRight: 80, amplitude: 12 },
      { type: 'rogue-packet',      col:  91, row:  6, patrolLeft: 86, patrolRight: 94 },
      { type: 'rogue-packet',      col: 102, row:  9, patrolLeft: 100, patrolRight: 107 },
      { type: 'crypto-process',    col: 116, row:  7, patrolLeft: 112, patrolRight: 119, amplitude: 11 },
      { type: 'rogue-packet',      col: 127, row:  5, patrolLeft: 124, patrolRight: 131 },
      { type: 'rogue-packet',      col: 150, row: 10, patrolLeft: 148, patrolRight: 155 },
      { type: 'crypto-process',    col: 163, row:  8, patrolLeft: 160, patrolRight: 167, amplitude: 10 },
      { type: 'rogue-packet',      col: 174, row:  6, patrolLeft: 172, patrolRight: 179 },
      { type: 'ransomware-warden', col: 197, row: 11, arenaLeft: 188, arenaRight: 214 },
    ],
    platforms: [
      { col: 45,  row: 11, wTiles: 2, axis: 'y', travelTiles: 3, periodFrames: 220, phase: 0.22 },
      { col: 96,  row: 10, wTiles: 2, axis: 'x', travelTiles: 3, periodFrames: 200, phase: 0.62 },
      { col: 141, row:  8, wTiles: 2, axis: 'y', travelTiles: 2, periodFrames: 190, phase: 0.42 },
      { col: 181, row:  7, wTiles: 2, axis: 'x', travelTiles: 4, periodFrames: 170, phase: 0.18 },
    ],
    hazards: [
      { type: 'corruption', col:  68, row: 10, wTiles: 2, hTiles: 2 },
      { type: 'emp',        col:  84, row:  8, wTiles: 2, hTiles: 2 },
      { type: 'corruption', col: 108, row:  7, wTiles: 3, hTiles: 2 },
      { type: 'emp',        col: 144, row: 10, wTiles: 2, hTiles: 2 },
      { type: 'corruption', col: 170, row:  8, wTiles: 2, hTiles: 2 },
      { type: 'corruption', col: 183, row: 10, wTiles: 2, hTiles: 2 },
    ],
    tileBuilder: buildWorld15Tiles,
  },
  '1-6': {
    name: 'World 1-6 — Snapshot Runoff',
    subtitle: 'Overflow lanes, brittle caches, and collapse-routing',
    cols: WORLD_1_6_COLS,
    rows: LEVEL_ROWS,
    rtoSeconds: 510,
    playerStart: { x: 48, y: 384 },
    goal: { col: 223, row: 5 },
    sections: [
      { startCol:   0, endCol:  43, label: 'Runoff Gate' },
      { startCol:  44, endCol:  97, label: 'Shelf Spill' },
      { startCol:  98, endCol: 153, label: 'Cache Break' },
      { startCol: 154, endCol: 191, label: 'Snapshot Drain' },
      { startCol: 192, endCol: 227, label: 'Overflow Crown' },
    ],
    landmarks: [
      { col: 35,  color: '#00ddff' },
      { col: 77,  color: '#ffaa00' },
      { col: 124, color: '#66ff99' },
      { col: 175, color: '#ffd27a' },
      { col: 223, color: '#ffd700' },
    ],
    orbs: [
      { col:   6, row: 12, checkpoint: true },
      { col:  15, row:  9 },
      { col:  34, row:  7 },
      { col:  49, row:  5, checkpoint: true },
      { col:  64, row:  9 },
      { col:  78, row:  7 },
      { col:  92, row:  5 },
      { col: 106, row:  9, checkpoint: true },
      { col: 120, row:  7 },
      { col: 136, row:  5 },
      { col: 149, row:  3, checkpoint: true },
      { col: 162, row:  8 },
      { col: 176, row:  6 },
      { col: 188, row:  4, checkpoint: true },
      { col: 202, row:  9 },
      { col: 214, row:  7 },
      { col: 223, row:  5 },
    ],
    powerups: [
      { type: 'grow',       col:  18, row:  9 },
      { type: 'speed',      col:  33, row:  7 },
      { type: 'doublejump', col:  51, row:  5 },
      { type: 'freeze',     col:  66, row:  9 },
      { type: 'fire',       col:  82, row:  7 },
      { type: 'rollback',   col:  95, row:  5 },
      { type: 'immutable',  col: 110, row:  9 },
      { type: 'grow',       col: 124, row:  7 },
      { type: 'shield',     col: 138, row:  5 },
      { type: 'speed',      col: 151, row:  3 },
      { type: 'rollback',   col: 166, row:  8 },
      { type: 'fire',       col: 186, row:  5 },
      { type: 'life',       col: 214, row:  7 },
      { type: 'freeze',     col: 223, row:  5 },
    ],
    enemies: [
      { type: 'rogue-packet',   col:  16, row: 10, patrolLeft: 14, patrolRight: 21 },
      { type: 'rogue-packet',   col:  33, row:  8, patrolLeft: 30, patrolRight: 37 },
      { type: 'crypto-process', col:  49, row:  6, patrolLeft: 46, patrolRight: 53, amplitude: 10 },
      { type: 'rogue-packet',   col:  62, row: 10, patrolLeft: 58, patrolRight: 66 },
      { type: 'crypto-process', col:  78, row:  8, patrolLeft: 72, patrolRight: 80, amplitude: 11 },
      { type: 'rogue-packet',   col:  92, row:  6, patrolLeft: 88, patrolRight: 96 },
      { type: 'rogue-packet',   col: 106, row: 10, patrolLeft: 104, patrolRight: 111 },
      { type: 'crypto-process', col: 121, row:  8, patrolLeft: 118, patrolRight: 125, amplitude: 12 },
      { type: 'rogue-packet',   col: 136, row:  6, patrolLeft: 132, patrolRight: 139 },
      { type: 'rogue-packet',   col: 161, row:  9, patrolLeft: 158, patrolRight: 165 },
      { type: 'crypto-process', col: 175, row:  7, patrolLeft: 171, patrolRight: 178, amplitude: 10 },
      { type: 'rogue-packet',   col: 187, row:  5, patrolLeft: 184, patrolRight: 191 },
      { type: 'crypto-process', col: 214, row:  6, patrolLeft: 210, patrolRight: 217, amplitude: 8 },
    ],
    platforms: [
      { col: 56,  row: 11, wTiles: 2, axis: 'y', travelTiles: 3, periodFrames: 220, phase: 0.16 },
      { col: 101, row:  8, wTiles: 2, axis: 'x', travelTiles: 3, periodFrames: 200, phase: 0.62 },
      { col: 154, row: 10, wTiles: 2, axis: 'y', travelTiles: 2, periodFrames: 180, phase: 0.38 },
      { col: 196, row:  8, wTiles: 2, axis: 'x', travelTiles: 4, periodFrames: 170, phase: 0.22 },
    ],
    hazards: [
      { type: 'emp',        col:  70, row: 10, wTiles: 2, hTiles: 2 },
      { type: 'corruption', col: 118, row:  8, wTiles: 3, hTiles: 2 },
      { type: 'emp',        col: 149, row: 10, wTiles: 2, hTiles: 2 },
      { type: 'corruption', col: 178, row:  8, wTiles: 2, hTiles: 2 },
      { type: 'emp',        col: 204, row: 10, wTiles: 2, hTiles: 2 },
    ],
    tileBuilder: buildWorld16Tiles,
  },
  '1-7': {
    name: 'World 1-7 — Archive Causeway',
    subtitle: 'Late-world transfers above mirrored outage lanes',
    cols: WORLD_1_7_COLS,
    rows: LEVEL_ROWS,
    rtoSeconds: 540,
    playerStart: { x: 48, y: 384 },
    goal: { col: 224, row: 2 },
    sections: [
      { startCol:   0, endCol:  47, label: 'Causeway Boot' },
      { startCol:  48, endCol:  95, label: 'Mirror Ladder' },
      { startCol:  96, endCol: 149, label: 'Relay Crest' },
      { startCol: 150, endCol: 195, label: 'Dark Span' },
      { startCol: 196, endCol: 231, label: 'Keep Approach' },
    ],
    landmarks: [
      { col: 34,  color: '#00ddff' },
      { col: 82,  color: '#ffaa00' },
      { col: 126, color: '#7dffaf' },
      { col: 176, color: '#ff9d66' },
      { col: 224, color: '#ffd700' },
    ],
    orbs: [
      { col:   6, row: 12, checkpoint: true },
      { col:  17, row:  9 },
      { col:  31, row:  7 },
      { col:  44, row:  5, checkpoint: true },
      { col:  59, row:  8 },
      { col:  74, row:  6 },
      { col:  87, row:  4, checkpoint: true },
      { col: 102, row:  9 },
      { col: 116, row:  7 },
      { col: 130, row:  5 },
      { col: 144, row:  3, checkpoint: true },
      { col: 159, row:  8 },
      { col: 173, row:  6 },
      { col: 187, row:  4, checkpoint: true },
      { col: 201, row:  3 },
      { col: 216, row:  2, checkpoint: true },
      { col: 224, row:  2 },
    ],
    powerups: [
      { type: 'grow',       col:  18, row:  9 },
      { type: 'doublejump', col:  31, row:  7 },
      { type: 'rollback',   col:  46, row:  5 },
      { type: 'freeze',     col:  61, row:  8 },
      { type: 'speed',      col:  76, row:  6 },
      { type: 'fire',       col:  89, row:  4 },
      { type: 'immutable',  col: 105, row:  9 },
      { type: 'grow',       col: 116, row:  7 },
      { type: 'shield',     col: 132, row:  5 },
      { type: 'rollback',   col: 144, row:  3 },
      { type: 'speed',      col: 161, row:  8 },
      { type: 'freeze',     col: 176, row:  6 },
      { type: 'fire',       col: 191, row:  4 },
      { type: 'life',       col: 216, row:  2 },
    ],
    enemies: [
      { type: 'rogue-packet',   col:  16, row: 10, patrolLeft: 14, patrolRight: 22 },
      { type: 'crypto-process', col:  30, row:  8, patrolLeft: 28, patrolRight: 35, amplitude: 10 },
      { type: 'rogue-packet',   col:  43, row:  6, patrolLeft: 40, patrolRight: 47 },
      { type: 'rogue-packet',   col:  58, row:  9, patrolLeft: 55, patrolRight: 62 },
      { type: 'crypto-process', col:  73, row:  7, patrolLeft: 68, patrolRight: 76, amplitude: 12 },
      { type: 'rogue-packet',   col:  86, row:  5, patrolLeft: 82, patrolRight: 89 },
      { type: 'rogue-packet',   col: 101, row: 10, patrolLeft: 98, patrolRight: 106 },
      { type: 'crypto-process', col: 117, row:  8, patrolLeft: 112, patrolRight: 120, amplitude: 11 },
      { type: 'rogue-packet',   col: 129, row:  6, patrolLeft: 126, patrolRight: 134 },
      { type: 'crypto-process', col: 143, row:  4, patrolLeft: 140, patrolRight: 148, amplitude: 8 },
      { type: 'rogue-packet',   col: 159, row:  9, patrolLeft: 156, patrolRight: 163 },
      { type: 'crypto-process', col: 174, row:  7, patrolLeft: 170, patrolRight: 177, amplitude: 10 },
      { type: 'rogue-packet',   col: 187, row:  5, patrolLeft: 184, patrolRight: 191 },
      { type: 'crypto-process', col: 214, row:  4, patrolLeft: 210, patrolRight: 219, amplitude: 8 },
    ],
    platforms: [
      { col: 52,  row: 10, wTiles: 2, axis: 'y', travelTiles: 2, periodFrames: 210, phase: 0.24 },
      { col: 96,  row:  9, wTiles: 2, axis: 'x', travelTiles: 4, periodFrames: 200, phase: 0.58 },
      { col: 150, row:  8, wTiles: 2, axis: 'y', travelTiles: 3, periodFrames: 190, phase: 0.36 },
      { col: 194, row:  6, wTiles: 2, axis: 'x', travelTiles: 4, periodFrames: 170, phase: 0.12 },
    ],
    hazards: [
      { type: 'corruption', col:  67, row:  8, wTiles: 3, hTiles: 2 },
      { type: 'emp',        col: 113, row:  9, wTiles: 2, hTiles: 2 },
      { type: 'corruption', col: 141, row:  7, wTiles: 2, hTiles: 2 },
      { type: 'emp',        col: 170, row:  8, wTiles: 2, hTiles: 2 },
      { type: 'corruption', col: 199, row:  6, wTiles: 3, hTiles: 2 },
    ],
    tileBuilder: buildWorld17Tiles,
  },
  '1-8': {
    name: 'World 1-8 — Recovery Keep',
    subtitle: 'Castle lockdown and the split-brain sovereign',
    theme: 'fortress',
    cols: WORLD_1_8_COLS,
    rows: LEVEL_ROWS,
    rtoSeconds: 600,
    playerStart: { x: 48, y: 384 },
    goal: { col: 230, row: 2 },
    requiresBossDefeat: true,
    sections: [
      { startCol:   0, endCol:  57, label: 'Outer Gate' },
      { startCol:  58, endCol: 114, label: 'Cinder Hall' },
      { startCol: 115, endCol: 165, label: 'Vault Stair' },
      { startCol: 166, endCol: 193, label: 'Throne Walk' },
      { startCol: 194, endCol: 239, label: 'Split-Brain Keep' },
    ],
    landmarks: [
      { col: 36,  color: '#ff9f66' },
      { col: 84,  color: '#ffd27a' },
      { col: 148, color: '#7dffaf' },
      { col: 182, color: '#ff7799' },
      { col: 230, color: '#ffd700' },
    ],
    orbs: [
      { col:   6, row: 12, checkpoint: true },
      { col:  18, row:  9 },
      { col:  35, row:  7 },
      { col:  52, row:  5, checkpoint: true },
      { col:  66, row:  9 },
      { col:  82, row:  7 },
      { col:  96, row:  5 },
      { col: 110, row:  9, checkpoint: true },
      { col: 126, row:  7 },
      { col: 140, row:  5 },
      { col: 152, row:  3, checkpoint: true },
      { col: 170, row: 10 },
      { col: 184, row:  8, checkpoint: true },
      { col: 200, row: 10 },
      { col: 214, row:  7 },
      { col: 223, row:  5, checkpoint: true },
      { col: 230, row:  2 },
    ],
    powerups: [
      { type: 'grow',       col:  18, row:  9 },
      { type: 'shield',     col:  37, row:  7 },
      { type: 'doublejump', col:  54, row:  5 },
      { type: 'rollback',   col:  68, row:  9 },
      { type: 'freeze',     col:  84, row:  7 },
      { type: 'fire',       col:  98, row:  5 },
      { type: 'immutable',  col: 112, row:  9 },
      { type: 'grow',       col: 126, row:  7 },
      { type: 'shield',     col: 141, row:  5 },
      { type: 'rollback',   col: 154, row:  3 },
      { type: 'life',       col: 171, row: 10 },
      { type: 'freeze',     col: 203, row: 10 },
      { type: 'fire',       col: 219, row:  7 },
      { type: 'immutable',  col: 227, row:  4 },
    ],
    enemies: [
      { type: 'rogue-packet',        col:  18, row: 10, patrolLeft: 16, patrolRight: 23 },
      { type: 'crypto-process',      col:  35, row:  8, patrolLeft: 33, patrolRight: 40, amplitude: 10 },
      { type: 'rogue-packet',        col:  52, row:  6, patrolLeft: 50, patrolRight: 57 },
      { type: 'rogue-packet',        col:  66, row: 10, patrolLeft: 62, patrolRight: 70 },
      { type: 'crypto-process',      col:  82, row:  8, patrolLeft: 76, patrolRight: 84, amplitude: 11 },
      { type: 'rogue-packet',        col:  96, row:  6, patrolLeft: 90, patrolRight: 98 },
      { type: 'rogue-packet',        col: 110, row: 10, patrolLeft: 106, patrolRight: 114 },
      { type: 'crypto-process',      col: 126, row:  8, patrolLeft: 120, patrolRight: 128, amplitude: 12 },
      { type: 'rogue-packet',        col: 140, row:  6, patrolLeft: 134, patrolRight: 142 },
      { type: 'rogue-packet',        col: 170, row: 11, patrolLeft: 166, patrolRight: 176 },
      { type: 'crypto-process',      col: 184, row: 10, patrolLeft: 180, patrolRight: 190, amplitude: 8 },
      { type: 'splitbrain-sovereign', col: 210, row: 11, arenaLeft: 198, arenaRight: 236 },
    ],
    platforms: [
      { col: 58,  row: 10, wTiles: 2, axis: 'y', travelTiles: 2, periodFrames: 210, phase: 0.44 },
      { col: 116, row:  9, wTiles: 2, axis: 'x', travelTiles: 4, periodFrames: 190, phase: 0.16 },
      { col: 162, row: 10, wTiles: 2, axis: 'y', travelTiles: 2, periodFrames: 180, phase: 0.72 },
    ],
    hazards: [
      { type: 'corruption', col:  72, row:  8, wTiles: 2, hTiles: 2 },
      { type: 'emp',        col: 104, row:  9, wTiles: 2, hTiles: 2 },
      { type: 'corruption', col: 136, row:  7, wTiles: 2, hTiles: 2 },
      { type: 'emp',        col: 167, row: 10, wTiles: 2, hTiles: 2 },
      { type: 'corruption', col: 196, row: 10, wTiles: 2, hTiles: 2 },
      { type: 'corruption', col: 205, row: 10, wTiles: 2, hTiles: 2 },
    ],
    tileBuilder: buildWorld18Tiles,
  },
  '2-1': {
    name: 'World 2-1 — Tidal Mirror',
    subtitle: 'Waterlogged restore lanes, undertow fields, and floating relays',
    theme: 'water',
    cols: WORLD_2_1_COLS,
    rows: LEVEL_ROWS,
    rtoSeconds: 540,
    playerStart: { x: 48, y: 384 },
    goal: { col: 200, row: 4 },
    sections: [
      { startCol:   0, endCol:  47, label: 'Flooded Dock' },
      { startCol:  48, endCol: 101, label: 'Undertow Reach' },
      { startCol: 102, endCol: 151, label: 'Lagoon Shelf' },
      { startCol: 152, endCol: 211, label: 'Mirror Reef' },
    ],
    landmarks: [
      { col: 29,  color: '#7ce6ff' },
      { col: 84,  color: '#b8fbff' },
      { col: 132, color: '#ffd27a' },
      { col: 176, color: '#8dffcf' },
      { col: 200, color: '#ffe680' },
    ],
    orbs: [
      { col:   6, row: 12, checkpoint: true },
      { col:  12, row: 10 },
      { col:  28, row:  8 },
      { col:  45, row:  6, checkpoint: true },
      { col:  68, row:  9 },
      { col:  83, row:  7 },
      { col:  97, row:  5, checkpoint: true },
      { col: 118, row:  9 },
      { col: 132, row:  7 },
      { col: 147, row:  5, checkpoint: true },
      { col: 165, row:  8 },
      { col: 178, row:  6 },
      { col: 194, row:  4, checkpoint: true },
      { col: 200, row:  4 },
    ],
    powerups: [
      { type: 'doublejump', col:  13, row: 10 },
      { type: 'speed',      col:  29, row:  8 },
      { type: 'freeze',     col:  46, row:  6 },
      { type: 'grow',       col:  69, row:  9 },
      { type: 'shield',     col:  84, row:  7 },
      { type: 'rollback',   col:  98, row:  5 },
      { type: 'fire',       col: 119, row:  9 },
      { type: 'immutable',  col: 133, row:  7 },
      { type: 'grow',       col: 148, row:  5 },
      { type: 'freeze',     col: 166, row:  8 },
      { type: 'life',       col: 179, row:  6 },
      { type: 'shield',     col: 196, row:  4 },
    ],
    enemies: [
      { type: 'tide-skimmer',   col:  13, row: 11, patrolLeft:  8, patrolRight: 16, amplitude: 10 },
      { type: 'tide-skimmer',   col:  28, row:  9, patrolLeft: 22, patrolRight: 30, amplitude: 12 },
      { type: 'rogue-packet',   col:  45, row:  7, patrolLeft: 40, patrolRight: 48 },
      { type: 'tide-skimmer',   col:  68, row: 10, patrolLeft: 65, patrolRight: 73, amplitude: 10 },
      { type: 'crypto-process', col:  82, row:  8, patrolLeft: 79, patrolRight: 87, amplitude: 9 },
      { type: 'tide-skimmer',   col:  97, row:  6, patrolLeft: 94, patrolRight: 101, amplitude: 8 },
      { type: 'rogue-packet',   col: 118, row: 10, patrolLeft: 114, patrolRight: 122 },
      { type: 'tide-skimmer',   col: 132, row:  8, patrolLeft: 128, patrolRight: 136, amplitude: 10 },
      { type: 'crypto-process', col: 147, row:  6, patrolLeft: 143, patrolRight: 151, amplitude: 8 },
      { type: 'tide-skimmer',   col: 178, row:  8, patrolLeft: 174, patrolRight: 182, amplitude: 12 },
      { type: 'rogue-packet',   col: 194, row:  5, patrolLeft: 188, patrolRight: 200 },
    ],
    platforms: [
      { col: 54,  row: 10, wTiles: 2, axis: 'x', travelTiles: 4, periodFrames: 210, phase: 0.24 },
      { col: 104, row:  8, wTiles: 2, axis: 'y', travelTiles: 2, periodFrames: 190, phase: 0.68 },
      { col: 154, row:  7, wTiles: 2, axis: 'x', travelTiles: 3, periodFrames: 180, phase: 0.44 },
    ],
    hazards: [
      { type: 'undertow', col:  52, row: 11, wTiles: 4, hTiles: 2, flow: 1, strength: 0.14 },
      { type: 'undertow', col:  88, row: 10, wTiles: 4, hTiles: 2, flow: -1, strength: 0.16 },
      { type: 'undertow', col: 124, row:  9, wTiles: 4, hTiles: 2, flow: 1, strength: 0.18 },
      { type: 'undertow', col: 170, row:  8, wTiles: 4, hTiles: 2, flow: -1, strength: 0.18 },
      { type: 'emp',      col: 190, row:  6, wTiles: 2, hTiles: 2 },
    ],
    tileBuilder: buildWorld21Tiles,
  }
};

// ─── Active world state ───────────────────────────────────────────────────────
let world = null;

function loadLevel(id) {
  const base = LEVELS[id];
  if (!base) return null;
  world = {
    ...base,
    themeId: base.theme || 'datacenter',
    theme: cloneTheme(base.theme || 'datacenter'),
    playerStart: { ...base.playerStart },
    goal: { ...base.goal },
    orbs: (base.orbs || []).map(o => ({ ...o })),
    powerups: (base.powerups || []).map(p => ({ ...p })),
    enemies: (base.enemies || []).map(e => ({ ...e })),
    platforms: (base.platforms || []).map((p, index) => createPlatformState({ ...p }, index)),
    hazards: (base.hazards || []).map((h, index) => createHazardState({ ...h }, index)),
    sections: (base.sections || []).map(s => ({ ...s })),
    landmarks: (base.landmarks || []).map(l => ({ ...l })),
    tiles: base.tileBuilder ? base.tileBuilder() : (base.tiles || []).map(row => row.slice()),
  };
  return world;
}

function updatePlatforms() {
  if (!world?.platforms) return;
  for (const platform of world.platforms) {
    platform.prevX = platform.x;
    platform.prevY = platform.y;
    platform.t = (platform.t + 1 / Math.max(60, platform.periodFrames || 180)) % 1;
    positionPlatform(platform);
    platform.dx = platform.x - platform.prevX;
    platform.dy = platform.y - platform.prevY;
  }
}

function rectOverlapsHazard(x, y, w, h, hazard) {
  return x + w > hazard.x &&
         x < hazard.x + hazard.w &&
         y + h > hazard.y &&
         y < hazard.y + hazard.h;
}

function getOverlappingHazards(entity) {
  if (!world?.hazards) return [];
  return world.hazards.filter(hazard => rectOverlapsHazard(entity.x, entity.y, entity.w, entity.h, hazard));
}

// ─── Tile queries ─────────────────────────────────────────────────────────────
function tileAt(col, row) {
  if (!world) return 0;
  if (col < 0 || col >= world.cols) return 1;  // side walls
  if (row < 0) return 0;                        // open sky above
  if (row >= world.rows) return 1;              // solid below level
  return world.tiles[row][col];
}

function isSolid(col, row) {
  return tileAt(col, row) !== 0;
}

function isBreakable(col, row) {
  return tileAt(col, row) === 2;
}

function breakTile(col, row) {
  if (!world || row < 0 || row >= world.rows || col < 0 || col >= world.cols) return;
  world.tiles[row][col] = 0;
}

function pixToCol(x) { return Math.floor(x / TILE_SIZE); }
function pixToRow(y) { return Math.floor(y / TILE_SIZE); }

// ─── Tile-based collision resolution ─────────────────────────────────────────
// Call after moving on X, then after moving on Y.
// Returns a collision info object: { left, right, top, bottom }
function resolveX(entity) {
  const topRow = pixToRow(entity.y + 1);
  const botRow = pixToRow(entity.y + entity.h - 2);

  if (entity.vx > 0) {
    const col = pixToCol(entity.x + entity.w);
    if (isSolid(col, topRow) || isSolid(col, botRow)) {
      entity.x  = col * TILE_SIZE - entity.w;
      entity.vx = 0;
    }
  } else if (entity.vx < 0) {
    const col = pixToCol(entity.x);
    if (isSolid(col, topRow) || isSolid(col, botRow)) {
      entity.x  = (col + 1) * TILE_SIZE;
      entity.vx = 0;
    }
  }
}

function resolveY(entity) {
  const leftCol  = pixToCol(entity.x + 1);
  const rightCol = pixToCol(entity.x + entity.w - 2);
  entity.brokenTiles = null;
  entity.bumpedBreakable = false;

  if (entity.vy > 0) {
    const row = pixToRow(entity.y + entity.h);
    if (isSolid(leftCol, row) || isSolid(rightCol, row)) {
      entity.y        = row * TILE_SIZE - entity.h;
      entity.vy       = 0;
      entity.grounded = true;
    }
  } else if (entity.vy < 0) {
    const row = pixToRow(entity.y);
    const brokenTiles = [];
    const hitBreakable = isBreakable(leftCol, row) || isBreakable(rightCol, row);
    if (entity.canBreakBricks) {
      if (isBreakable(leftCol, row)) {
        breakTile(leftCol, row);
        brokenTiles.push({ col: leftCol, row });
      }
      if (rightCol !== leftCol && isBreakable(rightCol, row)) {
        breakTile(rightCol, row);
        brokenTiles.push({ col: rightCol, row });
      }
    }
    if (brokenTiles.length > 0) {
      entity.y = (row + 1) * TILE_SIZE;
      entity.vy = Math.max(0.8, entity.vy * -0.15);
      entity.brokenTiles = brokenTiles;
    } else if (hitBreakable) {
      entity.y = (row + 1) * TILE_SIZE;
      entity.vy = 0;
      entity.bumpedBreakable = true;
    } else if (isSolid(leftCol, row) || isSolid(rightCol, row)) {
      entity.y  = (row + 1) * TILE_SIZE;
      entity.vy = 0;
    }
  }
}

// ─── Rendering ────────────────────────────────────────────────────────────────
function drawWorld(ctx, camX) {
  if (!world) return;
  const theme = world.theme || THEMES.datacenter;

  const startCol = Math.max(0, pixToCol(camX) - 1);
  const endCol   = Math.min(world.cols, pixToCol(camX + 800) + 2);

  for (let row = 0; row < world.rows; row++) {
    for (let col = startCol; col < endCol; col++) {
      const tile = tileAt(col, row);
      if (tile === 0) continue;

      const sx = col * TILE_SIZE - camX;
      const sy = row * TILE_SIZE;

      ctx.fillStyle = tile === 2 ? theme.breakable.body : theme.tile.body;
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

      if (tile === 2) {
        ctx.fillStyle = theme.breakable.panel;
        ctx.fillRect(sx + 4, sy + 4, TILE_SIZE - 8, 3);
        ctx.fillRect(sx + 4, sy + 13, TILE_SIZE - 8, 3);
        ctx.fillRect(sx + 4, sy + 22, TILE_SIZE - 8, 3);
        ctx.fillStyle = theme.breakable.detail;
        ctx.fillRect(sx + 5, sy + 8, 4, 4);
        ctx.fillRect(sx + 13, sy + 16, 4, 4);
        ctx.fillRect(sx + 21, sy + 8, 4, 4);
      } else if (world.themeId === 'fortress') {
        ctx.fillStyle = theme.tile.panel;
        ctx.fillRect(sx + 2, sy + 8, TILE_SIZE - 4, 3);
        ctx.fillRect(sx + 2, sy + 18, TILE_SIZE - 4, 3);
        ctx.fillRect(sx + 8, sy + 3, 2, TILE_SIZE - 6);
        ctx.fillRect(sx + 18, sy + 11, 2, TILE_SIZE - 12);
      } else if (world.themeId === 'water') {
        ctx.fillStyle = theme.tile.panel;
        ctx.fillRect(sx + 2, sy + 8, TILE_SIZE - 4, 4);
        ctx.fillRect(sx + 4, sy + 18, TILE_SIZE - 8, 3);
        ctx.fillStyle = theme.tile.ledOn;
        ctx.fillRect(sx + 6, sy + 5, 3, 3);
        ctx.fillRect(sx + 19, sy + 20, 2, 2);
      } else {
        ctx.fillStyle = theme.tile.panel;
        ctx.fillRect(sx + 2, sy + 6,  TILE_SIZE - 4, 4);
        ctx.fillRect(sx + 2, sy + 14, TILE_SIZE - 4, 4);
        ctx.fillRect(sx + 2, sy + 22, TILE_SIZE - 4, 4);
      }

      ctx.fillStyle = tile === 2 ? theme.breakable.top : theme.tile.top;
      ctx.fillRect(sx, sy, TILE_SIZE, 2);

      if (tile === 1 && (col + row) % 3 === 0) {
        ctx.fillStyle = (Math.floor(Date.now() / 800 + col) % 2 === 0) ? theme.tile.ledOn : theme.tile.ledOff;
        ctx.fillRect(sx + TILE_SIZE - 6, sy + 4, 3, 3);
      }
    }
  }

  // Golden Backup (goal)
  const g    = world.goal;
  const gx   = g.col * TILE_SIZE - camX + 6;
  const gy   = g.row * TILE_SIZE;
  const glow = 0.6 + 0.4 * Math.sin(Date.now() / 300);
  const goalLocked = !!(world.requiresBossDefeat && typeof entities !== 'undefined' && entities.enemies?.some(enemy => enemy.isBoss && !enemy.dead));

  ctx.fillStyle = goalLocked
    ? `rgba(${theme.goal.lockedBase}, ${glow * 0.8})`
    : `rgba(${theme.goal.openBase}, ${glow})`;
  ctx.fillRect(gx, gy, 20, 28);

  ctx.fillStyle = theme.goal.label;
  ctx.font = 'bold 7px monospace';
  ctx.fillText(goalLocked ? 'LCK' : 'BCK', gx + 1, gy + 11);
  ctx.fillText(goalLocked ? 'DWN' : 'UP', gx + 3, gy + 20);

  if (goalLocked) {
    ctx.strokeStyle = theme.goal.lockedStroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(gx - 3, gy - 3, 26, 34);
  }
}

function drawPlatforms(ctx, camX) {
  if (!world?.platforms) return;
  const theme = world.theme || THEMES.datacenter;

  for (const platform of world.platforms) {
    const sx = Math.round(platform.x - camX);
    const sy = Math.round(platform.y);

    ctx.fillStyle = theme.platform.rail;
    if (platform.axis === 'x') {
      const minX = platform.baseX - platform.travelTiles * TILE_SIZE - camX;
      const maxX = platform.baseX + platform.travelTiles * TILE_SIZE - camX + platform.w;
      ctx.fillRect(Math.round(minX), sy + 4, Math.round(maxX - minX), 4);
    } else {
      const minY = platform.baseY - platform.travelTiles * TILE_SIZE;
      const maxY = platform.baseY + platform.travelTiles * TILE_SIZE + platform.h;
      ctx.fillRect(sx + Math.round(platform.w / 2) - 2, Math.round(minY), 4, Math.round(maxY - minY));
    }

    ctx.fillStyle = theme.platform.body;
    ctx.fillRect(sx, sy, platform.w, platform.h);
    ctx.fillStyle = theme.platform.top;
    ctx.fillRect(sx, sy, platform.w, 3);
    ctx.fillStyle = theme.platform.inset;
    ctx.fillRect(sx + 4, sy + 5, platform.w - 8, 3);
    ctx.fillRect(sx + 4, sy + 10, platform.w - 8, 1);
    ctx.fillStyle = theme.platform.light;
    ctx.fillRect(sx + 6, sy + 4, 3, 3);
    ctx.fillRect(sx + platform.w - 9, sy + 4, 3, 3);

    ctx.fillStyle = theme.platform.label;
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(theme.platform.text, sx + Math.round(platform.w / 2), sy + 9);
    ctx.textAlign = 'left';
  }
}

function drawHazards(ctx, camX) {
  if (!world?.hazards) return;
  const theme = world.theme || THEMES.datacenter;

  for (const hazard of world.hazards) {
    const sx = Math.round(hazard.x - camX);
    const sy = Math.round(hazard.y);
    const pulse = 0.4 + 0.25 * Math.sin(Date.now() / 140 + hazard.id);

    if (hazard.type === 'corruption') {
      const style = theme.hazards.corruption;
      ctx.fillStyle = `rgba(${style.fillBase}, ${0.08 + pulse * 0.1})`;
      ctx.fillRect(sx, sy, hazard.w, hazard.h);

      ctx.strokeStyle = `rgba(${style.strokeBase}, ${0.4 + pulse * 0.35})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1, sy + 1, hazard.w - 2, hazard.h - 2);

      ctx.fillStyle = `rgba(${style.stripeBase}, ${0.2 + pulse * 0.14})`;
      for (let x = sx + 4; x < sx + hazard.w - 4; x += 10) {
        ctx.fillRect(x, sy + 4, 2, hazard.h - 8);
      }

      ctx.fillStyle = style.label;
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(style.text, sx + Math.round(hazard.w / 2), sy + Math.round(hazard.h / 2) + 3);
      ctx.textAlign = 'left';
    } else if (hazard.type === 'undertow') {
      const style = theme.hazards.undertow;
      const dir = (hazard.flow || -1) >= 0 ? 1 : -1;
      ctx.fillStyle = `rgba(${style.fillBase}, ${0.09 + pulse * 0.08})`;
      ctx.fillRect(sx, sy, hazard.w, hazard.h);

      ctx.strokeStyle = `rgba(${style.strokeBase}, ${0.35 + pulse * 0.30})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1, sy + 1, hazard.w - 2, hazard.h - 2);

      ctx.fillStyle = `rgba(${style.stripeBase}, ${0.15 + pulse * 0.16})`;
      for (let x = sx + 5; x < sx + hazard.w - 10; x += 16) {
        ctx.fillRect(x, sy + Math.round(hazard.h / 2) - 1, 8, 2);
        const headX = dir > 0 ? x + 8 : x - 1;
        ctx.fillRect(headX, sy + Math.round(hazard.h / 2) - 3, 3, 2);
        ctx.fillRect(headX, sy + Math.round(hazard.h / 2) + 1, 3, 2);
      }

      ctx.fillStyle = style.label;
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(style.text, sx + Math.round(hazard.w / 2), sy + Math.round(hazard.h / 2) + 3);
      ctx.textAlign = 'left';
    } else {
      const style = theme.hazards.emp;
      ctx.fillStyle = `rgba(${style.fillBase}, ${0.08 + pulse * 0.08})`;
      ctx.fillRect(sx, sy, hazard.w, hazard.h);

      ctx.strokeStyle = `rgba(${style.strokeBase}, ${0.35 + pulse * 0.35})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1, sy + 1, hazard.w - 2, hazard.h - 2);

      ctx.fillStyle = `rgba(${style.stripeBase}, ${0.18 + pulse * 0.12})`;
      for (let y = sy + 4; y < sy + hazard.h - 2; y += 8) {
        ctx.fillRect(sx + 3, y, hazard.w - 6, 2);
      }

      ctx.fillStyle = style.label;
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(style.text, sx + Math.round(hazard.w / 2), sy + Math.round(hazard.h / 2) + 3);
      ctx.textAlign = 'left';
    }
  }
}
