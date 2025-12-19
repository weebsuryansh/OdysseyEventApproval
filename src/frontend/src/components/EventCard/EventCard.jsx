import EventStatusPill from '../EventStatusPill/EventStatusPill'
import './EventCard.scss'

function EventCard({ event, onDownload, downloading, onOpen }) {
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
    if (onOpen) {
      onOpen(event.id)
      return
    }

    const params = new URLSearchParams(window.location.search)
    params.set('eventId', event.id)
    const newQuery = params.toString()
    const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}`
    window.history.pushState({}, '', newUrl)
  }

  const descriptionSnippet =
    event.description && event.description.length > 140
      ? `${event.description.slice(0, 140)}…`
      : event.description

  const previewSubs = pocStatuses.slice(0, 3)
  const moreCount = pocStatuses.length - previewSubs.length

  return (
    <div className="event-card card-surface">
      <div className="card-header">
        <div className="card-title">
          <div className="title-row">
            <h3>{event.title}</h3>
            <span className={`badge stage ${event.stage?.toLowerCase()}`}>{event.stage}</span>
          </div>
          <p className="muted small-label">
            Request #{event.id}
            {event.studentName ? ` · ${event.studentName}` : ''}
          </p>
          {descriptionSnippet && <p className="muted description">{descriptionSnippet}</p>}
          <div className="meta-row compact">
            <span className="pill subtle">Sub-events {pocStatuses.length}</span>
            <span className="pill subtle">Budget ₹{formatAmount(totalBudget)}</span>
            {event.clubName && <span className="pill subtle">{event.clubName}</span>}
          </div>
        </div>
        <div className="card-actions compact">
          {onDownload && (
            <button className="ghost compact" onClick={() => onDownload(event)} disabled={downloading}>
              {downloading ? 'Preparing PDF...' : 'Budget PDF'}
            </button>
          )}
          <button className="primary" onClick={openDetails}>
            View details
          </button>
        </div>
      </div>

      <div className="subevent-preview compact">
        {previewSubs.length > 0 ? (
          previewSubs.map((sub) => (
            <div key={sub.id} className="preview-chip">
              <div className="chip-head">
                <span className="chip-name">{sub.name}</span>
              </div>
              <p className="muted">POC: {sub.pocName}</p>
            </div>
          ))
        ) : (
          <p className="muted">No sub-events provided.</p>
        )}
        {moreCount > 0 && <span className="pill subtle">+{moreCount} more</span>}
      </div>

    </div>
  )
}

export default EventCard
