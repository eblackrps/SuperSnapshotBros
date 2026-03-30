// entities.js — Snapshot Orbs and Enemies

// ─── Snapshot Orb ─────────────────────────────────────────────────────────────
class SnapshotOrb {
  constructor(x, y, checkpoint = false) {
    this.x = x - 8;  // center on given pixel coord
    this.y = y - 8;
    this.w = 16;
    this.h = 16;
    this.checkpoint = checkpoint;
    this.collected = false;
  }

  update() {}

  draw(ctx, camX) {
    if (this.collected) return;
    const sx = Math.round(this.x - camX);
    const sy = Math.round(this.y);
    const t  = Date.now() / 500;
    const bob = Math.sin(t + this.x * 0.01) * 3;

    // Outer glow ring
    const glow = 0.4 + 0.3 * Math.sin(t * 1.5);
    ctx.fillStyle = this.checkpoint
      ? `rgba(255, 215, 80, ${glow})`
      : `rgba(0, 210, 255, ${glow})`;
    ctx.beginPath();
    ctx.arc(sx + 8, sy + 8 + bob, this.checkpoint ? 12 : 10, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = this.checkpoint ? '#ffd700' : '#00ddff';
    ctx.beginPath();
    ctx.arc(sx + 8, sy + 8 + bob, 6, 0, Math.PI * 2);
    ctx.fill();

    // Inner shine
    ctx.fillStyle = '#aaffff';
    ctx.fillRect(sx + 5, sy + 4 + bob, 3, 2);

    // Label
    ctx.fillStyle = '#003344';
    ctx.font = 'bold 5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.checkpoint ? 'CP' : 'SN', sx + 8, sy + 10 + bob);
    ctx.textAlign = 'left';
  }

  overlaps(player) {
    if (this.collected) return false;
    return player.x + player.w > this.x + 2 &&
           player.x < this.x + this.w - 2    &&
           player.y + player.h > this.y + 2  &&
           player.y < this.y + this.h - 2;
  }
}

function rectsOverlap(a, b) {
  return a.x + a.w > b.x &&
         a.x < b.x + b.w &&
         a.y + a.h > b.y &&
         a.y < b.y + b.h;
}

// ─── Rogue Packet ─────────────────────────────────────────────────────────────
class RoguePacket {
  constructor(x, y, patrolLeft, patrolRight) {
    this.x           = x;
    this.y           = y;
    this.w           = 22;
    this.h           = 22;
    this.vx          = 1.0;
    this.patrolLeft  = patrolLeft;
    this.patrolRight = patrolRight;
    this.tick        = 0;
    this.dead        = false;
    this.frozen      = 0;
  }

  update() {
    if (this.dead) return;
    this.tick++;
    if (this.frozen > 0) {
      this.frozen--;
      return;
    }
    this.x += this.vx;
    if (this.x <= this.patrolLeft || this.x + this.w >= this.patrolRight) {
      this.vx *= -1;
      this.x  += this.vx * 2;
    }
  }

  draw(ctx, camX) {
    if (this.dead) return;
    const sx     = Math.round(this.x - camX);
    const sy     = Math.round(this.y);
    const glitch = this.tick % 10 < 2;
    const dx     = glitch ? (Math.random() > 0.5 ? 3 : -2) : 0;

    // Shadow
    ctx.fillStyle = 'rgba(200,0,0,0.2)';
    ctx.fillRect(sx + 2, sy + 2, this.w, this.h);

    // Body
    ctx.fillStyle = glitch ? '#ff2222' : '#cc0000';
    ctx.fillRect(sx + dx, sy, this.w, this.h);

    // Glitch stripe
    if (glitch) {
      ctx.fillStyle = 'rgba(255, 140, 0, 0.7)';
      ctx.fillRect(sx - 4 + dx, sy + 6, this.w + 6, 4);
    }

    // Corrupted pixel noise
    ctx.fillStyle = '#ff6666';
    ctx.fillRect(sx + dx + 2,  sy + 2,  4, 4);
    ctx.fillRect(sx + dx + 14, sy + 14, 4, 4);
    ctx.fillStyle = '#ffaaaa';
    ctx.fillRect(sx + dx + 10, sy + 4,  2, 2);
    ctx.fillRect(sx + dx + 4,  sy + 14, 2, 2);

    // Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ERR', sx + dx + 11, sy + 14);
    ctx.textAlign = 'left';

    // Direction indicator (little arrow)
    ctx.fillStyle = '#ff4444';
    if (this.vx > 0) ctx.fillRect(sx + this.w + 1, sy + 8, 4, 6);
    else              ctx.fillRect(sx - 5,           sy + 8, 4, 6);
  }

