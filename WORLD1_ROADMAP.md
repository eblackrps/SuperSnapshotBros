# Super Snapshot Bros — World 1 Roadmap

## Goal

Build `World 1` into a polished, website-ready Disaster Recovery platformer arc that:

1. teaches the core fantasy of restoring service under pressure,
2. feels fun even without the DR context,
3. gives [github.com/eblackrps](https://github.com/eblackrps) a memorable interactive centerpiece.

This roadmap assumes the current project already has:

- strong core movement,
- one playable level,
- checkpoints,
- enemies,
- powerups,
- RTO pressure,
- title / pause / fail / win flow.

The next step is not "more random content." The next step is a tightly scoped `World 1` production plan.

---

## World 1 Fantasy

`World 1: Hypervisor Crash`

The primary idea of World 1 is:

- the datacenter has suffered a cascading failure,
- the player is moving through increasingly unstable infrastructure,
- each level introduces one new DR concept,
- the final stage feels like a recovery event rather than a generic boss fight.

World 1 should function like onboarding for the whole game:

- movement mastery,
- checkpoint literacy,
- timer awareness,
- basic risk/reward routing,
- first DR-specific mechanics.

---

## World 1 Structure

Recommended structure:

1. `1-1 Hypervisor Crash`
2. `1-2 Replication Lag`
3. `1-3 Immutable Backup`
4. `1-4 Failover Spine`
5. `1-F Rogue Control Plane`

This gives World 1 a clean Mario-like arc:

- level 1 teaches,
- level 2 tests,
- level 3 introduces a signature mechanic,
- level 4 raises pressure,
- fortress/boss closes the world.

---

## Level Plan

## 1-1 Hypervisor Crash

Purpose:

- onboarding,
- teach checkpoints,
- teach Snapshot Orbs,
- establish the datacenter look and tone.

Keep / improve:

- basic platform staircase,
- first enemy stomps,
- first checkpoint feedback,
- Golden Backup finish.

Polish goals:

- tighten route readability,
- improve collectible placement so it teaches the intended jump path,
- tune enemy positions so first deaths feel fair,
- make the RTO timer visible but not oppressive,
- treat this as the "proof of fun" level.

Success criteria:

- first-time players understand what they are doing,
- they understand that snapshots matter,
- they understand the game is DR-themed within 30 seconds.

## 1-2 Replication Lag

New mechanic:

- moving timing windows,
- delayed platform states,
- or simple moving platforms framed as replication delay.

Theme:

- the environment is live but unreliable,
- systems are still trying to catch up.

Gameplay role:

- teach timing-based traversal,
- force players to respect pacing rather than only hold right,
- introduce route planning under mild pressure.

DR framing:

- delayed sync windows,
- lagging state replication,
- unstable service paths.

Recommended hazards:

- moving server-lift platforms,
- intermittent bridge tiles,
- enemy positions that punish impatient movement.

## 1-3 Immutable Backup

New mechanic:

- `Immutable Backup` powerup.

Suggested effect:

- protects the player from one corruption event,
- or preserves last checkpoint progress from one bad failure,
- or lets the player pass through a corruption field safely once.

Theme:

- the player reaches a hardened backup zone,
- the lesson is that not all recovery points are equally trustworthy.

Gameplay role:

- introduce a truly DR-native mechanic,
- create locked paths that require intentional powerup use,
- make the DR metaphor mechanical instead of decorative.

Recommended hazards:

- corruption fields,
- ransomware-red tiles,
- enemies guarding safer routes.

## 1-4 Failover Spine

New mechanic:

- `Failover` route choice.

Suggested implementation:

- one route is faster but riskier,
- one route is slower but safer,
- temporary alternate path appears after activating a failover node.

Theme:

- the player is traversing a core backbone or uplink path,
- recovery now feels strategic, not just athletic.

Gameplay role:

- introduce decision-making under RTO pressure,
- create replayability,
- set up the final fortress.

DR framing:

- active-passive failover,
- degraded mode,
- choosing between service restoration speed and stability.

## 1-F Rogue Control Plane

Finale type:

- short fortress or mini-boss stage, not a long slog.

Theme:

- the orchestration layer is compromised,
- the player must complete the failover and restore control.

Recommended boss concept:

- `Rogue Control Plane`
- or `BSOD Sentinel`
- or `Corrupted Orchestrator`

Mechanics:

- projectile pattern or sweeping hazard,
- checkpoints before the final challenge,
- weak point cycles that reward pattern learning instead of raw chaos.

Win fantasy:

- the player did not just survive,
- they restored the world.

---

## Systems Needed To Support World 1

These are the systems that unlock the rest of the content efficiently.

## Tier 1: Must-Build Before More Levels

1. `Hazard framework`
2. `Moving platform support`
3. `World progression flow`
4. `Results / recovery grading polish`
5. `A second DR-native powerup`

### Hazard framework

Needed for:

- corruption zones,
- EMP fields,
- timed outage tiles,
- boss attacks.

Minimum feature set:

- rectangular hazard areas,
- damage / life loss on overlap,
- optional animated draw style,
- optional on/off timing state.

### Moving platform support

Needed for:

- replication lag level ideas,
- more expressive traversal,
- future cloud/outage worlds.

Minimum feature set:

- horizontal and vertical movement,
- player rides platform cleanly,
- safe collision and dismount behavior,
- easy level-data authoring.

### World progression flow

Needed for:

- finishing World 1 as a sequence instead of one isolated map.

Minimum feature set:

- level order,
- between-level transition card,
- next level load,
- final world-complete state.

### Results / recovery grading polish

Needed for:

- stronger website impact,
- replay loop,
- DR framing.

Minimum feature set:

- completion grade,
- RTO result,
- snapshot result,
- clear call-to-action.

### Second DR-native powerup

Needed for:

- making the concept feel unique,
- giving level 1-3 a signature mechanic.

Best candidate:

- `Immutable Backup`

Second-best candidate:

- `Failover`

---

## Tier 2: High-Impact Enhancements For World 1

1. `Mini-map or topology progress strip`
2. `Intro cards for each level`
3. `Boss encounter logic`
4. `RPO scoring`
5. `Route secrets and speedrun lines`

### Mini-map or topology strip

Instead of a plain "Level 1-2" label, show progression like:

- node diagram,
- rack-to-rack path,
- DR topology visualization.

This makes the world feel like infrastructure, not generic stages.

### Intro cards

A short pre-level panel can teach the new DR concept in one sentence:

- `Replication Lag — links are up, but state is delayed`
- `Immutable Backup — this restore point cannot be corrupted`
- `Failover Spine — choose speed or safety`

### Boss encounter logic

A simple boss system will help the fortress land:

- boss health or phase count,
- attack windows,
- arena bounds,
- victory trigger.

### RPO scoring

World 1 does not need full runtime RPO punishment yet.

A good first step:

- calculate RPO quality from snapshot collection and death history,
- show it in the results screen.

### Route secrets and speed lines

To make the game feel amazing instead of merely competent:

- add optional high-skill routes,
- hidden snapshot caches,
- faster lines for advanced players.

These give replay value without bloating the system count.

---

## Production Sequence

This is the recommended order of work.

## Phase A — Polish The Existing Vertical Slice

Deliverable:

- `1-1` feels tight, readable, and replayable.

Tasks:

- final pass on jump spacing,
- final pass on orb placement,
- final pass on enemy fairness,
- stronger checkpoint telegraphing,
- stronger HUD clarity,
- results screen polish.

Do not move on until:

- the current level feels good enough to show someone new.

## Phase B — Build Reusable Systems

Deliverable:

- reusable systems that unlock multiple levels.

Tasks:

- hazard entity support,
- moving platforms,
- level sequencing,
- richer level metadata,
- second DR-native powerup.

This phase is what prevents future content from becoming copy-paste tech debt.

## Phase C — Build The Rest Of World 1

Deliverable:

- `1-2`, `1-3`, `1-4`, and `1-F`.

Tasks:

- create each level around one clear idea,
- tune one level at a time,
- do not build all four maps before playtesting,
- reuse mechanics deliberately instead of inventing new ones per stage.

Recommended cadence:

1. graybox level,
2. playtest,
3. tune,
4. add visuals and collectibles,
5. lock.

## Phase D — Website Integration

Deliverable:

- the game feels native to `github.com/eblackrps`.

Tasks:

- title screen CTA,
- end screen CTA,
- short explanatory copy,
- article or service page links tied to results,
- embed or landing page layout.

## Phase E — Amazing Pass

Deliverable:

- the game becomes memorable, not just functional.

Tasks:

- stronger transitions,
- better pixel polish,
- better level intros,
- world map presentation,
- boss spectacle,
- hidden routes,
- refined sound identity.

---

## "Amazing" Features Worth Doing After World 1

These are the upgrades that could make the project stand out.

1. `World map as network topology`
2. `Bosses that embody infrastructure failure`
3. `RPO as a real gameplay layer`
4. `Branching routes with failover logic`
5. `Sharable run summaries`
6. `Embedded article tie-ins`

### World map as network topology

Instead of a plain Mario map, build:

- linked nodes,
- regions,
- backup paths,
- failover destinations.

This is one of the best brand differentiators available.

### Bosses as failure events

Examples:

- ransomware locker boss,
- cooling failure boss,
- control plane outage boss,
- cloud region balancer boss.

If bosses are themed well, people will remember the concept instantly.

### RPO as real gameplay

Later, the player could lose some volatile recovery state on death if they have not secured enough checkpoints. That would make DR strategy feel genuinely unique.

### Branching routes

This is how the game stops being a neat prototype and starts feeling designed.

- safe route,
- risky route,
- reward route,
- failover route.

### Sharable run summaries

For the website, this could be a big win:

- `Recovery grade A`
- `RTO met with 01:48 remaining`
- `10/12 snapshots recovered`

That can become image cards or simple copyable results later.

### Embedded article tie-ins

After finishing a level or world:

- `Learn the real architecture lesson`
- `Read the DR breakdown`
- `Book a review`

This is how the game becomes a content engine, not just an extra.

---

## Scope Guardrails

To keep the project from collapsing under ambition:

1. Finish World 1 before expanding into Worlds 2-6.
2. Reuse systems aggressively.
3. Introduce only one new core mechanic per level.
4. Prefer polish over raw quantity.
5. Treat `amazing` as clarity plus identity, not just more features.

---

## Recommended Immediate Backlog

If we want the next actionable queue, it should be:

1. polish `1-1` difficulty and readability,
2. implement hazard zones,
3. implement moving platforms,
4. add `Immutable Backup`,
5. create `1-2 Replication Lag`,
6. create `1-3 Immutable Backup`,
7. add level-to-level progression flow,
8. create `1-4 Failover Spine`,
9. create `1-F Rogue Control Plane`,
10. add website-native world completion flow.

---

## Success Definition For World 1

World 1 is done when:

- a new player can complete it and understand the theme,
- the platforming feels fun on its own,
- each level has a distinct DR identity,
- the final fortress feels like a payoff,
- the game naturally points people back to [github.com/eblackrps](https://github.com/eblackrps),
- you would be proud to feature it publicly.
