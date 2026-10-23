import { describe, expect, it } from 'vitest'
import { compareStrategies, replayWorkload } from '../src/engine/replay'
import { DEMO_WORKLOAD, generateSeededWorkload } from '../src/engine/workload'

describe('Replay and comparison', () => {
  it('runs the same workload across all strategies and returns deterministic results', () => {
    const comparison = compareStrategies(100, DEMO_WORKLOAD)
    expect(Object.keys(comparison)).toHaveLength(3)

    const strategies = ['first-fit', 'best-fit', 'worst-fit'] as const
    const summaries = strategies.map((key) => comparison[key].summary)
    expect(summaries.every((summary) => summary.allocationRequestCount === summaries[0].allocationRequestCount)).toBe(true)
  })

  it('handles release events for previously failed allocations without crashing', () => {
    const events = [
      { type: 'allocate', id: 'A', size: 150 },
      { type: 'allocate', id: 'B', size: 25 },
      { type: 'release', id: 'X' },
    ] as const

    const replay = replayWorkload(100, 'first-fit', [...events])
    expect(replay.history[2].success).toBe(false)
  })

  it('generates reproducible seeded workloads', () => {
    const first = generateSeededWorkload({ heapCapacity: 120, targetEventCount: 12, seed: 7, minSize: 10, maxSize: 30, releaseProbability: 0.4 })
    const second = generateSeededWorkload({ heapCapacity: 120, targetEventCount: 12, seed: 7, minSize: 10, maxSize: 30, releaseProbability: 0.4 })
    expect(first).toEqual(second)
  })
})
