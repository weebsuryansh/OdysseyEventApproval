import './EventStatusPill.scss'

function EventStatusPill({ label, status, remark }) {
  const normalizedStatus = status?.toLowerCase() || 'pending'
  const displayStatus = status || 'Pending'

  return (
    <span className={`status-pill ${normalizedStatus}`}>
      <div className="status-pill__header">
        <strong>{label}</strong>
        <span className="status-pill__state">{displayStatus}</span>
      </div>
      {remark && <span className="remark">{remark}</span>}
    </span>
  )
}

export default EventStatusPill
