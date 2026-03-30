# Super Snapshot Bros — Next 3 Sessions

## New Direction

World 1 should feel closer to classic Mario pacing:

- longer levels,
- more travel,
- more landmarks,
- more escalation,
- more sense of journey.

The current prototype level works as a proof of concept, but the rest of World 1 should not feel like a series of short obstacle courses. Each level should feel like a full stage with multiple ideas, a midpoint, a late-level twist, and a final push.

---

## Level Length Guidance

These are practical targets, not rigid rules.

### Recommended World 1 level sizes

| Level | Target Length | Notes |
|---|---|---|
| `1-1 Hypervisor Crash` | `170-210 cols` | onboarding level, long but readable |
| `1-2 Replication Lag` | `180-220 cols` | moving timing play, more route variation |
| `1-3 Immutable Backup` | `190-230 cols` | longer because mechanic teaching needs room |
| `1-4 Failover Spine` | `200-240 cols` | more branching and pressure |
| `1-F Rogue Control Plane` | `130-170 cols` | denser fortress pacing, not overworld-long |

### Recommended beat count per level

Each full level should have `6-8 beats`:

1. intro / warm-up
2. first mechanic reminder
3. first pressure segment
4. midpoint / checkpoint
5. mechanic escalation
6. route variation or risk/reward section
7. final push
8. goal approach or climax

That is the big shift from the current prototype. We are building journeys now, not demos.

---

## Session 1 — Rebuild `1-1` As A Real Mario-Length Stage

### Goal

Turn `1-1 Hypervisor Crash` into the first real showcase level.

### Deliverable

A longer `1-1` with:

- clear beginning, middle, and end,
- at least one midpoint checkpoint,
- 2-3 visual landmarks,
- better enemy pacing,
- optional reward routes,
- a stronger final approach to the Golden Backup.

### Tasks

1. Expand the current level layout from prototype size into a full stage.
2. Break the level into 6-7 clear beats.
3. Add a visible midpoint checkpoint around 45-60% of the stage.
4. Place Snapshot Orbs to guide the intended movement line.
5. Add one optional higher-risk route with better rewards.
6. Re-space enemies so the first half teaches and the second half tests.
7. Add one "quiet" traversal section between pressure moments so the pacing can breathe.
8. Make the goal area feel like a destination, not just another platform.

### Suggested `1-1` beat map

1. `Boot Corridor`
   Basic movement, first orb line, first safe jump.

2. `Rack Gap`
   Early pit and first meaningful route commitment.

3. `Packet Lane`
   First enemy cluster, easy stomps, safe recovery.

4. `Snapshot Midpoint`
   Strong checkpoint moment with a short safe plateau.

5. `Broken Hypervisor Shelf`
   Higher platforming, more verticality, stronger use of `SN²`.

6. `Degraded Service Spine`
   Longer run with mixed enemies and small gaps.

7. `Golden Backup Vault`
   Clear goal read, short dramatic final approach.

### Important rule

Do not just stretch the current staircase.

A long Mario-like level needs:

- shape changes,
- pacing changes,
- reward beats,
- recovery beats,
- escalation.

---

## Session 2 — Build The Reusable Systems World 1 Needs

### Goal

Build the systems that unlock the rest of World 1 without copy-paste hacks.

### Deliverable

Reusable support for:

- hazard zones,
- moving platforms,
- richer level metadata,
- a second DR-native mechanic.

### Tasks

1. Add `hazard zones` to level data.
2. Support static and timed hazard areas.
3. Add `moving platforms` with clean player carry behavior.
4. Extend level data format so new levels are easier to author.
5. Add scaffolding for `Immutable Backup`.
6. Add level intro metadata such as:
   - display name
   - short DR subtitle
   - target concept

### Why this session matters

Without this session, future levels will become hardcoded one-offs.

With this session, the rest of World 1 becomes level design work instead of engine surgery.

### Target mechanics to unlock

- `1-2 Replication Lag` needs moving timing elements.
- `1-3 Immutable Backup` needs hazard gating.
- `1-4 Failover Spine` needs route logic and more expressive geometry.
- `1-F` needs boss arena hazards.

---

## Session 3 — Build The Next Two Levels In Graybox Form

### Goal

Create the rest of World 1 momentum by building `1-2` and `1-3` in playable graybox form.

### Deliverable

Two long graybox levels with distinct identities:

- `1-2 Replication Lag`
- `1-3 Immutable Backup`

### Tasks

1. Build `1-2` around moving timing windows and delayed traversal.
2. Build `1-3` around `Immutable Backup` and corruption hazards.
3. Keep both levels long enough to feel like stages, not challenge rooms.
4. Put checkpoints at meaningful pacing transitions, not at arbitrary distances.
5. Add temporary placeholder intro cards for each level.
6. Add placeholder end-of-level transitions into the next stage.

### Suggested `1-2` beat structure

1. safe intro with obvious timing read
2. first moving platform
3. enemy plus movement timing
4. midpoint checkpoint
5. longer lag-bridge section
6. optional reward route
7. final traversal chain
8. goal

### Suggested `1-3` beat structure

1. safe intro
2. first corruption field
3. teach `Immutable Backup`
4. midpoint checkpoint
5. protect-and-commit route
6. higher-risk corruption gauntlet
7. final recovery corridor
8. goal

---

## What Comes Immediately After These 3 Sessions

If those sessions go well, the next queue should be:

1. build `1-4 Failover Spine`,
2. add level-to-level world progression flow,
3. build `1-F Rogue Control Plane`,
4. add a small topology-style world map,
5. polish website CTA and world-complete flow.

---

## Design Rules For Longer Mario-Like Levels

These rules should guide every World 1 map.

1. A level should feel like travel through a place, not a stack of tests.
2. Reuse mechanics across a level in different contexts instead of introducing constant novelty.
3. Give the player short low-stress stretches between high-stress stretches.
4. Hide at least one optional reward route in each long level.
5. Use visual landmarks so long levels remain memorable.
6. Place checkpoints at emotional milestones, not just even spacing.
7. The last 15-20% of a level should feel like a payoff, not more of the same.

---

## Success Check

After these 3 sessions, we should have:

- one polished long level,
- two playable graybox long levels,
- the systems needed to finish World 1,
- a much clearer Mario-like structure,
- a stronger foundation for making the game amazing instead of merely larger.
