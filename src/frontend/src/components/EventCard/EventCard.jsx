import EventStatusPill from '../EventStatusPill/EventStatusPill'
import './EventCard.scss'

function EventCard({ event, onDownload, downloading }) {
  const steps = [
    { label: 'SA Office', value: event.saStatus, remark: event.saRemark },
    { label: 'Faculty', value: event.facultyStatus, remark: event.facultyRemark },
    { label: 'Dean', value: event.deanStatus, remark: event.deanRemark },
  ]

  const pocStatuses = event.subEvents || []
  const calcTotal = (items = []) => items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const formatAmount = (value) => Number(value || 0).toFixed(2)
  const totalBudget = pocStatuses.reduce((sum, sub) => sum + Number(sub.budgetTotal ?? calcTotal(sub.budgetItems)), 0)

  const openDetails = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('eventId', event.id)
    window.open(url.toString(), '_blank', 'noopener,noreferrer')
  }

  const previewSubs = pocStatuses.slice(0, 3)
  const moreCount = pocStatuses.length - previewSubs.length

  return (
    <div className="event-card card-surface">
      <div className="card-header">
        <div className="card-title">
          <p className="muted small-label">Request #{event.id}</p>
          <h3>{event.title}</h3>
          <p className="muted description">{event.description}</p>
          <div className="meta-row">
            <span className={`badge stage ${event.stage?.toLowerCase()}`}>{event.stage}</span>
            <span className="pill subtle">Sub-events: {pocStatuses.length}</span>
            {event.studentName && <span className="pill subtle">By {event.studentName}</span>}
            <span className="pill subtle">Budget: ₹{formatAmount(totalBudget)}</span>
          </div>
        </div>
        <div className="card-actions">
          {onDownload && (
            <button className="ghost compact" onClick={() => onDownload(event)} disabled={downloading}>
              {downloading ? 'Preparing PDF...' : 'Download budget PDF'}
            </button>
          )}
          <button className="primary" onClick={openDetails}>
            Open details
          </button>
        </div>
      </div>

      <div className="subevent-preview">
        {previewSubs.length > 0 ? (
          previewSubs.map((sub) => (
            <div key={sub.id} className="preview-chip">
              <div className="chip-head">
                <span className="chip-name">{sub.name}</span>
                <span className={`poc-status ${sub.status.toLowerCase()}`}>{sub.status}</span>
              </div>
              <p className="muted">POC: {sub.pocName}</p>
            </div>
          ))
        ) : (
          <p className="muted">No sub-events provided.</p>
        )}
        {moreCount > 0 && <span className="pill subtle">+{moreCount} more</span>}
      </div>

      <div className="status-row compact">
        {steps.map((step) => (
          <EventStatusPill key={step.label} label={step.label} status={step.value} remark={step.remark} />
        ))}
      </div>
    </div>
  )
}

export default EventCard
