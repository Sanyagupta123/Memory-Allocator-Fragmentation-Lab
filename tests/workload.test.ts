import { describe, expect, it } from 'vitest'
import { replayWorkload } from '../src/engine/replay'
import { DEMO_WORKLOAD } from '../src/engine/workload'

describe('Workload replay', () => {
  it('replays events in order and records the correct outcomes', () => {
    const result = replayWorkload(100, 'first-fit', [
      { type: 'allocate', id: 'A', size: 30 },
      { type: 'allocate', id: 'B', size: 20 },
      { type: 'allocate', id: 'C', size: 50 },
      { type: 'allocate', id: 'D', size: 30 },
      { type: 'release', id: 'B' },
      { type: 'allocate', id: 'E', size: 25 },
    ])

    expect(result.history).toHaveLength(6)
    expect(result.history[3].success).toBe(false)
    expect(result.history[4].success).toBe(true)
    expect(result.summary.failedAllocationCount).toBe(2)
    expect(result.finalSnapshot.blocks.length).toBeGreaterThan(1)
  })

  it('replays the demo workload deterministically', () => {
    const result = replayWorkload(100, 'first-fit', DEMO_WORKLOAD)
    expect(result.finalSnapshot.activeAllocations.map((item) => item.id)).toContain('I')
    expect(result.summary.allocationRequestCount).toBeGreaterThan(0)
  })
})
