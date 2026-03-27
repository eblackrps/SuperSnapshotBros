# Super Snapshot Bros — Build Plan

**Tagline:** "Thank you! But your data is in another datacenter!"
**Genre:** 2D Physics Platformer (Mario / Celeste style)
**Platform:** Browser (HTML5 Canvas + Vanilla JS, no framework)
**Theme:** Disaster Recovery / IT Infrastructure — levels set inside datacenters, cloud regions, and backup vaults

---

## Concept

Super Snapshot Bros is a tight, juicy 2D platformer where you play as a sysadmin hero navigating rogue infrastructure to reach the golden backup before RTO expires. Every world is a different failure scenario: a crashed hypervisor, a flooded datacenter, a ransomware outbreak. The DR hook is baked into the premise — the goal of every level is literally disaster recovery.

---

## World / Level Theme Map

| World | DR Theme                  | Environment                        | Boss / Obstacle              |
|-------|---------------------------|------------------------------------|------------------------------|
| 1     | Hypervisor Crash          | Server racks, blinking LEDs        | Rogue BSOD screen            |
| 2     | Ransomware Outbreak       | Dark corridors, red encrypted tiles | Crypto-locker enemy          |
| 3     | Storage Failure           | RAID array ruins, spinning disks   | Fragmented data shards       |
| 4     | Datacenter Flood          | Submerged floor, rising water      | Coolant leak boss            |
| 5     | Cloud Region Outage       | Sky-level, floating VMs            | The Spinning Beachball        |
| 6     | Recovery Point            | Golden vault, clean backup light   | Final failover               |

---

## Tech Stack Decision

**Vanilla JS + HTML5 Canvas** — chosen because:
- No framework lock-in, teaches raw physics math
- Portable, zero build tooling required to start
- Fits the "from scratch" nerd-cred angle that matches the blog brand

Files:
```
/index.html       — canvas host, game loop bootstrap
/game.js          — main game loop (requestAnimationFrame)
/player.js        — player entity, physics, input
/world.js         — tilemap loader, collision grid
/physics.js       — AABB collision detection and resolution
/renderer.js      — draw calls, sprite sheets, camera
/input.js         — keyboard / gamepad abstraction
/entities.js      — enemies, pickups, hazards
/ui.js            — HUD (RTO timer, lives, DR status bar)
/levels/          — JSON level data files
/assets/          — sprites, tiles, sounds
```

---

## Phase 1 — Core Physics Loop (Week 1)

Goal: A square that moves and jumps on the screen. Nothing else.

- [ ] Set up `index.html` with a `<canvas>` element
- [ ] Write a fixed-timestep game loop using `requestAnimationFrame`
- [ ] Implement a `Player` object with:
  - Position (`x`, `y`)
  - Velocity (`vx`, `vy`)
  - Horizontal acceleration and friction
  - Gravity constant applied every frame
  - Terminal velocity cap
- [ ] Keyboard input: left, right, jump
- [ ] Player renders as a colored rectangle

**Key physics constants to tune (these will take iteration):**
```js
const GRAVITY       = 0.5;    // pixels per frame²
const MAX_FALL      = 12;     // terminal velocity
const JUMP_FORCE    = -11;    // initial jump velocity
const MOVE_SPEED    = 0.8;    // acceleration per frame
const FRICTION      = 0.85;   // velocity multiplier when no input
```

---

## Phase 2 — AABB Collision (Week 1–2)

Goal: Player lands on platforms without clipping through.

- [ ] Build a tile grid: 2D array where `1` = solid, `0` = empty
- [ ] AABB overlap check:
  ```
  overlapX = (a.right > b.left) && (a.left < b.right)
  overlapY = (a.bottom > b.top) && (a.top < b.bottom)
  ```
- [ ] **Resolve X-axis first, then Y-axis** (critical — prevents corner bugs)
- [ ] Set `isGrounded = true` when resolved downward (player on top of tile)
- [ ] Render the tilemap as colored rectangles (no art yet)

---

## Phase 3 — Game Feel ("The Juice") (Week 2)

This is what separates a good platformer from a bad one. Implement in this order:

- [ ] **Variable Jump Height**
  - On jump keydown: apply `JUMP_FORCE`
  - On jump keyup while rising: multiply `vy` by `0.5` (cut the jump short)
  - On falling: multiply gravity by `2.5` (heavier fall, snappier arc)

- [ ] **Coyote Time**
  - Track `coyoteTimer` — a frame counter reset to `6` whenever the player leaves a platform
  - Allow jump if `coyoteTimer > 0`, even if not grounded

- [ ] **Jump Buffering**
  - Track `jumpBuffer` — set to `8` frames when jump key pressed
  - On landing, if `jumpBuffer > 0`, immediately jump

- [ ] **Screen Shake** (for landings and deaths)

- [ ] **Squash & Stretch** on jump and land

---

## Phase 4 — Tilemaps & Level Loading (Week 2–3)

- [ ] Define level format as JSON:
  ```json
  {
    "name": "Hypervisor Crash",
    "width": 40,
    "height": 20,
    "tileSize": 32,
    "tiles": [[1,1,1,...], [0,0,0,...], ...],
    "playerStart": [2, 15],
    "goal": [38, 5]
  }
  ```
- [ ] Write a level loader that parses JSON and populates the tile grid
- [ ] Scrolling camera that follows the player (center-lock with edge clamping)
- [ ] Design World 1-1 in the JSON format

---

## Phase 5 — Art & Audio (Week 3–4)

