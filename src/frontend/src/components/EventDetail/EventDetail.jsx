import { useEffect, useMemo, useState } from 'react'
import Banner from '../Banner/Banner'
import EventStatusPill from '../EventStatusPill/EventStatusPill'
import PhotoUploadModal from '../PhotoUploadModal/PhotoUploadModal'
import { api, downloadFile, resolveApiUrl, uploadFiles } from '../../services/api'
import { CHROMIUM_IMAGE_ACCEPT, INVOICE_FILE_ACCEPT, filterChromiumImages, filterInvoiceFiles } from '../../utils/fileValidation'
import './EventDetail.scss'

const EMPTY_BUDGET_ITEM = { description: '', amount: '' }
const createBudgetItem = () => ({ ...EMPTY_BUDGET_ITEM })
const createInflowItem = () => ({ ...EMPTY_BUDGET_ITEM })
const EMPTY_AFTER_EVENT_ITEM = { description: '', amount: '', invoices: [] }
const createAfterEventItem = () => ({ ...EMPTY_AFTER_EVENT_ITEM })
const normalizeAfterEventDraft = (subEvent) => ({
  items: (subEvent?.afterEventItems || []).map((item) => ({
    description: item?.description || '',
    amount: item?.amount ?? '',
    invoices: (item?.invoices || []).map((invoice) => ({
      url: invoice?.url || '',
      description: invoice?.description || '',
    })),
  })),
  images: (subEvent?.afterEventImages || []).map((image) => ({
    url: image?.url || '',
    description: image?.description || '',
  })),
  budgetStatus: subEvent?.afterEventBudgetStatus || '',
  budgetDelta: subEvent?.afterEventBudgetDelta ?? '',
})
const createSubEvent = () => ({
  name: '',
  clubId: '',
  budgetHead: '',
  budgetItems: [createBudgetItem()],
  inflowItems: [createInflowItem()],
  budgetPhotos: [],
  pocUsername: '',
  pocName: '',
  pocPhone: '',
})