  // Returns 'stomp' if player lands on top, 'hit' if side/bottom, null if no overlap
  collideWith(player) {
    if (this.dead) return null;
    const overlapX = player.x + player.w - 2 > this.x && player.x + 2 < this.x + this.w;
    const overlapY = player.y + player.h     > this.y && player.y     < this.y + this.h;
    if (!overlapX || !overlapY) return null;
    // Stomp: player must be moving downward AND feet in the top 75% of the enemy
    if (player.vy > 0 && player.y + player.h < this.y + this.h * 0.75) return 'stomp';
    return this.frozen > 0 ? null : 'hit';
  }

  freeze() {
    if (this.dead) return;
    this.frozen = 240;
  }

  hitByProjectile(type) {
    if (this.dead) return null;
    if (type === 'freeze') {
      if (this.frozen > 0) return null;
      this.freeze();
      return 'freeze';
    }
    if (type === 'fire') {
      this.stomp();
      return 'burn';
    }
    return null;
  }

  stomp() {
    this.dead        = true;
    this.squashTick  = 22;
    this.floorY      = this.y + this.h;   // remember where the floor is
  }

  draw(ctx, camX) {
    if (this.dead) {
      if (this.squashTick <= 0) return;
      this.squashTick--;

      const sx       = Math.round(this.x - camX);
      const total    = 22;
      const progress = 1 - this.squashTick / total;   // 0 → 1
      // Height collapses, width expands (squash-and-stretch)
      const squashH  = Math.max(1, Math.round(this.h * (1 - progress * 0.92)));
      const expand   = Math.round(progress * 10);
      const drawX    = sx - expand;
      const drawW    = this.w + expand * 2;
      const drawY    = Math.round(this.floorY) - squashH;   // pinned to floor

      ctx.globalAlpha = Math.max(0, 1 - progress * 0.85);

      // Body
      ctx.fillStyle = '#882200';
      ctx.fillRect(drawX, drawY, drawW, squashH);

      // Impact highlight on first few frames
      if (this.squashTick > 18) {
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(drawX, drawY, drawW, Math.max(1, Math.round(squashH * 0.4)));
      }

      // Thin top rim
      ctx.fillStyle = '#ff4400';
      ctx.fillRect(drawX, drawY, drawW, 1);

      ctx.globalAlpha = 1;
      return;
    }

    const sx     = Math.round(this.x - camX);
    const sy     = Math.round(this.y);
    const glitch = this.frozen > 0 ? false : this.tick % 10 < 2;
    const dx     = glitch ? (Math.random() > 0.5 ? 3 : -2) : 0;

    // Shadow
    ctx.fillStyle = 'rgba(200,0,0,0.2)';
    ctx.fillRect(sx + 2, sy + 2, this.w, this.h);

    // Body
    ctx.fillStyle = this.frozen > 0 ? '#8adfff' : glitch ? '#ff2222' : '#cc0000';
    ctx.fillRect(sx + dx, sy, this.w, this.h);

    // Glitch stripe
    if (glitch) {
      ctx.fillStyle = 'rgba(255, 140, 0, 0.7)';
      ctx.fillRect(sx - 4 + dx, sy + 6, this.w + 6, 4);
    }

    // Corrupted pixel noise
    ctx.fillStyle = this.frozen > 0 ? '#dff8ff' : '#ff6666';
    ctx.fillRect(sx + dx + 2,  sy + 2,  4, 4);
    ctx.fillRect(sx + dx + 14, sy + 14, 4, 4);
    ctx.fillStyle = this.frozen > 0 ? '#77ddff' : '#ffaaaa';
    ctx.fillRect(sx + dx + 10, sy + 4,  2, 2);
    ctx.fillRect(sx + dx + 4,  sy + 14, 2, 2);

    // Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.frozen > 0 ? 'ICE' : 'ERR', sx + dx + 11, sy + 14);
    ctx.textAlign = 'left';

    // Direction indicator
    ctx.fillStyle = this.frozen > 0 ? '#bff6ff' : '#ff4444';
    if (this.vx > 0) ctx.fillRect(sx + this.w + 1, sy + 8, 4, 6);
    else              ctx.fillRect(sx - 5,           sy + 8, 4, 6);
  }
}

// ─── Crypto Process ───────────────────────────────────────────────────────────
class CryptoProcess {
  constructor(x, y, patrolLeft, patrolRight, amplitude = 12) {
    this.x           = x;
    this.baseY       = y;
    this.y           = y;
    this.w           = 20;
    this.h           = 20;
    this.vx          = 0.75;
    this.patrolLeft  = patrolLeft;
    this.patrolRight = patrolRight;
    this.amplitude   = amplitude;
    this.tick        = Math.random() * Math.PI * 2;
    this.dead        = false;
    this.frozen      = 0;
  }

