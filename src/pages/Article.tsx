import React, {useEffect, useState} from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { 
  Typography, 
  Paper,
  Button,
  CircularProgress,
  Box,
  Breadcrumbs
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { Snackbar, Alert } from '@mui/material'

interface ArticlePageProps {
  onUpdate?: () => void
  onDelete?: () => void
}

export default function ArticlePage({ onUpdate: _onUpdate, onDelete }: ArticlePageProps) {
  const { slug } = useParams();
  const [article, setArticle] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [breadcrumbPath, setBreadcrumbPath] = useState<Array<{slug: string, title: string}>>([])
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity?: 'success'|'error'} | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if(!slug) return;
    setLoading(true)
    axios.get(`/api/articles/${slug}`)
      .then(r => {
        setArticle(r.data)
        // Build breadcrumb path by traversing parents
        buildBreadcrumbPath(r.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  },[slug])

  async function buildBreadcrumbPath(currentArticle: any) {
    const path: Array<{slug: string, title: string}> = []
    let article = currentArticle
    
    // Walk up the parent chain
    while (article) {
      path.unshift({ slug: article.slug, title: article.title })
      if (article.parentSlug) {
        try {
          const response = await axios.get(`/api/articles/${article.parentSlug}`)
          article = response.data
        } catch {
          break
        }
      } else {
        break
      }
    }
    
    setBreadcrumbPath(path)
  }

  if(loading) return (
    <Box display="flex" justifyContent="center" p={4}>
      <CircularProgress />
    </Box>
  )

  if(!article) return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Typography color="error">Article not found</Typography>
    </Paper>
  )

  return (
    <>
    <Paper elevation={0} sx={{ p: 3 }}>
      <Breadcrumbs 
        sx={{ mb: 2 }}
        maxItems={4}
        itemsBeforeCollapse={1}
        itemsAfterCollapse={2}
      >
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          Home
        </Link>
        {breadcrumbPath.map((item, index) => {
          const isLast = index === breadcrumbPath.length - 1
          return isLast ? (
            <Typography key={item.slug} color="text.primary">
              {item.title}
            </Typography>
          ) : (
            <Link 
              key={item.slug}
              to={`/a/${item.slug}`} 
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              {item.title}
            </Link>
          )
        })}
      </Breadcrumbs>
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          {article.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            component={Link}
            to={`/edit/${article.slug}`}
            startIcon={<EditIcon />}
            variant="outlined"
            size="small"
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={async () => {
              const ok = window.confirm('Delete this page? This action cannot be undone.')
              if (!ok) return
              try {
                await axios.delete(`/api/articles/${article.slug}`)
                setSnackbar({ open: true, message: 'Article deleted', severity: 'success' })
                // notify parent to refresh article list
                try { onDelete?.() } catch { /* ignore */ }
                // navigate to home after short delay to allow snackbar to show
                setTimeout(() => navigate('/'), 400)
              } catch (err) {
                console.error(err)
                setSnackbar({ open: true, message: 'Failed to delete article', severity: 'error' })
              }
            }}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Box sx={{ 
        '& img': { maxWidth: '100%' },
        '& a': { color: 'primary.main' },
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
        <ReactMarkdown>{article.bodyMarkdown || ''}</ReactMarkdown>
      </Box>
    </Paper>
    {snackbar && (
      <Snackbar
        open={snackbar?.open ?? false}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar(null)} severity={snackbar?.severity || 'success'} sx={{ width: '100%' }}>
          {snackbar?.message || ''}
        </Alert>
      </Snackbar>
    )}
    </>
  )
}
