import type { AllocationStrategy, HeapSnapshot } from './allocator'

export interface HeapMetrics {
  heapCapacity: number
  allocatedMemory: number
  totalFree: number
  largestFree: number
  freeBlockCount: number
  allocatedBlockCount: number
  utilization: number
  externalFragmentation: number
  allocationFailures: number
  cumulativeInspected: number
}

export interface WorkloadMetrics {
  allocationRequestCount: number
  successfulAllocationCount: number
  failedAllocationCount: number
  successRate: number | 'unavailable'
  averageInspectedPerAllocationAttempt: number | 'unavailable'
  peakBlockCount: number
  utilizationAfterEachEvent: number[]
}

export function computeHeapMetrics(snapshot: HeapSnapshot): HeapMetrics {
  const allocatedMemory = snapshot.blocks
    .filter((block) => block.allocatedTo !== null)
    .reduce((total, block) => total + block.size, 0)

  const freeBlocks = snapshot.blocks.filter((block) => block.allocatedTo === null)
  const totalFree = freeBlocks.reduce((total, block) => total + block.size, 0)
  const largestFree = freeBlocks.length === 0 ? 0 : Math.max(...freeBlocks.map((block) => block.size))

  return {
    heapCapacity: snapshot.capacity,
    allocatedMemory,
    totalFree,
    largestFree,
    freeBlockCount: freeBlocks.length,
    allocatedBlockCount: snapshot.blocks.filter((block) => block.allocatedTo !== null).length,
    utilization: snapshot.capacity === 0 ? 0 : allocatedMemory / snapshot.capacity,
    externalFragmentation: totalFree === 0 ? 0 : 1 - largestFree / totalFree,
    allocationFailures: snapshot.failureCount,
    cumulativeInspected: snapshot.cumulativeInspected,
  }
}

export function computeWorkloadMetrics(
  history: Array<{ event: { type: string }; success: boolean; inspected: number; snapshot: HeapSnapshot }>,
  finalSnapshot: HeapSnapshot,
): WorkloadMetrics {
  const allocationAttempts = history.filter((item) => item.event.type === 'allocate')
  const successfulAllocationCount = allocationAttempts.filter((item) => item.success).length
  const failedAllocationCount = allocationAttempts.filter((item) => !item.success).length
  const totalInspected = allocationAttempts.reduce((total, item) => total + item.inspected, 0)
  const successRate = allocationAttempts.length === 0 ? 'unavailable' : successfulAllocationCount / allocationAttempts.length
  const averageInspectedPerAllocationAttempt =
    allocationAttempts.length === 0 ? 'unavailable' : totalInspected / allocationAttempts.length

  const blockCounts = history.map((item) => item.snapshot.blocks.length)
  const peakBlockCount = Math.max(...blockCounts, finalSnapshot.blocks.length)

  return {
    allocationRequestCount: allocationAttempts.length,
    successfulAllocationCount,
    failedAllocationCount,
    successRate,
    averageInspectedPerAllocationAttempt,
    peakBlockCount,
    utilizationAfterEachEvent: history.map((item) => computeHeapMetrics(item.snapshot).utilization),
  }
}

export function computeStrategyComparisonMetrics(
  entries: Array<{
    strategy: AllocationStrategy
    finalSnapshot: HeapSnapshot
    allocationRequestCount: number
    successfulAllocationCount: number
    failedAllocationCount: number
    totalInspected: number
    utilizationAfterEachEvent: number[]
  }>,
): Array<{
  strategy: AllocationStrategy
  successfulAllocations: number
  failedAllocations: number
  successRate: number | 'unavailable'
  finalFreeMemory: number
  largestFreeBlock: number
  finalExternalFragmentation: number
  finalUtilization: number
  averageSearchSteps: number | 'unavailable'
  totalInspected: number
  peakBlockCount: number
  utilizationAfterEachEvent: number[]
}> {
  return entries.map((entry) => {
    const finalMetrics = computeHeapMetrics(entry.finalSnapshot)
    const successRate =
      entry.allocationRequestCount === 0 ? 'unavailable' : entry.successfulAllocationCount / entry.allocationRequestCount
    const averageSearchSteps =
      entry.allocationRequestCount === 0 ? 'unavailable' : entry.totalInspected / entry.allocationRequestCount

    return {
      strategy: entry.strategy,
      successfulAllocations: entry.successfulAllocationCount,
      failedAllocations: entry.failedAllocationCount,
      successRate,
      finalFreeMemory: finalMetrics.totalFree,
      largestFreeBlock: finalMetrics.largestFree,
      finalExternalFragmentation: finalMetrics.externalFragmentation,
      finalUtilization: finalMetrics.utilization,
      averageSearchSteps,
      totalInspected: entry.totalInspected,
      peakBlockCount: Math.max(...entry.utilizationAfterEachEvent.map((_, index) => index + 1), 0),
      utilizationAfterEachEvent: entry.utilizationAfterEachEvent,
    }
  })
}