  update() {
    if (this.dead) return;
    this.tick += 0.08;
    if (this.frozen > 0) {
      this.frozen--;
      this.y = this.baseY + Math.sin(this.tick) * 2;
      return;
    }
    this.x += this.vx;
    if (this.x <= this.patrolLeft || this.x + this.w >= this.patrolRight) {
      this.vx *= -1;
      this.x  += this.vx * 2;
    }
    this.y = this.baseY + Math.sin(this.tick) * this.amplitude;
  }

  collideWith(player) {
    if (this.dead) return null;
    const overlapX = player.x + player.w - 2 > this.x && player.x + 2 < this.x + this.w;
    const overlapY = player.y + player.h     > this.y && player.y     < this.y + this.h;
    if (!overlapX || !overlapY) return null;
    if (player.vy > 0 && player.y + player.h < this.y + this.h * 0.62) return 'stomp';
    return this.frozen > 0 ? null : 'hit';
  }

  freeze() {
    if (this.dead) return;
    this.frozen = 240;
  }

  hitByProjectile(type) {
    if (this.dead) return null;
    if (type === 'freeze') {
      if (this.frozen > 0) return null;
      this.freeze();
      return 'freeze';
    }
    if (type === 'fire') {
      this.stomp();
      return 'burn';
    }
    return null;
  }

  stomp() {
    this.dead = true;
    this.popTick = 18;
  }

  draw(ctx, camX) {
    const sx = Math.round(this.x - camX);
    const sy = Math.round(this.y);

    if (this.dead) {
      if (this.popTick <= 0) return;
      this.popTick--;
      const progress = 1 - this.popTick / 18;
      ctx.globalAlpha = 1 - progress;
      ctx.strokeStyle = '#77ffff';
      ctx.lineWidth   = 2;
      ctx.strokeRect(sx - progress * 10, sy - progress * 10, this.w + progress * 20, this.h + progress * 20);
      ctx.globalAlpha = 1;
      return;
    }

    const frozenPulse = this.frozen > 0 ? 0.5 + 0.5 * Math.sin(Date.now() / 120) : 0;
    ctx.fillStyle = this.frozen > 0 ? '#99e6ff' : '#7a1aff';
    ctx.fillRect(sx + 2, sy + 2, this.w, this.h);
    ctx.fillStyle = this.frozen > 0 ? '#dff7ff' : '#bb66ff';
    ctx.fillRect(sx, sy, this.w, this.h);
    ctx.fillStyle = this.frozen > 0 ? '#77ddff' : '#330055';
    ctx.fillRect(sx + 4, sy + 4, this.w - 8, 6);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.frozen > 0 ? 'ICE' : 'ENC', sx + 10, sy + 13);
    ctx.textAlign = 'left';

    if (this.frozen > 0) {
      ctx.strokeStyle = `rgba(180,245,255,${0.35 + frozenPulse * 0.35})`;
      ctx.lineWidth   = 2;
      ctx.strokeRect(sx - 2, sy - 2, this.w + 4, this.h + 4);
    }
  }
}

// ─── Ransomware Warden (mini-boss) ───────────────────────────────────────────
class RansomwareWarden {
  constructor(x, y, arenaLeft, arenaRight) {
    this.x = x;
    this.y = y;
    this.w = 54;
    this.h = 42;
    this.arenaLeft = arenaLeft;
    this.arenaRight = arenaRight;
    this.vx = 1;
    this.speed = 1.55;
    this.tick = Math.random() * Math.PI * 2;
    this.dead = false;
    this.isBoss = true;
    this.bossName = 'RANSOMWARE WARDEN';
    this.maxHp = 8;
    this.hp = this.maxHp;
    this.invuln = 0;
    this.frozen = 0;
    this.attackCooldown = 72;
    this.waves = [];
    this.deathTick = 0;
  }

