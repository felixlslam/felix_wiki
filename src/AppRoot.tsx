import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
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
  CircularProgress
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
import SpaceSelector from './components/SpaceSelector';
import ArticlePage from './pages/Article';

function MainLayout() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [loadingArticles, setLoadingArticles] = useState(false);
  // sidebar controls
  const [sidebarWidth, setSidebarWidth] = useState<number>(300)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)
  const resizingRef = useRef<{ startX: number; startWidth: number } | null>(null)

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
    function onMove(e: MouseEvent) {
      if (!resizingRef.current) return
      const dx = e.clientX - resizingRef.current.startX
      const next = Math.max(200, Math.min(800, resizingRef.current.startWidth + dx))
      setSidebarWidth(next)
    }
    function onUp() {
      resizingRef.current = null
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    if (resizingRef.current) {
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
      document.body.style.cursor = 'col-resize'
    }
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
    }
  }, [resizingRef.current])

  const loadArticles = async (spaceSlug: string) => {
    setLoadingArticles(true)
    try {
      const list = await api.articles.list(spaceSlug)
      setArticles(list)
    } catch (err) {
      console.error('Failed to load articles for space', err)
      throw err
    } finally {
      setLoadingArticles(false)
    }
  }

  useEffect(() => {
    // Load articles for current space
    if (currentSpace) {
      loadArticles(currentSpace.slug).catch(console.error)
    }
  }, [currentSpace]);

  const handleNewPage = () => {
    navigate('/new');
  };

  const toggleSidebar = () => setSidebarOpen(v => !v)

  const startResizing = (e: React.MouseEvent) => {
    resizingRef.current = { startX: e.clientX, startWidth: sidebarWidth }
    // listeners are attached in effect
  }

  const handleNewSubpage = (parentSlug: string) => {
    navigate(`/new?parent=${parentSlug}`);
  };

  const handleSearchSelect = async (result: any) => {
    if (!result) return;
    // find the space for the result and switch to it
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

  const handleCreateSpace = async (name: string) => {
    try {
      const newSpace = await api.spaces.create({ name });
      setSpaces([...spaces, newSpace]);
      setCurrentSpace(newSpace);
    } catch (err) {
      console.error('Failed to create space:', err);
      // TODO: Show error notification
    }
  };

  const handleUpdateSpace = async (space: Space, newName: string) => {
    try {
      const updated = await api.spaces.update(space.slug, { name: newName });
      setSpaces(spaces.map(s => s.id === updated.id ? updated : s));
    } catch (err) {
      console.error('Failed to update space:', err);
      // TODO: Show error notification
    }
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
            <IconButton color="inherit" onClick={toggleSidebar} aria-label={sidebarOpen ? 'Collapse sidebar' : 'Open sidebar'}>
              {sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>
            <SearchBar onSelect={handleSearchSelect} />
            {loadingArticles && <CircularProgress color="inherit" size={20} />}
          </Box>
        </Toolbar>
      </AppBar>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <div style={{ width: sidebarOpen ? sidebarWidth : 0, transition: 'width 160ms ease', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 8 }}>
            <SpaceSelector
              spaces={spaces}
              currentSpace={currentSpace}
              onSpaceChange={handleSpaceChange}
              onSpaceCreate={handleCreateSpace}
              onSpaceUpdate={handleUpdateSpace}
              onSpaceDelete={handleDeleteSpace}
            />
            <Box sx={{ mt: 1, mb: 1, flex: 1, overflow: 'auto' }}>
              <PageTree 
                articles={articles}
                onNewSubpage={handleNewSubpage}
              />
            </Box>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleNewPage}
              fullWidth
              sx={{ mt: 1 }}
            >
              New Page
            </Button>
          </nav>
        </div>

        {/* Resizer */}
        {sidebarOpen && (
          <div
            onMouseDown={startResizing}
            style={{ width: 8, cursor: 'col-resize', background: 'transparent' }}
            aria-hidden
          />
        )}

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
          <Box p={3}>
            <Routes>
              <Route path="/a/:slug" element={<ArticlePage onDelete={() => currentSpace && loadArticles(currentSpace.slug).catch(console.error)} />} />
              <Route path="/edit/:slug" element={<Editor onSave={() => currentSpace && loadArticles(currentSpace.slug).catch(console.error)} />} />
              <Route path="/new" element={<Editor currentSpaceId={currentSpace.id} onSave={() => currentSpace && loadArticles(currentSpace.slug).catch(console.error)} />} />
              <Route path="/" element={
                <Typography variant="body1" color="text.secondary" align="center">
                  Select a page or create a new one
                </Typography>
              } />
            </Routes>
          </Box>
        </main>
      </div>

      {/* Delete Space Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Space?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this space? All articles will be moved to the default space.
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
