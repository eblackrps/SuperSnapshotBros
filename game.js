// game.js — main loop, player, input, camera

const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');

const W = canvas.width;   // 800
const H = canvas.height;  // 450

// ─── Physics constants ────────────────────────────────────────────────────────
const GRAVITY       = 0.43;
const MAX_FALL      = 11.5;
const JUMP_FORCE    = -12.4;
const MOVE_SPEED    = 0.78;
const RUN_SPEED     = 1.08;
const WALK_MAX_VX   = 5.2;
const RUN_MAX_VX    = 7.4;
const FRICTION      = 0.86;
const RUN_FRICTION  = 0.92;
const COYOTE_FRAMES = 6;
const BUFFER_FRAMES = 8;

// ─── Game state ───────────────────────────────────────────────────────────────
// 'title' | 'playing' | 'paused' | 'gameover' | 'complete'
let gameState = 'title';

let transitionFlash = 0;
let lives           = 3;
const MAX_LIVES     = 3;

// Checkpoint
let checkpoint = null;

// Powerup timers (in frames) and double-jump flag
const pw = { shield: 0, speed: 0, doublejump: 0 };
let doubleJumpUsed = false;

const PW_DURATION = { shield: 360, speed: 360, doublejump: 480 };  // 6s / 6s / 8s

// ─── RTO Timer ────────────────────────────────────────────────────────────────
const DEFAULT_RTO_FRAMES = 300 * 60;  // 5 minutes at 60fps
let rtoMaxFrames = DEFAULT_RTO_FRAMES;
let rtoFrames = rtoMaxFrames;
let gameOverCause = 'lives';
const SITE_URL = 'https://anystackarchitect.com';
let runDeaths = 0;
let checkpointsActivated = 0;
let runStartedAt = 0;

function getLevelRtoFrames(level) {
  const seconds = Math.max(120, level?.rtoSeconds || 300);
  return seconds * 60;
}

function startGame() {
  gameState       = 'playing';
  levelComplete   = false;
  transitionFlash = 18;
  lives           = MAX_LIVES;
  checkpoint      = null;
  pw.shield = pw.speed = pw.doublejump = 0;
  doubleJumpUsed  = false;
  gameOverCause   = 'lives';
  particles.length = 0;
  floatingTexts.length = 0;
  shakeMag = 0;
  shakeDur = 0;
  runDeaths = 0;
  checkpointsActivated = 0;
  runStartedAt = Date.now();
  loadLevel('1-1');
  rtoMaxFrames    = getLevelRtoFrames(world);
  rtoFrames       = rtoMaxFrames;
  entities.init(world);
  respawn();
  Music.start();
}

function loseLife() {
  sfxDeath();
  runDeaths++;
  lives--;
  if (lives <= 0) {
    gameOverCause = 'lives';
    gameState = 'gameover';
    saveBestScore();
    Music.stop();
  } else {
    respawn();
  }
}

// ─── Input ────────────────────────────────────────────────────────────────────
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  e.preventDefault();
  if (gameState === 'title')    { startGame(); return; }
  if (gameState === 'complete') {
    if (e.code === 'Enter' || e.code === 'KeyL') {
      window.open(SITE_URL, '_blank', 'noopener');
      return;
    }
    startGame();
    return;
  }
  if (gameState === 'gameover') { startGame(); return; }
  if (gameState === 'playing'  && e.code === 'Escape') { gameState = 'paused';  sfxPause(); return; }
  if (gameState === 'paused'   && e.code === 'Escape') { gameState = 'playing'; sfxPause(); return; }
  if (gameState === 'paused'   && e.code === 'KeyR')   { startGame(); return; }
  if (e.code === 'KeyM') { const m = toggleMute(); Music.setVolume(m ? 0 : 0.32); }
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

// ─── Camera ───────────────────────────────────────────────────────────────────
const cam = { x: 0 };

function updateCamera(target) {
  const levelW = world.cols * TILE_SIZE;
  const ideal  = target.x + target.w / 2 - W / 2;
  cam.x        = Math.max(0, Math.min(ideal, levelW - W));
}

function isRunHeld() {
  return !!(keys['ShiftLeft'] || keys['ShiftRight'] || touchState.run);
}

function getCurrentSectionName() {
  if (!world?.sections) return '';
  const playerCol = pixToCol(player.x + player.w / 2);
  for (const section of world.sections) {
    if (playerCol >= section.startCol && playerCol <= section.endCol) return section.label;
  }
  return world.sections[world.sections.length - 1]?.label || '';
}

// ─── Player ───────────────────────────────────────────────────────────────────
const player = {
  x: 48, y: 384,
  w: 22, h: 30,
  vx: 0, vy: 0,
  grounded:    false,
  wasGrounded: false,   // previous frame — used to detect landing
  coyoteTimer: 0,
  jumpBuffer:  0,
  jumping:     false,
  facing:      1,
  walkTick:    0,
  hitFlash:    0,
};

function respawn() {
  const s     = checkpoint || world.playerStart;
  player.x    = s.x;
  player.y    = s.y;
  player.vx   = 0;
  player.vy   = 0;
  player.grounded = false;
  player.hitFlash = 40;
}

// ─── Goal state ───────────────────────────────────────────────────────────────
let levelComplete = false;

function checkGoal() {
  const g  = world.goal;
  const gx = g.col * TILE_SIZE + 6;
  const gy = g.row * TILE_SIZE;
  return player.x + player.w > gx &&
         player.x < gx + 20        &&
         player.y + player.h > gy  &&
         player.y < gy + 28;
}

// ─── Particles ────────────────────────────────────────────────────────────────
const particles = [];

