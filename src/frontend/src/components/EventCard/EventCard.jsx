import EventStatusPill from '../EventStatusPill/EventStatusPill'
import './EventCard.scss'

function EventCard({ event }) {
  const steps = [
    { label: 'SA Office', value: event.saStatus, remark: event.saRemark },
    { label: 'Faculty', value: event.facultyStatus, remark: event.facultyRemark },
    { label: 'Dean', value: event.deanStatus, remark: event.deanRemark },
  ]

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
