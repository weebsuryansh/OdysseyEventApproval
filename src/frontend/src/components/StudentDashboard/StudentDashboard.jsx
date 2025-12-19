import { useEffect, useState } from 'react'
import Banner from '../Banner/Banner'
import ChangePasswordCard from '../ChangePasswordCard/ChangePasswordCard'
import EventCard from '../EventCard/EventCard'
import TabNavigation from '../TabNavigation/TabNavigation'
import { api, downloadFile } from '../../services/api'
import './StudentDashboard.scss'

const STAGES_COMPLETE = ['APPROVED', 'REJECTED']
const EMPTY_BUDGET_ITEM = { description: '', amount: '' }
const EMPTY_SUB_EVENT = {
  name: '',
  clubId: '',
  budgetHead: '',
  budgetItems: [{ ...EMPTY_BUDGET_ITEM }],
  pocUsername: '',
  pocName: '',
  pocPhone: '',
}

function StudentDashboard() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subEvents, setSubEvents] = useState([{ ...EMPTY_SUB_EVENT }])
  const [events, setEvents] = useState([])
  const [pocRequests, setPocRequests] = useState([])
  const [pocEdits, setPocEdits] = useState({})
  const [clubs, setClubs] = useState([])
  const [message, setMessage] = useState({ type: '', text: '' })
  const [pocMessage, setPocMessage] = useState({ type: '', text: '' })
  const [downloadMessage, setDownloadMessage] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [pocWorkingId, setPocWorkingId] = useState(null)
  const [downloadWorkingId, setDownloadWorkingId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [eventsData, pocData, clubData] = await Promise.all([
        api('/api/events/mine'),
        api('/api/poc/requests'),
        api('/api/clubs'),
      ])
      setEvents(eventsData)
      setPocRequests(pocData)
      setClubs(clubData)
      setPocEdits(
        pocData.reduce((acc, req) => {
          acc[req.subEventId] = {
            budgetHead: req.budgetHead ?? '',
            budgetItems: req.budgetItems?.length ? req.budgetItems.map((item) => ({ ...item })) : [{ ...EMPTY_BUDGET_ITEM }],
          }
          return acc
        }, {})
      )
      setMessage({ type: '', text: '' })
      setPocMessage({ type: '', text: '' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not load your requests. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage({ type: '', text: '' })

    const budgetError = validateSubEvents()
    if (budgetError) {
      setMessage({ type: 'error', text: budgetError })
      setSubmitting(false)
      return
    }
    try {
      const payload = subEvents.map((sub) => ({
        ...sub,
        clubId: Number(sub.clubId),
        budgetHead: sub.budgetHead.trim(),
        budgetItems: sub.budgetItems.map((item) => ({
          description: item.description,
          amount: Number(item.amount),
        })),
      }))
      await api('/api/events', {
        method: 'POST',
        body: JSON.stringify({ title, description, subEvents: payload }),
      })
      setTitle('')
      setDescription('')
      setSubEvents([{ ...EMPTY_SUB_EVENT }])
      setMessage({ type: 'success', text: 'Submitted for POC confirmation.' })
      load()
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not submit event.' })
    } finally {
      setSubmitting(false)
    }
  }

  const pending = events.filter((ev) => !STAGES_COMPLETE.includes(ev.stage))
  const past = events.filter((ev) => STAGES_COMPLETE.includes(ev.stage))

  const tabs = [
    { label: 'Home', value: 'home', variant: 'primary' },
    { label: 'New request', value: 'new' },
    { label: 'Pending', value: 'pending' },
    { label: 'Past', value: 'past' },
    { label: 'Change password', value: 'password' },
  ]

  const addSubEvent = () => {
    if (subEvents.length >= 15) {
      setMessage({ type: 'error', text: 'You can add up to 15 sub-events.' })
      return
    }
    setSubEvents([...subEvents, { ...EMPTY_SUB_EVENT }])
  }

  const addBudgetItem = (subIndex) => {
    const updated = [...subEvents]
    const items = [...(updated[subIndex].budgetItems || [])]
    items.push({ ...EMPTY_BUDGET_ITEM })
    updated[subIndex] = { ...updated[subIndex], budgetItems: items }
    setSubEvents(updated)
  }

  const downloadBudget = async (eventId) => {
    setDownloadWorkingId(eventId)
    setDownloadMessage({ type: '', text: '' })
    try {
      await downloadFile(`/api/events/${eventId}/budget.pdf`, `event-${eventId}-budget.pdf`)
      setDownloadMessage({ type: 'success', text: 'Budget PDF downloaded.' })
    } catch (err) {
      setDownloadMessage({ type: 'error', text: err.message || 'Could not download budget PDF.' })
    } finally {
      setDownloadWorkingId(null)
    }
  }

  const updateBudgetItem = (subIndex, itemIndex, field, value) => {
    const updated = [...subEvents]
    const items = [...(updated[subIndex].budgetItems || [])]
    items[itemIndex] = { ...items[itemIndex], [field]: value }
    updated[subIndex] = { ...updated[subIndex], budgetItems: items }
    setSubEvents(updated)
  }

  const removeBudgetItem = (subIndex, itemIndex) => {
    const updated = [...subEvents]
    const items = [...(updated[subIndex].budgetItems || [])]
    if (items.length === 1) return
    updated[subIndex] = { ...updated[subIndex], budgetItems: items.filter((_, idx) => idx !== itemIndex) }
    setSubEvents(updated)
  }

  const updateSubEvent = (index, field, value) => {
    const updated = [...subEvents]
    updated[index] = { ...updated[index], [field]: value }
    setSubEvents(updated)
  }

  const removeSubEvent = (index) => {
    if (subEvents.length === 1) return
    const updated = subEvents.filter((_, i) => i !== index)
    setSubEvents(updated)
  }

  const calcTotal = (items = []) => items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  const validateSubEvents = () => {
    for (const [index, sub] of subEvents.entries()) {
      if (!sub.clubId) {
        return `Please pick a club for sub-event #${index + 1}`
      }
      if (!sub.budgetHead || !sub.budgetHead.trim()) {
        return `Add who is sanctioning the budget for sub-event #${index + 1}`
      }
      if (!sub.budgetItems?.length) {
        return `Add at least one budget line for sub-event #${index + 1}`
      }
      let hasInvalidLine = false
      let total = 0
      for (const item of sub.budgetItems) {
        const amount = Number(item.amount)
        if (!item.description?.trim() || !amount || amount <= 0) {
          hasInvalidLine = true
          break
        }
        total += amount
      }
      if (hasInvalidLine || total <= 0) {
        return `Please provide valid descriptions and positive amounts for sub-event #${index + 1}`
      }
    }
    return ''
  }

  const decidePoc = async (id, accept) => {
    setPocWorkingId(id)
    setPocMessage({ type: '', text: '' })
    try {
      const current = pocEdits[id]
      if (accept) {
        const head = current?.budgetHead?.trim()
        const total = calcTotal(current?.budgetItems)
        const hasInvalid = (current?.budgetItems || []).some(
          (item) => !item.description?.trim() || !Number(item.amount) || Number(item.amount) <= 0
        )

        if (!head || !current?.budgetItems?.length || hasInvalid || total <= 0) {
          setPocMessage({ type: 'error', text: 'Please provide a sanctioning budget head and valid budget lines before approving.' })
          setPocWorkingId(null)
          return
        }
      }
      await api(`/api/poc/requests/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify({
          accept,
          budgetHead: accept ? current?.budgetHead?.trim() : null,
          budgetItems: accept
            ? current?.budgetItems?.map((item) => ({ description: item.description, amount: Number(item.amount) }))
            : [],
        }),
      })
      setPocMessage({ type: 'success', text: accept ? 'You accepted the POC role.' : 'You declined the POC role.' })
      load()
    } catch (err) {
      setPocMessage({ type: 'error', text: err.message || 'Unable to submit response.' })
    } finally {
      setPocWorkingId(null)
    }
  }

  const updatePocEdit = (id, field, value) => {
    setPocEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const updatePocBudgetItem = (id, index, field, value) => {
    setPocEdits((prev) => {
      const budget = prev[id]?.budgetItems || [{ ...EMPTY_BUDGET_ITEM }]
      const items = [...budget]
      items[index] = { ...items[index], [field]: value }
      return { ...prev, [id]: { ...prev[id], budgetItems: items } }
    })
  }

  const addPocBudgetItem = (id) => {
    setPocEdits((prev) => {
      const budget = prev[id]?.budgetItems || []
      return { ...prev, [id]: { ...prev[id], budgetItems: [...budget, { ...EMPTY_BUDGET_ITEM }] } }
    })
  }

  const removePocBudgetItem = (id, index) => {
    setPocEdits((prev) => {
      const budget = prev[id]?.budgetItems || []
      if (budget.length <= 1) return prev
      return { ...prev, [id]: { ...prev[id], budgetItems: budget.filter((_, i) => i !== index) } }
    })
  }

  return (
    <div className="student-layout">
      <TabNavigation tabs={tabs} active={activeTab} onChange={setActiveTab} />
      <div className="tab-content">
        {activeTab === 'home' && (
          <div className="home-grid">
            <div className="panel card-surface">
              <div className="panel-header">
                <div>
                  <p className="muted">Approve or decline POC requests from your peers</p>
                  <h2>POC confirmations</h2>
                </div>
                <button className="ghost refresh-button" onClick={load} disabled={loading || pocWorkingId !== null}>
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              <Banner status={pocMessage} />
              {loading && <p className="muted">Loading your POC requests...</p>}
              {!loading &&
                pocRequests.map((req) => {
                  const current = pocEdits[req.subEventId] || {
                    budgetHead: req.budgetHead ?? '',
                    budgetItems: req.budgetItems ?? [],
                  }

                  return (
                    <div key={req.subEventId} className="poc-card">
                      <div className="card-header">
                        <div>
                          <p className="muted">Event #{req.eventId}</p>
                          <h3>{req.eventTitle}</h3>
                        </div>
                        <span className="badge stage poc">Awaiting your response</span>
                      </div>
                      <p>{req.eventDescription}</p>
                      <div className="poc-details">
                        <p>
                          <strong>Sub-event:</strong> {req.subEventName}
                        </p>
                        <p>
                          <strong>Club:</strong> {req.clubName}
                        </p>
                        <label>
                          Budget head (sanctioning authority)
                          <input
                            placeholder="Name / designation"
                            value={current.budgetHead}
                            onChange={(e) => updatePocEdit(req.subEventId, 'budgetHead', e.target.value)}
                          />
                        </label>
                        <div className="budget-list">
                          <div className="budget-list-header">
                            <strong>Budget breakdown</strong>
                            <button type="button" className="ghost compact" onClick={() => addPocBudgetItem(req.subEventId)}>
                              + Add line
                            </button>
                          </div>
                          {(current.budgetItems || [{ ...EMPTY_BUDGET_ITEM }]).map((item, idx) => (
                            <div key={idx} className="budget-row">
                              <input
                                placeholder="Description"
                                value={item.description || ''}
                                onChange={(e) => updatePocBudgetItem(req.subEventId, idx, 'description', e.target.value)}
                              />
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Amount"
                                value={item.amount}
                                onChange={(e) => updatePocBudgetItem(req.subEventId, idx, 'amount', e.target.value)}
                              />
                              {current.budgetItems?.length > 1 && (
                                <button
                                  type="button"
                                  className="ghost compact"
                                  onClick={() => removePocBudgetItem(req.subEventId, idx)}
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          ))}
                          <p className="muted total-row">Total budget: {calcTotal(current.budgetItems || []).toFixed(2)}</p>
                        </div>
                        <p className="muted">
                          Requested by {req.requestedBy} · Contact listed: {req.pocName} ({req.pocPhone})
                        </p>
                      </div>
                      <div className="actions">
                        <button disabled={pocWorkingId === req.subEventId} onClick={() => decidePoc(req.subEventId, true)}>
                          {pocWorkingId === req.subEventId ? 'Sending...' : 'Accept'}
                        </button>
                        <button
                          className="danger"
                          disabled={pocWorkingId === req.subEventId}
                          onClick={() => decidePoc(req.subEventId, false)}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )
                })}
              {!loading && pocRequests.length === 0 && <p className="muted">No POC confirmations are waiting on you.</p>}
            </div>

            <div className="panel card-surface">
              <div className="panel-header">
                <div>
                  <p className="muted">Track each step of your submissions</p>
                  <h2>Pending requests</h2>
                </div>
                <button className="ghost refresh-button" onClick={load} disabled={loading}>
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              <Banner status={downloadMessage} />
              {loading ? (
                <p className="muted">Loading your requests...</p>
              ) : (
                pending.map((ev) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    onDownload={() => downloadBudget(ev.id)}
                    downloading={downloadWorkingId === ev.id}
                  />
                ))
              )}
              {!loading && pending.length === 0 && <p className="muted">No pending items right now.</p>}
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="panel card-surface">
            <div className="panel-header">
              <h2>Your pending requests</h2>
              <button className="ghost refresh-button" onClick={load} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            <Banner status={downloadMessage} />
            {loading ? (
              <p className="muted">Loading your requests...</p>
            ) : (
              pending.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onDownload={() => downloadBudget(ev.id)}
                  downloading={downloadWorkingId === ev.id}
                />
              ))
            )}
            {!loading && pending.length === 0 && <p className="muted">No pending items right now.</p>}
          </div>
        )}

        {activeTab === 'past' && (
          <div className="panel card-surface">
            <h2>Past requests</h2>
            <Banner status={downloadMessage} />
            {loading ? (
              <p className="muted">Loading your requests...</p>
            ) : (
              past.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onDownload={() => downloadBudget(ev.id)}
                  downloading={downloadWorkingId === ev.id}
                />
              ))
            )}
            {!loading && past.length === 0 && <p className="muted">No past requests yet.</p>}
          </div>
        )}

        {activeTab === 'new' && (
          <div className="panel card-surface">
            <h2>Request new event</h2>
            <form onSubmit={submit} className="stack">
              <label>
                Title
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </label>
              <label>
                Description
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
              </label>

              <div className="subevent-form">
                <div className="subevent-header">
                  <h3>Sub-events</h3>
                  <button type="button" className="ghost" onClick={addSubEvent}>
                    + Add sub-event
                  </button>
                </div>
                {clubs.length === 0 && (
                  <p className="muted">Add clubs from the admin dashboard to enable selection here.</p>
                )}
                {subEvents.map((sub, index) => (
                  <div className="subevent-card" key={index}>
                    <div className="subevent-card-header">
                      <h4>Sub-event #{index + 1}</h4>
                      {subEvents.length > 1 && (
                        <button type="button" className="ghost" onClick={() => removeSubEvent(index)}>
                          Remove
                        </button>
                      )}
                    </div>
                    <label>
                      Sub-event name
                      <input value={sub.name} onChange={(e) => updateSubEvent(index, 'name', e.target.value)} required />
                    </label>
                    <label>
                      Club
                      <select value={sub.clubId} onChange={(e) => updateSubEvent(index, 'clubId', e.target.value)} required>
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
                        value={sub.budgetHead}
                        onChange={(e) => updateSubEvent(index, 'budgetHead', e.target.value)}
                        required
                      />
                    </label>
                    <div className="budget-list">
                      <div className="budget-list-header">
                        <strong>Budget breakdown</strong>
                        <button type="button" className="ghost compact" onClick={() => addBudgetItem(index)}>
                          + Add line item
                        </button>
                      </div>
                      {(sub.budgetItems || [{ ...EMPTY_BUDGET_ITEM }]).map((item, idx) => (
                        <div key={idx} className="budget-row">
                          <input
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateBudgetItem(index, idx, 'description', e.target.value)}
                            required
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Amount"
                            value={item.amount}
                            onChange={(e) => updateBudgetItem(index, idx, 'amount', e.target.value)}
                            required
                          />
                          {sub.budgetItems?.length > 1 && (
                            <button type="button" className="ghost compact" onClick={() => removeBudgetItem(index, idx)}>
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <p className="muted total-row">Total: {calcTotal(sub.budgetItems || []).toFixed(2)}</p>
                    </div>
                    <div className="poc-grid">
                      <label>
                        POC username
                        <input
                          value={sub.pocUsername}
                          onChange={(e) => updateSubEvent(index, 'pocUsername', e.target.value)}
                          required
                        />
                      </label>
                      <label>
                        POC name
                        <input value={sub.pocName} onChange={(e) => updateSubEvent(index, 'pocName', e.target.value)} required />
                      </label>
                      <label>
                        POC phone
                        <input value={sub.pocPhone} onChange={(e) => updateSubEvent(index, 'pocPhone', e.target.value)} required />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
              <Banner status={message} />
            </form>
          </div>
        )}

        {activeTab === 'password' && <ChangePasswordCard />}
      </div>
    </div>
  )
}

export default StudentDashboard
