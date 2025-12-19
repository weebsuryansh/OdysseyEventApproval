import EventStatusPill from '../EventStatusPill/EventStatusPill'
import './EventCard.scss'

function EventCard({ event, onDownload, downloading }) {
  const steps = [
    { label: 'SA Office', value: event.saStatus, remark: event.saRemark },
    { label: 'Faculty', value: event.facultyStatus, remark: event.facultyRemark },
    { label: 'Dean', value: event.deanStatus, remark: event.deanRemark },
  ]

  const pocStatuses = event.subEvents || []

  return (
    <div className="event-card card-surface">
      <div className="card-header">
        <div>
          <p className="muted">Request #{event.id}</p>
          <h3>{event.title}</h3>
        </div>
        <span className={`badge stage ${event.stage?.toLowerCase()}`}>{event.stage}</span>
      </div>
      {onDownload && (
        <div className="card-actions">
          <button className="ghost compact" onClick={() => onDownload(event)} disabled={downloading}>
            {downloading ? 'Preparing PDF...' : 'Download budget PDF'}
          </button>
        </div>
      )}
      <p className="muted description">{event.description}</p>

      {pocStatuses.length > 0 && (
        <div className="subevent-block">
          <p className="muted">Sub-events and POCs</p>
          <div className="subevent-list">
            {pocStatuses.map((sub) => (
              <div key={sub.id} className="subevent-row">
                <div>
                  <strong>{sub.name}</strong>
                  <p className="muted">
                    POC: {sub.pocName} ({sub.pocUsername}) · {sub.pocPhone}
                  </p>
                  <p className="muted">Club: {sub.clubName}</p>
                  <p className="muted">Budget head: {sub.budgetHead}</p>
                  {sub.budgetItems?.length > 0 && (
                    <ul className="budget-mini">
                      {sub.budgetItems.map((item, idx) => (
                        <li key={idx}>
                          {item.description} — {Number(item.amount || 0).toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <span className={`poc-status ${sub.status.toLowerCase()}`}>{sub.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="status-row">
        {steps.map((step) => (
          <EventStatusPill key={step.label} label={step.label} status={step.value} remark={step.remark} />
        ))}
      </div>
      <div className="progress" data-stage={event.stage}></div>
    </div>
  )
}

export default EventCard
