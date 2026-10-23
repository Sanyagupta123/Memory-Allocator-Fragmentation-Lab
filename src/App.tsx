import { useMemo, useState } from 'react'
import { ComparisonView } from './components/ComparisonView'
import { Controls } from './components/Controls'
import { EventLog } from './components/EventLog'
import { HeapView } from './components/HeapView'
import { MetricsPanel } from './components/MetricsPanel'
import type { AllocationStrategy } from './engine/allocator'
import { computeHeapMetrics } from './engine/metrics'
import { compareStrategies, replayWorkload } from './engine/replay'
import { DEMO_WORKLOAD, type WorkloadEvent } from './engine/workload'

const defaultHeapCapacity = 100

function App() {
  const [heapCapacity, setHeapCapacity] = useState(defaultHeapCapacity)
  const [strategy, setStrategy] = useState<AllocationStrategy>('first-fit')
  const [events, setEvents] = useState<WorkloadEvent[]>(DEMO_WORKLOAD)
  const [selectedStep, setSelectedStep] = useState(DEMO_WORKLOAD.length)
  const [allocationId, setAllocationId] = useState('A1')
  const [allocationSize, setAllocationSize] = useState('20')
  const [selectedReleaseId, setSelectedReleaseId] = useState('')
  const [message, setMessage] = useState('Ready')

  const visibleEvents = useMemo(() => events.slice(0, selectedStep), [events, selectedStep])
  const currentReplay = useMemo(
    () => replayWorkload(heapCapacity, strategy, visibleEvents),
    [heapCapacity, strategy, visibleEvents],
  )

  const activeAllocationIds = currentReplay.finalSnapshot.activeAllocations.map((allocation) => allocation.id)

  const comparison = useMemo(
    () => {
      const compare = compareStrategies(heapCapacity, events)
      return Object.entries(compare).map(([strategyKey, result]) => {
        const finalMetrics = computeHeapMetrics(result.finalSnapshot)
        return {
          strategy: strategyKey as AllocationStrategy,
          successfulAllocations: result.summary.successfulAllocationCount,
          failedAllocations: result.summary.failedAllocationCount,
          successRate: result.summary.successRate,
          finalFreeMemory: finalMetrics.totalFree,
          largestFreeBlock: finalMetrics.largestFree,
          finalExternalFragmentation: finalMetrics.externalFragmentation,
          finalUtilization: finalMetrics.utilization,
          averageSearchSteps: result.summary.averageInspectedPerAllocationAttempt,
          totalInspected: result.history.reduce(
            (total, item) => total + (item.event.type === 'allocate' ? item.inspected : 0),
            0,
          ),
        }
      })
    },
    [events, heapCapacity],
  )

  const handleQueueEvent = (nextEvent: WorkloadEvent) => {
    setEvents((prev) => {
      const prefix = prev.slice(0, selectedStep)
      const updated = [...prefix, nextEvent]
      setSelectedStep(updated.length)
      return updated
    })
  }

  const handleAllocate = () => {
    const id = allocationId.trim()
    const size = Number(allocationSize)

    if (!id) {
      setMessage('Allocation ID cannot be empty.')
      return
    }
    if (!Number.isInteger(size) || size <= 0) {
      setMessage('Allocation size must be a positive integer.')
      return
    }
    if (activeAllocationIds.includes(id)) {
      setMessage('Allocation ID is already active. Choose a unique ID.')
      return
    }

    handleQueueEvent({ type: 'allocate', id, size })
    setMessage(`Queued allocation ${id} for ${size} units.`)
  }

  const handleRelease = () => {
    if (!selectedReleaseId) {
      setMessage('Choose an active allocation to release.')
      return
    }

    handleQueueEvent({ type: 'release', id: selectedReleaseId })
    setMessage(`Queued release for ${selectedReleaseId}.`)
  }

  const handleCapacityChange = (nextCapacity: number) => {
    if (!Number.isInteger(nextCapacity) || nextCapacity <= 0) {
      setMessage('Heap capacity must be a positive integer.')
      return
    }

    setHeapCapacity(nextCapacity)
    setMessage(`Heap capacity set to ${nextCapacity}.`)
  }

  const handleStep = (direction: 'back' | 'forward') => {
    setSelectedStep((current) => {
      if (direction === 'back') {
        return Math.max(0, current - 1)
      }
      return Math.min(events.length, current + 1)
    })
  }

  const handleReset = () => {
    setSelectedStep(0)
    setMessage('Simulation reset to the beginning.')
  }

  const handleReplayToEnd = () => {
    setSelectedStep(events.length)
    setMessage('Replayed to the end of the workload.')
  }

  const exportReport = () => {
    const report = {
      application: 'MemScope',
      reportVersion: 1,
      heapCapacity,
      strategy,
      visibleStep: selectedStep,
      workload: events,
      comparison,
      finalSnapshot: currentReplay.finalSnapshot,
      history: currentReplay.history,
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'memscope-report.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setMessage('Exported MemScope report as JSON.')
  }

  const currentMetrics = useMemo(
    () => computeHeapMetrics(currentReplay.finalSnapshot),
    [currentReplay.finalSnapshot],
  )

  const selectedHistoryIndex = Math.max(0, Math.min(selectedStep - 1, currentReplay.history.length - 1))

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Virtual memory allocation simulator</p>
          <h1>MemScope</h1>
        </div>
        <div className="topbar-actions">
          <button type="button" onClick={handleReset}>Reset</button>
          <button type="button" onClick={exportReport}>Export JSON</button>
        </div>
      </header>

      <div className="status-row">
        <span>{message}</span>
      </div>

      <Controls
        heapCapacity={heapCapacity}
        strategy={strategy}
        allocationId={allocationId}
        allocationSize={allocationSize}
        onCapacityChange={handleCapacityChange}
        onStrategyChange={setStrategy}
        onAllocationIdChange={setAllocationId}
        onAllocationSizeChange={setAllocationSize}
        onAllocate={handleAllocate}
        onRelease={handleRelease}
        onStepBack={() => handleStep('back')}
        onStepForward={() => handleStep('forward')}
        onReset={handleReset}
        onReplayToEnd={handleReplayToEnd}
        currentStep={selectedStep}
        totalEvents={events.length}
        activeAllocationIds={activeAllocationIds}
        selectedReleaseId={selectedReleaseId}
        onSelectedReleaseIdChange={setSelectedReleaseId}
      />

      <div className="main-grid">
        <HeapView
          blocks={currentReplay.finalSnapshot.blocks}
          capacity={heapCapacity}
          strategy={strategy}
          currentStep={selectedStep}
          totalEvents={events.length}
        />
        <MetricsPanel metrics={currentMetrics} />
      </div>

      <div className="bottom-grid">
        <EventLog
          history={currentReplay.history}
          selectedIndex={selectedHistoryIndex}
          onSelect={(index) => setSelectedStep(index + 1)}
        />
        <ComparisonView rows={comparison} />
      </div>
    </main>
  )
}

export default App