function EventDetail({ eventId, user, onBack, readOnly = false }) {
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [decisionNotice, setDecisionNotice] = useState({ open: false, type: '', text: '' })
  const [remark, setRemark] = useState('')
  const [working, setWorking] = useState(false)
  const [downloadWorking, setDownloadWorking] = useState(false)
  const [inflowWorking, setInflowWorking] = useState(false)
  const [postEventWorking, setPostEventWorking] = useState(false)
  const [subEventWorkingId, setSubEventWorkingId] = useState(null)
  const [clubs, setClubs] = useState([])
  const [newSubEvent, setNewSubEvent] = useState(createSubEvent())
  const [addingSubEvent, setAddingSubEvent] = useState(false)
  const [showAddSubEvent, setShowAddSubEvent] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [pocSuggestions, setPocSuggestions] = useState([])
  const [afterEventDrafts, setAfterEventDrafts] = useState({})
  const [afterEventMessage, setAfterEventMessage] = useState({ type: '', text: '' })
  const [afterEventSavingId, setAfterEventSavingId] = useState(null)
  const [afterEventUpload, setAfterEventUpload] = useState({
    open: false,
    kind: '',
    subEventId: null,
    itemIndex: null,
  })

  const canAct = ['SA_OFFICE', 'FACULTY_COORDINATOR', 'DEAN'].includes(user?.role) && !readOnly
  const isStudent = user?.role === 'STUDENT' && !readOnly
  const canEditSubEvents = isStudent
  const canEditAfterEvent = isStudent && event?.stage === 'APPROVED'
  const showAfterEventSection =
    event?.stage === 'APPROVED' ||
    event?.subEvents?.some(
      (sub) =>
        (sub?.afterEventItems?.length ?? 0) > 0 ||
        (sub?.afterEventImages?.length ?? 0) > 0 ||
        sub?.afterEventBudgetStatus,
    )

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
        const drafts = {}
        ;(data.subEvents || []).forEach((sub) => {
          const normalized = normalizeAfterEventDraft(sub)
          drafts[sub.id] = {
            items: normalized.items.length ? normalized.items : [createAfterEventItem()],
            images: normalized.images,
            budgetStatus: normalized.budgetStatus,
            budgetDelta: normalized.budgetDelta,
          }
        })
        setAfterEventDrafts(drafts)
        setRemark('')
        setShowAddSubEvent(false)
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
    setDecisionNotice({ open: false, type: '', text: '' })
    if (!approve && !remark.trim()) {
      setDecisionNotice({ open: true, type: 'error', text: 'Please add a remark before declining.' })
      setWorking(false)
      return
    }
    try {
      await api(`/api/events/${event.id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ approve, remark }),
      })
      setDecisionNotice({ open: true, type: 'success', text: approve ? 'Event approved.' : 'Event declined.' })
      setRemark('')
      const refreshed = await api(`/api/events/${event.id}`)
      setEvent(refreshed)
    } catch (err) {
      setDecisionNotice({ open: true, type: 'error', text: err.message || 'Action failed. Please try again.' })
    } finally {
      setWorking(false)
    }
  }

  const decideSubEvent = async (subEventId, approve) => {
    if (!event) return
    setSubEventWorkingId(subEventId)
    setDecisionNotice({ open: false, type: '', text: '' })
    try {
      await api(`/api/sub-events/${subEventId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ approve }),
      })
      const refreshed = await api(`/api/events/${event.id}`)
      setEvent(refreshed)
      setDecisionNotice({ open: true, type: 'success', text: approve ? 'Sub-event approved.' : 'Sub-event declined.' })
    } catch (err) {
      setDecisionNotice({ open: true, type: 'error', text: err.message || 'Could not update sub-event status.' })
    } finally {
      setSubEventWorkingId(null)
    }
  }

  const handleDownload = async () => {
    if (!event) return
    setDownloadWorking(true)
    setMessage({ type: '', text: '' })
    try {
      await downloadFile(`/api/events/${event.id}/pre-event.pdf`, `event-${event.id}-pre-event.pdf`)
      setMessage({ type: 'success', text: 'Pre-event document downloaded.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not download pre-event document.' })
    } finally {
      setDownloadWorking(false)
    }
  }

  const handleInflowOutflowDownload = async () => {
    if (!event) return
    setInflowWorking(true)
    setMessage({ type: '', text: '' })
    try {
      await downloadFile(`/api/events/${event.id}/inflow-outflow.pdf`, `event-${event.id}-inflow-outflow.pdf`)
      setMessage({ type: 'success', text: 'Inflow/outflow document downloaded.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not download inflow/outflow document.' })
    } finally {
      setInflowWorking(false)
    }
  }

  const handlePostEventDownload = async () => {
    if (!event) return
    setPostEventWorking(true)
    setMessage({ type: '', text: '' })
    try {
      await downloadFile(`/api/events/${event.id}/post-event.pdf`, `event-${event.id}-post-event.pdf`)
      setMessage({ type: 'success', text: 'Post-event document downloaded.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not download post-event document.' })
    } finally {
      setPostEventWorking(false)
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
  const eventDecisionStatus = () => {
    if (!event) return 'PENDING'
    if (user?.role === 'SA_OFFICE') return event.saStatus
    if (user?.role === 'FACULTY_COORDINATOR') return event.facultyStatus
    if (user?.role === 'DEAN') return event.deanStatus
    return event.saStatus
  }
  const allSubEventsDecided = event?.subEvents?.every((sub) => subEventDecisionStatus(sub) !== 'PENDING')

  const updateNewSubEvent = (field, value) => {
    setNewSubEvent((prev) => ({ ...prev, [field]: value }))
  }

  const updateAfterEventDraft = (subEventId, updater) => {
    setAfterEventDrafts((prev) => {
      const current = prev[subEventId] || { items: [createAfterEventItem()], images: [], budgetStatus: '', budgetDelta: '' }
      const next = updater(current)
      return { ...prev, [subEventId]: next }
    })
  }

  const updateAfterEventItem = (subEventId, index, field, value) => {
    updateAfterEventDraft(subEventId, (current) => {
      const items = [...(current.items || [])]
      items[index] = { ...items[index], [field]: value }
      return { ...current, items }
    })
  }

  const addAfterEventItem = (subEventId) => {
    updateAfterEventDraft(subEventId, (current) => ({
      ...current,
      items: [...(current.items || []), createAfterEventItem()],
    }))
  }

  const removeAfterEventItem = (subEventId, index) => {
    updateAfterEventDraft(subEventId, (current) => ({
      ...current,
      items: (current.items || []).filter((_, idx) => idx !== index),
    }))
  }

  const updateInvoiceDescription = (subEventId, itemIndex, invoiceIndex, value) => {
    updateAfterEventDraft(subEventId, (current) => {
      const items = [...(current.items || [])]
      const invoices = [...(items[itemIndex]?.invoices || [])]
      invoices[invoiceIndex] = { ...invoices[invoiceIndex], description: value }
      items[itemIndex] = { ...items[itemIndex], invoices }
      return { ...current, items }
    })
  }

  const removeInvoice = (subEventId, itemIndex, invoiceIndex) => {
    updateAfterEventDraft(subEventId, (current) => {
      const items = [...(current.items || [])]
      const invoices = [...(items[itemIndex]?.invoices || [])].filter((_, idx) => idx !== invoiceIndex)
      items[itemIndex] = { ...items[itemIndex], invoices }
      return { ...current, items }
    })
  }

  const addInvoiceFiles = async (files) => {
    if (afterEventUpload.subEventId == null || afterEventUpload.itemIndex == null) return
    const { accepted, rejected } = filterInvoiceFiles(files)
    if (rejected.length) {
      setAfterEventMessage({
        type: 'error',
        text: 'Some files were skipped. Please upload PDF or image invoices only.',
      })
    }
    if (!accepted.length) return
    try {
      const uploads = await uploadFiles('/api/after-event-files', accepted)
      updateAfterEventDraft(afterEventUpload.subEventId, (current) => {
        const items = [...(current.items || [])]
        const invoices = [...(items[afterEventUpload.itemIndex]?.invoices || [])]
        uploads.forEach((url) => invoices.push({ url, description: '' }))
        items[afterEventUpload.itemIndex] = { ...items[afterEventUpload.itemIndex], invoices }
        return { ...current, items }
      })
      setAfterEventMessage({ type: 'success', text: 'Invoice files uploaded.' })
    } catch (err) {
      setAfterEventMessage({ type: 'error', text: err.message || 'Could not upload invoice files.' })
    }
  }

  const updateAfterEventImage = (subEventId, index, value) => {
    updateAfterEventDraft(subEventId, (current) => {
      const images = [...(current.images || [])]
      images[index] = { ...images[index], description: value }
      return { ...current, images }
    })
  }

  const removeAfterEventImage = (subEventId, index) => {
    updateAfterEventDraft(subEventId, (current) => ({
      ...current,
      images: (current.images || []).filter((_, idx) => idx !== index),
    }))
  }

  const addAfterEventImages = async (files) => {
    if (afterEventUpload.subEventId == null) return
    const { accepted, rejected } = filterChromiumImages(files)
    if (rejected.length) {
      setAfterEventMessage({
        type: 'error',
        text: 'Some files were skipped. Please upload image files only.',
      })
    }
    if (!accepted.length) return
    try {
      const uploads = await uploadFiles('/api/after-event-files', accepted)
      updateAfterEventDraft(afterEventUpload.subEventId, (current) => ({
        ...current,
        images: [...(current.images || []), ...uploads.map((url) => ({ url, description: '' }))],
      }))
      setAfterEventMessage({ type: 'success', text: 'Event photos uploaded.' })
    } catch (err) {
      setAfterEventMessage({ type: 'error', text: err.message || 'Could not upload event photos.' })
    }
  }

  const updateBudgetStatus = (subEventId, value) => {
    updateAfterEventDraft(subEventId, (current) => ({
      ...current,
      budgetStatus: value,
      budgetDelta: value === 'ON' ? '' : current.budgetDelta,
    }))
  }

  const updateBudgetDelta = (subEventId, value) => {
    updateAfterEventDraft(subEventId, (current) => ({ ...current, budgetDelta: value }))
  }

  const saveAfterEventDetails = async (subEventId) => {
    if (!event) return
    setAfterEventMessage({ type: '', text: '' })
    const draft = afterEventDrafts[subEventId] || { items: [], images: [], budgetStatus: '', budgetDelta: '' }
    const trimmedItems = (draft.items || []).filter((item) => item.description || item.amount || item.invoices?.length)
    if (trimmedItems.length === 0) {
      setAfterEventMessage({ type: 'error', text: 'Please add at least one expense item.' })
      return
    }
    for (const [index, item] of trimmedItems.entries()) {
      if (!item.description?.trim()) {
        setAfterEventMessage({ type: 'error', text: `Expense item #${index + 1} needs a description.` })
        return
      }
      if (!item.amount || Number(item.amount) <= 0) {
        setAfterEventMessage({ type: 'error', text: `Expense item #${index + 1} needs a valid amount.` })
        return
      }
      for (const [invoiceIndex, invoice] of (item.invoices || []).entries()) {
        if (!invoice.description?.trim()) {
          setAfterEventMessage({
            type: 'error',
            text: `Invoice #${invoiceIndex + 1} for item #${index + 1} needs a description.`,
          })
          return
        }
      }
    }
    if (draft.budgetStatus && draft.budgetStatus !== 'ON' && (!draft.budgetDelta || Number(draft.budgetDelta) <= 0)) {
      setAfterEventMessage({ type: 'error', text: 'Please enter a budget variance amount.' })
      return
    }
    setAfterEventSavingId(subEventId)
    try {
      await api(`/api/sub-events/${subEventId}/after-event`, {
        method: 'PUT',
        body: JSON.stringify({
          items: trimmedItems.map((item) => ({
            description: item.description,
            amount: Number(item.amount),
            invoices: item.invoices || [],
          })),
          images: draft.images || [],
          budgetStatus: draft.budgetStatus || null,
          budgetDelta: draft.budgetStatus === 'ON' || !draft.budgetStatus ? null : Number(draft.budgetDelta),
        }),
      })
      const refreshed = await api(`/api/events/${event.id}`)
      setEvent(refreshed)
      const drafts = {}
      ;(refreshed.subEvents || []).forEach((sub) => {
        const normalized = normalizeAfterEventDraft(sub)
        drafts[sub.id] = {
          items: normalized.items.length ? normalized.items : [createAfterEventItem()],
          images: normalized.images,
          budgetStatus: normalized.budgetStatus,
          budgetDelta: normalized.budgetDelta,
        }
      })
      setAfterEventDrafts(drafts)
      setAfterEventMessage({ type: 'success', text: 'After-event details saved.' })
    } catch (err) {
      setAfterEventMessage({ type: 'error', text: err.message || 'Could not save after-event details.' })
    } finally {
      setAfterEventSavingId(null)
    }
  }

  const updateNewBudgetItem = (index, field, value) => {
    setNewSubEvent((prev) => {
      const items = [...(prev.budgetItems || [])]
      items[index] = { ...items[index], [field]: value }
      return { ...prev, budgetItems: items }
    })
  }

  const updateNewInflowItem = (index, field, value) => {
    setNewSubEvent((prev) => {
      const items = [...(prev.inflowItems || [])]
      items[index] = { ...items[index], [field]: value }
      return { ...prev, inflowItems: items }
    })
  }

  const addNewBudgetItem = () => {
    setNewSubEvent((prev) => ({
      ...prev,
      budgetItems: [...(prev.budgetItems || []), createBudgetItem()],
    }))
  }

  const addNewInflowItem = () => {
    setNewSubEvent((prev) => ({
      ...prev,
      inflowItems: [...(prev.inflowItems || []), createInflowItem()],
    }))
  }

  const removeNewBudgetItem = (index) => {
    setNewSubEvent((prev) => {
      const items = [...(prev.budgetItems || [])]
      if (items.length <= 1) return prev
      return { ...prev, budgetItems: items.filter((_, idx) => idx !== index) }
    })
  }

  const removeNewInflowItem = (index) => {
    setNewSubEvent((prev) => {
      const items = [...(prev.inflowItems || [])]
      if (items.length <= 1) return prev
      return { ...prev, inflowItems: items.filter((_, idx) => idx !== index) }
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
        inflowItems: newSubEvent.inflowItems.map((item) => ({
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
      setShowAddSubEvent(false)
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

  const afterEventDraftFor = (subEventId) =>
    afterEventDrafts[subEventId] || { items: [createAfterEventItem()], images: [], budgetStatus: '', budgetDelta: '' }

  const isImageFile = (url = '') => {
    const lower = url.toLowerCase()
    return ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg'].some((ext) => lower.includes(ext))
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
            {downloadWorking ? 'Preparing document...' : 'Download pre-event document'}
          </button>
          <button className="ghost" onClick={handleInflowOutflowDownload} disabled={inflowWorking || !event}>
            {inflowWorking ? 'Preparing document...' : 'Download inflow/outflow document'}
          </button>
          {event?.stage === 'APPROVED' && (
            <button className="ghost" onClick={handlePostEventDownload} disabled={postEventWorking || !event}>
              {postEventWorking ? 'Preparing document...' : 'Download post-event document'}
            </button>
          )}
        </div>
      </div>

      <Banner status={message} />
      {decisionNotice.open && (
        <div className="decision-modal" role="dialog" aria-live="polite">
          <div
            className="decision-modal__backdrop"
            onClick={() => setDecisionNotice({ open: false, type: '', text: '' })}
          />
          <div className="decision-modal__content">
            <p className={`decision-modal__title ${decisionNotice.type}`}>{decisionNotice.type === 'error' ? 'Action failed' : 'Action completed'}</p>
            <p className="decision-modal__message">{decisionNotice.text}</p>
            <button
              type="button"
              className="primary"
              onClick={() => setDecisionNotice({ open: false, type: '', text: '' })}
            >
              Close
            </button>
          </div>
        </div>
      )}
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
              <div className="section-header__actions">
                {event.subEvents?.length > 3 && <span className="pill muted-pill">{event.subEvents.length} entries</span>}
                {canEditSubEvents && (
                  <button type="button" className="ghost" onClick={() => setShowAddSubEvent((prev) => !prev)}>
                    {showAddSubEvent ? 'Hide sub-event form' : 'Add sub-event'}
                  </button>
                )}
              </div>
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
                    {sub.inflowItems?.length > 0 && (
                      <div className="budget-table">
                        <div className="budget-table__header">
                          <span>Inflow source</span>
                          <span>Amount</span>
                        </div>
                        {sub.inflowItems.map((item, idx) => (
                          <div key={`inflow-${idx}`} className="budget-table__row">
                            <span>{item.description}</span>
                            <span>₹{Number(item.amount || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
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
                      {subEventDecisionStatus(sub) === 'PENDING' && (
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
                      )}
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

          {canEditSubEvents && showAddSubEvent && (
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
                <div className="budget-list">
                  <div className="budget-list-header">
                    <strong>Inflow sources</strong>
                    <button type="button" className="ghost compact" onClick={addNewInflowItem}>
                      + Add source
                    </button>
                  </div>
                  {(newSubEvent.inflowItems || [{ ...EMPTY_BUDGET_ITEM }]).map((item, idx) => (
                    <div key={`inflow-${idx}`} className="budget-row">
                      <input
                        placeholder="Source description"
                        value={item.description}
                        onChange={(e) => updateNewInflowItem(idx, 'description', e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount"
                        value={item.amount}
                        onChange={(e) => updateNewInflowItem(idx, 'amount', e.target.value)}
                        required
                      />
                      {newSubEvent.inflowItems?.length > 1 && (
                        <button type="button" className="ghost compact" onClick={() => removeNewInflowItem(idx)}>
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <p className="muted total-row">Total: {calcTotal(newSubEvent.inflowItems || []).toFixed(2)}</p>
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

          {showAfterEventSection && (
            <section className="after-event card-surface">
              <div className="section-header">
                <div>
                  <p className="muted">Share expenses, invoices, and photos from the completed event.</p>
                  <h2>After-event details</h2>
                </div>
              </div>
              <Banner status={afterEventMessage} />
              <div className="after-event__grid">
                {event?.subEvents?.map((sub) => {
                  const draft = afterEventDraftFor(sub.id)
                  const items = canEditAfterEvent ? draft.items : sub.afterEventItems || []
                  const images = canEditAfterEvent ? draft.images : sub.afterEventImages || []
                  const budgetStatus = canEditAfterEvent ? draft.budgetStatus : sub.afterEventBudgetStatus
                  const budgetDelta = canEditAfterEvent ? draft.budgetDelta : sub.afterEventBudgetDelta
                  return (
                    <div key={`after-${sub.id}`} className="after-event__subevent">
                      <div className="after-event__subheader">
                        <div>
                          <p className="muted">Sub-event</p>
                          <h3>{sub.name}</h3>
                          <p className="muted">Club: {sub.clubName}</p>
                        </div>
                        {canEditAfterEvent && (
                          <div className="after-event__actions">
                            <button type="button" className="ghost compact" onClick={() => addAfterEventItem(sub.id)}>
                              + Add expense
                            </button>
                            <button
                              type="button"
                              className="primary"
                              onClick={() => saveAfterEventDetails(sub.id)}
                              disabled={afterEventSavingId === sub.id}
                            >
                              {afterEventSavingId === sub.id ? 'Saving...' : 'Save details'}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="after-event__items">
                        {items?.length ? (
                          items.map((item, index) => (
                            <div key={`after-item-${sub.id}-${index}`} className="after-event__item">
                              <div className="after-event__row">
                                {canEditAfterEvent ? (
                                  <>
                                    <input
                                      placeholder="Expense description"
                                      value={item.description || ''}
                                      onChange={(e) => updateAfterEventItem(sub.id, index, 'description', e.target.value)}
                                    />
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="Amount"
                                      value={item.amount || ''}
                                      onChange={(e) => updateAfterEventItem(sub.id, index, 'amount', e.target.value)}
                                    />
                                    {items.length > 1 && (
                                      <button
                                        type="button"
                                        className="ghost compact"
                                        onClick={() => removeAfterEventItem(sub.id, index)}
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <div className="budget-table">
                                    <div className="budget-table__header">
                                      <span>Description</span>
                                      <span>Amount</span>
                                    </div>
                                    <div className="budget-table__row">
                                      <span>{item.description}</span>
                                      <span>₹{Number(item.amount || 0).toFixed(2)}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="after-event__invoices">
                                <div className="after-event__header">
                                  <strong>Invoices</strong>
                                  {canEditAfterEvent && (
                                    <button
                                      type="button"
                                      className="ghost compact"
                                      onClick={() =>
                                        setAfterEventUpload({
                                          open: true,
                                          kind: 'invoice',
                                          subEventId: sub.id,
                                          itemIndex: index,
                                        })
                                      }
                                    >
                                      + Upload invoices
                                    </button>
                                  )}
                                </div>
                                {item.invoices?.length ? (
                                  <div className="after-event__invoice-list">
                                    {item.invoices.map((invoice, invoiceIndex) => (
                                      <div key={`invoice-${sub.id}-${index}-${invoiceIndex}`} className="after-event__invoice">
                                        <a href={resolveApiUrl(invoice.url)} target="_blank" rel="noreferrer">
                                          {invoice.url?.split('/').pop() || `Invoice ${invoiceIndex + 1}`}
                                        </a>
                                        {isImageFile(invoice.url) && !canEditAfterEvent && (
                                          <img src={resolveApiUrl(invoice.url)} alt={`Invoice ${invoiceIndex + 1}`} />
                                        )}
                                        {canEditAfterEvent ? (
                                          <>
                                            <input
                                              type="text"
                                              placeholder="Invoice description"
                                              value={invoice.description || ''}
                                              onChange={(e) =>
                                                updateInvoiceDescription(sub.id, index, invoiceIndex, e.target.value)
                                              }
                                            />
                                            <button
                                              type="button"
                                              className="ghost compact"
                                              onClick={() => removeInvoice(sub.id, index, invoiceIndex)}
                                            >
                                              Remove
                                            </button>
                                          </>
                                        ) : (
                                          invoice.description && <p className="muted">{invoice.description}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="muted">No invoices uploaded yet.</p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="muted">No expenses added yet.</p>
                        )}
                      </div>

                      <div className="after-event__budget">
                        <div className="after-event__header">
                          <strong>Budget variance</strong>
                        </div>
                        {canEditAfterEvent ? (
                          <div className="after-event__row">
                            <select
                              value={budgetStatus || ''}
                              onChange={(e) => updateBudgetStatus(sub.id, e.target.value)}
                            >
                              <option value="">Select status</option>
                              <option value="OVER">Over budget</option>
                              <option value="UNDER">Under budget</option>
                              <option value="ON">On budget</option>
                            </select>
                            {budgetStatus && budgetStatus !== 'ON' && (
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Amount"
                                value={budgetDelta || ''}
                                onChange={(e) => updateBudgetDelta(sub.id, e.target.value)}
                              />
                            )}
                          </div>
                        ) : budgetStatus ? (
                          <p className="muted">
                            {budgetStatus === 'OVER' && `Over budget by ₹${Number(budgetDelta || 0).toFixed(2)}`}
                            {budgetStatus === 'UNDER' && `Under budget by ₹${Number(budgetDelta || 0).toFixed(2)}`}
                            {budgetStatus === 'ON' && 'On budget'}
                          </p>
                        ) : (
                          <p className="muted">No budget variance noted.</p>
                        )}
                      </div>

                      <div className="after-event__photos">
                        <div className="after-event__header">
                          <strong>Event images</strong>
                          {canEditAfterEvent && (
                            <button
                              type="button"
                              className="ghost compact"
                              onClick={() =>
                                setAfterEventUpload({
                                  open: true,
                                  kind: 'image',
                                  subEventId: sub.id,
                                  itemIndex: null,
                                })
                              }
                            >
                              + Upload photos
                            </button>
                          )}
                        </div>
                        {images?.length ? (
                          <div className="budget-photo-grid__items">
                            {images.map((photo, index) => (
                              <div key={`after-photo-${sub.id}-${index}`} className="budget-photo-grid__item">
                                <img src={resolveApiUrl(photo.url)} alt={`Event photo ${index + 1}`} />
                                {canEditAfterEvent ? (
                                  <>
                                    <input
                                      type="text"
                                      placeholder="Add a short description"
                                      value={photo.description || ''}
                                      onChange={(e) => updateAfterEventImage(sub.id, index, e.target.value)}
                                    />
                                    <button
                                      type="button"
                                      className="ghost compact"
                                      onClick={() => removeAfterEventImage(sub.id, index)}
                                    >
                                      Remove
                                    </button>
                                  </>
                                ) : (
                                  photo.description && <p className="muted">{photo.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="muted">No event photos uploaded yet.</p>
                        )}
                      </div>
                    </div>
                  )
                })}
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
              {!allSubEventsDecided && (
                <p className="muted">Approve or decline all sub-events before deciding on the overall event.</p>
              )}
              <p className="muted">Your decision: {stageLabel(eventDecisionStatus())}</p>
              {eventDecisionStatus() === 'PENDING' && allSubEventsDecided && (
                <>
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
                </>
              )}
            </section>
          )}
        </>
      )}
      <PhotoUploadModal
        open={uploadModalOpen}
        title="Upload budget photos"
        description="Drag and drop supported images or browse your device."
        accept={CHROMIUM_IMAGE_ACCEPT}
        dropLabel="Drag and drop photos here"
        buttonLabel="Browse photos"
        onClose={() => setUploadModalOpen(false)}
        onFilesSelected={(files) => {
          addNewBudgetPhotos(files)
          setUploadModalOpen(false)
        }}
      />
      <PhotoUploadModal
        open={afterEventUpload.open && afterEventUpload.kind === 'invoice'}
        title="Upload invoices"
        description="Drag and drop PDF or image invoices."
        accept={INVOICE_FILE_ACCEPT}
        dropLabel="Drag and drop invoices here"
        buttonLabel="Browse invoices"
        onClose={() => setAfterEventUpload({ open: false, kind: '', subEventId: null, itemIndex: null })}
        onFilesSelected={(files) => {
          addInvoiceFiles(files)
          setAfterEventUpload({ open: false, kind: '', subEventId: null, itemIndex: null })
        }}
      />
      <PhotoUploadModal
        open={afterEventUpload.open && afterEventUpload.kind === 'image'}
        title="Upload event photos"
        description="Drag and drop event photos or browse your device."
        accept={CHROMIUM_IMAGE_ACCEPT}
        dropLabel="Drag and drop event photos here"
        buttonLabel="Browse photos"
        onClose={() => setAfterEventUpload({ open: false, kind: '', subEventId: null, itemIndex: null })}
        onFilesSelected={(files) => {
          addAfterEventImages(files)
          setAfterEventUpload({ open: false, kind: '', subEventId: null, itemIndex: null })
        }}
      />
    </div>
  )
}

export default EventDetail
