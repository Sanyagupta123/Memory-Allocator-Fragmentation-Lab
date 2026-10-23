import type { AllocationStrategy, MemoryBlock } from './allocator'

export interface SelectionResult {
  index: number
  inspected: number
}

export function selectBlock(
  blocks: MemoryBlock[],
  requestedSize: number,
  strategy: AllocationStrategy,
): SelectionResult {
  if (!Number.isInteger(requestedSize) || requestedSize <= 0) {
    throw new Error('Requested size must be a positive integer.')
  }

  let inspected = 0

  if (strategy === 'first-fit') {
    for (let index = 0; index < blocks.length; index += 1) {
      inspected += 1
      const block = blocks[index]
      if (block.allocatedTo === null && block.size >= requestedSize) {
        return { index, inspected }
      }
    }
    return { index: -1, inspected }
  }

  let candidateIndex = -1
  let candidateSize = strategy === 'best-fit' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY

  for (let index = 0; index < blocks.length; index += 1) {
    inspected += 1
    const block = blocks[index]
    if (block.allocatedTo === null && block.size >= requestedSize) {
      if (strategy === 'best-fit') {
        if (candidateIndex === -1 || block.size < candidateSize) {
          candidateIndex = index
          candidateSize = block.size
        }
      } else if (candidateIndex === -1 || block.size > candidateSize) {
        candidateIndex = index
        candidateSize = block.size
      }
    }
  }

  return { index: candidateIndex, inspected }
}
