import EventStatusPill from '../EventStatusPill/EventStatusPill'
import './EventCard.scss'

function EventCard({ event }) {
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
      <p className="muted description">{event.description}</p>

      {pocStatuses.length > 0 && (
        <div className="subevent-block">
          <p className="muted">Sub-events and POCs</p>
          <div className="subevent-list">
            {pocStatuses.map((sub) => (
              <div key={sub.id} className="subevent-row">
                <div>
                  <strong>{sub.name}</strong>
                  <p className="muted">Club: {sub.clubName}</p>
                  <p className="muted">
                    POC: {sub.pocName} ({sub.pocUsername}) · {sub.pocPhone}
                  </p>
                  <p className="muted">Budget head: ₹{Number(sub.budgetHead).toFixed(2)}</p>
                  {sub.budgetItems?.length > 0 && (
                    <ul className="budget-list">
                      {sub.budgetItems.map((item, idx) => (
                        <li key={idx}>
                          <span className="muted">{item.description}</span>
                          <strong>₹{Number(item.amount).toFixed(2)}</strong>
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
