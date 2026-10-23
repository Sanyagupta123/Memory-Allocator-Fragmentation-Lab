import { describe, expect, it } from 'vitest'
import { selectBlock } from '../src/engine/strategies'

describe('Allocation strategies', () => {
  it('first-fit selects the first eligible block and stops early', () => {
    const blocks = [
      { start: 0, size: 20, allocatedTo: null },
      { start: 20, size: 15, allocatedTo: 'A' },
      { start: 35, size: 50, allocatedTo: null },
    ]

    const result = selectBlock(blocks, 15, 'first-fit')
    expect(result).toEqual({ index: 0, inspected: 1 })
  })

  it('best-fit chooses the smallest eligible block with deterministic tie-breaking', () => {
    const blocks = [
      { start: 0, size: 40, allocatedTo: null },
      { start: 40, size: 25, allocatedTo: null },
      { start: 65, size: 25, allocatedTo: null },
      { start: 90, size: 10, allocatedTo: 'B' },
    ]

    const result = selectBlock(blocks, 20, 'best-fit')
    expect(result).toEqual({ index: 1, inspected: 4 })
  })

  it('worst-fit chooses the largest eligible block and inspects all blocks', () => {
    const blocks = [
      { start: 0, size: 15, allocatedTo: null },
      { start: 15, size: 30, allocatedTo: null },
      { start: 45, size: 20, allocatedTo: null },
      { start: 65, size: 35, allocatedTo: 'A' },
    ]

    const result = selectBlock(blocks, 18, 'worst-fit')
    expect(result).toEqual({ index: 1, inspected: 4 })
  })

  it('returns -1 and the correct inspected count when no free block fits', () => {
    const blocks = [
      { start: 0, size: 8, allocatedTo: null },
      { start: 8, size: 10, allocatedTo: 'A' },
      { start: 18, size: 14, allocatedTo: null },
    ]

    expect(selectBlock(blocks, 15, 'first-fit')).toEqual({ index: -1, inspected: 3 })
    expect(selectBlock(blocks, 15, 'best-fit')).toEqual({ index: -1, inspected: 3 })
    expect(selectBlock(blocks, 15, 'worst-fit')).toEqual({ index: -1, inspected: 3 })
  })
})
