import { useRef, useState } from 'react'
import './PhotoUploadModal.scss'

function PhotoUploadModal({
  open,
  title,
  description,
  accept,
  dropLabel = 'Drag and drop files here',
  buttonLabel = 'Browse files',
  onClose,
  onFilesSelected,
}) {
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef(null)

  if (!open) return null

  const handleFiles = (files) => {
    if (!files?.length) return
    onFilesSelected(Array.from(files))
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  return (
    <div className="photo-upload-modal">
      <div className="photo-upload-modal__overlay" onClick={onClose} />
      <div className="photo-upload-modal__content" role="dialog" aria-modal="true">
        <div className="photo-upload-modal__header">
          <div>
            <h3>{title}</h3>
            {description && <p className="muted">{description}</p>}
          </div>
          <button type="button" className="ghost compact" onClick={onClose}>
            Close
          </button>
        </div>
        <div
          className={`photo-upload-modal__dropzone ${dragging ? 'dragging' : ''}`}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <p className="muted">{dragging ? 'Release to upload files' : dropLabel}</p>
          <span className="muted small-label">or</span>
          <button type="button" className="primary" onClick={() => fileInputRef.current?.click()}>
            {buttonLabel}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            onChange={(event) => {
              handleFiles(event.target.files)
              event.target.value = ''
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default PhotoUploadModal
