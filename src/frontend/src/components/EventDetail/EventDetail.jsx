import { useEffect, useMemo, useState } from 'react'
import Banner from '../Banner/Banner'
import EventStatusPill from '../EventStatusPill/EventStatusPill'
import PhotoUploadModal from '../PhotoUploadModal/PhotoUploadModal'
import { api, downloadFile, resolveApiUrl, uploadFiles } from '../../services/api'
import { CHROMIUM_IMAGE_ACCEPT, filterChromiumImages } from '../../utils/fileValidation'
import './EventDetail.scss'

const EMPTY_BUDGET_ITEM = { description: '', amount: '' }
const createBudgetItem = () => ({ ...EMPTY_BUDGET_ITEM })
const createSubEvent = () => ({
  name: '',
  clubId: '',
  budgetHead: '',
  budgetItems: [createBudgetItem()],
  budgetPhotos: [],
  pocUsername: '',
  pocName: '',
  pocPhone: '',
})

function EventDetail({ eventId, user, onBack, readOnly = false }) {
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [remark, setRemark] = useState('')
  const [working, setWorking] = useState(false)
  const [downloadWorking, setDownloadWorking] = useState(false)
  const [subEventWorkingId, setSubEventWorkingId] = useState(null)
  const [clubs, setClubs] = useState([])
  const [newSubEvent, setNewSubEvent] = useState(createSubEvent())
  const [addingSubEvent, setAddingSubEvent] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [pocSuggestions, setPocSuggestions] = useState([])

  const canAct = ['SA_OFFICE', 'FACULTY_COORDINATOR', 'DEAN'].includes(user?.role) && !readOnly
  const isStudent = user?.role === 'STUDENT' && !readOnly
  const canEditSubEvents = isStudent

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

  useEffect(() => {
    if (!isStudent) return
    api('/api/clubs')
      .then(setClubs)
      .catch(() => setClubs([]))
  }, [isStudent])

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

  const decideSubEvent = async (subEventId, approve) => {
    if (!event) return
    setSubEventWorkingId(subEventId)
    setMessage({ type: '', text: '' })
    try {
      await api(`/api/sub-events/${subEventId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ approve }),
      })
      const refreshed = await api(`/api/events/${event.id}`)
      setEvent(refreshed)
      setMessage({ type: 'success', text: approve ? 'Sub-event approved.' : 'Sub-event declined.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not update sub-event status.' })
    } finally {
      setSubEventWorkingId(null)
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

  const stageLabel = (value) => (value ? value.replaceAll('_', ' ') : 'PENDING')
  const roleStage = {
    SA_OFFICE: 'SA_REVIEW',
    FACULTY_COORDINATOR: 'FACULTY_REVIEW',
    DEAN: 'DEAN_REVIEW',
  }
  const canDecideSubEvents = canAct && (event?.stage === roleStage[user?.role] || event?.stage === 'APPROVED')
  const subEventDecisionStatus = (sub) => {
    if (!sub) return 'PENDING'
    if (user?.role === 'SA_OFFICE') return sub.saStatus
    if (user?.role === 'FACULTY_COORDINATOR') return sub.facultyStatus
    if (user?.role === 'DEAN') return sub.deanStatus
    return sub.saStatus
  }

  const updateNewSubEvent = (field, value) => {
    setNewSubEvent((prev) => ({ ...prev, [field]: value }))
  }

  const updateNewBudgetItem = (index, field, value) => {
    setNewSubEvent((prev) => {
      const items = [...(prev.budgetItems || [])]
      items[index] = { ...items[index], [field]: value }
      return { ...prev, budgetItems: items }
    })
  }

  const addNewBudgetItem = () => {
    setNewSubEvent((prev) => ({
      ...prev,
      budgetItems: [...(prev.budgetItems || []), createBudgetItem()],
    }))
  }

  const removeNewBudgetItem = (index) => {
    setNewSubEvent((prev) => {
      const items = [...(prev.budgetItems || [])]
      if (items.length <= 1) return prev
      return { ...prev, budgetItems: items.filter((_, idx) => idx !== index) }
    })
  }

  const addNewBudgetPhotos = async (files) => {
    const { accepted, rejected } = filterChromiumImages(Array.from(files || []))
    if (rejected.length) {
      setMessage({
        type: 'error',
        text: 'Some files were skipped. Please use PNG, JPEG, WEBP, GIF, BMP, or SVG images.',
      })
    }
    if (!accepted.length) return
    try {
      setMessage({ type: 'info', text: 'Uploading budget photos...' })
      const uploads = await uploadFiles('/api/budget-photos', accepted)
      const nextPhotos = uploads.map((url) => ({ url, description: '' }))
      setNewSubEvent((prev) => ({
        ...prev,
        budgetPhotos: [...(prev.budgetPhotos || []), ...nextPhotos],
      }))
      setMessage({ type: 'success', text: 'Budget photos uploaded.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not load budget photos.' })
    }
  }

  const updateNewPhotoDescription = (photoIndex, value) => {
    setNewSubEvent((prev) => {
      const photos = [...(prev.budgetPhotos || [])]
      photos[photoIndex] = { ...photos[photoIndex], description: value }
      return { ...prev, budgetPhotos: photos }
    })
  }

  const removeNewPhoto = (photoIndex) => {
    setNewSubEvent((prev) => ({
      ...prev,
      budgetPhotos: (prev.budgetPhotos || []).filter((_, idx) => idx !== photoIndex),
    }))
  }

  const updatePocUsername = async (value) => {
    updateNewSubEvent('pocUsername', value)
    if (!value || value.trim().length < 2) {
      setPocSuggestions([])
      return
    }
    try {
      const results = await api(`/api/users/search?query=${encodeURIComponent(value.trim())}`)
      setPocSuggestions(results)
    } catch (_) {
      setPocSuggestions([])
    }
  }

  const addSubEvent = async () => {
    if (!event) return
    setAddingSubEvent(true)
    setMessage({ type: '', text: '' })
    try {
      const payload = {
        ...newSubEvent,
        clubId: Number(newSubEvent.clubId),
        budgetHead: newSubEvent.budgetHead.trim(),
        budgetItems: newSubEvent.budgetItems.map((item) => ({
          description: item.description,
          amount: Number(item.amount),
        })),
        budgetPhotos: newSubEvent.budgetPhotos || [],
      }
      await api(`/api/events/${event.id}/sub-events`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const refreshed = await api(`/api/events/${event.id}`)
      setEvent(refreshed)
      setNewSubEvent(createSubEvent())
      setMessage({ type: 'success', text: 'Sub-event added.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not add sub-event.' })
    } finally {
      setAddingSubEvent(false)
    }
  }

  const removeSubEvent = async (subEventId) => {
    if (!event) return
    setMessage({ type: '', text: '' })
    try {
      await api(`/api/events/${event.id}/sub-events/${subEventId}`, { method: 'DELETE' })
      const refreshed = await api(`/api/events/${event.id}`)
      setEvent(refreshed)
      setMessage({ type: 'success', text: 'Sub-event removed.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not remove sub-event.' })
    }
  }

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
                  <div className="subevent-approvals">
                    <span className="pill subtle">SA: {stageLabel(sub.saStatus)}</span>
                    <span className="pill subtle">Faculty: {stageLabel(sub.facultyStatus)}</span>
                    <span className="pill subtle">Dean: {stageLabel(sub.deanStatus)}</span>
                  </div>
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
                  {canDecideSubEvents && (
                    <div className="subevent-decision">
                      <p className="muted">Your decision: {stageLabel(subEventDecisionStatus(sub))}</p>
                      <div className="actions">
                        <button
                          type="button"
                          disabled={subEventWorkingId === sub.id}
                          onClick={() => decideSubEvent(sub.id, true)}
                        >
                          {subEventWorkingId === sub.id ? 'Working...' : 'Approve sub-event'}
                        </button>
                        <button
                          type="button"
                          className="danger"
                          disabled={subEventWorkingId === sub.id}
                          onClick={() => decideSubEvent(sub.id, false)}
                        >
                          Decline sub-event
                        </button>
                      </div>
                    </div>
                  )}
                  {canEditSubEvents && event.subEvents?.length > 1 && (
                    <button type="button" className="ghost compact subevent-remove" onClick={() => removeSubEvent(sub.id)}>
                      Remove sub-event
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {canEditSubEvents && (
            <section className="subevent-edit card-surface">
              <div className="section-header">
                <div>
                  <p className="muted">Add or remove sub-events even after the main event is reviewed</p>
                  <h2>Add a sub-event</h2>
                </div>
              </div>
              <div className="subevent-edit-form">
                <label>
                  Sub-event name
                  <input value={newSubEvent.name} onChange={(e) => updateNewSubEvent('name', e.target.value)} required />
                </label>
                <label>
                  Club
                  <select value={newSubEvent.clubId} onChange={(e) => updateNewSubEvent('clubId', e.target.value)} required>
                    <option value="">Select a club</option>
                    {clubs.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Budget head (sanctioning authority)
                  <input
                    placeholder="Name / designation"
                    value={newSubEvent.budgetHead}
                    onChange={(e) => updateNewSubEvent('budgetHead', e.target.value)}
                    required
                  />
                </label>
                <div className="budget-list">
                  <div className="budget-list-header">
                    <strong>Budget breakdown</strong>
                    <button type="button" className="ghost compact" onClick={addNewBudgetItem}>
                      + Add line item
                    </button>
                  </div>
                  {(newSubEvent.budgetItems || [{ ...EMPTY_BUDGET_ITEM }]).map((item, idx) => (
                    <div key={idx} className="budget-row">
                      <input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateNewBudgetItem(idx, 'description', e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount"
                        value={item.amount}
                        onChange={(e) => updateNewBudgetItem(idx, 'amount', e.target.value)}
                        required
                      />
                      {newSubEvent.budgetItems?.length > 1 && (
                        <button type="button" className="ghost compact" onClick={() => removeNewBudgetItem(idx)}>
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <p className="muted total-row">Total: {calcTotal(newSubEvent.budgetItems || []).toFixed(2)}</p>
                </div>
                <div className="budget-photos">
                  <div className="budget-photos__header">
                    <strong>Budget photos</strong>
                    <button type="button" className="ghost compact upload-button" onClick={() => setUploadModalOpen(true)}>
                      + Upload photos
                    </button>
                  </div>
                  {newSubEvent.budgetPhotos?.length ? (
                    <div className="budget-photos__grid">
                      {newSubEvent.budgetPhotos.map((photo, photoIndex) => (
                        <div className="budget-photos__item" key={`new-${photoIndex}`}>
                          <img src={resolveApiUrl(photo.url)} alt={`Budget proof ${photoIndex + 1}`} />
                          <input
                            type="text"
                            placeholder="Add a short description"
                            value={photo.description || ''}
                            onChange={(e) => updateNewPhotoDescription(photoIndex, e.target.value)}
                          />
                          <button type="button" className="ghost compact" onClick={() => removeNewPhoto(photoIndex)}>
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">Add photos of receipts or estimates for this sub-event.</p>
                  )}
                </div>
                <div className="poc-grid">
                  <label>
                    POC username
                    <div className="poc-suggestion-wrap">
                      <input
                        value={newSubEvent.pocUsername}
                        onChange={(e) => updatePocUsername(e.target.value)}
                        onBlur={() => {
                          setTimeout(() => setPocSuggestions([]), 150)
                        }}
                        required
                      />
                      {pocSuggestions.length > 0 && (
                        <ul className="poc-suggestions" role="listbox">
                          {pocSuggestions.map((match) => (
                            <li key={match.username}>
                              <button
                                type="button"
                                onMouseDown={() => {
                                  updateNewSubEvent('pocUsername', match.username)
                                  updateNewSubEvent('pocName', match.displayName)
                                  setPocSuggestions([])
                                }}
                              >
                                <strong>{match.username}</strong>
                                <span className="muted">{match.displayName}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </label>
                  <label>
                    POC name
                    <input value={newSubEvent.pocName} onChange={(e) => updateNewSubEvent('pocName', e.target.value)} required />
                  </label>
                  <label>
                    POC phone
                    <input value={newSubEvent.pocPhone} onChange={(e) => updateNewSubEvent('pocPhone', e.target.value)} required />
                  </label>
                </div>
                <button type="button" className="primary" onClick={addSubEvent} disabled={addingSubEvent}>
                  {addingSubEvent ? 'Adding...' : 'Add sub-event'}
                </button>
              </div>
            </section>
          )}

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
      <PhotoUploadModal
        open={uploadModalOpen}
        title="Upload budget photos"
        description="Drag and drop supported images or browse your device."
        accept={CHROMIUM_IMAGE_ACCEPT}
        onClose={() => setUploadModalOpen(false)}
        onFilesSelected={(files) => {
          addNewBudgetPhotos(files)
          setUploadModalOpen(false)
        }}
      />
    </div>
  )
}

export default EventDetail
