// world.js — tile grid, level data, rendering

const TILE_SIZE = 32;
const LEVEL_ROWS = 14;
const WORLD_1_1_COLS = 188;
const WORLD_1_2_COLS = 196;
const WORLD_1_3_COLS = 208;

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
  fillRow(tiles, 2, 59, 71);

  // Summit support towers to make the midpoint feel like a destination
  fillRect(tiles, 59, 61, 3, 12);
  fillRect(tiles, 69, 71, 3, 12);

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
  clearRect(tiles, 104, 104, 11, 12);
  clearRect(tiles, 117, 117, 11, 12);

  // Breakable maintenance bricks for big-form reward routes
  fillBreakableRect(tiles, 109, 113, 11, 11);
  fillBreakableRect(tiles, 148, 151, 9, 9);
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
      { col:  4, row: 12 },
      { col: 10, row: 12, checkpoint: true },
      // Packet ascent
      { col: 18, row:  9 },
      { col: 29, row:  7 },
      { col: 40, row:  5, checkpoint: true },
      { col: 52, row:  3 },
      // First summit
      { col: 65, row:  1, checkpoint: true },
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
      { type: 'shield',     col:  67, row:  1 },  // calm before the midpoint descent
      { type: 'fire',       col:  80, row:  3 },  // first ranged attack appears on the descent
      { type: 'freeze',     col:  90, row:  5 },  // cold shot shows up before the service bay
      { type: 'freeze',     col: 112, row: 10 },  // service-bay crowd control refresh
      { type: 'speed',      col: 112, row:  8 },  // bonus route lure
      { type: 'life',       col: 131, row:  4 },  // high-risk optional reward
      { type: 'grow',       col: 150, row:  8 },  // lets late-stage players crack brick stacks
      { type: 'doublejump', col: 148, row:  5 },  // helps the late staircase recover
      { type: 'fire',       col: 160, row:  3 },  // late-stage purge burst for the vault climb
      { type: 'freeze',     col: 170, row: 10 },  // final crowd-control refresh
      { type: 'shield',     col: 169, row:  2 },  // final vault approach buffer
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
      { col:  5, row: 12 },
      { col: 12, row: 12, checkpoint: true },
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
      { type: 'fire',       col:  59, row:  8 },
      { type: 'freeze',     col:  75, row:  5 },
      { type: 'shield',     col:  89, row:  7 },
      { type: 'speed',      col: 105, row: 10 },
      { type: 'life',       col: 116, row:  8 },
      { type: 'grow',       col: 127, row:  5 },
      { type: 'doublejump', col: 138, row:  9 },
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
      { col:  6, row: 12 },
      { col: 14, row: 12, checkpoint: true },
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
      { type: 'immutable',  col: 112, row:  7 },
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
  }
};

// ─── Active world state ───────────────────────────────────────────────────────
let world = null;

function loadLevel(id) {
  const base = LEVELS[id];
  if (!base) return null;
  world = {
    ...base,
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
    } else if (isSolid(leftCol, row) || isSolid(rightCol, row)) {
      entity.y  = (row + 1) * TILE_SIZE;
      entity.vy = 0;
    }
  }
}

// ─── Rendering ────────────────────────────────────────────────────────────────
function drawWorld(ctx, camX) {
  if (!world) return;

  const startCol = Math.max(0, pixToCol(camX) - 1);
  const endCol   = Math.min(world.cols, pixToCol(camX + 800) + 2);

  for (let row = 0; row < world.rows; row++) {
    for (let col = startCol; col < endCol; col++) {
      const tile = tileAt(col, row);
      if (tile === 0) continue;

      const sx = col * TILE_SIZE - camX;
      const sy = row * TILE_SIZE;

      // Body
      ctx.fillStyle = tile === 2 ? '#6b4a16' : '#152d15';
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

      // Server rack panel lines
      if (tile === 2) {
        ctx.fillStyle = '#9a6a22';
        ctx.fillRect(sx + 4, sy + 4, TILE_SIZE - 8, 3);
        ctx.fillRect(sx + 4, sy + 13, TILE_SIZE - 8, 3);
        ctx.fillRect(sx + 4, sy + 22, TILE_SIZE - 8, 3);
        ctx.fillStyle = '#c79133';
        ctx.fillRect(sx + 5, sy + 8, 4, 4);
        ctx.fillRect(sx + 13, sy + 16, 4, 4);
        ctx.fillRect(sx + 21, sy + 8, 4, 4);
      } else {
        ctx.fillStyle = '#1e421e';
        ctx.fillRect(sx + 2, sy + 6,  TILE_SIZE - 4, 4);
        ctx.fillRect(sx + 2, sy + 14, TILE_SIZE - 4, 4);
        ctx.fillRect(sx + 2, sy + 22, TILE_SIZE - 4, 4);
      }

      // Top highlight (lit edge)
      ctx.fillStyle = tile === 2 ? '#ffd27a' : '#3aaa3a';
      ctx.fillRect(sx, sy, TILE_SIZE, 2);

      // Blinking LED (every 3rd tile in every other row)
      if (tile === 1 && (col + row) % 3 === 0) {
        ctx.fillStyle = (Math.floor(Date.now() / 800 + col) % 2 === 0) ? '#00ff41' : '#003310';
        ctx.fillRect(sx + TILE_SIZE - 6, sy + 4, 3, 3);
      }
    }
  }

  // Golden Backup (goal)
  const g    = world.goal;
  const gx   = g.col * TILE_SIZE - camX + 6;
  const gy   = g.row * TILE_SIZE;
  const glow = 0.6 + 0.4 * Math.sin(Date.now() / 300);

  ctx.fillStyle = `rgba(255, 200, 0, ${glow})`;
  ctx.fillRect(gx, gy, 20, 28);

  ctx.fillStyle = '#000';
  ctx.font = 'bold 7px monospace';
  ctx.fillText('BCK', gx + 1, gy + 11);
  ctx.fillText('UP', gx + 3, gy + 20);
}

