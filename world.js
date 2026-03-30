// world.js — tile grid, level data, rendering

const TILE_SIZE = 32;
const LEVEL_ROWS = 14;
const WORLD_1_1_COLS = 188;

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

  return tiles;
}

const LEVELS = {
  '1-1': {
    name: 'World 1-1 — Hypervisor Crash',
    cols: WORLD_1_1_COLS,
    rows: LEVEL_ROWS,
    playerStart: { x: 48, y: 384 },
    goal: { col: 180, row: 1 },
    // Snapshot Orbs — also serve as restore-point checkpoints
    orbs: [
      // Boot corridor
      { col:  4, row: 12 },
      { col: 10, row: 12 },
      // Packet ascent
      { col: 18, row:  9 },
      { col: 29, row:  7 },
      { col: 40, row:  5 },
      { col: 52, row:  3 },
      // First summit
      { col: 65, row:  1 },
      // Descent and midpoint
      { col: 79, row:  3 },
      { col: 90, row:  5 },
      { col: 108, row: 12 },
      // Optional route and late climb
      { col: 121, row:  6 },
      { col: 137, row:  7 },
      { col: 148, row:  5 },
      { col: 160, row:  3 },
      { col: 169, row:  2 },
      // Vault finale
      { col: 180, row:  1 },
    ],
    powerups: [
      { type: 'speed',      col:   8, row: 12 },  // reward the early gap clear
      { type: 'doublejump', col:  41, row:  5 },  // supports the first big climb
      { type: 'shield',     col:  67, row:  1 },  // calm before the midpoint descent
      { type: 'speed',      col: 112, row:  8 },  // bonus route lure
      { type: 'life',       col: 131, row:  4 },  // high-risk optional reward
      { type: 'doublejump', col: 148, row:  5 },  // helps the late staircase recover
      { type: 'shield',     col: 169, row:  2 },  // final vault approach buffer
    ],
    // Enemies — patrol between patrolLeft and patrolRight (tile cols)
    enemies: [
      { type: 'rogue-packet', col:  16, row: 10, patrolLeft:  14, patrolRight:  20 },
      { type: 'rogue-packet', col:  28, row:  8, patrolLeft:  25, patrolRight:  31 },
      { type: 'rogue-packet', col:  39, row:  6, patrolLeft:  36, patrolRight:  42 },
      { type: 'rogue-packet', col:  78, row:  4, patrolLeft:  75, patrolRight:  82 },
      { type: 'rogue-packet', col: 110, row: 13, patrolLeft: 104, patrolRight: 120 },
      { type: 'rogue-packet', col: 123, row: 10, patrolLeft: 122, patrolRight: 129 },
      { type: 'rogue-packet', col: 136, row:  8, patrolLeft: 134, patrolRight: 140 },
      { type: 'rogue-packet', col: 147, row:  6, patrolLeft: 145, patrolRight: 151 },
      { type: 'rogue-packet', col: 158, row:  4, patrolLeft: 156, patrolRight: 163 },
    ],
    tiles: buildWorld11Tiles(),
  }
};

// ─── Active world state ───────────────────────────────────────────────────────
let world = null;

function loadLevel(id) {
  world = LEVELS[id];
  return world;
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
  return tileAt(col, row) === 1;
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

  if (entity.vy > 0) {
    const row = pixToRow(entity.y + entity.h);
    if (isSolid(leftCol, row) || isSolid(rightCol, row)) {
      entity.y        = row * TILE_SIZE - entity.h;
      entity.vy       = 0;
      entity.grounded = true;
    }
  } else if (entity.vy < 0) {
    const row = pixToRow(entity.y);
    if (isSolid(leftCol, row) || isSolid(rightCol, row)) {
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
      if (tileAt(col, row) !== 1) continue;

      const sx = col * TILE_SIZE - camX;
      const sy = row * TILE_SIZE;

      // Body
      ctx.fillStyle = '#152d15';
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

      // Server rack panel lines
      ctx.fillStyle = '#1e421e';
      ctx.fillRect(sx + 2, sy + 6,  TILE_SIZE - 4, 4);
      ctx.fillRect(sx + 2, sy + 14, TILE_SIZE - 4, 4);
      ctx.fillRect(sx + 2, sy + 22, TILE_SIZE - 4, 4);

      // Top highlight (lit edge)
      ctx.fillStyle = '#3aaa3a';
      ctx.fillRect(sx, sy, TILE_SIZE, 2);

      // Blinking LED (every 3rd tile in every other row)
      if ((col + row) % 3 === 0) {
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
