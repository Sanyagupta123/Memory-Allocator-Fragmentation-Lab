export type AllocationStrategy = 'first-fit' | 'best-fit' | 'worst-fit'

export interface MemoryBlock {
  start: number
  size: number
  allocatedTo: string | null
}

export interface Allocation {
  id: string
  requestedSize: number
  actualSize: number
  start: number
}

export interface HeapSnapshot {
  capacity: number
  blocks: MemoryBlock[]
  activeAllocations: Allocation[]
  selectedStrategy: AllocationStrategy
  failureCount: number
  cumulativeInspected: number
}

const MAX_SAFE_INT = BigInt(Number.MAX_SAFE_INTEGER)

function assertSafeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0 || BigInt(Math.abs(value)) > MAX_SAFE_INT) {
    throw new Error(`${label} must be a positive safe integer.`)
  }
}

export function validateAllocationId(id: string): void {
  if (typeof id !== 'string' || id.trim() === '') {
    throw new Error('Allocation ID must be a non-empty string.')
  }
}

export function validateAllocationSize(size: number): void {
  if (!Number.isInteger(size) || size <= 0 || BigInt(Math.abs(size)) > MAX_SAFE_INT) {
    throw new Error('Allocation size must be a positive safe integer.')
  }
}

function isFreeBlock(block: MemoryBlock): boolean {
  return block.allocatedTo === null
}

export function coalesceAdjacentFreeBlocks(blocks: MemoryBlock[]): MemoryBlock[] {
  const merged: MemoryBlock[] = []

  for (const block of blocks) {
    const last = merged[merged.length - 1]
    if (last && isFreeBlock(last) && isFreeBlock(block)) {
      last.size += block.size
      continue
    }
    merged.push({ ...block })
  }

  return merged
}

export class MemoryAllocator {
  public readonly capacity: number
  public readonly selectedStrategy: AllocationStrategy
  public blocks: MemoryBlock[]
  public activeAllocations: Map<string, Allocation>
  public failureCount: number
  public cumulativeInspected: number
  public lastInspected: number

  constructor(capacity: number, selectedStrategy: AllocationStrategy) {
    assertSafeInteger(capacity, 'Heap capacity')
    this.capacity = capacity
    this.selectedStrategy = selectedStrategy
    this.blocks = [{ start: 0, size: capacity, allocatedTo: null }]
    this.activeAllocations = new Map()
    this.failureCount = 0
    this.cumulativeInspected = 0
    this.lastInspected = 0
  }

  private validateInvariants(): void {
    if (this.blocks.length === 0) {
      throw new Error('Heap cannot be empty.')
    }

    let offset = 0
    const seenAllocations = new Set<string>()
    let totalSize = 0

    for (let index = 0; index < this.blocks.length; index += 1) {
      const block = this.blocks[index]
      if (!Number.isInteger(block.size) || block.size <= 0) {
        throw new Error(`Block ${index} must have a positive integer size.`)
      }

      if (block.start !== offset) {
        throw new Error(`Block ${index} must begin at offset ${offset}.`)
      }

      if (index > 0 && this.blocks[index - 1].allocatedTo === null && block.allocatedTo === null) {
        throw new Error('Adjacent free blocks must be coalesced after each release.')
      }

      if (block.allocatedTo !== null) {
        const allocation = this.activeAllocations.get(block.allocatedTo)
        if (!allocation) {
          throw new Error(`Allocated block references missing allocation ${block.allocatedTo}.`)
        }
        if (seenAllocations.has(block.allocatedTo)) {
          throw new Error(`Duplicate active allocation ID found: ${block.allocatedTo}.`)
        }
        seenAllocations.add(block.allocatedTo)
      }

      if (block.start + block.size > this.capacity) {
        throw new Error('Block exceeds heap capacity.')
      }

      totalSize += block.size
      offset += block.size
    }

    if (totalSize !== this.capacity) {
      throw new Error('Heap size must equal the configured capacity.')
    }

    if (this.blocks[0].start !== 0) {
      throw new Error('The first block must start at offset zero.')
    }

    for (const [allocationId, allocation] of this.activeAllocations.entries()) {
      const block = this.blocks.find((candidate) => candidate.allocatedTo === allocationId)
      if (!block) {
        throw new Error(`Active allocation ${allocationId} is missing a backing block.`)
      }
      if (block.start !== allocation.start) {
        throw new Error(`Allocation ${allocationId} has a mismatched start offset.`)
      }
      if (allocation.id !== allocationId) {
        throw new Error(`Allocation metadata mismatch for ${allocationId}.`)
      }
    }

    if (seenAllocations.size !== this.activeAllocations.size) {
      throw new Error('Active allocation IDs and allocated blocks are out of sync.')
    }
  }

