import { Card, Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap'

function FilePreview({ file }) {
  if (file.previewType === 'image' && file.previewUrl) {
    return (
      <div
        className="d-flex h-100 w-100 overflow-hidden"
        style={{ borderRadius: 16, backgroundColor: '#0e141a', border: '1px solid #262626' }}
      >
        <img
          src={file.previewUrl}
          alt=""
          className="h-100 w-100"
          style={{ objectFit: 'cover' }}
        />
      </div>
    )
  }

  return (
    <div
      className="d-flex h-100 w-100 align-items-center justify-content-center"
      style={{ borderRadius: 16, backgroundColor: '#0e141a', border: '1px solid #262626' }}
    >
      <i className="bi bi-file-earmark-pdf-fill" aria-hidden="true" style={{ color: '#8f98a3', fontSize: 34 }} />
    </div>
  )
}

export default function FileCard({ file, onClick, onDelete }) {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick?.(event)
    }
  }

  return (
    <Card
      as="div"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="border-0 text-start text-light"
      style={{
        backgroundColor: '#121212',
        borderRadius: 20,
        boxShadow: 'none',
        cursor: 'pointer',
        width: '100%',
        height: 167,
        padding: 9,
      }}
    >
      <Card.Body className="p-0 d-flex flex-column h-100" style={{ minWidth: 0 }}>
        <div
          className="overflow-hidden flex-grow-1"
          style={{
            borderRadius: 16,
            backgroundColor: '#0e141a',
            border: '1px solid #262626',
          }}
        >
          <FilePreview file={file} />
        </div>

        <div className="d-flex align-items-center justify-content-between gap-2 pt-2 px-1" style={{ minWidth: 0 }}>
          <div className="d-flex align-items-center gap-1 flex-grow-1 min-w-0">
            <i className="bi bi-file-earmark-pdf-fill flex-shrink-0" aria-hidden="true" style={{ color: '#8a94a6', fontSize: 12 }} />
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id={`tooltip-file-${file.id}`}>{file.name}</Tooltip>}
            >
              <span
                tabIndex={-1}
                className="text-light d-inline-block mw-100"
                style={{
                  fontSize: 14,
                  lineHeight: 1.4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  pointerEvents: 'auto',
                  outline: 'none',
                }}
              >
                {file.name}
              </span>
            </OverlayTrigger>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown align="end">
              <Dropdown.Toggle
                as="button"
                variant="link"
                aria-label={`${file.name} menu`}
                className="p-0 border-0 kebab-icon shadow-none no-caret"
                style={{ lineHeight: 1 }}
              >
                <i className="bi bi-three-dots-vertical" aria-hidden="true" />
              </Dropdown.Toggle>
              <Dropdown.Menu variant="dark">
                <Dropdown.Item onClick={() => onClick?.()}>Open</Dropdown.Item>
                <Dropdown.Item>Download</Dropdown.Item>
                <Dropdown.Item>Share</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item className="text-danger" onClick={onDelete}>
                  Delete
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}
