import type { ReplayEventRecord } from '../engine/replay'

interface EventLogProps {
  history: ReplayEventRecord[]
  selectedIndex: number
  onSelect: (index: number) => void
}

export function EventLog({ history, selectedIndex, onSelect }: EventLogProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Event log</h2>
      </div>
      <div className="event-list">
        {history.length === 0 ? (
          <p className="empty-state">No workload events yet.</p>
        ) : (
          history.map((entry, index) => (
            <button
              key={`${entry.event.type}-${index}-${JSON.stringify(entry.event)}`}
              type="button"
              className={selectedIndex === index ? 'event-item selected' : 'event-item'}
              onClick={() => onSelect(index)}
            >
              <span className={`event-badge ${entry.success ? 'success' : 'failure'}`}>
                {entry.event.type === 'allocate' ? 'ALLOC' : 'FREE'}
              </span>
              <div>
                <strong>
                  {entry.event.type === 'allocate'
                    ? `${entry.event.id} (${entry.event.size})`
                    : `${entry.event.id} released`}
                </strong>
                <small>{entry.explanation}</small>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
