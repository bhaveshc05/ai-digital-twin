import { useMemo, useState, useEffect, useContext, useRef } from 'react'
import { Button, Dropdown, Form, InputGroup, Modal } from 'react-bootstrap'
import { AuthContext } from '../context/AuthContext'
import FileCard from '../components/FileCard.jsx'
import FolderCard from '../components/FolderCard.jsx'
import LibraryBreadcrumb from '../components/LibraryBreadcrumb.jsx'
import { initialLibraryItems } from '../data/mockData.js'

const headerStyle = {
  height: 64,
  backgroundColor: '#121920',
  borderBottom: '1px solid #3e484f',
}

const canvasStyle = {
  minHeight: 'calc(100vh - 64px)',
  padding: 24,
  backgroundColor: '#0F172A',
}

function normalizeQuery(value) {
  return value.trim().toLowerCase()
}

/** Walk parentId chain from a folder up to root, returning segments for breadcrumb. */
function buildBreadcrumbSegments(folderId, itemsMap) {
  const segments = []
  let current = folderId

  while (current !== null) {
    const item = itemsMap.get(current)
    if (!item) break
    segments.unshift({ id: item.id, name: item.name })
    current = item.parentId
  }

  // Always start with Library (root)
  segments.unshift({ id: null, name: 'Library' })
  return segments
}

/** Count direct children of a folder. */
function countChildren(folderId, items) {
  return items.filter((item) => item.parentId === folderId).length
}

