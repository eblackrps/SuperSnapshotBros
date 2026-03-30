# Super Snapshot Bros 🎮

> *"Thank you! But your data is in another datacenter!"*

A 2D physics platformer built with **Vanilla JS + HTML5 Canvas** — zero dependencies, zero build tools, open the HTML file and play.

Every mechanic is a **disaster recovery metaphor**. You are a sysadmin hero navigating failed infrastructure to reach the Golden Backup before RTO expires.

---

## Play Now

Open `index.html` in any modern browser. No server required.

---

## Controls

| Key | Action |
|-----|--------|
| `A` / `←` | Move left |
| `D` / `→` | Move right |
| `Shift` | Run / build longer jump momentum |
| `W` / `↑` / `Space` | Jump |
| `Esc` | Pause / Resume |
| `R` (paused) | Restart level |
| `M` | Mute / Unmute |

Touch controls are displayed automatically on mobile devices.

---

## DR Mechanics — What Everything Means

| Game Element | DR Concept |
|---|---|
| **Snapshot Orbs** | VM / storage snapshots — collecting one sets your respawn checkpoint |
| **Golden Backup** | The recovery target — reach it to complete the level |
| **RTO Timer** | Recovery Time Objective — lose all lives and RTO is breached |
| **Lives (▣▣▣)** | Replication count — your redundancy budget |
| **Rogue Packets** | Corrupt network traffic causing outage events |
| **HA Powerup** | High Availability — temporary invincibility |
| **TR Powerup** | Turbo Replication — movement speed boost |
| **SN² Powerup** | Snapshot Chain — mid-air double jump |
| **+1 Powerup** | Extra Replica — bonus life |
| **World 1-1** | *Hypervisor Crash* — the inciting incident |

---

## Powerups

| Pickup | Label | Effect | Duration |
|--------|-------|--------|----------|
| Blue diamond | `HA` | Invincibility + shield aura | 6 seconds |
| Yellow diamond | `TR` | 1.7× speed + motion trail | 6 seconds |
| Cyan diamond | `SN²` | Double jump | 8 seconds |
| Green diamond | `UP` | Grow larger, survive one hit, break bricks | Until hit / death |
| Ice diamond | `STN` | Snapshot stun aura freezes enemies on contact | 7 seconds |
| Red diamond | `+1` | Extra life (instant) | — |

---

## Game Feel Features

- **Coyote time** — 6-frame jump grace window after walking off a platform
- **Jump buffering** — 8-frame early jump input registration
- **Variable jump height** — tap for a short hop, hold for full height
- **Run-up jumps** — hold `Shift` to build speed and clear longer gaps
- **Big form** — `UP` powerup makes you larger and lets you smash breakable bricks
- **Snapshot stun** — `STN` powerup freezes enemies instead of taking contact damage
- **Enemy stomp** — land on Rogue Packets to squash them; chain stomps for a bounce
- **Squash & stretch** — enemies flatten with physics-accurate deformation on stomp
- **Parallax background** — two-layer server rack scenery with animated LEDs
- **Procedural soundtrack** — chiptune music engine using Web Audio API (no audio files)
- **Procedural SFX** — jump, land, collect, stomp, death, and fanfare sounds

---

## File Structure

```
index.html      — canvas host, script loader
world.js        — tile grid, level data, AABB collision helpers, camera
entities.js     — Snapshot Orbs, Rogue Packet enemies, Powerups, entity manager
audio.js        — one-shot SFX via Web Audio API
music.js        — chiptune sequencer and patterns
game.js         — game loop, player physics, input, HUD, all screen states
```

---

## World Map — Level 1-1: Hypervisor Crash

```
                                                         [GOAL]
                                                    ████████████
                                          ██████
                                ██████
                      ██████
            ██████

████████   ████████████████████████████████████████████████████
   ^gap^
```

Six ascending platforms form the recovery path. The gap in the ground forces you onto the first platform early.

---

## Tech Stack

- **Vanilla JS** — no framework, no bundler
- **HTML5 Canvas 2D** — all rendering via `ctx` draw calls
- **Web Audio API** — all sound synthesised procedurally at runtime
- **localStorage** — best score persisted per level

---

## Roadmap

See [`BUILD_PLAN.md`](BUILD_PLAN.md) for the full phase breakdown.

Planned additions:
- World 1-2 through 1-6 (Ransomware, Storage Failure, Datacenter Flood, Cloud Outage, Recovery Point)
- World select map (network topology style)
- Crypto Process enemy (sine-wave float pattern)
- EMP Pulse Zone hazard (disables jump temporarily)
- Rising Log Data mechanic (rising floor)
- Web-font pixel art title logo

---

## License

MIT — do whatever you want with it.

---

*Built as part of the nerd industry DR blog series.*
