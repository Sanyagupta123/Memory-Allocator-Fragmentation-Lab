import { MemoryAllocator, type AllocationStrategy, type HeapSnapshot } from './allocator'
import { computeHeapMetrics, type HeapMetrics } from './metrics'
import type { WorkloadEvent } from './workload'

export interface ReplayEventRecord {
  event: WorkloadEvent
  success: boolean
  inspected: number
  snapshot: HeapSnapshot
  metrics: HeapMetrics
  explanation: string
}

export interface ReplaySummary {
  allocationRequestCount: number
  successfulAllocationCount: number
  failedAllocationCount: number
  successRate: number | 'unavailable'
  averageInspectedPerAllocationAttempt: number | 'unavailable'
  peakBlockCount: number
  utilizationAfterEachEvent: number[]
}

export interface ReplayResult {
  finalSnapshot: HeapSnapshot
  history: ReplayEventRecord[]
  summary: ReplaySummary
}

export function replayWorkload(
  heapCapacity: number,
  strategy: AllocationStrategy,
  events: WorkloadEvent[],
): ReplayResult {
  const allocator = new MemoryAllocator(heapCapacity, strategy)
  const history: ReplayEventRecord[] = []

  for (const event of events) {
    let success = false
    let inspected = 0
    let explanation = ''
    let snapshot: HeapSnapshot

    if (event.type === 'allocate') {
      success = allocator.allocate(event.id, event.size)
      inspected = allocator.lastInspected

      if (success) {
        explanation = `Allocated ${event.id} (${event.size} units) at offset ${allocator.activeAllocations.get(event.id)?.start ?? 0}.`
      } else {
        explanation = `Allocation failed for ${event.id}: no contiguous free block of ${event.size} units was available.`
      }

      snapshot = allocator.snapshot()
    } else {
      const existing = allocator.activeAllocations.has(event.id)
      success = allocator.release(event.id)
      inspected = 0
      explanation = success
        ? `Released ${event.id}; adjacent free blocks were merged.`
        : existing
          ? `Release of ${event.id} was rejected because the allocation was not in a valid state.`
          : `Release of ${event.id} was a no-op because it was never active in this strategy.`
      snapshot = allocator.snapshot()
    }

    const metrics = computeHeapMetrics(snapshot)
    history.push({
      event,
      success,
      inspected,
      snapshot,
      metrics,
      explanation,
    })
  }

  const finalSnapshot = allocator.snapshot()
  const allocationAttempts = history.filter((item) => item.event.type === 'allocate')
  const successfulAllocationCount = allocationAttempts.filter((item) => item.success).length
  const failedAllocationCount = allocationAttempts.filter((item) => !item.success).length
  const totalInspected = allocationAttempts.reduce((total, item) => total + item.inspected, 0)
  const successRate = allocationAttempts.length === 0 ? 'unavailable' : successfulAllocationCount / allocationAttempts.length
  const averageInspectedPerAllocationAttempt =
    allocationAttempts.length === 0 ? 'unavailable' : totalInspected / allocationAttempts.length

  const summary: ReplaySummary = {
    allocationRequestCount: allocationAttempts.length,
    successfulAllocationCount,
    failedAllocationCount,
    successRate,
    averageInspectedPerAllocationAttempt,
    peakBlockCount: Math.max(...history.map((item) => item.snapshot.blocks.length), finalSnapshot.blocks.length),
    utilizationAfterEachEvent: history.map((item) => computeHeapMetrics(item.snapshot).utilization),
  }

  return {
    finalSnapshot,
    history,
    summary,
  }
}

export function compareStrategies(
  heapCapacity: number,
  events: WorkloadEvent[],
): Record<AllocationStrategy, ReplayResult> {
  const strategies: AllocationStrategy[] = ['first-fit', 'best-fit', 'worst-fit']
  const result = {} as Record<AllocationStrategy, ReplayResult>

  for (const strategy of strategies) {
    result[strategy] = replayWorkload(heapCapacity, strategy, events)
  }

  return result
}