  spawnBurstPattern() {
    const originX = this.x + this.w / 2;
    const originY = this.y + this.h - 12;
    const speed = this.hp <= 3 ? 5.2 : 4.5;
    this.waves.push(
      { x: originX - 6, y: originY, w: 16, h: 10, vx: -speed, life: 68 },
      { x: originX - 6, y: originY, w: 16, h: 10, vx: speed, life: 68 },
      { x: originX - 6, y: originY - 14, w: 16, h: 10, vx: this.vx > 0 ? speed * 0.78 : -speed * 0.78, life: 58 },
    );
  }

  updateWaves() {
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const wave = this.waves[i];
      wave.x += wave.vx;
      wave.life--;
      if (wave.life <= 0) this.waves.splice(i, 1);
    }
  }

  update() {
    this.tick += 0.08;
    this.updateWaves();

    if (this.dead) {
      if (this.deathTick > 0) this.deathTick--;
      return;
    }

    if (this.invuln > 0) this.invuln--;
    if (this.frozen > 0) this.frozen--;

    const moveSpeed = this.frozen > 0 ? 0.45 : this.speed + (this.hp <= 4 ? 0.25 : 0);
    this.x += this.vx * moveSpeed;
    if (this.x <= this.arenaLeft) {
      this.x = this.arenaLeft;
      this.vx = 1;
    } else if (this.x + this.w >= this.arenaRight) {
      this.x = this.arenaRight - this.w;
      this.vx = -1;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    } else {
      this.spawnBurstPattern();
      this.attackCooldown = this.frozen > 0 ? 132 : Math.max(44, 98 - (this.maxHp - this.hp) * 6);
    }
  }

  collideWith(player) {
    if (this.dead) return null;

    for (const wave of this.waves) {
      if (rectsOverlap(player, wave)) return 'hit';
    }

    const overlapX = player.x + player.w - 3 > this.x && player.x + 3 < this.x + this.w;
    const overlapY = player.y + player.h > this.y && player.y < this.y + this.h;
    if (!overlapX || !overlapY) return null;

    const stompWindow = this.invuln === 0 && player.vy > 0 && player.y + player.h < this.y + this.h * 0.45;
    if (stompWindow) return 'stomp';
    return 'hit';
  }

  hitByProjectile(type) {
    if (this.dead) return null;
    if (type === 'freeze') {
      if (this.frozen > 0) return null;
      this.frozen = 140;
      this.attackCooldown = Math.max(this.attackCooldown, 38);
      return 'boss-freeze';
    }
    if (type === 'fire') {
      return this.takeDamage(1);
    }
    return null;
  }

  stomp() {
    return this.takeDamage(1);
  }

  takeDamage(amount) {
    if (this.dead || this.invuln > 0) return null;
    this.hp = Math.max(0, this.hp - amount);
    this.invuln = 40;
    this.vx *= -1;
    this.attackCooldown = Math.min(this.attackCooldown, 28);
    if (this.hp <= 0) {
      this.dead = true;
      this.deathTick = 54;
      this.waves = [];
      return 'boss-kill';
    }
    return 'boss-hit';
  }

  draw(ctx, camX) {
    for (const wave of this.waves) {
      const sx = Math.round(wave.x - camX);
      const sy = Math.round(wave.y + Math.sin((wave.life + this.tick * 12) * 0.2) * 2);
      const alpha = Math.max(0.18, wave.life / 68);
      ctx.fillStyle = `rgba(255, 40, 110, ${0.14 + alpha * 0.18})`;
      ctx.fillRect(sx - 4, sy - 4, wave.w + 8, wave.h + 8);
      ctx.fillStyle = `rgba(255, 90, 150, ${0.7 * alpha})`;
      ctx.fillRect(sx, sy, wave.w, wave.h);
      ctx.fillStyle = '#ffd0dd';
      ctx.font = 'bold 6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CRC', sx + Math.round(wave.w / 2), sy + 8);
      ctx.textAlign = 'left';
    }

    const sx = Math.round(this.x - camX);
    const sy = Math.round(this.y);

    if (this.dead) {
      if (this.deathTick <= 0) return;
      const progress = 1 - this.deathTick / 54;
      ctx.globalAlpha = 1 - progress * 0.88;
      ctx.strokeStyle = '#55ff99';
      ctx.lineWidth = 3;
      ctx.strokeRect(sx - progress * 18, sy - progress * 14, this.w + progress * 36, this.h + progress * 28);
      ctx.fillStyle = 'rgba(110,255,170,0.18)';
      ctx.fillRect(sx - progress * 12, sy - progress * 10, this.w + progress * 24, this.h + progress * 20);
      ctx.globalAlpha = 1;
      return;
    }

    const pulse = 0.45 + 0.25 * Math.sin(Date.now() / 120);
    const invulnPulse = this.invuln > 0 ? 0.45 + 0.4 * Math.sin(Date.now() / 70) : 0;
    const frozenPulse = this.frozen > 0 ? 0.4 + 0.3 * Math.sin(Date.now() / 90) : 0;

    ctx.fillStyle = 'rgba(0,0,0,0.24)';
    ctx.fillRect(sx + 4, sy + this.h + 2, this.w - 8, 6);

    ctx.fillStyle = this.frozen > 0 ? '#8be9ff' : '#8a1038';
    ctx.fillRect(sx + 3, sy + 4, this.w, this.h - 2);
    ctx.fillStyle = this.frozen > 0 ? '#dffcff' : '#c61f56';
    ctx.fillRect(sx, sy, this.w, this.h - 4);

    ctx.fillStyle = this.frozen > 0 ? '#6bcfe8' : '#2b0714';
    ctx.fillRect(sx + 6, sy + 6, this.w - 12, 10);
    ctx.fillRect(sx + 10, sy + 21, this.w - 20, 7);

    ctx.fillStyle = this.frozen > 0 ? '#f7ffff' : '#ffd9a5';
    ctx.fillRect(sx + 12, sy + 8, 7, 4);
    ctx.fillRect(sx + this.w - 19, sy + 8, 7, 4);

    ctx.fillStyle = this.frozen > 0 ? '#9df2ff' : '#ffb55a';
    ctx.fillRect(sx + 8, sy + 28, this.w - 16, 6);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RANSM', sx + Math.round(this.w / 2), sy + 18);
    ctx.fillText('LOCK', sx + Math.round(this.w / 2), sy + 32);
    ctx.textAlign = 'left';

    if (this.invuln > 0) {
      ctx.strokeStyle = `rgba(255, 210, 130, ${invulnPulse})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - 3, sy - 3, this.w + 6, this.h + 6);
    }

    if (this.frozen > 0) {
      ctx.strokeStyle = `rgba(200, 250, 255, ${frozenPulse})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(sx - 5, sy - 5, this.w + 10, this.h + 10);
    } else {
      ctx.strokeStyle = `rgba(255, 60, 140, ${0.28 + pulse * 0.32})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - 4, sy - 4, this.w + 8, this.h + 8);
    }
  }
}

// ─── Powerup ──────────────────────────────────────────────────────────────────
const POWERUP_DEFS = {
  shield:     { color: '#0088ff', inner: '#88ddff', label: 'HA',  desc: 'HIGH AVAIL'   },
  speed:      { color: '#ffcc00', inner: '#ffff88', label: 'TR',  desc: 'TURBO REPL'   },
  doublejump: { color: '#00ddff', inner: '#aaffff', label: 'SN²', desc: 'SNAP CHAIN'   },
  grow:       { color: '#55cc55', inner: '#c7ffb8', label: 'UP',  desc: 'SCALE UP'      },
  immutable:  { color: '#55cc77', inner: '#e6ffe9', label: 'IMM', desc: 'IMMUTABLE'     },
  rollback:   { color: '#00f5c0', inner: '#dffef7', label: 'RBK', desc: 'ROLLBACK'      },
  freeze:     { color: '#66e0ff', inner: '#e6fcff', label: 'STN', desc: 'SNAP STUN'     },
  fire:       { color: '#ff7722', inner: '#ffd29a', label: 'FIR', desc: 'PURGE BURST'   },
  life:       { color: '#ff4455', inner: '#ffaaaa', label: '+1',  desc: 'EXTRA REPLICA' },
};

class Powerup {
  constructor(x, y, type) {
    this.x    = x - 12;
    this.y    = y - 12;
    this.w    = 24;
    this.h    = 24;
    this.type = type;
    this.collected = false;
    this.bob  = Math.random() * Math.PI * 2;
    this.spin = Math.random() * Math.PI * 2;
  }

  update() {
    this.bob  += 0.045;
    this.spin += 0.035;
  }

  draw(ctx, camX) {
    if (this.collected) return;
    const def = POWERUP_DEFS[this.type];
    const sx  = Math.round(this.x - camX + 12);
    const sy  = Math.round(this.y + Math.sin(this.bob) * 4 + 12);
    const t   = Date.now() / 350;
    const pulse = 0.55 + 0.45 * Math.sin(t);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.spin);

    // Outer glow ring
    ctx.shadowColor = def.color;
    ctx.shadowBlur  = 8 + pulse * 10;

    // Diamond body
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.moveTo(0, -12); ctx.lineTo(12, 0);
    ctx.lineTo(0,  12); ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.fill();

    // Inner highlight diamond
    ctx.fillStyle = def.inner;
    ctx.beginPath();
    ctx.moveTo(0, -6); ctx.lineTo(6, 0);
    ctx.lineTo(0,  6); ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();

    // Label below (unrotated)
    ctx.fillStyle   = def.inner;
    ctx.font        = 'bold 7px monospace';
    ctx.textAlign   = 'center';
    ctx.shadowColor = def.color;
    ctx.shadowBlur  = 4;
    ctx.fillText(def.label, sx, sy + 20);
    ctx.shadowBlur  = 0;
    ctx.textAlign   = 'left';
  }

  overlaps(player) {
    if (this.collected) return false;
    return player.x + player.w > this.x + 4 &&
           player.x < this.x + this.w - 4   &&
           player.y + player.h > this.y + 4  &&
           player.y < this.y + this.h - 4;
  }
}

// ─── Entity manager ───────────────────────────────────────────────────────────
const entities = {
  orbs:     [],
  enemies:  [],
  powerups: [],
  orbsCollected: 0,
  totalOrbs: 0,

  init(level) {
    this.orbs     = [];
    this.enemies  = [];
    this.powerups = [];
    this.orbsCollected = 0;

    for (const o of (level.orbs || [])) {
      this.orbs.push(new SnapshotOrb(
        o.col * TILE_SIZE + 16,
        o.row * TILE_SIZE + 16,
        !!o.checkpoint
      ));
    }
    this.totalOrbs = this.orbs.length;

    for (const e of (level.enemies || [])) {
      if (e.type === 'rogue-packet') {
        this.enemies.push(new RoguePacket(
          e.col  * TILE_SIZE,
          e.row  * TILE_SIZE - 22,
          e.patrolLeft  * TILE_SIZE,
          e.patrolRight * TILE_SIZE
        ));
      } else if (e.type === 'crypto-process') {
        this.enemies.push(new CryptoProcess(
          e.col  * TILE_SIZE,
          e.row  * TILE_SIZE - 18,
          e.patrolLeft  * TILE_SIZE,
          e.patrolRight * TILE_SIZE,
          e.amplitude || 12
        ));
      } else if (e.type === 'ransomware-warden') {
        this.enemies.push(new RansomwareWarden(
          e.col * TILE_SIZE,
          e.row * TILE_SIZE - 42,
          (e.arenaLeft ?? Math.max(0, e.col - 4)) * TILE_SIZE,
          (e.arenaRight ?? e.col + 6) * TILE_SIZE
        ));
      }
    }

    for (const p of (level.powerups || [])) {
      this.powerups.push(new Powerup(
        p.col * TILE_SIZE + TILE_SIZE / 2,
        p.row * TILE_SIZE + TILE_SIZE / 2,
        p.type
      ));
    }
  },

  update(player, onHit, onStomp, onPowerup) {
    for (const orb of this.orbs) {
      orb.update();
      if (orb.overlaps(player)) {
        orb.collected = true;
        this.orbsCollected++;
      }
    }
    for (const enemy of this.enemies) {
      enemy.update();
      const result = enemy.collideWith(player);
      if (result === 'stomp') {
        player.y = enemy.y - player.h;
        const stompResult = enemy.stomp?.();
        onStomp(enemy.x + enemy.w / 2, enemy.y, stompResult, enemy);
      } else if (result === 'hit') {
        const hitResult = onHit(enemy);
        if (hitResult === 'abort') return 'abort';
      }
    }
    for (const pw of this.powerups) {
      pw.update();
      if (pw.overlaps(player)) {
        pw.collected = true;
        onPowerup(pw.type, pw.x + pw.w / 2, pw.y + pw.h / 2);
      }
    }
    return 'ok';
  },

  draw(ctx, camX) {
    for (const orb  of this.orbs)     orb.draw(ctx, camX);
    for (const enemy of this.enemies) enemy.draw(ctx, camX);
    for (const pw   of this.powerups) pw.draw(ctx, camX);
  }
};
