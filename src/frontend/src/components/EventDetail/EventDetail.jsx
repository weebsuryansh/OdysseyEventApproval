import { useEffect, useMemo, useState } from 'react'
import Banner from '../Banner/Banner'
import EventStatusPill from '../EventStatusPill/EventStatusPill'
import { api, downloadFile, resolveApiUrl } from '../../services/api'
import './EventDetail.scss'

function EventDetail({ eventId, user, onBack, readOnly = false }) {
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [remark, setRemark] = useState('')
  const [working, setWorking] = useState(false)
  const [downloadWorking, setDownloadWorking] = useState(false)

  const canAct = ['SA_OFFICE', 'FACULTY_COORDINATOR', 'DEAN'].includes(user?.role) && !readOnly

  const calcTotal = (items = []) => items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const formatAmount = (value) => Number(value || 0).toFixed(2)

  const totalBudget = useMemo(() => {
    if (!event?.subEvents?.length) return 0
    return event.subEvents.reduce((sum, sub) => sum + Number(sub.budgetTotal ?? calcTotal(sub.budgetItems)), 0)
  }, [event])

  const statusSteps = useMemo(() => {
    if (!event) return []
    return [
      { label: 'SA Office', value: event.saStatus, remark: event.saRemark },
      { label: 'Faculty', value: event.facultyStatus, remark: event.facultyRemark },
      { label: 'Dean', value: event.deanStatus, remark: event.deanRemark },
    ]
  }, [event])

  useEffect(() => {
    const load = async () => {
      if (!eventId) return
      setLoading(true)
      setMessage({ type: '', text: '' })
      try {
        const data = await api(`/api/events/${eventId}`)
        setEvent(data)
        setRemark('')
      } catch (err) {
        setMessage({ type: 'error', text: err.message || 'Could not load event details.' })
        setEvent(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [eventId])

  const decide = async (approve) => {
    if (!event) return
    setWorking(true)
    setMessage({ type: '', text: '' })
    if (!approve && !remark.trim()) {
      setMessage({ type: 'error', text: 'Please add a remark before declining.' })
      setWorking(false)
      return
    }
    try {
      await api(`/api/events/${event.id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ approve, remark }),
      })
      setMessage({ type: 'success', text: approve ? 'Event approved.' : 'Event declined.' })
      setRemark('')
      const refreshed = await api(`/api/events/${event.id}`)
      setEvent(refreshed)
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Action failed. Please try again.' })
    } finally {
      setWorking(false)
    }
  }

  const handleDownload = async () => {
    if (!event) return
    setDownloadWorking(true)
    setMessage({ type: '', text: '' })
    try {
      await downloadFile(`/api/events/${event.id}/budget.pdf`, `event-${event.id}-budget.pdf`)
      setMessage({ type: 'success', text: 'Budget PDF downloaded.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not download budget PDF.' })
    } finally {
      setDownloadWorking(false)
    }
  }

  const pill = (label, value) => (
    <span className="pill muted-pill" key={label}>
      <strong>{label}:</strong> {value}
    </span>
  )

  return (
    <div className="event-detail card-surface">
      <div className="detail-header">
        <div>
          <p className="muted">Request #{eventId}</p>
          <h1>{event?.title || 'Event details'}</h1>
          {event && <p className="muted description">{event.description}</p>}
          <div className="detail-meta">
            {pill('Stage', event?.stage || 'Loading...')}
            {event?.studentName && pill('Student', event.studentName)}
            {event && pill('Sub-events', event.subEvents?.length || 0)}
            {event && pill('Total budget', `₹${formatAmount(totalBudget)}`)}
          </div>
        </div>
        <div className="detail-actions">
          <button className="ghost" onClick={onBack}>
            Back to dashboard
          </button>
          <button className="ghost" onClick={handleDownload} disabled={downloadWorking || !event}>
            {downloadWorking ? 'Preparing PDF...' : 'Download budget PDF'}
          </button>
        </div>
      </div>

      <Banner status={message} />
      {loading && <p className="muted">Loading event information...</p>}
      {!loading && !event && <p className="muted">Could not find this event.</p>}

      {event && (
        <>
          <div className="status-row expanded">
            {statusSteps.map((step) => (
              <EventStatusPill key={step.label} label={step.label} status={step.value} remark={step.remark} />
            ))}
          </div>

          <section className="subevents">
            <div className="section-header">
              <div>
                <p className="muted">Each sub-event is separated for clarity</p>
                <h2>Sub-events and budgets</h2>
              </div>
              {event.subEvents?.length > 3 && <span className="pill muted-pill">{event.subEvents.length} entries</span>}
            </div>
            <div className="subevent-grid">
              {event.subEvents?.map((sub) => (
                <div key={sub.id} className="subevent-card">
                  <div className="subevent-card__header">
                    <div>
                      <p className="muted">Club: {sub.clubName}</p>
                      <h3>{sub.name}</h3>
                    </div>
                    <span className={`poc-status ${sub.status.toLowerCase()}`}>{sub.status}</span>
                  </div>
                  <p className="muted">Budget head: {sub.budgetHead}</p>
                  <p className="muted">
                    POC: {sub.pocName} ({sub.pocUsername}) · {sub.pocPhone}
                  </p>
                  <div className="subevent-budgets">
                    <div className="budget-summary">Total budget: ₹{formatAmount(sub.budgetTotal ?? calcTotal(sub.budgetItems))}</div>
                    {sub.budgetItems?.length > 0 && (
                      <div className="budget-table">
                        <div className="budget-table__header">
                          <span>Description</span>
                          <span>Amount</span>
                        </div>
                        {sub.budgetItems.map((item, idx) => (
                          <div key={idx} className="budget-table__row">
                            <span>{item.description}</span>
                            <span>₹{Number(item.amount || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {sub.budgetPhotos?.length > 0 && (
                      <div className="budget-photo-grid">
                        <p className="muted">Budget photos</p>
                        <div className="budget-photo-grid__items">
                          {sub.budgetPhotos.map((photo, idx) => {
                            const normalized = typeof photo === 'string' ? { url: photo, description: '' } : photo
                            return (
                              <div key={idx} className="budget-photo-grid__item">
                                <img src={resolveApiUrl(normalized.url)} alt={`Budget photo ${idx + 1} for ${sub.name}`} />
                                {normalized.description && <p className="muted">{normalized.description}</p>}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {canAct && (
            <section className="decision-panel">
              <div className="panel-header">
                <div>
                  <p className="muted">Leave feedback before taking action</p>
                  <h2>Approve or decline</h2>
                </div>
              </div>
              <label>
                Remark (required when declining)
                <textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Share context for your decision" />
              </label>
              <div className="actions">
                <button onClick={() => decide(true)} disabled={working}>
                  {working ? 'Working...' : 'Approve'}
                </button>
                <button className="danger" onClick={() => decide(false)} disabled={working}>
                  Decline
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default EventDetail