function drawPlatforms(ctx, camX) {
  if (!world?.platforms) return;

  for (const platform of world.platforms) {
    const sx = Math.round(platform.x - camX);
    const sy = Math.round(platform.y);

    ctx.fillStyle = 'rgba(0, 255, 200, 0.08)';
    if (platform.axis === 'x') {
      const minX = platform.baseX - platform.travelTiles * TILE_SIZE - camX;
      const maxX = platform.baseX + platform.travelTiles * TILE_SIZE - camX + platform.w;
      ctx.fillRect(Math.round(minX), sy + 4, Math.round(maxX - minX), 4);
    } else {
      const minY = platform.baseY - platform.travelTiles * TILE_SIZE;
      const maxY = platform.baseY + platform.travelTiles * TILE_SIZE + platform.h;
      ctx.fillRect(sx + Math.round(platform.w / 2) - 2, Math.round(minY), 4, Math.round(maxY - minY));
    }

    ctx.fillStyle = '#15463a';
    ctx.fillRect(sx, sy, platform.w, platform.h);
    ctx.fillStyle = '#2be8c1';
    ctx.fillRect(sx, sy, platform.w, 3);
    ctx.fillStyle = '#0d221c';
    ctx.fillRect(sx + 4, sy + 5, platform.w - 8, 3);
    ctx.fillRect(sx + 4, sy + 10, platform.w - 8, 1);
    ctx.fillStyle = '#9affea';
    ctx.fillRect(sx + 6, sy + 4, 3, 3);
    ctx.fillRect(sx + platform.w - 9, sy + 4, 3, 3);

    ctx.fillStyle = '#062018';
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SYNC', sx + Math.round(platform.w / 2), sy + 9);
    ctx.textAlign = 'left';
  }
}

function drawHazards(ctx, camX) {
  if (!world?.hazards) return;

  for (const hazard of world.hazards) {
    const sx = Math.round(hazard.x - camX);
    const sy = Math.round(hazard.y);
    const pulse = 0.4 + 0.25 * Math.sin(Date.now() / 140 + hazard.id);

    if (hazard.type === 'corruption') {
      ctx.fillStyle = `rgba(255, 30, 80, ${0.08 + pulse * 0.1})`;
      ctx.fillRect(sx, sy, hazard.w, hazard.h);

      ctx.strokeStyle = `rgba(255, 90, 140, ${0.4 + pulse * 0.35})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1, sy + 1, hazard.w - 2, hazard.h - 2);

      ctx.fillStyle = `rgba(255, 180, 210, ${0.2 + pulse * 0.14})`;
      for (let x = sx + 4; x < sx + hazard.w - 4; x += 10) {
        ctx.fillRect(x, sy + 4, 2, hazard.h - 8);
      }

      ctx.fillStyle = '#ffd6e3';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CRC', sx + Math.round(hazard.w / 2), sy + Math.round(hazard.h / 2) + 3);
      ctx.textAlign = 'left';
    } else {
      ctx.fillStyle = `rgba(255, 80, 0, ${0.08 + pulse * 0.08})`;
      ctx.fillRect(sx, sy, hazard.w, hazard.h);

      ctx.strokeStyle = `rgba(255, 170, 0, ${0.35 + pulse * 0.35})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1, sy + 1, hazard.w - 2, hazard.h - 2);

      ctx.fillStyle = `rgba(255, 220, 120, ${0.18 + pulse * 0.12})`;
      for (let y = sy + 4; y < sy + hazard.h - 2; y += 8) {
        ctx.fillRect(sx + 3, y, hazard.w - 6, 2);
      }

      ctx.fillStyle = '#ffdd88';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EMP', sx + Math.round(hazard.w / 2), sy + Math.round(hazard.h / 2) + 3);
      ctx.textAlign = 'left';
    }
  }
}
