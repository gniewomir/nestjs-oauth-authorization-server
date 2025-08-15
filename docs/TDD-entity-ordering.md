# Technical Design Document—Tasks Order

## Problems to solve

* [As discovered](DDD-tasks.md) I need to find a solution allowing to keep `Tasks` globally ordered [as decided](DDD-tasks-order.md).

## Goals and constraints

- Keep a globally consistent total order of entities.
- Reordering should be transparent to external consumers: simple `ORDER BY` without bespoke joins.
- Low complexity for reads and writes.
- Ideally, moving one entity only updates that entity.
- Support concurrent edits with deterministic ordering and minimal conflicts.

## Candidate approaches

### Fractional indexing (dense order keys, LexoRank-style) — Recommended

- Add a sortable `order_key` per entity using a variable-length, base-N string (e.g., base-62).
- To move an entity between neighbors A and B, assign a new key strictly between `A.order_key` and `B.order_key`.
- Inserts at start/end take a key before the minimum or after the maximum.
- Reads: `ORDER BY order_key, id` for deterministic tiebreaking.

Why this fits the constraints:
- Only one row changes on move (the moved entity).
- Reads are simple and fast; fully transparent.
- Implementation complexity is low: a column + a small key-generation helper.
- Rebalancing is rare; occasional background compaction can re-space keys if they grow long after heavy churn.

Operational notes:
- Index per ordering scope: `(scope_id, order_key)` if lists are scoped; otherwise just `order_key`.
- Concurrency: compute the between-key inside a transaction. If a collision occurs, retry with a slightly different midpoint; `id` remains a stable tie-breaker.

### Alternatives

1. Sparse integers (gaps like 1024 apart)
   - Pros: trivial to start.
   - Cons: eventually gaps exhaust; needs periodic renumbering touching many rows, violating the single-row update goal.

2. Linked list (`prev_id`/`next_id`)
   - Pros: constant-time local moves conceptually.
   - Cons: updates 2–3 rows per move; read ordering requires recursive CTE or application traversal; more invariants to maintain.

3. Pair/edge table or general DAG
   - Pros: flexible for constraints.
   - Cons: high complexity; non-transparent reads.

Given the goals, fractional indexing is the best fit.

## Minimal schema changes

- Add column: `order_key TEXT NOT NULL` (or `VARCHAR` sized to expected max).
- Add index: composite on scope if needed, e.g. `(scope_id, order_key)`.
- Migrate existing rows by assigning evenly spaced keys (e.g., sequential base-62 strings) ordered by current position or `created_at`.

## Core operations (domain/service API)

- Insert at end: set `order_key = between(max_key, null)` within scope.
- Move before Y: `order_key = between(prev(Y), Y)`.
- Move after X: `order_key = between(X, next(X))`.
- Insert at start: `order_key = between(null, min_key)`.

Reads remain: `SELECT ... ORDER BY order_key, id`.

## Key generation algorithm (between)

- Alphabet: stable ordered charset, e.g., `0-9A-Za-z`.
- Given optional bounds `a`, `b`, return a string strictly between them by digit-wise midpoint; if no space at a digit, extend length to create space.
- Guarantees: always returns a key between when `a < b`; handles open-ended bounds by treating missing sides as −∞/＋∞.

## Concurrency & transactions

- Perform reorders in a transaction scoped to the affected list.
- Add a unique constraint over `(scope_id, order_key)` only if collisions must be impossible; otherwise rely on `ORDER BY order_key, id` and retry on rare duplicates.
- For high-contention lists, consider short `SELECT ... FOR UPDATE` on immediate neighbors to stabilize reads while computing the new key.

## Compaction (optional, infrequent)

- Triggered when keys for a scope exceed a length threshold or density metric.
- Reassign fresh evenly spaced keys in-order within the scope in a background job, chunked to avoid long locks.
- Transparent to consumers; ordering preserved.

## TDD plan (behavior-first)

### Unit tests for key generation
- Generates a key strictly between two given keys.
- Supports open-ended bounds (before first, after last).
- Produces increasing keys for repeated inserts at end/start.
- Resolves tight gaps by lengthening the key (no collisions under normal use).

### Repository/service tests
- Insert at end yields monotonically increasing order in reads.
- Move before/after updates only the moved entity’s `order_key`.
- Reordering preserves relative order of unaffected entities.
- Deterministic read order with `ORDER BY order_key, id` when keys are equal.
- Scoped lists: operations affect only the given scope.

### Concurrency tests (integration)
- Two concurrent moves into the same gap: one succeeds; the other retries and succeeds with a different key; final order correct.
- Concurrent inserts at end: final order is consistent and stable.

### Migration tests
- Migrating from no `order_key` assigns keys matching prior order (by existing position or `created_at`).
- Post-migration reads match pre-migration order.

### Compaction tests
- After compaction, order remains identical; average key length reduces; no consumer-visible change.

## Acceptance criteria

- Consumers retrieve entities ordered via a single `ORDER BY order_key, id`.
- Reordering an entity updates exactly one row under normal operation.
- Typical operations are O(1) and do not require range renumbering.
- Strategy supports long-term use with occasional, optional background compaction.

