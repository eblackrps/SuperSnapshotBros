// world.js — tile grid, level data, rendering

const TILE_SIZE = 32;

// ─── Level Data ───────────────────────────────────────────────────────────────
// 0 = empty, 1 = solid
// 60 cols x 14 rows. Tile (0,13) is bottom-left corner.
// Path: ground → platform staircase ascending right → Golden Backup at top.

const LEVELS = {
  '1-1': {
    name: 'World 1-1 — Hypervisor Crash',
    cols: 60,
    rows: 14,
    playerStart: { x: 48, y: 384 },
    goal: { col: 56, row: 1 },
    // Snapshot Orbs — col/row of center tile
    orbs: [
      { col:  4, row: 12 },   // on the ground before the gap
      { col: 11, row: 12 },   // just after the gap (reward for making it)
      { col: 16, row:  9 },   // above platform 1
      { col: 24, row:  7 },   // above platform 2
      { col: 32, row:  5 },   // above platform 3
      { col: 40, row:  3 },   // above platform 4
      { col: 53, row:  1 },   // near the goal
    ],
    // Powerups
    powerups: [
      { type: 'speed',      col:  7, row: 12 },   // just after the gap — reward for making it
      { type: 'doublejump', col: 19, row:  9 },   // above platform 1
      { type: 'shield',     col: 33, row:  5 },   // above platform 3
      { type: 'life',       col: 45, row:  2 },   // near the goal — high reward
    ],
    // Enemies — patrol between patrolLeft and patrolRight (tile cols)
    enemies: [
      { type: 'rogue-packet', col: 15, row: 10, patrolLeft: 14, patrolRight: 20 },
      { type: 'rogue-packet', col: 23, row:  8, patrolLeft: 22, patrolRight: 28 },
      { type: 'rogue-packet', col: 31, row:  6, patrolLeft: 30, patrolRight: 36 },
    ],
    tiles: [
      // row 0  (sky)
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // row 1
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // row 2  — top platform (goal is here)
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0],
      // row 3
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // row 4
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // row 5
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // row 6
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // row 7
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // row 8
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // row 9
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // row 10
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // row 11
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // row 12
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      // row 13 (ground) — gap at cols 6-7 so the player has to use the first platform
      [1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ]
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