function spawnBurst(wx, wy, count, colors, minSpeed, maxSpeed) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
    const life  = 18 + Math.floor(Math.random() * 28);
    particles.push({
      x: wx, y: wy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life, maxLife: life,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 1 + Math.floor(Math.random() * 3),
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x  += p.vx;
    p.y  += p.vy;
    p.vy += 0.2;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles(camX) {
  for (const p of particles) {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle   = p.color;
    ctx.fillRect(Math.round(p.x - camX), Math.round(p.y), p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

// ─── Floating texts ───────────────────────────────────────────────────────────
const floatingTexts = [];

function addFloatingText(wx, wy, text, color) {
  floatingTexts.push({ x: wx, y: wy, text, color, life: 55, maxLife: 55 });
}

function updateFloatingTexts() {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    floatingTexts[i].y   -= 0.9;
    floatingTexts[i].life--;
    if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
  }
}

function drawFloatingTexts(camX) {
  ctx.font      = 'bold 11px monospace';
  ctx.textAlign = 'center';
  for (const ft of floatingTexts) {
    ctx.globalAlpha = ft.life / ft.maxLife;
    ctx.fillStyle   = ft.color;
    ctx.fillText(ft.text, Math.round(ft.x - camX), Math.round(ft.y));
  }
  ctx.globalAlpha = 1;
  ctx.textAlign   = 'left';
}

// ─── Screen shake ─────────────────────────────────────────────────────────────
let shakeMag = 0, shakeDur = 0;

function addShake(mag, dur) {
  if (mag > shakeMag) { shakeMag = mag; shakeDur = dur; }
}

// ─── Update ───────────────────────────────────────────────────────────────────
function update() {
  if (levelComplete || gameState !== 'playing') return;

  if (player.hitFlash > 0) player.hitFlash--;
  if (shakeDur > 0) {
    shakeDur--;
    shakeMag *= 0.92;
  } else {
    shakeMag = 0;
  }

  // Powerup timers
  if (pw.shield     > 0) { pw.shield--;     if (player.hitFlash === 0) player.hitFlash = 2; }
  if (pw.speed      > 0)   pw.speed--;
  if (pw.doublejump > 0)   pw.doublejump--;
  if (rtoFrames > 0) rtoFrames--;

  // Horizontal input
  const speedMult = pw.speed > 0 ? 1.7 : 1.0;
  const goLeft  = keys['ArrowLeft']  || keys['KeyA'];
  const goRight = keys['ArrowRight'] || keys['KeyD'];
  const runHeld = isRunHeld();
  const accel = (runHeld ? RUN_SPEED : MOVE_SPEED) * speedMult;
  const maxVx = (runHeld ? RUN_MAX_VX : WALK_MAX_VX) * speedMult;
  const friction = (!goLeft && !goRight) ? (runHeld ? RUN_FRICTION : FRICTION) : 1;
  if (goLeft)  { player.vx -= accel; player.facing = -1; }
  if (goRight) { player.vx += accel; player.facing =  1; }
  player.vx *= friction;
  if (player.vx > maxVx) player.vx = maxVx;
  if (player.vx < -maxVx) player.vx = -maxVx;

  // Walk animation tick
  if ((goLeft || goRight) && player.grounded) player.walkTick++;
  else if (player.grounded) player.walkTick = 0;

  // Gravity
  const falling  = player.vy > 0;
  const cutJump  = !player.jumping && player.vy < 0;
  const gravityMult = falling ? 1.7 : cutJump ? 2.05 : 1.0;
  player.vy     += GRAVITY * gravityMult;
  if (player.vy > MAX_FALL) player.vy = MAX_FALL;

  // Jump tracking
  const jumpPressed = keys['ArrowUp'] || keys['KeyW'] || keys['Space'];
  if (!jumpPressed) player.jumping = false;

  if (jumpPressed)                player.jumpBuffer = BUFFER_FRAMES;
  else if (player.jumpBuffer > 0) player.jumpBuffer--;

  if (player.grounded)              player.coyoteTimer = COYOTE_FRAMES;
  else if (player.coyoteTimer > 0)  player.coyoteTimer--;

  if (player.grounded) doubleJumpUsed = false;

  if (player.jumpBuffer > 0 && player.coyoteTimer > 0) {
    player.vy          = JUMP_FORCE;
    player.jumping     = true;
    player.grounded    = false;
    player.coyoteTimer = 0;
    player.jumpBuffer  = 0;
    sfxJump();
  } else if (player.jumpBuffer > 0 && !player.grounded && pw.doublejump > 0 && !doubleJumpUsed) {
    player.vy         = JUMP_FORCE * 0.88;
    player.jumping    = true;
    player.jumpBuffer = 0;
    doubleJumpUsed    = true;
    sfxJump();
  }

  // Move → resolve (X first, then Y)
  player.grounded = false;

  player.x += player.vx;
  resolveX(player);

  player.y += player.vy;
  resolveY(player);

  // Land detection
  if (player.grounded && !player.wasGrounded) sfxLand();
  player.wasGrounded = player.grounded;

  // Fell into pit
  if (player.y > world.rows * TILE_SIZE + 60) loseLife();

  // Camera
  updateCamera(player);

  // Entities
  if (player.hitFlash === 0) {
    entities.update(
      player,
      () => {
        if (player.hitFlash === 0 && pw.shield === 0) {
          addShake(8, 18);
          loseLife();
        }
      },
      (x, y) => {
        player.vy = JUMP_FORCE * 0.75;
        spawnBurst(x, y, 16, ['#ff8800', '#ff4400', '#ffaa33'], 1.2, 3.4);
        addFloatingText(x, y - 8, 'STOMP', '#ffcc66');
        addShake(5, 12);
        sfxStomp();
      },
      (type, x, y) => {
        if (type === 'life') {
          lives = Math.min(MAX_LIVES + 1, lives + 1);
        } else {
          pw[type] = PW_DURATION[type];
        }
        const colorsByType = {
          shield: ['#0088ff', '#88ddff', '#d8f6ff'],
          speed: ['#ffcc00', '#fff18a', '#ff9900'],
          doublejump: ['#00ddff', '#aaffff', '#3cf2ff'],
          life: ['#ff4455', '#ff8899', '#ffd0d6'],
        };
        const labelsByType = {
          shield: 'HA',
          speed: 'TR',
          doublejump: 'SN^2',
          life: '+1',
        };
        spawnBurst(x, y, 18, colorsByType[type] || ['#ffffff'], 0.8, 2.8);
        addFloatingText(x, y - 10, labelsByType[type] || type.toUpperCase(), '#ffffff');
        addShake(3, 10);
        sfxCollect();
      }
    );
  }

  // Snapshot orbs — some are checkpoints, others are score-only collectibles
  for (const orb of entities.orbs) {
    if (orb.collected && !orb.processedCollection) {
      orb.processedCollection = true;
      if (orb.checkpoint) {
        checkpointsActivated++;
        checkpoint = { x: orb.x + orb.w / 2 - player.w / 2, y: orb.y - player.h };
        spawnBurst(orb.x + orb.w / 2, orb.y + orb.h / 2, 18, ['#ffd700', '#00ddff', '#ffffff'], 0.9, 3.0);
        addFloatingText(orb.x + orb.w / 2, orb.y - 8, 'CHECKPOINT', '#ffd700');
      } else {
        spawnBurst(orb.x + orb.w / 2, orb.y + orb.h / 2, 10, ['#00ddff', '#aaffff', '#ffffff'], 0.7, 2.2);
        addFloatingText(orb.x + orb.w / 2, orb.y - 8, 'SNAPSHOT', '#00ddff');
      }
      sfxCollect();
    }
  }

  updateParticles();
  updateFloatingTexts();

  if (rtoFrames <= 0) {
    gameOverCause = 'rto';
    gameState = 'gameover';
    addShake(10, 24);
    saveBestScore();
    Music.stop();
    return;
  }

  // Goal
  if (checkGoal()) { levelComplete = true; sfxGoal(); saveBestScore(); Music.stop(); }
}

// ─── Parallax background ─────────────────────────────────────────────────────
const BG_TOWERS = (() => {
  // Pre-generate a pattern that repeats every 240px
  // Each entry: [x, width, height, shade]
  const pattern = [];
  for (let i = 0; i < 3; i++) {
    const bx = i * 240;
    pattern.push({ x: bx + 10,  w: 28, h: 340, shade: '#0c1e0c' });
    pattern.push({ x: bx + 80,  w: 18, h: 280, shade: '#0a180a' });
    pattern.push({ x: bx + 140, w: 32, h: 360, shade: '#0d220d' });
    pattern.push({ x: bx + 200, w: 16, h: 250, shade: '#0b1c0b' });
  }
  return pattern;
})();

function drawParallax() {
  const PATTERN_W = 240 * 3;

  // ── Far layer (0.12x) — tower silhouettes ──
  const farOff = (cam.x * 0.12) % PATTERN_W;
  for (let rep = -1; rep <= 1; rep++) {
    const ox = rep * PATTERN_W - farOff;
    for (const t of BG_TOWERS) {
      ctx.fillStyle = t.shade;
      ctx.fillRect(ox + t.x, H - t.h, t.w, t.h);
    }
  }

  // ── Mid layer (0.35x) — horizontal rack shelves ──
  const midOff = (cam.x * 0.35) % W;
  ctx.fillStyle = '#0e260e';
  for (let rep = -1; rep <= 2; rep++) {
    const ox = rep * W - midOff;
    // Rack units spaced every 60px vertically
    for (let y = 120; y < H; y += 60) {
      ctx.fillRect(ox,       y,      W, 2);
      ctx.fillRect(ox + 20,  y + 10, W - 40, 6);
      // Status LEDs
      ctx.fillStyle = (Math.floor(Date.now() / 1200 + y) % 3 === 0) ? '#003310' : '#001a08';
      ctx.fillRect(ox + 24, y + 12, 3, 2);
      ctx.fillRect(ox + 30, y + 12, 3, 2);
      ctx.fillStyle = '#0e260e';
    }
  }
}

// ─── Player draw ─────────────────────────────────────────────────────────────
function drawPlayer() {
  if (player.hitFlash > 0 && pw.shield === 0 && Math.floor(player.hitFlash / 4) % 2 === 0) return;

  const sx = Math.round(player.x - cam.x);
  const sy = Math.round(player.y);
  const f  = player.facing;
  const inAir = !player.grounded;

  // Walk frame: legs alternate every 8 ticks
  const legPhase = Math.floor(player.walkTick / 8) % 2;

  ctx.save();
  // Flip for left-facing by translating to center and scaling
  if (f === -1) {
    ctx.translate(sx + player.w / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(sx + player.w / 2), 0);
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(sx + 2, sy + player.h - 2, player.w - 4, 4);

  // Body
  ctx.fillStyle = '#0088cc';
  ctx.fillRect(sx + 2, sy + 6, player.w - 4, 16);

  // Head
  ctx.fillStyle = '#00aaee';
  ctx.fillRect(sx, sy, player.w, 10);

  // Visor
  ctx.fillStyle = '#002244';
  ctx.fillRect(sx + 2, sy + 2, player.w - 4, 6);

  // Eyes (two dots in visor)
  ctx.fillStyle = inAir ? '#ff8800' : '#00ffaa';   // orange eyes when airborne
  ctx.fillRect(sx + 5,  sy + 3, 4, 3);
  ctx.fillRect(sx + 13, sy + 3, 4, 3);

  // Backpack (right side, always)
  ctx.fillStyle = '#005588';
  ctx.fillRect(sx + player.w - 2, sy + 6, 5, 10);

  // Arms
  const armY = inAir ? sy + 4 : sy + 8;   // arms up when jumping
  ctx.fillStyle = '#006699';
  ctx.fillRect(sx - 4, armY, 6, 8);       // left arm

  // Legs (animated when running, static otherwise)
  ctx.fillStyle = '#005588';
  if (inAir) {
    // Tuck legs
    ctx.fillRect(sx + 3,  sy + 22, 7, 6);
    ctx.fillRect(sx + 12, sy + 22, 7, 6);
  } else if (legPhase === 0) {
    ctx.fillRect(sx + 3,  sy + 22, 7, 8);
    ctx.fillRect(sx + 12, sy + 22, 7, 4);
  } else {
    ctx.fillRect(sx + 3,  sy + 22, 7, 4);
    ctx.fillRect(sx + 12, sy + 22, 7, 8);
  }

  ctx.restore();

  // Shield aura
  if (pw.shield > 0) {
    const pulse = 0.4 + 0.3 * Math.sin(Date.now() / 120);
    ctx.strokeStyle = `rgba(0,160,255,${pulse})`;
    ctx.lineWidth   = 3;
    ctx.shadowColor = '#0088ff';
    ctx.shadowBlur  = 12;
    ctx.strokeRect(Math.round(player.x - cam.x) - 4, player.y - 4, player.w + 8, player.h + 8);
    ctx.shadowBlur  = 0;
  }

  // Speed trail
  if (pw.speed > 0 && (keys['ArrowLeft'] || keys['KeyA'] || keys['ArrowRight'] || keys['KeyD'])) {
    ctx.globalAlpha = 0.25;
    ctx.fillStyle   = '#ffcc00';
    ctx.fillRect(Math.round(player.x - cam.x) - player.facing * 10, player.y + 4, player.w, player.h - 8);
    ctx.globalAlpha = 0.12;
    ctx.fillRect(Math.round(player.x - cam.x) - player.facing * 20, player.y + 8, player.w, player.h - 16);
    ctx.globalAlpha = 1;
  }
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
function drawHUD() {
  // Top bar background
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, 38);

  // Title
  ctx.fillStyle = '#00ff41';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('SUPER SNAPSHOT BROS', 10, 16);

  // Level name
  ctx.fillStyle = '#3a8a3a';
  ctx.font = '10px monospace';
  const sectionName = getCurrentSectionName();
  ctx.fillText(sectionName ? `${world.name}  //  ${sectionName}` : world.name, 10, 30);

  // Lives (top right)
  ctx.textAlign = 'right';
  ctx.font      = 'bold 13px monospace';
  for (let i = 0; i < MAX_LIVES; i++) {
    ctx.fillStyle = i < lives ? '#00aaee' : '#1a3a1a';
    ctx.fillText('▣', W - 12 - i * 18, 20);
  }

  // Orb counter (top right, second row)
  ctx.fillStyle = '#00ddff';
  ctx.font      = '11px monospace';
  ctx.fillText(`SN: ${entities.orbsCollected} / ${entities.totalOrbs}`, W - 10, 33);
  ctx.textAlign = 'left';

  // Level progress strip for longer Mario-style stages
  const goalPx = world.goal.col * TILE_SIZE + 16;
  const playerPx = player.x + player.w / 2;
  const trackX = 220, trackY = 26, trackW = 330, trackH = 5;
  const playerRatio = Math.max(0, Math.min(1, playerPx / Math.max(goalPx, 1)));

  ctx.fillStyle = '#1a5a1a';
  ctx.font      = '8px monospace';
  ctx.fillText('PATH', trackX - 34, trackY + 4);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(trackX, trackY, trackW, trackH);
  ctx.fillStyle = '#114411';
  ctx.fillRect(trackX + 1, trackY + 1, trackW - 2, trackH - 2);
  ctx.fillStyle = '#2a8a2a';
  ctx.fillRect(trackX + 1, trackY + 1, Math.max(2, Math.round((trackW - 2) * playerRatio)), trackH - 2);

  if (world.landmarks) {
    for (const marker of world.landmarks) {
      const ratio = Math.max(0, Math.min(1, marker.col / Math.max(world.goal.col, 1)));
      const mx = trackX + Math.round(trackW * ratio);
      ctx.fillStyle = marker.color || '#88aa88';
      ctx.fillRect(mx, trackY - 2, 2, trackH + 4);
    }
  }

  if (checkpoint) {
    const checkpointRatio = Math.max(0, Math.min(1, (checkpoint.x + player.w / 2) / Math.max(goalPx, 1)));
    const cx = trackX + Math.round(trackW * checkpointRatio);
    ctx.fillStyle = '#00ddff';
    ctx.fillRect(cx - 1, trackY - 4, 4, trackH + 8);
  }

  const px = trackX + Math.round(trackW * playerRatio);
  ctx.fillStyle = '#00ffaa';
  ctx.fillRect(px - 2, trackY - 3, 5, trackH + 6);
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(trackX + trackW - 4, trackY - 3, 6, trackH + 6);

  // Checkpoint indicator
  if (checkpoint) {
    ctx.fillStyle = '#00aaff';
    ctx.font      = '9px monospace';
    ctx.fillText('◈ CHECKPOINT ACTIVE', 10, 45);
  }

  // Active powerup bars
  const activePws = [
    { key: 'shield',     label: 'HA',  color: '#0088ff', max: PW_DURATION.shield     },
    { key: 'speed',      label: 'TR',  color: '#ffcc00', max: PW_DURATION.speed      },
    { key: 'doublejump', label: 'SN²', color: '#00ddff', max: PW_DURATION.doublejump },
  ].filter(p => pw[p.key] > 0);

  activePws.forEach((p, i) => {
    const bx = 10, by = 50 + i * 18;
    const ratio = pw[p.key] / p.max;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(bx, by, 80, 10);
    ctx.fillStyle = p.color;
    ctx.fillRect(bx, by, Math.round(80 * ratio), 10);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(p.label, bx + 83, by + 9);
  });

  const totalSeconds = Math.ceil(rtoFrames / 60);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  const rtoWarnFrames = Math.min(60 * 60, Math.round(rtoMaxFrames * 0.18));
  ctx.textAlign = 'right';
  ctx.font      = 'bold 11px monospace';
  ctx.fillStyle = rtoFrames <= rtoWarnFrames ? '#ff6666' : '#ffd700';
  ctx.fillText(`RTO ${minutes}:${seconds}`, W - 10, 48);
  ctx.textAlign = 'left';

  // Double jump indicator (mid-air)
  if (pw.doublejump > 0 && !player.grounded) {
    ctx.fillStyle = doubleJumpUsed ? '#224444' : '#00ddff';
    ctx.font      = 'bold 11px monospace';
    ctx.fillText('▲▲', W / 2 - 12, 52);
  }

  // Bottom debug bar
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, H - 20, W, 20);
  ctx.fillStyle = '#2a4a2a';
  ctx.font = '9px monospace';
  ctx.fillText(
    `vx:${player.vx.toFixed(1)}  vy:${player.vy.toFixed(1)}  grounded:${player.grounded}  coyote:${player.coyoteTimer}  buf:${player.jumpBuffer}  camX:${Math.round(cam.x)}`,
    8, H - 6
  );
  ctx.fillStyle = '#2a3a2a';
  ctx.textAlign = 'right';
  ctx.fillText('Shift / Run + Jump for long arcs', W - 8, H - 6);
  ctx.textAlign = 'left';
}

function getRunSummary() {
  const elapsedMs = runStartedAt ? (Date.now() - runStartedAt) : 0;
  const elapsedSeconds = Math.max(0, Math.round(elapsedMs / 1000));
  const rtoLeftRatio = Math.max(0, rtoFrames) / rtoMaxFrames;
  const orbRatio = entities.totalOrbs ? entities.orbsCollected / entities.totalOrbs : 0;
  const totalCheckpointOrbs = Math.max(1, entities.orbs.filter(orb => orb.checkpoint).length);
  const checkpointRatio = Math.min(1, checkpointsActivated / totalCheckpointOrbs);
  const deathPenalty = Math.min(0.35, runDeaths * 0.08);
  const score = Math.max(0, Math.min(1,
    0.45 * rtoLeftRatio +
    0.35 * orbRatio +
    0.20 * checkpointRatio -
    deathPenalty
  ));

  let grade = 'C';
  let status = 'PARTIAL RECOVERY';
  if (score >= 0.90) { grade = 'S'; status = 'ZERO-DATA-LOSS HERO'; }
  else if (score >= 0.78) { grade = 'A'; status = 'RECOVERY EXCELLENT'; }
  else if (score >= 0.64) { grade = 'B'; status = 'RECOVERY STABLE'; }
  else if (score >= 0.50) { grade = 'C'; status = 'RECOVERY ACCEPTABLE'; }
  else if (score >= 0.35) { grade = 'D'; status = 'RECOVERY DEGRADED'; }
  else { grade = 'F'; status = 'RECOVERY FRAGILE'; }

  return {
    elapsedSeconds,
    rtoLeftSeconds: Math.max(0, Math.ceil(rtoFrames / 60)),
    orbRatio,
    score,
    grade,
    status,
  };
}

function drawComplete() {
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, W, H);

  const summary = getRunSummary();
  const elapsedMinutes = String(Math.floor(summary.elapsedSeconds / 60)).padStart(2, '0');
  const elapsedSeconds = String(summary.elapsedSeconds % 60).padStart(2, '0');
  const rtoMinutes = String(Math.floor(summary.rtoLeftSeconds / 60)).padStart(2, '0');
  const rtoSeconds = String(summary.rtoLeftSeconds % 60).padStart(2, '0');

  ctx.textAlign = 'center';

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 36px monospace';
  ctx.fillText('BACKUP RESTORED', W / 2, H / 2 - 122);

  ctx.fillStyle = '#00ff41';
  ctx.font = '16px monospace';
  ctx.fillText('RTO ACHIEVED — DATACENTER ONLINE', W / 2, H / 2 - 92);

  ctx.fillStyle = '#00ddff';
  ctx.font = '13px monospace';
  ctx.fillText(`Recovery grade ${summary.grade}  //  ${summary.status}`, W / 2, H / 2 - 66);

  ctx.fillStyle = 'rgba(0,10,0,0.92)';
  ctx.fillRect(W / 2 - 220, H / 2 - 44, 440, 148);
  ctx.strokeStyle = '#00ff41';
  ctx.lineWidth = 2;
  ctx.strokeRect(W / 2 - 220, H / 2 - 44, 440, 148);

  ctx.fillStyle = '#00ff41';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('RECOVERY SUMMARY', W / 2, H / 2 - 18);

  ctx.font = '12px monospace';
  ctx.fillStyle = '#aaffaa';
  ctx.fillText(`Run time: ${elapsedMinutes}:${elapsedSeconds}`, W / 2, H / 2 + 10);
  ctx.fillText(`RTO remaining: ${rtoMinutes}:${rtoSeconds}`, W / 2, H / 2 + 32);
  ctx.fillText(`Snapshots: ${entities.orbsCollected} / ${entities.totalOrbs}`, W / 2, H / 2 + 54);
  ctx.fillText(`Deaths: ${runDeaths}   Checkpoints: ${checkpointsActivated}`, W / 2, H / 2 + 76);

  // Best score
  const best = loadBestScore();
  if (best) {
    const tag = best.completed
      ? `BEST ${best.grade || 'A'}  //  ${best.orbs}/${best.total} SNAPSHOTS`
      : `BEST: ${best.orbs}/${best.total} SNAPSHOTS`;
    ctx.fillStyle = '#886600';
    ctx.font      = '11px monospace';
    ctx.fillText(`PERSONAL RECORD — ${tag}`, W / 2, H / 2 + 124);
  }

  const blink = Math.floor(Date.now() / 500) % 2 === 0;
  if (blink) {
    ctx.fillStyle = '#aaffaa';
    ctx.font      = '12px monospace';
    ctx.fillText('[ ENTER / L: VISIT ANYSTACKARCHITECT.COM ]', W / 2, H / 2 + 150);
  }

  ctx.fillStyle = '#3a8a3a';
  ctx.font      = '11px monospace';
  ctx.fillText('[ ANY OTHER KEY: RUN AGAIN ]', W / 2, H / 2 + 172);

  if (blink) {
    ctx.fillStyle = '#00ddff';
    ctx.font      = '10px monospace';
    ctx.fillText('Learn the real DR strategy behind the run', W / 2, H / 2 + 192);
  }

  ctx.textAlign = 'left';
}

// ─── Title screen ────────────────────────────────────────────────────────────
const BOOT_LOG = [
  '> SYSTEM BOOT..................... [OK]',
  '> HYPERVISOR DETECTED............. [OK]',
  '> LOADING SNAPSHOT INDEX.......... [OK]',
  '> CHECKING REPLICATION STATUS..... [WARN]',
  '> PRIMARY SITE UNREACHABLE........ [FAIL]',
  '> INITIATING FAILOVER SEQUENCE... [OK]',
  '> LOADING HERO MODULE............. [OK]',
  '> SUPER SNAPSHOT BROS v1.0........ [READY]',
];
let titleCamX    = 0;
let bootLine     = 0;
let bootTimer    = 0;
const BOOT_DELAY = 18;

// ── Matrix rain ──
const MATRIX_CHARS = '01アイウエカキクサシスタチツナニヌABCDEF>_[]{}#%';
const COL_W        = 16;
const matrixCols   = Array.from({ length: Math.ceil(W / COL_W) }, (_, i) => ({
  y:     Math.random() * H,
  speed: 0.8 + Math.random() * 1.6,
  chars: Array.from({ length: 22 }, () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]),
}));

function tickMatrix() {
  ctx.font = '11px monospace';
  for (const col of matrixCols) {
    col.y += col.speed;
    if (col.y > H + 240) { col.y = -40; col.speed = 0.8 + Math.random() * 1.6; }
    for (let j = 0; j < col.chars.length; j++) {
      const cy = col.y - j * 12;
      if (cy < 0 || cy > H) continue;
      if (Math.random() < 0.015) col.chars[j] = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
      const alpha = (1 - j / col.chars.length) * (j === 0 ? 1 : 0.55);
      ctx.fillStyle = j === 0 ? `rgba(180,255,180,${alpha})` : `rgba(0,160,0,${alpha})`;
      ctx.fillText(col.chars[j], (matrixCols.indexOf(col)) * COL_W, cy);
    }
  }
}

// ── Floating data packets ──
const dataPackets = Array.from({ length: 18 }, () => ({
  x:     Math.random() * W,
  y:     Math.random() * H,
  vy:   -(0.3 + Math.random() * 0.5),
  size:  3 + Math.floor(Math.random() * 5),
  alpha: 0.2 + Math.random() * 0.4,
  label: Math.random() < 0.5 ? '01' : 'SN',
}));

function tickPackets() {
  ctx.font = '7px monospace';
  for (const p of dataPackets) {
    p.y += p.vy;
    if (p.y < -10) p.y = H + 10;
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle   = '#00ddff';
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.fillStyle = '#aaffff';
    ctx.fillText(p.label, p.x - 2, p.y - 2);
  }
  ctx.globalAlpha = 1;
}

// ── CRT scanlines ──
function drawScanlines() {
  ctx.fillStyle = 'rgba(0,0,0,0.10)';
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  // Vignette
  const vig = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.85);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

// ── Card corner brackets ──
function drawCorners(x, y, w, h, size, color) {
  ctx.fillStyle = color;
  const corners = [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]];
  for (const [cx, cy, dx, dy] of corners) {
    ctx.fillRect(cx, cy, dx * size, 3);
    ctx.fillRect(cx, cy, 3, dy * size);
  }
}

// ── Running border light ──
function drawBorderLight(x, y, w, h, color) {
  const perim = 2 * (w + h);
  const pos   = (Date.now() / 6) % perim;
  const segL  = 80;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur  = 14;
  ctx.beginPath();

  // Map 1D position along perimeter to x,y
  function perimPoint(d) {
    d = ((d % perim) + perim) % perim;
    if (d < w)         return [x + d, y];
    d -= w;
    if (d < h)         return [x + w, y + d];
    d -= h;
    if (d < w)         return [x + w - d, y + h];
    d -= w;
    return [x, y + h - d];
  }

  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const [px, py] = perimPoint(pos + (i / steps) * segL);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

// ── VHS horizontal tear glitch ──
let glitchCooldown = 0;
let glitchStrips   = [];

function maybeVHSGlitch() {
  glitchCooldown--;
  if (glitchCooldown > 0) return;
  if (Math.random() > 0.025) return;   // ~2.5% chance per frame when cooldown is 0
  glitchCooldown = 60 + Math.floor(Math.random() * 120);
  glitchStrips   = Array.from({ length: 3 + Math.floor(Math.random() * 5) }, () => ({
    y:  Math.floor(Math.random() * H),
    h:  2 + Math.floor(Math.random() * 10),
    dx: (Math.random() - 0.5) * 28,
    life: 4 + Math.floor(Math.random() * 6),
  }));
}

function drawVHSGlitch() {
  glitchStrips = glitchStrips.filter(s => s.life-- > 0);
  for (const s of glitchStrips) {
    ctx.fillStyle = `rgba(255,20,60,0.12)`;
    ctx.fillRect(s.dx,      s.y, W, s.h);
    ctx.fillStyle = `rgba(0,220,255,0.10)`;
    ctx.fillRect(-s.dx * 0.6, s.y + 1, W, s.h);
    ctx.fillStyle = `rgba(255,255,255,0.06)`;
    ctx.fillRect(s.dx * 0.3, s.y,     W, 1);
  }
}

// ── Scrolling ticker ──
const PAGE_START  = Date.now();
const TICKER_TEXT = '  ◈  RTO TARGET: 4H  |  RPO TARGET: 1H  |  UPTIME: 99.97%  |  SNAPSHOTS INDEXED: 1,337  |  REPLICATION SITES: 3  |  DR STATUS: DEGRADED — FAILOVER REQUIRED  |  HERO MODULE: LOADED  |  AWAITING OPERATOR  ◈  ';
let tickerX = W;

function drawTicker() {
  ctx.font = '10px monospace';
  const textW = ctx.measureText(TICKER_TEXT).width;
  tickerX -= 1.4;
  if (tickerX < -textW) tickerX = W;

  // Uptime counter (bottom right corner)
  const elapsed = Math.floor((Date.now() - PAGE_START) / 1000);
  const mm      = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss      = String(elapsed % 60).padStart(2, '0');

  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, H - 20, W, 20);

  // Scrolling text
  ctx.fillStyle = '#1a6a1a';
  ctx.fillText(TICKER_TEXT, tickerX, H - 6);
  ctx.fillText(TICKER_TEXT, tickerX + textW, H - 6);

  // Uptime badge
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(W - 118, H - 20, 118, 20);
  ctx.fillStyle = '#006600';
  ctx.fillText(`SESSION: ${mm}:${ss}`, W - 112, H - 6);
}

// ── Title screen player sprite (drawn at a given scale/position) ──
let titleWalkTick = 0;

function drawTitlePlayer(cx, cy, facing, scale) {
  titleWalkTick++;
  const legPhase = Math.floor(titleWalkTick / 8) % 2;
  const bob      = Math.sin(titleWalkTick * 0.08) * 2;

  ctx.save();
  ctx.translate(cx, cy + bob);
  ctx.scale(facing * scale, scale);

  const W2 = 22, H2 = 30;
  const ox  = -W2 / 2;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(ox + 2, H2 - 2, W2 - 4, 4);
  // Body
  ctx.fillStyle = '#0088cc';
  ctx.fillRect(ox + 2, 6, W2 - 4, 16);
  // Head
  ctx.fillStyle = '#00aaee';
  ctx.fillRect(ox, 0, W2, 10);
  // Visor
  ctx.fillStyle = '#002244';
  ctx.fillRect(ox + 2, 2, W2 - 4, 6);
  // Eyes
  ctx.fillStyle = '#00ffaa';
  ctx.fillRect(ox + 5, 3, 4, 3);
  ctx.fillRect(ox + 13, 3, 4, 3);
  // Backpack
  ctx.fillStyle = '#005588';
  ctx.fillRect(ox + W2 - 2, 6, 5, 10);
  // Arm
  ctx.fillStyle = '#006699';
  ctx.fillRect(ox - 4, 8, 6, 8);
  // Legs
  ctx.fillStyle = '#005588';
  if (legPhase === 0) {
    ctx.fillRect(ox + 3,  22, 7, 8);
    ctx.fillRect(ox + 12, 22, 7, 4);
  } else {
    ctx.fillRect(ox + 3,  22, 7, 4);
    ctx.fillRect(ox + 12, 22, 7, 8);
  }

  ctx.restore();
}

// ── Glitch text helper ──
function glitchText(text, x, y) {
  if (Math.random() < 0.06) {
    const ox = (Math.random() - 0.5) * 8;
    ctx.fillStyle = 'rgba(255,0,80,0.6)';
    ctx.fillText(text, x + ox + 4, y);
    ctx.fillStyle = 'rgba(0,255,255,0.6)';
    ctx.fillText(text, x - ox - 3, y);
  }
  ctx.fillStyle = '#ffd700';
  ctx.fillText(text, x, y);
}

function drawTitle() {
  const levelW = world.cols * TILE_SIZE;
  titleCamX    = (titleCamX + 0.5) % (levelW - W);
  cam.x        = titleCamX;

  // World scrolling behind
  drawBg();
  drawParallax();
  drawWorld(ctx, cam.x);
  entities.draw(ctx, cam.x);

  // VHS glitch (before overlay so it shows through)
  maybeVHSGlitch();
  drawVHSGlitch();

  // Matrix rain layer
  ctx.fillStyle = 'rgba(0,6,0,0.55)';
  ctx.fillRect(0, 0, W, H);
  tickMatrix();

  // Floating data packets
  tickPackets();

  // Second dark overlay to push matrix back
  ctx.fillStyle = 'rgba(0,4,0,0.55)';
  ctx.fillRect(0, 0, W, H);

  // ── Card ──
  const cardX = W / 2 - 300;
  const cardY = 52;
  const cardW = 600;
  const cardH = 322;

  // Outer glow
  ctx.shadowColor = '#00ff41';
  ctx.shadowBlur  = 24;
  ctx.strokeStyle = '#005500';
  ctx.lineWidth   = 1;
  ctx.strokeRect(cardX - 4, cardY - 4, cardW + 8, cardH + 8);
  ctx.shadowBlur  = 0;

  // Card body
  ctx.fillStyle = 'rgba(0,10,0,0.94)';
  ctx.fillRect(cardX, cardY, cardW, cardH);

  // Card border
  ctx.strokeStyle = '#00bb33';
  ctx.lineWidth   = 2;
  ctx.strokeRect(cardX, cardY, cardW, cardH);

  // Running border light
  drawBorderLight(cardX, cardY, cardW, cardH, '#00ff88');

  // Corner decorations
  drawCorners(cardX, cardY, cardW, cardH, 16, '#00ff41');

  // Top bar
  ctx.fillStyle = '#003300';
  ctx.fillRect(cardX + 2, cardY + 2, cardW - 4, 22);
  ctx.fillStyle = '#00ff41';
  ctx.fillRect(cardX + 2, cardY + 2, cardW - 4, 2);  // top accent line
  ctx.fillStyle = '#00cc44';
  ctx.font      = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('◈  DISASTER RECOVERY CONSOLE  v2.1  ◈', W / 2, cardY + 17);

  // ── Flanking player characters ──
  drawTitlePlayer(cardX - 30, cardY + cardH - 60,  1, 2.4);
  drawTitlePlayer(cardX + cardW + 30, cardY + cardH - 60, -1, 2.4);

  // ── Game title ──
  ctx.textAlign = 'center';

  // "SUPER" with outline + glow
  ctx.font        = 'bold 50px monospace';
  ctx.lineWidth   = 6;
  ctx.strokeStyle = '#003300';
  ctx.strokeText('SUPER', W / 2, cardY + 82);
  ctx.shadowColor = '#00ff41';
  ctx.shadowBlur  = 22;
  ctx.fillStyle   = '#00ff41';
  ctx.fillText('SUPER', W / 2, cardY + 82);
  ctx.shadowBlur  = 0;

  // Badge behind "SNAPSHOT BROS"
  ctx.font = 'bold 44px monospace';
  const snW = ctx.measureText('SNAPSHOT BROS').width;
  ctx.fillStyle = 'rgba(55,38,0,0.6)';
  ctx.fillRect(W / 2 - snW / 2 - 14, cardY + 92, snW + 28, 48);
  ctx.strokeStyle = '#775500';
  ctx.lineWidth   = 1;
  ctx.strokeRect(W / 2 - snW / 2 - 14, cardY + 92, snW + 28, 48);

  // "SNAPSHOT BROS" with outline + glitch
  ctx.lineWidth   = 6;
  ctx.strokeStyle = '#332200';
  ctx.strokeText('SNAPSHOT BROS', W / 2, cardY + 132);
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur  = 18;
  glitchText('SNAPSHOT BROS', W / 2, cardY + 132);
  ctx.shadowBlur  = 0;

  // Subtitle
  ctx.fillStyle = '#2a8a2a';
  ctx.font      = '12px monospace';
  ctx.fillText('"Thank you! But your data is in another datacenter!"', W / 2, cardY + 156);

  // Divider with small diamonds
  ctx.fillStyle = '#1a5a1a';
  ctx.fillRect(cardX + 20, cardY + 167, cardW - 40, 1);
  ctx.fillStyle = '#00ff41';
  ctx.fillText('◆', cardX + 10, cardY + 170);
  ctx.fillText('◆', cardX + cardW - 18, cardY + 170);

  // Boot log
  bootTimer++;
  if (bootTimer % BOOT_DELAY === 0 && bootLine < BOOT_LOG.length) bootLine++;

  ctx.textAlign = 'left';
  ctx.font      = '10px monospace';
  for (let i = 0; i < bootLine; i++) {
    const line   = BOOT_LOG[i];
    const isLast = i === bootLine - 1;
    const isFail = line.includes('[FAIL]');
    const isWarn = line.includes('[WARN]');
    ctx.fillStyle = isLast ? '#aaffaa' : '#2a6a2a';
    ctx.fillText(line.replace(/\[.*\]/, '').trimEnd(), cardX + 24, cardY + 184 + i * 14);
    const badge = line.match(/\[.*\]/)?.[0] || '';
    ctx.fillStyle = isFail ? '#ff3333' : isWarn ? '#ffaa00' : '#00ff41';
    ctx.fillText(badge, cardX + cardW - 68, cardY + 184 + i * 14);

    // Typing cursor on the active line
    if (isLast && Math.floor(Date.now() / 400) % 2 === 0) {
      ctx.fillStyle = '#00ff41';
      ctx.fillRect(cardX + 24 + ctx.measureText(line.replace(/\[.*\]/, '').trimEnd()).width + 3,
                   cardY + 175 + i * 14, 6, 10);
    }
  }

  // Uptime counter (inside card, bottom-right)
  const elapsed = Math.floor((Date.now() - PAGE_START) / 1000);
  const uu = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const us = String(elapsed % 60).padStart(2, '0');
  ctx.textAlign = 'right';
  ctx.font      = '9px monospace';
  ctx.fillStyle = '#1a5a1a';
  ctx.fillText(`SESSION ${uu}:${us}  |  v1.0.0`, cardX + cardW - 10, cardY + cardH - 28);

  // Blink prompt
  if (bootLine >= BOOT_LOG.length) {
    const blink = Math.floor(Date.now() / 520) % 2 === 0;
    ctx.textAlign   = 'center';
    ctx.font        = 'bold 13px monospace';
    ctx.shadowColor = '#00ff41';
    ctx.shadowBlur  = blink ? 10 : 0;
    ctx.fillStyle   = blink ? '#00ff41' : '#005500';
    ctx.fillText('[ PRESS ANY KEY TO INITIATE RECOVERY ]', W / 2, cardY + cardH - 14);
    ctx.shadowBlur  = 0;
  }

  // Scrolling ticker + world name
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1a4a1a';
  ctx.font      = '9px monospace';
  ctx.fillText(`▶  ${world.name}  ◀`, W / 2, H - 24);
  drawTicker();

  // CRT + VHS on top of everything
  drawVHSGlitch();
  drawScanlines();

  ctx.textAlign = 'left';
}

// ─── Pause screen ─────────────────────────────────────────────────────────────
function drawPause() {
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2, cy = H / 2;
  const pw = 340, ph = 200;

  ctx.fillStyle = 'rgba(0,10,0,0.95)';
  ctx.fillRect(cx - pw/2, cy - ph/2, pw, ph);
  ctx.strokeStyle = '#00ff41';
  ctx.lineWidth   = 2;
  ctx.strokeRect(cx - pw/2, cy - ph/2, pw, ph);
  drawCorners(cx - pw/2, cy - ph/2, pw, ph, 12, '#00ff41');

  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#00ff41';
  ctx.font        = 'bold 22px monospace';
  ctx.shadowColor = '#00ff41';
  ctx.shadowBlur  = 12;
  ctx.fillText('// PAUSED //', cx, cy - 50);
  ctx.shadowBlur  = 0;

  ctx.fillStyle = '#2a8a2a';
  ctx.font      = '12px monospace';
  ctx.fillText('ESC  —  RESUME', cx, cy - 10);
  ctx.fillText('R    —  RESTART LEVEL', cx, cy + 14);
  ctx.fillText('SHIFT —  RUN / LONG JUMP', cx, cy + 38);

  ctx.fillStyle = '#1a5a1a';
  ctx.font      = '10px monospace';
  ctx.fillText(`LIVES: ${lives} / ${MAX_LIVES}   SNAPSHOTS: ${entities.orbsCollected} / ${entities.totalOrbs}`, cx, cy + 74);
  ctx.fillText(world.name, cx, cy + 90);

  ctx.textAlign = 'left';
  drawScanlines();
}

// ─── Game over screen ─────────────────────────────────────────────────────────
function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.80)';
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2, cy = H / 2;

  ctx.textAlign   = 'center';
  ctx.font        = 'bold 34px monospace';
  ctx.shadowColor = '#ff2200';
  ctx.shadowBlur  = 20;
  ctx.fillStyle   = '#ff2200';
  ctx.fillText(gameOverCause === 'rto' ? 'RECOVERY TIME EXCEEDED' : 'ALL REPLICAS LOST', cx, cy - 40);
  ctx.shadowBlur  = 0;

  ctx.fillStyle = '#882200';
  ctx.font      = '14px monospace';
  ctx.fillText(
    gameOverCause === 'rto' ? 'RTO BREACH — FAILOVER WINDOW CLOSED' : 'NO LIVES REMAINING — RECOVERY ABORTED',
    cx, cy - 6
  );

  ctx.fillStyle = '#00ddff';
  ctx.font      = '12px monospace';
  ctx.fillText(`Snapshots recovered: ${entities.orbsCollected} / ${entities.totalOrbs}`, cx, cy + 22);

  const blink = Math.floor(Date.now() / 520) % 2 === 0;
  ctx.fillStyle = blink ? '#aaffaa' : '#1a4a1a';
  ctx.font      = '12px monospace';
  ctx.fillText('[ PRESS ANY KEY TO RETRY ]', cx, cy + 56);

  ctx.textAlign = 'left';
  drawScanlines();
}

