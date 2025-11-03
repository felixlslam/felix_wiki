import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  TextField
} from '@mui/material';
import { 
  Add as AddIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';
import SearchBar from './components/SearchBar';
import { Article, Space } from './api';
import * as api from './api';
import PageTree from './components/PageTree';
import Editor from './components/Editor';
import SpaceManager from './components/SpaceManager';
import ArticlePage from './pages/Article';

function HomePageContent({ currentSpace, onDelete, onSetHomePage }: { currentSpace: Space; onDelete: () => void; onSetHomePage: (slug: string) => void }) {
  const navigate = useNavigate();
  useEffect(() => {
    if (currentSpace?.homePageSlug) {
      navigate(`/a/${currentSpace.homePageSlug}`, { replace: true });
    }
  }, [currentSpace?.homePageSlug, navigate]);

  // If space has no home page, render blank with padding for alignment
  return (
    <Box sx={{ p: 3 }}>
      {/* Empty state - main panel is intentionally blank when no home page is set */}
    </Box>
  )
}

function MainLayout() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [newSpaceDialogOpen, setNewSpaceDialogOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  // sidebar controls
  const [sidebarWidth, setSidebarWidth] = useState<number>(300)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)
  const [resizing, setResizing] = useState(false)
  const resizingRef = useRef<{ startX: number; startWidth: number } | null>(null)
  const dragMovedRef = useRef(false)
  const suppressClickRef = useRef(false)
  const resizeActivatedRef = useRef(false)

  useEffect(() => {
    // Load spaces and set default space
    api.spaces.list().then((spaceList: Space[]) => {
      setSpaces(spaceList);
      const defaultSpace = spaceList.find((s: Space) => s.slug === 'default');
      if (defaultSpace) {
        setCurrentSpace(defaultSpace);
      }
    }).catch(console.error);
  }, []);

  // resize handlers
  useEffect(() => {
    if (!resizing) return

    function onMove(e: MouseEvent) {
      if (!resizingRef.current) return

      const dx = e.clientX - resizingRef.current.startX

      // Activate resize only after movement threshold (distinguishes drag from click)
      if (!resizeActivatedRef.current) {
        if (Math.abs(dx) < 6) return
        resizeActivatedRef.current = true
        // if sidebar was closed, open it before resizing
        if (!sidebarOpen) setSidebarOpen(true)
        document.body.style.cursor = 'col-resize'
      }

      dragMovedRef.current = true
      const next = Math.max(200, Math.min(800, resizingRef.current.startWidth + dx))
      setSidebarWidth(next)
    }

    function onUp() {
      // if a drag occurred, suppress the immediate click that follows
      if (dragMovedRef.current) {
        suppressClickRef.current = true
        // Reset suppress flag after a short delay to allow click handler to check it
        setTimeout(() => {
          suppressClickRef.current = false
        }, 10)
      }
      dragMovedRef.current = false
      resizingRef.current = null
      resizeActivatedRef.current = false
      document.body.style.cursor = ''
      setResizing(false)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
    }
  }, [resizing, sidebarOpen])

  const loadArticles = async (spaceSlug: string) => {
    setLoadingArticles(true)
    try {
      const list = await api.articles.list(spaceSlug)
      setArticles(list)
      return list
    } catch (err) {
      console.error('Failed to load articles for space', err)
      throw err
    } finally {
      setLoadingArticles(false)
    }
  }

  const prevSpaceId = useRef<number | null>(null)

  useEffect(() => {
    // Load articles for current space and, when switching spaces, navigate to the
    // appropriate home page (homePageSlug if set, otherwise the first page).
    if (!currentSpace) return
    let cancelled = false
    ;(async () => {
      try {
        const list = await loadArticles(currentSpace.slug)
        if (cancelled) return
        // If we've actually switched spaces (not just reloaded), pick a home page
        if (prevSpaceId.current !== currentSpace.id) {
          prevSpaceId.current = currentSpace.id
          if (list && list.length > 0) {
            const home = currentSpace.homePageSlug || list[0].slug
            navigate(`/a/${home}`, { replace: true })
          } else {
            // no pages in this space: navigate to root to show blank main panel
            navigate('/', { replace: true })
          }
        }
      } catch (err) {
        console.error('Failed to load articles for space', err)
      }
    })()
    return () => { cancelled = true }
  }, [currentSpace?.id])

  // When switching spaces, if the new space has no pages ensure the main view is cleared
  const location = useLocation();
  useEffect(() => {
    if (!currentSpace) return
    // if there are no articles in the newly loaded space, navigate to root to clear article view
    if (articles.length === 0 && location.pathname.startsWith('/a/')) {
      navigate('/', { replace: true })
    }
  }, [currentSpace?.id, articles.length, location.pathname])

  const handleNewPage = () => {
    navigate('/new');
  };

  const toggleSidebar = () => setSidebarOpen(v => !v)

  const startResizing = (e: React.MouseEvent) => {
    // Start a pending resize on mousedown. Activation happens only after
    // movement threshold in mousemove, so a click won't start resizing.
    resizingRef.current = { startX: e.clientX, startWidth: sidebarWidth }
    resizeActivatedRef.current = false
    dragMovedRef.current = false
    setResizing(true)
    // listeners are attached in effect
  }

  const handleNewSubpage = (parentSlug: string) => {
    navigate(`/new?parent=${parentSlug}`);
  };

  const handleSearchSelect = async (result: any) => {
    if (!result) return;
    
    // Handle space selection
    if (result.type === 'space') {
      const found = spaces.find(s => s.id === result.id);
      if (found) {
        setCurrentSpace(found);
        await loadArticles(found.slug);
        // Navigate to home page if set, otherwise to root
        if (found.homePageSlug) {
          navigate(`/a/${found.homePageSlug}`);
        } else {
          navigate('/');
        }
      }
      return;
    }
    
    // Handle article selection
    try {
      if (typeof result.spaceId !== 'undefined') {
        const found = spaces.find(s => s.id === result.spaceId);
        if (found && found.id !== currentSpace?.id) {
          setCurrentSpace(found);
          // reload articles for the new space
          await loadArticles(found.slug)
        }
      }
    } catch (err) {
      console.error('Failed to switch space after search select', err);
    }
    // navigate to article page
    navigate(`/a/${result.slug}`);
  };

  const handleSpaceChange = (space: Space) => {
    setCurrentSpace(space);
  };

  const handleCreateSpace = async () => {
    if (!newSpaceName.trim()) return;
    try {
      const newSpace = await api.spaces.create({ name: newSpaceName.trim() });
      setSpaces([...spaces, newSpace]);
      setCurrentSpace(newSpace);
      setNewSpaceName('');
      setNewSpaceDialogOpen(false);
    } catch (err) {
      console.error('Failed to create space:', err);
      // TODO: Show error notification
    }
  };

  const handleUpdateSpace = async (space: Space, updates: { name?: string; homePageSlug?: string | null }) => {
    try {
      const updated = await api.spaces.update(space.slug, updates);
      setSpaces(spaces.map(s => s.id === updated.id ? updated : s));
      if (currentSpace?.id === updated.id) {
        setCurrentSpace(updated);
      }
    } catch (err) {
      console.error('Failed to update space:', err);
      // TODO: Show error notification
    }
  };

  const handleSetHomePage = async (articleSlug: string) => {
    if (!currentSpace) return;
    await handleUpdateSpace(currentSpace, { homePageSlug: articleSlug });
  };

  const handleDeleteSpace = async (_space: Space) => {
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteSpace = async () => {
    if (!currentSpace) return;
    
    try {
      await api.spaces.delete(currentSpace.slug);
      setSpaces(spaces.filter(s => s.id !== currentSpace.id));
      const defaultSpace = spaces.find(s => s.slug === 'default');
      if (defaultSpace) {
        setCurrentSpace(defaultSpace);
      }
    } catch (err) {
      console.error('Failed to delete space:', err);
      // TODO: Show error notification
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  if (!currentSpace) return null;

  return (
    <div className="container" style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Wiki
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SearchBar onSelect={handleSearchSelect} />
            {loadingArticles && <CircularProgress color="inherit" size={20} />}
            <Button
              color="inherit"
              onClick={() => setNewSpaceDialogOpen(true)}
              sx={{ ml: 1 }}
            >
              New Space
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <div style={{ width: sidebarOpen ? sidebarWidth : 0, transition: 'width 160ms ease', overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRight: sidebarOpen ? '1px solid rgba(0, 0, 0, 0.12)' : 'none' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <SpaceManager
              currentSpace={currentSpace}
              onSpaceUpdate={handleUpdateSpace}
              onSpaceDelete={handleDeleteSpace}
            />
            <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
              <PageTree 
                articles={articles}
                onNewSubpage={handleNewSubpage}
                onNewRootPage={handleNewPage}
              />
            </Box>
          </nav>
        </div>

        {/* Resizer - always visible; when sidebar is closed it's a visible handle at the left edge */}
        <div
          onMouseDown={(e) => startResizing(e)}
          onClick={() => {
            // suppress click following a drag
            if (suppressClickRef.current) {
              suppressClickRef.current = false
              return
            }
            setSidebarOpen(v => !v)
          }}
          role="separator"
          aria-label={sidebarOpen ? 'Resize sidebar' : 'Open sidebar'}
          style={{
            width: sidebarOpen ? 8 : 20,
            cursor: 'col-resize',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* visible handle */}
          <div style={{ width: 4, height: 36, borderRadius: 2, background: sidebarOpen ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.3)' }} />
        </div>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
          <Box>
            <Routes>
              <Route path="/a/:slug" element={<ArticlePage onDelete={() => currentSpace && loadArticles(currentSpace.slug).catch(console.error)} currentSpace={currentSpace || undefined} onSetHomePage={handleSetHomePage} />} />
              <Route path="/edit/:slug" element={<Editor onSave={() => currentSpace && loadArticles(currentSpace.slug).catch(console.error)} />} />
              <Route path="/new" element={<Editor currentSpaceId={currentSpace.id} onSave={() => currentSpace && loadArticles(currentSpace.slug).catch(console.error)} />} />
              <Route path="/" element={
                <HomePageContent 
                  currentSpace={currentSpace} 
                  onDelete={() => currentSpace && loadArticles(currentSpace.slug).catch(console.error)}
                  onSetHomePage={handleSetHomePage}
                />
              } />
            </Routes>
          </Box>
        </main>
      </div>

      {/* New Space Dialog */}
      <Dialog
        open={newSpaceDialogOpen}
        onClose={() => setNewSpaceDialogOpen(false)}
      >
        <DialogTitle>Create New Space</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Space Name"
            fullWidth
            value={newSpaceName}
            onChange={(e) => setNewSpaceName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newSpaceName.trim()) {
                handleCreateSpace();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewSpaceDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateSpace} disabled={!newSpaceName.trim()} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Space Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            confirmDeleteSpace();
          }
        }}
      >
        <DialogTitle>Delete Space?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this space? All pages in this space will be permanently deleted. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteSpace} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default function AppRoot() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}
