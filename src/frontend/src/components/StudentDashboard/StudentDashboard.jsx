import { useEffect, useState } from 'react'
import Banner from '../Banner/Banner'
import ChangePasswordCard from '../ChangePasswordCard/ChangePasswordCard'
import EventCard from '../EventCard/EventCard'
import TabNavigation from '../TabNavigation/TabNavigation'
import { api } from '../../services/api'
import './StudentDashboard.scss'

const STAGES_COMPLETE = ['APPROVED', 'REJECTED']
const EMPTY_BUDGET_ITEM = { description: '', amount: '' }
const EMPTY_SUB_EVENT = {
  name: '',
  budgetHead: '',
  budgetItems: [{ ...EMPTY_BUDGET_ITEM }],
  clubId: '',
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
  const [pocDrafts, setPocDrafts] = useState({})
  const [clubs, setClubs] = useState([])
  const [message, setMessage] = useState({ type: '', text: '' })
  const [pocMessage, setPocMessage] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [pocWorkingId, setPocWorkingId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [eventsData, pocData, clubsData] = await Promise.all([
        api('/api/events/mine'),
        api('/api/poc/requests'),
        api('/api/clubs'),
      ])
      setEvents(eventsData)
      setPocRequests(pocData)
      setClubs(clubsData)
      setPocDrafts(
        Object.fromEntries(
          pocData.map((req) => [
            req.subEventId,
            {
              budgetHead: req.budgetHead?.toString() || '',
              budgetItems: (req.budgetItems || []).map((item) => ({
                description: item.description,
                amount: item.amount?.toString() || '',
              })),
            },
          ])
        )
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
    const preparedSubEvents = []

    for (const sub of subEvents) {
      const budgetPayload = prepareBudgetPayload(sub.budgetHead, sub.budgetItems)
      if (budgetPayload.error) {
        setSubmitting(false)
        setMessage({ type: 'error', text: `${sub.name || 'Sub-event'}: ${budgetPayload.error}` })
        return
      }
      if (!sub.clubId) {
        setSubmitting(false)
        setMessage({ type: 'error', text: `${sub.name || 'Sub-event'}: Please select a club.` })
        return
      }

      preparedSubEvents.push({
        name: sub.name,
        budgetHead: budgetPayload.budgetHead,
        budgetItems: budgetPayload.budgetItems,
        clubId: Number(sub.clubId),
        pocUsername: sub.pocUsername,
        pocName: sub.pocName,
        pocPhone: sub.pocPhone,
      })
    }
    try {
      await api('/api/events', {
        method: 'POST',
        body: JSON.stringify({ title, description, subEvents: preparedSubEvents }),
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

  const prepareBudgetPayload = (budgetHeadValue, itemsValue) => {
    const headNumber = Number(budgetHeadValue)
    if (!budgetHeadValue || Number.isNaN(headNumber) || headNumber <= 0) {
      return { error: 'Please enter a valid budget head total greater than zero.' }
    }
    if (!itemsValue || itemsValue.length === 0) {
      return { error: 'Add at least one budget breakdown item.' }
    }

    const parsedItems = []
    let total = 0
    for (const item of itemsValue) {
      const amountNumber = Number(item.amount)
      if (!item.description?.trim()) {
        return { error: 'Every budget item must have a description.' }
      }
      if (Number.isNaN(amountNumber) || amountNumber <= 0) {
        return { error: 'Each budget item needs an amount greater than zero.' }
      }
      parsedItems.push({ description: item.description.trim(), amount: Number(amountNumber.toFixed(2)) })
      total += amountNumber
    }

    const roundedTotal = Number(total.toFixed(2))
    const roundedHead = Number(headNumber.toFixed(2))
    if (roundedTotal !== roundedHead) {
      return { error: 'Budget breakdown must add up to the budget head.' }
    }

    return { budgetHead: roundedHead, budgetItems: parsedItems }
  }

  const addBudgetItem = (subIndex) => {
    const updated = [...subEvents]
    updated[subIndex] = {
      ...updated[subIndex],
      budgetItems: [...updated[subIndex].budgetItems, { ...EMPTY_BUDGET_ITEM }],
    }
    setSubEvents(updated)
  }

  const updateBudgetItem = (subIndex, itemIndex, field, value) => {
    const updated = [...subEvents]
    const items = [...updated[subIndex].budgetItems]
    items[itemIndex] = { ...items[itemIndex], [field]: value }
    updated[subIndex] = { ...updated[subIndex], budgetItems: items }
    setSubEvents(updated)
  }

  const removeBudgetItem = (subIndex, itemIndex) => {
    const updated = [...subEvents]
    if (updated[subIndex].budgetItems.length === 1) return
    updated[subIndex] = {
      ...updated[subIndex],
      budgetItems: updated[subIndex].budgetItems.filter((_, idx) => idx !== itemIndex),
    }
    setSubEvents(updated)
  }

  const updatePocDraft = (id, updater) => {
    setPocDrafts((current) => ({
      ...current,
      [id]: updater(current[id] || { budgetHead: '', budgetItems: [{ ...EMPTY_BUDGET_ITEM }] }),
    }))
  }

  const decidePoc = async (id, accept) => {
    setPocWorkingId(id)
    setPocMessage({ type: '', text: '' })
    let payload = { accept }
    if (accept) {
      const draft = pocDrafts[id] || { budgetHead: '', budgetItems: [] }
      const budgetPayload = prepareBudgetPayload(draft.budgetHead, draft.budgetItems)
      if (budgetPayload.error) {
        setPocWorkingId(null)
        setPocMessage({ type: 'error', text: budgetPayload.error })
        return
      }
      payload = { ...payload, ...budgetPayload }
    }
    try {
      await api(`/api/poc/requests/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setPocMessage({ type: 'success', text: accept ? 'You accepted the POC role.' : 'You declined the POC role.' })
      load()
    } catch (err) {
      setPocMessage({ type: 'error', text: err.message || 'Unable to submit response.' })
    } finally {
      setPocWorkingId(null)
    }
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
                pocRequests.map((req) => (
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
                      <div>
                        <p>
                          <strong>Sub-event:</strong> {req.subEventName}
                        </p>
                        <p>
                          <strong>Club:</strong> {req.clubName}
                        </p>
                        <p className="muted">
                          Requested by {req.requestedBy} · Contact listed: {req.pocName} ({req.pocPhone})
                        </p>
                      </div>

                      {(() => {
                        const draft = pocDrafts[req.subEventId] || {
                          budgetHead: req.budgetHead?.toString() || '',
                          budgetItems:
                            req.budgetItems?.map((item) => ({
                              description: item.description,
                              amount: item.amount?.toString() || '',
                            })) || [{ ...EMPTY_BUDGET_ITEM }],
                        }
                        const breakdownItems = draft.budgetItems?.length ? draft.budgetItems : [{ ...EMPTY_BUDGET_ITEM }]
                        const total = Number(
                          breakdownItems.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2)
                        )
                        const headNumber = Number(draft.budgetHead || 0)
                        const totalsMatch = draft.budgetHead && Number(headNumber.toFixed(2)) === total

                        return (
                          <div className="budget-editor">
                            <label>
                              Budget head (total)
                              <input
                                type="number"
                                step="0.01"
                                value={draft.budgetHead}
                                onChange={(e) =>
                                  updatePocDraft(req.subEventId, (current) => ({
                                    ...current,
                                    budgetHead: e.target.value,
                                  }))
                                }
                                required
                              />
                            </label>
                            <div className="budget-breakdown">
                              <div className="subevent-card-header">
                                <h4>Budget breakdown</h4>
                                <button
                                  type="button"
                                  className="ghost compact"
                                  onClick={() =>
                                    updatePocDraft(req.subEventId, (current) => ({
                                      ...current,
                                      budgetItems: [...(current.budgetItems || []), { ...EMPTY_BUDGET_ITEM }],
                                    }))
                                  }
                                >
                                  + Add item
                                </button>
                              </div>
                              {breakdownItems.map((item, idx) => (
                                <div className="breakdown-row" key={idx}>
                                  <input
                                    placeholder="Description"
                                    value={item.description}
                                    onChange={(e) =>
                                      updatePocDraft(req.subEventId, (current) => {
                                        const updated = [...(current.budgetItems || [])]
                                        updated[idx] = { ...updated[idx], description: e.target.value }
                                        return { ...current, budgetItems: updated }
                                      })
                                    }
                                    required
                                  />
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Amount"
                                    value={item.amount}
                                    onChange={(e) =>
                                      updatePocDraft(req.subEventId, (current) => {
                                        const updated = [...(current.budgetItems || [])]
                                        updated[idx] = { ...updated[idx], amount: e.target.value }
                                        return { ...current, budgetItems: updated }
                                      })
                                    }
                                    required
                                  />
                                  {breakdownItems.length > 1 && (
                                    <button
                                      type="button"
                                      className="ghost compact"
                                      onClick={() =>
                                        updatePocDraft(req.subEventId, (current) => ({
                                          ...current,
                                          budgetItems: current.budgetItems.filter((_, i) => i !== idx),
                                        }))
                                      }
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              ))}
                              <p className={`muted ${totalsMatch ? 'success' : 'warning'}`}>
                                Breakdown total: {total.toFixed(2)} {totalsMatch ? '✔' : '(must match budget head)'}
                              </p>
                            </div>
                          </div>
                        )
                      })()}
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
                ))}
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
              {loading ? <p className="muted">Loading your requests...</p> : pending.map((ev) => <EventCard key={ev.id} event={ev} />)}
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
            {loading ? <p className="muted">Loading your requests...</p> : pending.map((ev) => <EventCard key={ev.id} event={ev} />)}
            {!loading && pending.length === 0 && <p className="muted">No pending items right now.</p>}
          </div>
        )}

        {activeTab === 'past' && (
          <div className="panel card-surface">
            <h2>Past requests</h2>
            {loading ? <p className="muted">Loading your requests...</p> : past.map((ev) => <EventCard key={ev.id} event={ev} />)}
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
                    <div className="budget-editor">
                      <label>
                        Budget head (total)
                        <input
                          type="number"
                          step="0.01"
                          value={sub.budgetHead}
                          onChange={(e) => updateSubEvent(index, 'budgetHead', e.target.value)}
                          required
                        />
                      </label>
                      <div className="budget-breakdown">
                        <div className="subevent-card-header">
                          <h4>Budget breakdown</h4>
                          <button type="button" className="ghost compact" onClick={() => addBudgetItem(index)}>
                            + Add item
                          </button>
                        </div>
                        {sub.budgetItems.map((item, itemIdx) => (
                          <div className="breakdown-row" key={itemIdx}>
                            <input
                              placeholder="Description"
                              value={item.description}
                              onChange={(e) => updateBudgetItem(index, itemIdx, 'description', e.target.value)}
                              required
                            />
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Amount"
                              value={item.amount}
                              onChange={(e) => updateBudgetItem(index, itemIdx, 'amount', e.target.value)}
                              required
                            />
                            {sub.budgetItems.length > 1 && (
                              <button
                                type="button"
                                className="ghost compact"
                                onClick={() => removeBudgetItem(index, itemIdx)}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                        {(() => {
                          const total = Number(
                            sub.budgetItems.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2)
                          )
                          const headNumber = Number(sub.budgetHead || 0)
                          const totalsMatch = sub.budgetHead && Number(headNumber.toFixed(2)) === total
                          return (
                            <p className={`muted ${totalsMatch ? 'success' : 'warning'}`}>
                              Breakdown total: {total.toFixed(2)} {totalsMatch ? '✔' : '(must match budget head)'}
                            </p>
                          )
                        })()}
                      </div>
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