  public snapshot(): HeapSnapshot {
    return {
      capacity: this.capacity,
      blocks: this.blocks.map((block) => ({ ...block })),
      activeAllocations: Array.from(this.activeAllocations.values()).map((allocation) => ({ ...allocation })),
      selectedStrategy: this.selectedStrategy,
      failureCount: this.failureCount,
      cumulativeInspected: this.cumulativeInspected,
    }
  }

  public allocate(id: string, size: number): boolean {
    validateAllocationId(id)
    validateAllocationSize(size)

    if (this.activeAllocations.has(id)) {
      throw new Error(`Allocation ID ${id} already exists in the active heap.`)
    }

    const { index: selectedIndex, inspected } = findAllocationBlock(
      this.blocks,
      size,
      this.selectedStrategy,
    )
    this.lastInspected = inspected
    this.cumulativeInspected += inspected

    if (selectedIndex === -1) {
      this.failureCount += 1
      return false
    }

    const selectedBlock = this.blocks[selectedIndex]
    const allocation: Allocation = {
      id,
      requestedSize: size,
      actualSize: size,
      start: selectedBlock.start,
    }

    const remainder = selectedBlock.size - size
    this.blocks[selectedIndex] = {
      start: selectedBlock.start,
      size: size,
      allocatedTo: id,
    }

    if (remainder > 0) {
      this.blocks.splice(selectedIndex + 1, 0, {
        start: selectedBlock.start + size,
        size: remainder,
        allocatedTo: null,
      })
    }

    this.activeAllocations.set(id, allocation)
    this.validateInvariants()
    return true
  }

  public release(id: string): boolean {
    const allocation = this.activeAllocations.get(id)
    if (!allocation) {
      return false
    }

    const blockIndex = this.blocks.findIndex((block) => block.allocatedTo === id)
    if (blockIndex === -1) {
      this.activeAllocations.delete(id)
      this.validateInvariants()
      return false
    }

    this.blocks[blockIndex] = {
      start: this.blocks[blockIndex].start,
      size: this.blocks[blockIndex].size,
      allocatedTo: null,
    }

    this.activeAllocations.delete(id)
    this.blocks = coalesceAdjacentFreeBlocks(this.blocks)
    this.validateInvariants()
    return true
  }
}

export function findAllocationBlock(
  blocks: MemoryBlock[],
  requestedSize: number,
  strategy: AllocationStrategy,
): { index: number; inspected: number } {
  validateAllocationSize(requestedSize)

  if (strategy === 'first-fit') {
    let inspected = 0
    for (let index = 0; index < blocks.length; index += 1) {
      inspected += 1
      const block = blocks[index]
      if (block.allocatedTo === null && block.size >= requestedSize) {
        return { index, inspected }
      }
    }
    return { index: -1, inspected }
  }

  if (strategy === 'best-fit') {
    let inspected = 0
    let bestIndex = -1
    let bestSize = Number.POSITIVE_INFINITY

    for (let index = 0; index < blocks.length; index += 1) {
      inspected += 1
      const block = blocks[index]
      if (block.allocatedTo === null && block.size >= requestedSize) {
        if (bestIndex === -1 || block.size < bestSize) {
          bestIndex = index
          bestSize = block.size
        }
      }
    }

    return { index: bestIndex, inspected }
  }

  let inspected = 0
  let worstIndex = -1
  let worstSize = Number.NEGATIVE_INFINITY

  for (let index = 0; index < blocks.length; index += 1) {
    inspected += 1
    const block = blocks[index]
    if (block.allocatedTo === null && block.size >= requestedSize) {
      if (worstIndex === -1 || block.size > worstSize) {
        worstIndex = index
        worstSize = block.size
      }
    }
  }

  return { index: worstIndex, inspected }
}

export function hasValidInvariants(blocks: MemoryBlock[], capacity: number): boolean {
  try {
    if (blocks.length === 0) {
      return false
    }
    let offset = 0
    let total = 0
    for (let index = 0; index < blocks.length; index += 1) {
      const block = blocks[index]
      if (!Number.isInteger(block.size) || block.size <= 0) {
        return false
      }
      if (block.start !== offset) {
        return false
      }
      if (index > 0 && blocks[index - 1].allocatedTo === null && block.allocatedTo === null) {
        return false
      }
      total += block.size
      offset += block.size
    }
    return total === capacity && blocks[0].start === 0
  } catch {
    return false
  }
}
