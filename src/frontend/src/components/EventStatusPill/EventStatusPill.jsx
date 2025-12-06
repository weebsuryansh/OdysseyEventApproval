import './EventStatusPill.scss'

function EventStatusPill({ label, status }) {
  return <span className={`status-pill ${status?.toLowerCase() || 'pending'}`}>{label}: {status || 'Pending'}</span>
}

export default EventStatusPill