// ─── Background fill ─────────────────────────────────────────────────────────
function drawBg() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#050e05');
  grad.addColorStop(1, '#0a180a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// ─── Best score (localStorage) ───────────────────────────────────────────────
const SCORE_KEY = 'ssb-best-1-1';

function loadBestScore() {
  try { return JSON.parse(localStorage.getItem(SCORE_KEY)); } catch { return null; }
}

function saveBestScore() {
  try {
    const prev    = loadBestScore();
    const summary = getRunSummary();
    const current = {
      orbs: entities.orbsCollected,
      total: entities.totalOrbs,
      completed: !!levelComplete,
      grade: summary.grade,
      rtoLeftSeconds: summary.rtoLeftSeconds,
      deaths: runDeaths,
    };
    if (
      !prev ||
      current.orbs > prev.orbs ||
      (!prev.completed && current.completed) ||
      (current.completed && prev.completed && current.rtoLeftSeconds > (prev.rtoLeftSeconds || 0))
    ) {
      localStorage.setItem(SCORE_KEY, JSON.stringify(current));
    }
  } catch (_) {}
}

// ─── Touch controls ───────────────────────────────────────────────────────────
const touchBtns = {
  left:  { x: 50,     y: H - 75, r: 36 },
  right: { x: 138,    y: H - 75, r: 36 },
  run:   { x: W - 158, y: H - 75, r: 34 },
  jump:  { x: W - 70, y: H - 75, r: 44 },
};
const touchState = { left: false, right: false, run: false, jump: false };

function touchInBtn(tx, ty, btn) {
  const dx = tx - btn.x, dy = ty - btn.y;
  return dx * dx + dy * dy < btn.r * btn.r;
}

function syncTouchToKeys() {
  keys['ArrowLeft']  = touchState.left;
  keys['ArrowRight'] = touchState.right;
  keys['ShiftLeft']  = touchState.run;
  keys['Space']      = touchState.jump;
}

function evalTouches(e) {
  touchState.left  = false;
  touchState.right = false;
  touchState.run   = false;
  touchState.jump  = false;
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  for (const t of e.touches) {
    const tx = (t.clientX - rect.left) * scaleX;
    const ty = (t.clientY - rect.top)  * scaleY;
    if (touchInBtn(tx, ty, touchBtns.left))  touchState.left  = true;
    if (touchInBtn(tx, ty, touchBtns.right)) touchState.right = true;
    if (touchInBtn(tx, ty, touchBtns.run))   touchState.run   = true;
    if (touchInBtn(tx, ty, touchBtns.jump))  touchState.jump  = true;
  }
  syncTouchToKeys();
}

canvas.addEventListener('touchstart',  e => { e.preventDefault(); evalTouches(e); }, { passive: false });
canvas.addEventListener('touchmove',   e => { e.preventDefault(); evalTouches(e); }, { passive: false });
canvas.addEventListener('touchend',    e => { e.preventDefault(); evalTouches(e); }, { passive: false });
canvas.addEventListener('touchcancel', e => { e.preventDefault(); evalTouches(e); }, { passive: false });

const hasTouchScreen = navigator.maxTouchPoints > 0;

function drawTouchControls() {
  if (!hasTouchScreen) return;
  const btns = [
    { ...touchBtns.left,  label: '◀', active: touchState.left  },
    { ...touchBtns.right, label: '▶', active: touchState.right },
    { ...touchBtns.run,   label: 'RUN', active: touchState.run },
    { ...touchBtns.jump,  label: '▲', active: touchState.jump  },
  ];
  for (const b of btns) {
    ctx.globalAlpha = b.active ? 0.75 : 0.35;
    ctx.fillStyle   = b.active ? '#00aaff' : '#003344';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00ddff';
    ctx.lineWidth   = 2;
    ctx.stroke();
    ctx.globalAlpha = b.active ? 1 : 0.6;
    ctx.fillStyle   = '#ffffff';
    ctx.font        = b.label === 'RUN' ? 'bold 12px monospace' : `bold ${b.r - 10}px monospace`;
    ctx.textAlign   = 'center';
    ctx.fillText(b.label, b.x, b.y + (b.r - 10) * 0.35);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign   = 'left';
}

// ─── Loop ─────────────────────────────────────────────────────────────────────
function loop() {
  if (gameState === 'title') {
    drawTitle();
  } else {
    update();
    drawBg();
    drawParallax();
    ctx.save();
    if (shakeDur > 0 && shakeMag > 0.1) {
      const sx = (Math.random() * 2 - 1) * shakeMag;
      const sy = (Math.random() * 2 - 1) * shakeMag;
      ctx.translate(sx, sy);
    }
    drawWorld(ctx, cam.x);
    entities.draw(ctx, cam.x);
    drawParticles(cam.x);
    drawPlayer();
    drawFloatingTexts(cam.x);
    ctx.restore();
    drawHUD();

    if (levelComplete)                 { gameState = 'complete'; drawComplete(); }
    else if (gameState === 'paused')   drawPause();
    else if (gameState === 'gameover') drawGameOver();

    drawTouchControls();

    // Transition flash
    if (transitionFlash > 0) {
      ctx.fillStyle = `rgba(200,255,200,${transitionFlash / 18 * 0.85})`;
      ctx.fillRect(0, 0, W, H);
      transitionFlash--;
    }
    drawScanlines();

    // Mute indicator
    if (muted) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(W - 42, 40, 34, 18);
      ctx.fillStyle = '#ff4444';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('M MUTE', W - 10, 52);
      ctx.textAlign = 'left';
    }
  }

  requestAnimationFrame(loop);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
loadLevel('1-1');
entities.init(world);
loop();
