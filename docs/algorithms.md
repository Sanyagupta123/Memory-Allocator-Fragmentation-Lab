# MemScope algorithms and metrics

MemScope models a virtual heap as an ordered array of blocks. Each block records a start offset, its size, and either the allocation ID or a null owner for free space. This is a deliberately simple array-based design that is easy to reason about and test.

## First Fit

First Fit scans the heap from low addresses to high addresses and picks the first free block that can satisfy the request. The algorithm stops as soon as it finds a valid block, so its worst-case search cost is O(B) over B blocks, with shorter runs on many workloads.

## Best Fit

Best Fit scans every block and selects the free block with the smallest size that still fits the requested allocation. This tends to reduce wasted space, but it may also leave many small fragments behind. In this MVP, Best Fit inspects every block to preserve accurate instrumentation and deterministic behavior.

## Worst Fit

Worst Fit scans every block and chooses the largest free block that can satisfy the request. This strategy often leaves a large remainder block, which can help future large allocations but may also create fragmentation patterns that are hard to reuse.

## Block splitting

When an allocation edge fits inside a free block, the allocator replaces that free region with an allocated block of the requested size and then inserts a remainder free block immediately afterward when the free block is larger than the request. This splits a region without changing the global heap capacity.

## Free-block coalescing

When an allocation is released, the allocator marks the block as free and then merges any adjacent free blocks. This prevents the heap from containing neighboring free regions that should logically be treated as one larger free area. The coalescing pass runs after each successful release and preserves the heap invariants.

## External fragmentation

External fragmentation captures the gap between the total free memory and the largest contiguous free block. The in-application metric is:

externalFragmentation = 1 - largestFree / totalFree

This is zero when the total free memory is zero by convention, because a division by zero would otherwise make the metric undefined.

## Heap utilization

Heap utilization is:

allocatedMemory / heapCapacity

This measures how much of the virtual heap is currently in use. Utilization can be high while fragmentation is also high; a large total free region may still exist as multiple small fragments that do not satisfy a large allocation request.

## Search-step instrumentation

Every allocation attempt records how many blocks were inspected while selecting a placement. First Fit stops immediately on the first acceptable block, while Best Fit and Worst Fit inspect the entire array to make an exact, deterministic choice. This is the search effort used by the metrics panel and comparison engine.

## Deterministic workload replay

MemScope replays the same workload sequence for all algorithms without mutating an original hidden heap. The UI and comparison engine derive their state from a single list of serialized workload events. This makes the simulator deterministic and makes it easy to compare strategies under identical conditions.

## Why comparisons require identical workloads

The comparison engine intentionally replays the same heap capacity, work order, and event sequence for all three strategies. Changing the workload or starting state for only one algorithm would hide the true performance trade-offs and make the comparison meaningless.

## Heap invariants

The allocator validates the following conditions after successful state mutations:

- block sizes are positive integers
- the first block starts at zero
- block start offsets are contiguous
- blocks do not overlap and there are no gaps
- the total size of all blocks equals the heap capacity
- every active allocation is backed by exactly one allocated block
- no duplicate active allocation IDs exist
- adjacent free blocks are merged after release

These invariants make it easier to reason about correctness and to catch edge cases such as fragmented free memory or inconsistent release operations.

## Limitations of the array-based design

The array-based implementation is intentionally simple. It is suitable for an educational simulator and for deterministic testing, but it does not match the performance characteristics of production allocators. More advanced structures, such as linked lists, balanced trees, and segregated free lists, would provide different performance trade-offs for lookup, insertion, and merging.

## Complexity summary

For B memory blocks:

- First Fit search: O(B) worst case
- Best Fit search: O(B)
- Worst Fit search: O(B)
- Array insertion or split repair: O(B)
- Release lookup: O(B)
- Coalescing: O(B)
- Metrics calculation: O(B)

This document describes algorithmic growth and trade-offs, not measured runtime performance from a benchmark.