- [ ] Pixel art sprite sheet for player (idle, run, jump, fall, death)
- [ ] Tile sprite sheet: server rack tiles, floor, wall, pipes
- [ ] Background layers (parallax scrolling — 2 layers minimum)
- [ ] Sound effects: jump, land, death, checkpoint save
- [ ] Background music: chiptune / lo-fi datacenter ambience
- [ ] DR-themed UI skin: RTO countdown timer instead of a clock, "Snapshots Collected" instead of coins

---

## Phase 6 — Enemies & Hazards (Week 4)

- [ ] Base `Entity` class with position, velocity, AABB collision
- [ ] Enemy: **Rogue Packet** — walks back and forth, bounces at platform edges
- [ ] Enemy: **Crypto Process** — floats in a sine wave pattern
- [ ] Hazard: **EMP Pulse Zone** — disables jump temporarily (simulates downtime)
- [ ] Hazard: **Rising Log Data** (rising floor mechanic, World 4 style)
- [ ] Player death + respawn at last snapshot (checkpoint)

---

## Phase 7 — Checkpoints & Progression (Week 5)

- [ ] **Snapshot Orbs** — collectible checkpoints (the DR pun: taking a snapshot)
- [ ] Save last snapshot position; respawn there on death
- [ ] Level completion: reach the "Golden Backup" at the end
- [ ] World map screen between levels (stylized network topology)
- [ ] Track RTO timer per level — bonus points for fast recovery

---

## Phase 8 — Polish & Release (Week 5–6)

- [ ] Start screen with game title and tagline
- [ ] Pause menu
- [ ] Death screen: "Recovery Time Exceeded — Retry?"
- [ ] Win screen: "RPO Achieved. Datacenter Restored."
- [ ] High score table (localStorage)
- [ ] Mobile / touch controls (virtual D-pad)
- [ ] itch.io or GitHub Pages deploy

---

## DR Branding Hooks (for blog / portfolio use)

These are the angles that tie the game back to the nerd industry brand:

| Game Element       | DR Concept Being Referenced                |
|--------------------|--------------------------------------------|
| Snapshot Orbs      | VM / storage snapshots                     |
| Golden Backup      | The recovery target / recovery point       |
| RTO Timer          | Recovery Time Objective                    |
| World select map   | Network topology / site map                |
| Player respawn     | Failover / failback                        |
| World 5: Cloud     | Cloud region availability zones            |
| Encrypted tiles    | Ransomware / data at rest encryption       |
| Lives system       | Redundancy / replication count             |

---

## Milestone Summary

| Milestone | Deliverable                                 | Target   |
|-----------|---------------------------------------------|----------|
| M1        | Physics loop — square moves and jumps       | Week 1   |
| M2        | AABB collision — player lands on platforms  | Week 1-2 |
| M3        | Game feel — coyote time, buffering, juice   | Week 2   |
| M4        | Level loader + World 1-1 playable           | Week 2-3 |
| M5        | Art pass + audio                            | Week 3-4 |
| M6        | Enemies + hazards                           | Week 4   |
| M7        | Checkpoints + progression                  | Week 5   |
| M8        | Polish + deploy                             | Week 5-6 |

---

## First Code to Write

Start here. Get this working before anything else:

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Super Snapshot Bros</title>
  <style>
    body { margin: 0; background: #0a0a0a; display: flex; justify-content: center; align-items: center; height: 100vh; }
    canvas { border: 1px solid #333; image-rendering: pixelated; }
  </style>
</head>
<body>
  <canvas id="game" width="800" height="450"></canvas>
  <script src="game.js"></script>
</body>
</html>
```

```js
// game.js — the entire game lives here until it's worth splitting
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const GRAVITY      = 0.5;
const MAX_FALL     = 12;
const JUMP_FORCE   = -11;
const MOVE_SPEED   = 0.8;
const FRICTION     = 0.85;

const keys = {};
document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup',   e => keys[e.code] = false);

const player = {
  x: 100, y: 200,
  w: 24,  h: 32,
  vx: 0,  vy: 0,
  grounded: false
};

// Simple floor for Phase 1 testing
const floor = { x: 0, y: 410, w: 800, h: 40 };

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function update() {
  // Horizontal movement
  if (keys['ArrowLeft']  || keys['KeyA']) player.vx -= MOVE_SPEED;
  if (keys['ArrowRight'] || keys['KeyD']) player.vx += MOVE_SPEED;
  player.vx *= FRICTION;

  // Gravity
  player.vy += GRAVITY;
  if (player.vy > MAX_FALL) player.vy = MAX_FALL;

  // Jump
  if ((keys['ArrowUp'] || keys['KeyW'] || keys['Space']) && player.grounded) {
    player.vy = JUMP_FORCE;
    player.grounded = false;
  }

  // Move
  player.x += player.vx;
  player.y += player.vy;

  // Cheap floor collision for Phase 1
  player.grounded = false;
  if (aabb(player, floor)) {
    player.y = floor.y - player.h;
    player.vy = 0;
    player.grounded = true;
  }

  // Keep in bounds
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;
}

function draw() {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Floor
  ctx.fillStyle = '#2a5a2a';
  ctx.fillRect(floor.x, floor.y, floor.w, floor.h);

  // Player
  ctx.fillStyle = '#00aaff';
  ctx.fillRect(player.x, player.y, player.w, player.h);

  // HUD
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px monospace';
  ctx.fillText('SUPER SNAPSHOT BROS — Phase 1', 10, 20);
  ctx.fillText(`vx: ${player.vx.toFixed(2)}  vy: ${player.vy.toFixed(2)}  grounded: ${player.grounded}`, 10, 40);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
```

Run `index.html` in a browser. This is your foundation.
