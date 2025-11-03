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
import { Edit as EditIcon, Delete as DeleteIcon, History as HistoryIcon } from '@mui/icons-material'
import { Snackbar, Alert } from '@mui/material'
import VersionHistory from '../components/VersionHistory'

interface ArticlePageProps {
  onUpdate?: () => void
  onDelete?: () => void
  currentSpace?: { id: number; slug: string; name: string; homePageSlug?: string | null }
  onSetHomePage?: (slug: string) => void
}

export default function ArticlePage({ onUpdate: _onUpdate, onDelete, currentSpace, onSetHomePage }: ArticlePageProps) {
  const { slug } = useParams();
  const [article, setArticle] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [breadcrumbPath, setBreadcrumbPath] = useState<Array<{slug: string, title: string}>>([])
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity?: 'success'|'error'} | null>(null)
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false)
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
    <Paper elevation={0} sx={{ p: 0, minHeight: '100vh' }}>
      {/* Sticky header with breadcrumbs and admin buttons on same level */}
      <Box 
        sx={{ 
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          // reduce vertical padding to make header shorter
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Breadcrumbs 
          sx={{ flex: 1, minWidth: 0 }}
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
              <Typography key={item.slug} color="text.primary" sx={{ fontWeight: 600 }}>
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
        
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Button
            size="small"
            startIcon={<HistoryIcon />}
            onClick={() => setVersionHistoryOpen(true)}
          >
            History
          </Button>
          {currentSpace && onSetHomePage && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => onSetHomePage(article.slug)}
              disabled={currentSpace.homePageSlug === article.slug}
            >
              {currentSpace.homePageSlug === article.slug ? 'Home Page' : 'Set as Home'}
            </Button>
          )}
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
      
      {/* Page title and content */}
        <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2, lineHeight: 1.15 }}>
          {article.title}
        </Typography>

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
      </Box>
    </Paper>
    
    {/* Version History Drawer */}
    {slug && (
      <VersionHistory
        articleSlug={slug}
        open={versionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
        onRestore={() => {
          // Reload article after restore
          if (slug) {
            axios.get(`/api/articles/${slug}`)
              .then(r => {
                setArticle(r.data);
                buildBreadcrumbPath(r.data);
                setSnackbar({ open: true, message: 'Version restored successfully', severity: 'success' });
              })
              .catch(() => {
                setSnackbar({ open: true, message: 'Failed to reload article', severity: 'error' });
              });
          }
        }}
      />
    )}
    
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
