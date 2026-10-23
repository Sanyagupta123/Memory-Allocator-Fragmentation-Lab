import type { AllocationStrategy, MemoryBlock } from '../engine/allocator'

interface HeapViewProps {
  blocks: MemoryBlock[]
  capacity: number
  strategy: AllocationStrategy
  currentStep: number
  totalEvents: number
}

export function HeapView({ blocks, capacity, strategy, currentStep, totalEvents }: HeapViewProps) {
  return (
    <div className="panel heap-panel">
      <div className="panel-header">
        <h2>Virtual heap</h2>
        <span>{strategy}</span>
      </div>
      <div className="legend">
        <span><i className="swatch allocated" /> Allocated</span>
        <span><i className="swatch free" /> Free</span>
      </div>
      <div className="heap-bar" aria-label="Heap visualization">
        {blocks.map((block) => {
          const width = (block.size / capacity) * 100
          return (
            <div
              key={`${block.start}-${block.size}-${block.allocatedTo ?? 'free'}`}
              className={block.allocatedTo ? 'heap-block allocated' : 'heap-block free'}
              style={{ width: `${width}%` }}
              title={`${block.allocatedTo ?? 'free'} • ${block.size} units • start ${block.start}`}
            >
              {block.size >= 12 ? block.allocatedTo ?? 'Free' : ''}
            </div>
          )
        })}
      </div>
      <div className="heap-meta">
        <span>Step {currentStep}/{totalEvents}</span>
        <span>Capacity {capacity}</span>
      </div>
    </div>
  )
}
