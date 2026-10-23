# MemScope

MemScope is a virtual memory allocation simulator designed to teach the relationship between total free memory, contiguous free regions, fragmentation, and allocation strategy selection. This is a simulation of virtual heap behavior and not a real operating-system memory allocator.

## Problem statement

A heap can have enough total free memory while still rejecting an allocation because no individual free block is large enough. MemScope makes that behavior visible by replaying deterministic workloads across First Fit, Best Fit, and Worst Fit placement strategies.

## Features

- configurable heap capacity
- First Fit, Best Fit, and Worst Fit strategy selection
- allocation and release operations with validation
- heap block splitting and automatic coalescing
- workload step-through and replay controls
- deterministic comparison across all strategies
- fragmentation and utilization metrics
- JSON export of the current report
- engine-level tests for allocator correctness and replay logic

## Technology stack

- React
- TypeScript
- Vite
- Vitest
- CSS-based heap visualization

## Screenshots

Screenshots will be added as the visual polish evolves. This section is intentionally left as a placeholder for future captures.

## Installation requirements

- Node.js 18 or newer
- npm

## Setup instructions

1. Clone this repository.
2. Install dependencies:
   npm install
3. Start the development app:
   npm run dev

## Development command

npm run dev

## Test command

npm test

## Production build command

npm run build

## Architecture and folder structure

- src/engine/allocator.ts — heap model and invariants
- src/engine/strategies.ts — allocation placement logic
- src/engine/metrics.ts — heap and workload metrics
- src/engine/workload.ts — deterministic workload model and optional seeded generation
- src/engine/replay.ts — workload replay and comparison engine
- src/components/ — React UI panels and controls
- src/App.tsx — overall simulation shell
- tests/ — engine and UI validation tests
- docs/algorithms.md — algorithm and metric explanations

## Allocation algorithm explanations

- First Fit: choose the first free block that is large enough.
- Best Fit: choose the smallest free block that can satisfy the request.
- Worst Fit: choose the largest free block that can satisfy the request.

The simulator uses an ordered array of memory blocks as a simple educational implementation. This design makes fragmentation, splitting, and coalescing straightforward to express and validate.

## Metric definitions

- allocatedMemory: sum of all allocated block sizes
- totalFree: sum of all free block sizes
- largestFree: largest individual free block size
- utilization: allocatedMemory / heapCapacity
- externalFragmentation: 1 - largestFree / totalFree when total free memory is non-zero
- allocationFailures: number of failed allocation attempts
- cumulativeInspected: total blocks inspected across all allocation attempts

## Example fragmentation scenario

Imagine a 100-unit heap with three small free regions: 20, 15, and 25. The total free memory is 60, but there may be no contiguous 30-unit block available. A request for 30 units fails even though 60 units are free overall.

## Workload replay and comparison behavior

MemScope replays each event in order, deriving the visible heap state from the current prefix of the workload sequence. All three strategies compare the same exact event history, using the same heap capacity, event order, and initial conditions. The visible state is always generated from the workload, rather than from a hidden allocator that can drift from the UI state.

## JSON export instructions

Use the Export JSON button in the top bar to download a report containing the current workload, selected strategy, visible snapshot, event history, and comparison data. The output is a plain JSON file suitable for inspection or further analysis.

## Complexity analysis

For B memory blocks:

- First Fit worst-case search: O(B)
- Best Fit worst-case search: O(B)
- Worst Fit worst-case search: O(B)
- Splitting and insertion: O(B)
- Release and coalescing: O(B)
- Metrics aggregation: O(B)

This is a teaching-oriented, array-backed implementation rather than a throughput-optimized allocator.

## Known limitations

- array-based block layout is intentionally simple
- no real OS paging, alignment, or page-table semantics
- no advanced allocator structures such as segregated free lists
- metrics intentionally focus on the virtual heap model rather than hardware-level behavior

## Future improvements

- richer seeded workload generators
- import of saved JSON reports
- more detailed block detail tooltips
- step-by-step animation for heap changes
- persistence for experiments
- more advanced allocator policies and trade-off visuals

This project is a virtual simulation for learning and experimentation, not a real operating-system memory allocator.
