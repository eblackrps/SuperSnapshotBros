// entities.js — Snapshot Orbs and Enemies

// ─── Snapshot Orb ─────────────────────────────────────────────────────────────
class SnapshotOrb {
  constructor(x, y) {
    this.x = x - 8;  // center on given pixel coord
    this.y = y - 8;
    this.w = 16;
    this.h = 16;
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
    ctx.fillStyle = `rgba(0, 210, 255, ${glow})`;
    ctx.beginPath();
    ctx.arc(sx + 8, sy + 8 + bob, 10, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = '#00ddff';
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
    ctx.fillText('SN', sx + 8, sy + 10 + bob);
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
  }

  update() {
    if (this.dead) return;
    this.tick++;
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
    return 'hit';
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

    // Direction indicator
    ctx.fillStyle = '#ff4444';
    if (this.vx > 0) ctx.fillRect(sx + this.w + 1, sy + 8, 4, 6);
    else              ctx.fillRect(sx - 5,           sy + 8, 4, 6);
  }
}

// ─── Powerup ──────────────────────────────────────────────────────────────────
const POWERUP_DEFS = {
  shield:     { color: '#0088ff', inner: '#88ddff', label: 'HA',  desc: 'HIGH AVAIL'   },
  speed:      { color: '#ffcc00', inner: '#ffff88', label: 'TR',  desc: 'TURBO REPL'   },
  doublejump: { color: '#00ddff', inner: '#aaffff', label: 'SN²', desc: 'SNAP CHAIN'   },
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
      this.orbs.push(new SnapshotOrb(o.col * TILE_SIZE + 16, o.row * TILE_SIZE + 16));
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
        enemy.stomp();
        onStomp();
      } else if (result === 'hit') {
        onHit();
      }
    }
    for (const pw of this.powerups) {
      pw.update();
      if (pw.overlaps(player)) {
        pw.collected = true;
        onPowerup(pw.type);
      }
    }
  },

  draw(ctx, camX) {
    for (const orb  of this.orbs)     orb.draw(ctx, camX);
    for (const enemy of this.enemies) enemy.draw(ctx, camX);
    for (const pw   of this.powerups) pw.draw(ctx, camX);
  }
};
