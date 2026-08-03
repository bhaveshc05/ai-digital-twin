import { Card, Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap'

export default function FolderCard({
  title,
  meta,
  icon = 'bi-folder-fill',
  iconColor = '#38bdf8',
  menuVisible = true,
  onClick,
  onDelete,
}) {
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
        padding: 17,
      }}
    >
      <Card.Body className="p-0 d-flex flex-column justify-content-between h-100" style={{ minWidth: 0 }}>
        <div className="d-flex align-items-center justify-content-between">
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: '#0e141a',
              border: '1px solid #262626',
            }}
          >
            <i className={`bi ${icon}`} aria-hidden="true" style={{ color: iconColor, fontSize: 18 }} />
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown align="end">
              <Dropdown.Toggle
                as="button"
                variant="link"
                aria-label={`${title} menu`}
                tabIndex={menuVisible ? 0 : -1}
                aria-hidden={!menuVisible}
                className="p-0 border-0 kebab-icon shadow-none no-caret"
                style={{
                  lineHeight: 1,
                  opacity: menuVisible ? 1 : 0,
                  visibility: menuVisible ? 'visible' : 'hidden',
                  pointerEvents: menuVisible ? 'auto' : 'none',
                }}
              >
                <i className="bi bi-three-dots-vertical" aria-hidden="true" />
              </Dropdown.Toggle>
              <Dropdown.Menu variant="dark">
                <Dropdown.Item onClick={() => onClick?.()}>Open</Dropdown.Item>
                <Dropdown.Item>Rename</Dropdown.Item>
                <Dropdown.Item>Share</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item className="text-danger" onClick={onDelete}>
                  Delete
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        <div className="d-flex flex-column gap-1" style={{ minWidth: 0 }}>
          <div className="d-flex align-items-center min-w-0">
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id={`tooltip-folder-${title.replace(/\s+/g, '-')}`}>{title}</Tooltip>}
            >
              <span
                tabIndex={-1}
                className="fw-medium text-light d-inline-block mw-100"
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
                {title}
              </span>
            </OverlayTrigger>
          </div>
          <div
            className="text-secondary"
            style={{
              fontSize: 14,
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {meta}
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}
