import type { AllocationStrategy } from '../engine/allocator'

interface ComparisonEntry {
  strategy: AllocationStrategy
  successfulAllocations: number
  failedAllocations: number
  successRate: number | 'unavailable'
  finalFreeMemory: number
  largestFreeBlock: number
  finalExternalFragmentation: number
  finalUtilization: number
  averageSearchSteps: number | 'unavailable'
  totalInspected: number
}

interface ComparisonViewProps {
  rows: ComparisonEntry[]
}

export function ComparisonView({ rows }: ComparisonViewProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Strategy comparison</h2>
      </div>
      <div className="comparison-grid">
        {rows.map((row) => (
          <div key={row.strategy} className="comparison-card">
            <h3>{row.strategy}</h3>
            <dl>
              <div><dt>Successes</dt><dd>{row.successfulAllocations}</dd></div>
              <div><dt>Failures</dt><dd>{row.failedAllocations}</dd></div>
              <div><dt>Success rate</dt><dd>{typeof row.successRate === 'number' ? `${(row.successRate * 100).toFixed(1)}%` : 'Unavailable'}</dd></div>
              <div><dt>Largest free</dt><dd>{row.largestFreeBlock}</dd></div>
              <div><dt>Fragmentation</dt><dd>{(row.finalExternalFragmentation * 100).toFixed(1)}%</dd></div>
              <div><dt>Utilization</dt><dd>{(row.finalUtilization * 100).toFixed(1)}%</dd></div>
              <div><dt>Avg search</dt><dd>{typeof row.averageSearchSteps === 'number' ? row.averageSearchSteps.toFixed(1) : 'Unavailable'}</dd></div>
              <div><dt>Inspected</dt><dd>{row.totalInspected}</dd></div>
            </dl>
          </div>
        ))}
      </div>
    </div>
  )
}
