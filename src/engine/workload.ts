export type AllocationEvent = {
  type: 'allocate'
  id: string
  size: number
}

export type ReleaseEvent = {
  type: 'release'
  id: string
}

export type WorkloadEvent = AllocationEvent | ReleaseEvent

export interface SeededWorkloadOptions {
  heapCapacity: number
  targetEventCount: number
  seed: number
  minSize: number
  maxSize: number
  releaseProbability: number
}

export const DEMO_WORKLOAD: WorkloadEvent[] = [
  { type: 'allocate', id: 'A', size: 30 },
  { type: 'allocate', id: 'B', size: 20 },
  { type: 'allocate', id: 'C', size: 25 },
  { type: 'allocate', id: 'D', size: 15 },
  { type: 'release', id: 'B' },
  { type: 'allocate', id: 'E', size: 18 },
  { type: 'allocate', id: 'F', size: 40 },
  { type: 'release', id: 'A' },
  { type: 'allocate', id: 'G', size: 12 },
  { type: 'release', id: 'D' },
  { type: 'allocate', id: 'H', size: 28 },
  { type: 'release', id: 'E' },
  { type: 'allocate', id: 'I', size: 17 },
  { type: 'release', id: 'C' },
]

export function generateSeededWorkload(options: SeededWorkloadOptions): WorkloadEvent[] {
  const { heapCapacity, targetEventCount, seed, minSize, maxSize, releaseProbability } = options
  if (!Number.isInteger(heapCapacity) || heapCapacity <= 0) {
    throw new Error('Heap capacity must be a positive integer.')
  }
  if (!Number.isInteger(targetEventCount) || targetEventCount < 0) {
    throw new Error('Target event count must be a non-negative integer.')
  }
  if (!Number.isInteger(minSize) || !Number.isInteger(maxSize) || minSize <= 0 || maxSize < minSize) {
    throw new Error('Allocation size range is invalid.')
  }
  if (releaseProbability < 0 || releaseProbability > 1) {
    throw new Error('Release probability must be between 0 and 1.')
  }

  let state = (seed >>> 0) || 1
  const activeIds: string[] = []
  const events: WorkloadEvent[] = []

  const nextRandom = (): number => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }

  for (let index = 0; index < targetEventCount; index += 1) {
    const randomValue = nextRandom()
    const shouldRelease = activeIds.length > 0 && randomValue < releaseProbability

    if (shouldRelease) {
      const allocationId = activeIds.splice(Math.floor(nextRandom() * activeIds.length), 1)[0]
      events.push({ type: 'release', id: allocationId })
      continue
    }

    const id = `S${index + 1}`
    const size = Math.floor(minSize + nextRandom() * (maxSize - minSize + 1))
    activeIds.push(id)
    events.push({ type: 'allocate', id, size })
  }

  return events
}
