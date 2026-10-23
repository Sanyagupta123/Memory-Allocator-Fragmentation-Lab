import { describe, expect, it } from 'vitest'
import { MemoryAllocator, hasValidInvariants } from '../src/engine/allocator'

describe('MemoryAllocator', () => {
  it('splits a free block during allocation and preserves heap invariants', () => {
    const allocator = new MemoryAllocator(100, 'first-fit')

    expect(allocator.allocate('A', 30)).toBe(true)
    expect(allocator.blocks).toEqual([
      { start: 0, size: 30, allocatedTo: 'A' },
      { start: 30, size: 70, allocatedTo: null },
    ])
    expect(hasValidInvariants(allocator.blocks, allocator.capacity)).toBe(true)
  })

  it('does not create a zero-size remainder on exact-size allocations', () => {
    const allocator = new MemoryAllocator(100, 'first-fit')

    expect(allocator.allocate('A', 100)).toBe(true)
    expect(allocator.blocks).toEqual([{ start: 0, size: 100, allocatedTo: 'A' }])
  })

  it('rejects invalid capacities and invalid IDs or sizes', () => {
    expect(() => new MemoryAllocator(0, 'first-fit')).toThrow()
    expect(() => new MemoryAllocator(-5, 'first-fit')).toThrow()
    expect(() => new MemoryAllocator(100, 'first-fit').allocate('', 10)).toThrow()
    expect(() => new MemoryAllocator(100, 'first-fit').allocate('A', 0)).toThrow()
    expect(() => new MemoryAllocator(100, 'first-fit').allocate('A', -1)).toThrow()
  })

  it('rejects duplicate active IDs and failed allocation leaves the heap unchanged', () => {
    const allocator = new MemoryAllocator(100, 'first-fit')
    allocator.allocate('A', 10)

    expect(() => allocator.allocate('A', 25)).toThrow()

    const before = allocator.snapshot()
    expect(allocator.allocate('B', 200)).toBe(false)
    expect(allocator.blocks).toEqual(before.blocks)
    expect(allocator.failureCount).toBe(1)
  })

  it('releases allocations and merges adjacent free blocks', () => {
    const allocator = new MemoryAllocator(100, 'first-fit')
    allocator.allocate('A', 20)
    allocator.allocate('B', 15)
    allocator.allocate('C', 25)
    allocator.allocate('D', 10)

    allocator.release('B')
    allocator.release('D')

    expect(allocator.blocks).toEqual([
      { start: 0, size: 20, allocatedTo: 'A' },
      { start: 20, size: 15, allocatedTo: null },
      { start: 35, size: 25, allocatedTo: 'C' },
      { start: 60, size: 40, allocatedTo: null },
    ])

    allocator.release('C')
    expect(allocator.blocks).toEqual([
      { start: 0, size: 20, allocatedTo: 'A' },
      { start: 20, size: 80, allocatedTo: null },
    ])
    expect(hasValidInvariants(allocator.blocks, allocator.capacity)).toBe(true)
  })

  it('returns false for an unknown allocation and restores a single free block after all releases', () => {
    const allocator = new MemoryAllocator(100, 'first-fit')
    allocator.allocate('A', 30)
    allocator.allocate('B', 40)

    expect(allocator.release('Z')).toBe(false)
    expect(allocator.release('A')).toBe(true)
    expect(allocator.release('B')).toBe(true)
    expect(allocator.blocks).toEqual([{ start: 0, size: 100, allocatedTo: null }])
  })
})
