import { Breadcrumb } from 'react-bootstrap'

export default function LibraryBreadcrumb({ segments, onNavigate }) {
  const items = [{ id: '__home__', name: 'Home' }, ...segments]

  return (
    <Breadcrumb
      className="mb-0"
      style={{
        '--bs-breadcrumb-divider': '">"',
      }}
    >
      {items.map((segment, index) => {
        const isLast = index === items.length - 1
        const isHome = index === 0

        return (
          <Breadcrumb.Item
            key={`${segment.id}-${index}`}
            active={isLast}
            href={isLast ? undefined : '#'}
            onClick={(event) => {
              if (isLast) {
                return
              }

              event.preventDefault()
              onNavigate(isHome ? null : segment.id)
            }}
            className="text-decoration-none"
            style={{
              cursor: isLast ? 'default' : 'pointer',
            }}
          >
            {segment.name}
          </Breadcrumb.Item>
        )
      })}
    </Breadcrumb>
  )
}
