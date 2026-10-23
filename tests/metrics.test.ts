import { describe, expect, it } from 'vitest'
import { computeHeapMetrics, computeWorkloadMetrics } from '../src/engine/metrics'
import type { HeapSnapshot } from '../src/engine/allocator'

describe('Metrics', () => {
  it('calculates free memory, largest free block, utilization, and fragmentation', () => {
    const snapshot: HeapSnapshot = {
      capacity: 100,
      blocks: [
        { start: 0, size: 25, allocatedTo: 'A' },
        { start: 25, size: 20, allocatedTo: null },
        { start: 45, size: 35, allocatedTo: 'B' },
        { start: 80, size: 20, allocatedTo: null },
      ],
      activeAllocations: [{ id: 'A', requestedSize: 25, actualSize: 25, start: 0 }, { id: 'B', requestedSize: 35, actualSize: 35, start: 45 }],
      selectedStrategy: 'first-fit',
      failureCount: 0,
      cumulativeInspected: 5,
    }

    const metrics = computeHeapMetrics(snapshot)
    expect(metrics.allocatedMemory).toBe(60)
    expect(metrics.totalFree).toBe(40)
    expect(metrics.largestFree).toBe(20)
    expect(metrics.utilization).toBeCloseTo(0.6, 6)
    expect(metrics.externalFragmentation).toBeCloseTo(0.5, 6)
  })

  it('applies the no-free-memory convention and handles empty allocation attempts', () => {
    const empty: HeapSnapshot = {
      capacity: 50,
      blocks: [{ start: 0, size: 50, allocatedTo: 'A' }],
      activeAllocations: [{ id: 'A', requestedSize: 50, actualSize: 50, start: 0 }],
      selectedStrategy: 'best-fit',
      failureCount: 0,
      cumulativeInspected: 0,
    }

    const fullMetrics = computeHeapMetrics(empty)
    expect(fullMetrics.totalFree).toBe(0)
    expect(fullMetrics.largestFree).toBe(0)
    expect(fullMetrics.externalFragmentation).toBe(0)

    const summary = computeWorkloadMetrics([], empty)
    expect(summary.successRate).toBe('unavailable')
    expect(summary.averageInspectedPerAllocationAttempt).toBe('unavailable')
  })
})
