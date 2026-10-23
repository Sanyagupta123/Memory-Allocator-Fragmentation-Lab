import type { AllocationStrategy } from '../engine/allocator'

interface ControlsProps {
  heapCapacity: number
  strategy: AllocationStrategy
  allocationId: string
  allocationSize: string
  onCapacityChange: (value: number) => void
  onStrategyChange: (strategy: AllocationStrategy) => void
  onAllocationIdChange: (value: string) => void
  onAllocationSizeChange: (value: string) => void
  onAllocate: () => void
  onRelease: () => void
  onStepBack: () => void
  onStepForward: () => void
  onReset: () => void
  onReplayToEnd: () => void
  currentStep: number
  totalEvents: number
  activeAllocationIds: string[]
  selectedReleaseId: string
  onSelectedReleaseIdChange: (value: string) => void
}

export function Controls({
  heapCapacity,
  strategy,
  allocationId,
  allocationSize,
  onCapacityChange,
  onStrategyChange,
  onAllocationIdChange,
  onAllocationSizeChange,
  onAllocate,
  onRelease,
  onStepBack,
  onStepForward,
  onReset,
  onReplayToEnd,
  currentStep,
  totalEvents,
  activeAllocationIds,
  selectedReleaseId,
  onSelectedReleaseIdChange,
}: ControlsProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Simulation controls</h2>
      </div>
      <div className="controls-grid">
        <label>
          <span>Heap capacity</span>
          <input
            type="number"
            min="1"
            value={heapCapacity}
            onChange={(event) => onCapacityChange(Number(event.target.value))}
          />
        </label>

        <label>
          <span>Strategy</span>
          <select value={strategy} onChange={(event) => onStrategyChange(event.target.value as AllocationStrategy)}>
            <option value="first-fit">First Fit</option>
            <option value="best-fit">Best Fit</option>
            <option value="worst-fit">Worst Fit</option>
          </select>
        </label>

        <label>
          <span>Allocation ID</span>
          <input value={allocationId} onChange={(event) => onAllocationIdChange(event.target.value)} />
        </label>

        <label>
          <span>Allocation size</span>
          <input type="number" min="1" value={allocationSize} onChange={(event) => onAllocationSizeChange(event.target.value)} />
        </label>

        <div className="button-row span-2">
          <button type="button" onClick={onAllocate}>Allocate</button>
        </div>

        <label>
          <span>Release allocation</span>
          <select value={selectedReleaseId} onChange={(event) => onSelectedReleaseIdChange(event.target.value)}>
            {activeAllocationIds.length === 0 ? (
              <option value="">No active allocations</option>
            ) : (
              activeAllocationIds.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))
            )}
          </select>
        </label>

        <div className="button-row">
          <button type="button" onClick={onRelease}>Release</button>
        </div>
      </div>

      <div className="toolbar">
        <button type="button" onClick={onStepBack} disabled={currentStep === 0}>Step back</button>
        <button type="button" onClick={onStepForward} disabled={currentStep >= totalEvents}>Step forward</button>
        <button type="button" onClick={onReset}>Reset</button>
        <button type="button" onClick={onReplayToEnd}>Replay to end</button>
      </div>
      <div className="step-indicator">Current step: {currentStep}/{totalEvents}</div>
    </div>
  )
}
