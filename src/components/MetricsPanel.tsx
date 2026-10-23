import type { HeapMetrics } from '../engine/metrics'

interface MetricsPanelProps {
  metrics: HeapMetrics
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Metrics</h2>
      </div>
      <div className="metric-grid">
        <div><span>Allocated</span><strong>{metrics.allocatedMemory}</strong></div>
        <div><span>Free</span><strong>{metrics.totalFree}</strong></div>
        <div><span>Largest free</span><strong>{metrics.largestFree}</strong></div>
        <div><span>Free blocks</span><strong>{metrics.freeBlockCount}</strong></div>
        <div><span>Utilization</span><strong>{(metrics.utilization * 100).toFixed(1)}%</strong></div>
        <div><span>Fragmentation</span><strong>{(metrics.externalFragmentation * 100).toFixed(1)}%</strong></div>
        <div><span>Failures</span><strong>{metrics.allocationFailures}</strong></div>
        <div><span>Inspected</span><strong>{metrics.cumulativeInspected}</strong></div>
      </div>
    </div>
  )
}
