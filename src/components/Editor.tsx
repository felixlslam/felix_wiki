import React, {useState, useEffect, useRef} from 'react'
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import {
  TextField,
  Button,
  Box,
  Typography,
  Breadcrumbs,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import { Save as SaveIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon, Close as CloseIcon } from '@mui/icons-material'

interface EditorProps {
  onSave?: () => void
  currentSpaceId?: number
  article?: any | null
}

export default function Editor({ onSave, currentSpaceId, article: _article }: EditorProps) {
  const { slug } = useParams();
  const location = useLocation();
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const navigate = useNavigate()
  const initialSnapshot = useRef<{title: string, body: string}>({ title: '', body: '' })
  
  // Get parentSlug from search params if present
  const searchParams = new URLSearchParams(location.search)
  const parentSlug = searchParams.get('parent')

  useEffect(() => {
    if(!slug) return
    axios.get(`/api/articles/${slug}`).then(r => {
      setTitle(r.data.title)
      setBody(r.data.bodyMarkdown)
      // capture initial snapshot after loading so we can detect edits
      initialSnapshot.current = { title: r.data.title || '', body: r.data.bodyMarkdown || '' }
    }).catch(() => {
      setError('Failed to load article')
    })
  },[slug])

  // For new pages, set the initial snapshot to empty values on mount
  useEffect(() => {
    if (!slug) {
      initialSnapshot.current = { title: '', body: '' }
    }
  }, [slug])

  async function save() {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    try {
      if (slug) {
        await axios.put(`/api/articles/${slug}`, {
          title,
          bodyMarkdown: body,
        })
        onSave?.()
        navigate(`/a/${slug}`)
      } else {
        const payload: any = { title, bodyMarkdown: body }
        if (parentSlug) payload.parentSlug = parentSlug
        if (currentSpaceId) payload.spaceId = currentSpaceId
        const r = await axios.post('/api/articles', payload)
        onSave?.()
        navigate(`/a/${r.data.slug}`)
      }
    } catch(err) {
      console.error(err)
      setError('Failed to save article')
    }
  }

  // dirty check: compare current values to initial snapshot
  const isDirty = title !== initialSnapshot.current.title || body !== initialSnapshot.current.body

  function performCancelNavigation() {
    // If editing an existing article, go back to its read view.
    if (slug) return navigate(`/a/${slug}`)
    // If this was a new page with a parent, go back to parent page
    if (parentSlug) return navigate(`/a/${parentSlug}`)
    // Otherwise go home
    navigate('/')
  }

  function cancel() {
    // If there are unsaved changes, show confirmation dialog.
    if (isDirty) {
      setConfirmOpen(true)
      return
    }
    performCancelNavigation()
  }

  function confirmCancel() {
    setConfirmOpen(false)
    performCancelNavigation()
  }

  function closeConfirm() {
    setConfirmOpen(false)
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Breadcrumbs sx={{ mb: 2, px: 3, pt: 3, mt: 3 }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          Home
        </Link>
        <Typography color="text.primary">
          {slug ? `Edit ${title}` : 'New Page'}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ px: 3, mb: 3 }}>
        <TextField
          fullWidth
          label="Title"
          variant="outlined"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && title.trim()) {
              e.preventDefault();
              save();
            }
          }}
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={showPreview ? <VisibilityOffIcon /> : <VisibilityIcon />}
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          width: '100%'
        }}>
          <TextField
            multiline
            fullWidth
            minRows={20}
            placeholder="Write your content in Markdown..."
            value={body}
            onChange={e => setBody(e.target.value)}
            sx={{
              flex: showPreview ? '1 1 50%' : '1 1 100%',
              '& .MuiInputBase-root': {
                height: '100%',
                fontFamily: 'monospace'
              }
            }}
          />

          {showPreview && (
            <Box sx={{
              flex: '1 1 50%',
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'auto',
              '& img': { maxWidth: '100%' },
              '& pre': { 
                bgcolor: 'grey.100', 
                p: 2, 
                borderRadius: 1,
                overflow: 'auto'
              },
              '& code': {
                bgcolor: 'grey.100',
                px: 0.5,
                borderRadius: 0.5,
                fontSize: '0.875em'
              }
            }}>
              <ReactMarkdown>{body}</ReactMarkdown>
            </Box>
          )}
        </Box>
      </Box>

      {/* Sticky Save Button */}
      <Box sx={{ 
        position: 'sticky', 
        bottom: 0, 
        bgcolor: 'background.paper', 
        py: 2, 
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'flex', 
        justifyContent: 'flex-end',
        zIndex: 10
      }}>
        <Button
          variant="outlined"
          startIcon={<CloseIcon />}
          onClick={cancel}
          sx={{ mr: 1 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={save}
          startIcon={<SaveIcon />}
        >
          Save
        </Button>
      </Box>

      <Dialog
        open={confirmOpen}
        onClose={closeConfirm}
        aria-labelledby="discard-dialog-title"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            confirmCancel();
          }
        }}
      >
        <DialogTitle id="discard-dialog-title">Discard changes?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes. If you leave now, your edits will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm} variant="outlined">Keep editing</Button>
          <Button onClick={confirmCancel} color="error" variant="contained">Discard</Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
      </Box>
  )
}
