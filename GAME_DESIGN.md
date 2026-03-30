# Super Snapshot Bros — Game Design

## Elevator Pitch

`Super Snapshot Bros` is a browser-based 2D platformer inspired by classic side-scrollers, but every mechanic is framed through Disaster Recovery. The player is a sysadmin hero racing through broken infrastructure, collecting recovery assets, restoring service, and reaching the final backup target before business continuity objectives are breached.

For [anystackarchitect.com](https://anystackarchitect.com), the game is both a brand piece and an interactive teaching tool: a playful way to make DR ideas memorable.

---

## Product Goals

1. Make Disaster Recovery feel approachable, visual, and memorable.
2. Deliver a genuinely fun short-form platformer, not just a reskinned gimmick.
3. Support the website brand by reinforcing expertise in architecture, resilience, and recovery planning.
4. Create a game small enough to ship as a polished embedded website experience.

---

## Core Player Fantasy

The player is not just "running and jumping." The player is restoring order under pressure.

The intended fantasy is:

- The environment is unstable.
- Time matters.
- Recovery choices matter.
- Redundancy matters.
- The player can still succeed through planning, speed, and smart use of DR tools.

The emotional tone should be:

- Urgent, but readable
- Clever, not grim
- Technical, but playful
- Confident and a little nerdy

---

## Core Loop

1. Enter a failed environment.
2. Move through hazards, enemies, and routing challenges.
3. Collect `snapshots`, `replication boosts`, and DR powerups.
4. Activate checkpoints that represent restore points or replicated states.
5. Reach the `Golden Backup` or recovery endpoint before `RTO` expires.
6. Finish with a score summary tied to recovery quality.

That loop should feel very close to Mario structurally, but with DR logic baked into the meaning of each action.

---

## DR-to-Gameplay Mapping

| Platformer Element | DR Meaning | Design Role |
|---|---|---|
| Player | Recovery engineer / sysadmin hero | Main actor restoring service |
| Goal flag / castle | Golden Backup / restored service endpoint | Level completion target |
| Coins | Snapshot Orbs / recovery artifacts | Collection and scoring |
| Mushrooms / stars | DR capabilities | Temporary player advantages |
| Timer | RTO | Hard pressure and failure condition |
| Checkpoints | Restore points / replication checkpoints | Progress preservation |
| Lives | Redundancy budget / replicas | Recovery attempts |
| Enemy collisions | Corruption / outage events | Punishment and pressure |
| Pits / hazards | Irrecoverable failure states | Navigation challenge |
| World themes | Failure scenarios | Educational framing |

---

## Primary Systems

## 1. RTO

`RTO` is the level timer and one of the main thematic pillars.

Design intent:

- It creates urgency.
- It keeps levels short and replayable.
- It reinforces the business impact of failure.

Rules:

- Every level starts with a visible RTO countdown.
- If RTO reaches zero, the level ends in failure.
- Faster completion improves score and supports replay value.

Player message:

"You are not just trying to survive. You are trying to restore service within the promised recovery window."

## 2. RPO

`RPO` should become the second major DR system after RTO.

Design intent:

- It gives snapshot collection a meaningful gameplay purpose.
- It creates a second recovery-quality metric beyond just surviving.

Recommended implementation:

- Collected Snapshot Orbs represent recoverable state.
- Dying after a checkpoint may cost some uncommitted progress if the checkpoint was weak or old.
- End-of-level results can grade the run using both completion and retained recovery state.

Simple version for early builds:

- Use Snapshot Orbs as both score and checkpoint unlocks.
- Add RPO as a score metric on the results screen before making it a punishing runtime mechanic.

## 3. Checkpoints

Checkpoints should be more than convenience.

They represent:

- Replicated restore points
- Saved recovery state
- Trustworthy recovery milestones

Design rules:

- A checkpoint should feel important when reached.
- Checkpoints should be visible, readable, and themed.
- Checkpoint placement teaches safe recovery progression.

## 4. Powerups

Powerups should map directly to DR concepts, not generic stat boosts with DR labels.

Current and suggested mapping:

| Powerup | DR Theme | Gameplay Effect |
|---|---|---|
| `HA` | High Availability | Temporary protection from failure |
| `TR` | Turbo Replication | Speed boost and faster traversal |
| `SN²` | Snapshot Chain | Double jump / extra mobility |
| `+1` | Extra Replica | Additional life / redundancy |
| `Immutable Backup` | Backup immutability | One-hit corruption immunity or checkpoint protection |
| `Failover` | Active site failover | Temporary alternate route or instant rescue effect |

## 5. Score

The score should reinforce DR success, not arcade abstraction alone.

Recommended score inputs:

- Level completed or failed
- Time remaining in RTO
- Snapshots collected
- Death count
- Checkpoints activated
- Optional RPO grade

Potential summary labels:

- `Recovery Successful`
- `RTO Met`
- `RPO Preserved`
- `Partial Recovery`
- `Recovery Failed`

---

## Level Design Principles

The game should remain readable and fun first. DR meaning should clarify mechanics, not make them confusing.

Principles:

1. One new idea per level segment.
2. Show the player a DR mechanic safely before testing it under pressure.
3. Keep the route readable even when themed as infrastructure.
4. Make collectibles support navigation and teaching.
5. Avoid punishing the player with overly abstract systems too early.

Recommended early pacing:

- Segment 1: safe onboarding and movement basics
- Segment 2: first enemy or outage hazard
- Segment 3: checkpoint and risk escalation
- Segment 4: higher-pressure traversal with timer awareness
- Segment 5: final recovery push to the Golden Backup

---

## World Themes

These worlds are strong because each one can teach a DR concept through platforming conditions.

| World | Theme | Mechanical Hook |
|---|---|---|
| 1 | Hypervisor Crash | Foundational platforming and checkpoints |
| 2 | Ransomware Outbreak | Corruption hazards and protected routes |
| 3 | Storage Failure | Fragmenting platforms and data-path routing |
| 4 | Datacenter Flood | Rising hazards and urgency |
| 5 | Cloud Region Outage | Failover paths and split-route traversal |
| 6 | Recovery Point | Final exam of all mechanics |

For the website, it is better to ship one excellent world first than six shallow ones.

---

## Website Role

The game should support the website in three ways:

1. Brand differentiation
2. Teaching through play
3. Conversion into deeper content

That means the game should connect back to the site intentionally.

Suggested website integrations:

- A short intro card: "Can you recover the datacenter before RTO expires?"
- A results screen with links to DR articles or service pages
- A follow-up CTA such as:
  - `Learn how real-world RTO/RPO planning works`
  - `Explore Disaster Recovery architecture`
  - `Book an architecture review`

This lets the game act like an interactive top-of-funnel experience instead of a disconnected novelty.

---

## Tone and Aesthetic

Visual direction:

- Datacenter greens, amber alerts, cyan recovery signals, gold goal states
- Pixel-art platformer readability with infrastructure styling
- Strong silhouettes and simple geometry over noisy detail

Writing tone:

- Technical without being dry
- Confident and playful
- Nerdy in a way that helps the brand

Examples:

- `Recovery Time Exceeded`
- `Failover Window Closed`
- `Checkpoint Replicated`
- `Immutable Backup Acquired`
- `Service Restored`

---

## Vertical Slice Recommendation

The best next milestone is a polished `World 1-1` that proves the whole concept.

That slice should include:

- Tight platforming
- Real RTO pressure
- Snapshot checkpoints
- At least 2 meaningful DR powerups
- One enemy type
- One hazard type
- Start, pause, fail, and win screens
- End-of-level recovery summary
- A website CTA after completion

If that slice works, the rest of the game becomes expansion instead of reinvention.

---

## Next Implementation Priorities

1. Polish `World 1-1` into a true vertical slice rather than extending more content.
2. Add a results screen that reports `RTO`, snapshots collected, deaths, and recovery grade.
3. Introduce one more DR-specific mechanic beyond movement, such as `Immutable Backup` or `Failover`.
4. Refine the HUD so `RTO`, redundancy, and checkpoint state are always easy to read.
5. Add website integration to the title or results screen.

---

## Non-Goals For Now

To keep the project shippable, avoid these too early:

- Large multi-world scope
- Heavy narrative cutscenes
- Complex inventory systems
- Procedural generation
- Multiplayer
- Full educational simulation accuracy

The game should feel inspired by DR, not trapped by enterprise complexity.

---

## Success Criteria

The concept is succeeding if:

- Players immediately understand the DR flavor.
- The platforming still feels fun even if they ignore the metaphor.
- The metaphor becomes memorable because it is mechanical, not just visual.
- The game feels like a natural extension of [anystackarchitect.com](https://anystackarchitect.com).

---

## One-Sentence Vision

`Super Snapshot Bros` is a playful, Mario-like disaster recovery platformer where restoring service before RTO expires is the core fantasy, and every jump, checkpoint, and powerup reinforces the resilience story behind the Any Stack Architect brand.
