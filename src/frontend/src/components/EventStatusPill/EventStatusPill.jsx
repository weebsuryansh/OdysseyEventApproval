import './EventStatusPill.scss'

function EventStatusPill({ label, status, remark }) {
  return (
    <span className={`status-pill ${status?.toLowerCase() || 'pending'}`}>
      <strong>{label}:</strong> {status || 'Pending'}
      {remark && <span className="remark">Remark: {remark}</span>}
    </span>
  )
}

export default EventStatusPill