export default function Library() {
  const { user } = useContext(AuthContext)
  const [items, setItems] = useState(initialLibraryItems.filter(item => item.type === 'folder'))
  const [currentFolderId, setCurrentFolderId] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const fetchDocuments = async () => {
    if (!user?.student_id) return
    try {
      const response = await fetch(`http://localhost:8000/api/v1/documents/${user.student_id}`)
      if (response.ok) {
        const data = await response.json()
        const fetchedFiles = data.documents.map((doc) => ({
          id: doc.document_id,
          name: doc.filename,
          type: 'file',
          parentId: null,
          uploadedAt: doc.created_at || new Date().toISOString(),
          size: 'Unknown',
        }))
        setItems(prev => {
          const folders = prev.filter(item => item.type === 'folder')
          return [...folders, ...fetchedFiles]
        })
      }
    } catch (error) {
      console.error("Failed to fetch documents", error)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [user])

  const handleUploadFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !user?.student_id) return
    
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('student_id', user.student_id)
      
      const response = await fetch(`http://localhost:8000/api/v1/documents/${user.student_id}`, {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        await fetchDocuments()
      } else {
        console.error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }
  const [searchQuery, setSearchQuery] = useState('')
  const [sortMode, setSortMode] = useState('recent')
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [itemToDelete, setItemToDelete] = useState(null)

  const query = normalizeQuery(searchQuery)

  // Build a map for quick lookups
  const itemsMap = useMemo(() => {
    const map = new Map()
    for (const item of items) {
      map.set(item.id, item)
    }
    return map
  }, [items])

  const currentFolder = currentFolderId ? itemsMap.get(currentFolderId) || null : null

  const breadcrumbSegments = useMemo(
    () => buildBreadcrumbSegments(currentFolderId, itemsMap),
    [currentFolderId, itemsMap],
  )

  const searchPlaceholder = useMemo(() => {
    if (currentFolder) {
      return `Search in ${currentFolder.name}...`
    }
    return 'Search files, folders...'
  }, [currentFolder])

  // Get children of current folder, filtered and sorted
  const childFolders = useMemo(() => {
    const filtered = items.filter((item) => {
      if (item.parentId !== currentFolderId || item.type !== 'folder') return false
      if (query) return item.name.toLowerCase().includes(query)
      return true
    })

    return [...filtered].sort((left, right) => {
      switch (sortMode) {
        case 'name-asc':
          return left.name.localeCompare(right.name)
        case 'name-desc':
          return right.name.localeCompare(left.name)
        case 'count-desc': {
          const leftCount = countChildren(left.id, items)
          const rightCount = countChildren(right.id, items)
          return rightCount - leftCount
        }
        default:
          return 0
      }
    })
  }, [items, currentFolderId, query, sortMode])

  const childFiles = useMemo(() => {
    const filtered = items.filter((item) => {
      if (item.parentId !== currentFolderId || item.type !== 'file') return false
      if (query) return item.name.toLowerCase().includes(query)
      return true
    })

    return [...filtered].sort((left, right) => {
      switch (sortMode) {
        case 'name-asc':
          return left.name.localeCompare(right.name)
        case 'name-desc':
          return right.name.localeCompare(left.name)
        default:
          return (right.uploadedAt || '').localeCompare(left.uploadedAt || '')
      }
    })
  }, [items, currentFolderId, query, sortMode])

  const isEmpty = childFolders.length === 0 && childFiles.length === 0

  const navigateToFolder = (folderId) => {
    setCurrentFolderId(folderId)
    setSearchQuery('')
  }

  const handleCreateFolder = () => {
    const trimmedName = newFolderName.trim()
    if (!trimmedName) return

    const newFolder = {
      id: crypto.randomUUID(),
      name: trimmedName,
      type: 'folder',
      parentId: currentFolderId,
      autoGenerated: false,
    }

    setItems((prev) => [...prev, newFolder])
    setNewFolderName('')
    setShowNewFolderModal(false)
  }

  const handleConfirmDelete = () => {
    if (!itemToDelete) return

    const idsToDelete = new Set([itemToDelete.id])
    if (itemToDelete.type === 'folder') {
      const queue = [itemToDelete.id]
      while (queue.length > 0) {
        const currentId = queue.shift()
        const children = items.filter((item) => item.parentId === currentId)
        for (const child of children) {
          idsToDelete.add(child.id)
          if (child.type === 'folder') {
            queue.push(child.id)
          }
        }
      }
    }

    setItems((prev) => prev.filter((item) => !idsToDelete.has(item.id)))

    if (idsToDelete.has(currentFolderId)) {
      setCurrentFolderId(itemToDelete.parentId || null)
    }

    setItemToDelete(null)
  }

  const handleNewFolderKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleCreateFolder()
    }
  }

  const getFolderMeta = (folder) => {
    const count = countChildren(folder.id, items)
    return `${count} Item${count !== 1 ? 's' : ''}`
  }

  return (
    <div className="min-vh-100 text-light" style={{ backgroundColor: '#0F172A' }}>
      <header style={headerStyle}>
        <div className="d-flex h-100 align-items-center px-4">
          <div className="fw-bold" style={{ color: '#8ed5ff', fontSize: 24, lineHeight: 1, flex: '1 1 0' }}>
            Library
          </div>

          <div className="d-flex justify-content-center flex-grow-1" style={{ maxWidth: 696 }}>
            <InputGroup
              className="w-100 overflow-hidden"
              style={{
                height: 41,
                borderRadius: 12,
                backgroundColor: '#121212',
                border: '1px solid #262626',
              }}
            >
              <InputGroup.Text className="border-0 bg-transparent ps-3 pe-2" style={{ borderRadius: 12, color: '#8a94a6' }}>
                <i className="bi bi-search" aria-hidden="true" />
              </InputGroup.Text>
              <Form.Control
                type="search"
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="border-0 bg-transparent text-light shadow-none pe-3"
                style={{ height: 41 }}
              />
            </InputGroup>
          </div>

          <div className="d-flex align-items-center justify-content-end" style={{ flex: '1 1 0' }}>
            <Button
              type="button"
              variant="link"
              aria-label="Profile"
              className="d-inline-flex align-items-center justify-content-center border-0 kebab-icon shadow-none p-0"
              style={{ width: 36, height: 36, borderRadius: 12 }}
            >
              <i className="bi bi-person-circle" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      <main style={canvasStyle}>
        <div className="mx-auto w-100" style={{ maxWidth: 1440 }}>
          <div className="d-flex align-items-center justify-content-between pb-3">
            <LibraryBreadcrumb segments={breadcrumbSegments} onNavigate={navigateToFolder} />

            <Dropdown align="end">
              <Dropdown.Toggle
                as="button"
                variant="link"
                aria-label="Sort files"
                className="d-inline-flex align-items-center justify-content-center border-0 kebab-icon shadow-none no-caret p-0"
                style={{ width: 36, height: 36, borderRadius: 12 }}
              >
                <i className="bi bi-sliders" aria-hidden="true" />
              </Dropdown.Toggle>
              <Dropdown.Menu variant="dark">
                <Dropdown.Item active={sortMode === 'recent'} onClick={() => setSortMode('recent')}>
                  Recently modified
                </Dropdown.Item>
                <Dropdown.Item active={sortMode === 'name-asc'} onClick={() => setSortMode('name-asc')}>
                  Name A to Z
                </Dropdown.Item>
                <Dropdown.Item active={sortMode === 'name-desc'} onClick={() => setSortMode('name-desc')}>
                  Name Z to A
                </Dropdown.Item>
                <Dropdown.Item active={sortMode === 'count-desc'} onClick={() => setSortMode('count-desc')}>
                  Most items
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>

          {/* Folders */}
          {childFolders.length > 0 ? (
            <section className="library-grid pb-4">
              {childFolders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  title={folder.name}
                  meta={getFolderMeta(folder)}
                  icon={folder.icon || 'bi-folder-fill'}
                  iconColor={folder.iconColor || '#38bdf8'}
                  onClick={() => navigateToFolder(folder.id)}
                  onDelete={() => setItemToDelete(folder)}
                />
              ))}
            </section>
          ) : null}

          {/* Files */}
          {childFiles.length > 0 ? (
            <section className="library-grid pb-4">
              {childFiles.map((file) => (
                <FileCard key={file.id} file={file} onDelete={() => setItemToDelete(file)} />
              ))}
            </section>
          ) : null}

          {/* Empty state */}
          {isEmpty ? (
            <div
              className="d-flex flex-column align-items-center justify-content-center"
              style={{ paddingTop: 80, paddingBottom: 80, color: '#8a94a6' }}
            >
              <i
                className="bi bi-folder2-open"
                aria-hidden="true"
                style={{ fontSize: 48, marginBottom: 16, opacity: 0.6, color: '#8a94a6' }}
              />
              <div style={{ fontSize: 16 }}>No files here yet</div>
            </div>
          ) : null}
        </div>
      </main>

      {/* FAB dropdown */}
      <Dropdown drop="up" align="end" className="position-fixed" style={{ right: 24, bottom: 24, zIndex: 1050 }}>
        <Dropdown.Toggle
          as="button"
          aria-label="Add new item"
          className="border-0 shadow-lg d-inline-flex align-items-center justify-content-center text-dark"
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: '#38bdf8',
          }}
        >
          <i className="bi bi-plus-lg" aria-hidden="true" style={{ fontSize: 22, lineHeight: 1 }} />
        </Dropdown.Toggle>
        <Dropdown.Menu variant="dark">
          <Dropdown.Item onClick={() => setShowNewFolderModal(true)}>
            <i className="bi bi-folder-plus me-2" aria-hidden="true" />
            New Folder
          </Dropdown.Item>
          <Dropdown.Item onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            <i className="bi bi-upload me-2" aria-hidden="true" />
            {isUploading ? 'Uploading...' : 'Upload File'}
          </Dropdown.Item>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="application/pdf"
            onChange={handleUploadFile}
          />
        </Dropdown.Menu>
      </Dropdown>

      {/* New Folder Modal */}
      <Modal
        show={showNewFolderModal}
        onHide={() => {
          setShowNewFolderModal(false)
          setNewFolderName('')
        }}
        centered
        contentClassName="library-modal"
      >
        <Modal.Header closeButton closeVariant="white" className="border-0 pb-0">
          <Modal.Title style={{ fontSize: 18, fontWeight: 600 }}>New Folder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            type="text"
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={handleNewFolderKeyDown}
            autoFocus
            className="bg-transparent text-light border-secondary"
            style={{ borderRadius: 10, height: 44 }}
          />
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            type="button"
            variant="link"
            onClick={() => {
              setShowNewFolderModal(false)
              setNewFolderName('')
            }}
            className="border-0 text-decoration-none"
            style={{
              borderRadius: 10,
              backgroundColor: '#121212',
              border: '1px solid #262626',
              color: '#8a94a6',
              padding: '6px 16px',
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={!newFolderName.trim()}
            onClick={handleCreateFolder}
            className="border-0 text-dark fw-semibold"
            style={{ borderRadius: 10, backgroundColor: '#38bdf8' }}
          >
            Create
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal
        show={itemToDelete !== null}
        onHide={() => setItemToDelete(null)}
        centered
        contentClassName="library-modal"
      >
        <Modal.Header closeButton closeVariant="white" className="border-0 pb-0">
          <Modal.Title style={{ fontSize: 18, fontWeight: 600 }}>
            Delete {itemToDelete?.type === 'folder' ? 'Folder' : 'File'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ color: '#e2e8f0' }}>
          Delete &lsquo;<span className="fw-semibold">{itemToDelete?.name}</span>&rsquo;? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            type="button"
            variant="link"
            onClick={() => setItemToDelete(null)}
            className="border-0 text-decoration-none"
            style={{
              borderRadius: 10,
              backgroundColor: '#121212',
              border: '1px solid #262626',
              color: '#8a94a6',
              padding: '6px 16px',
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirmDelete}
            className="border-0 fw-semibold text-white"
            style={{ borderRadius: 10, backgroundColor: '#ef4444', padding: '6px 16px' }}
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}