import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  IconButton,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  History as HistoryIcon,
  Restore as RestoreIcon,
  CompareArrows as CompareIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon
} from '@mui/icons-material';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { ArticleVersion } from '../api';
import * as api from '../api';

interface VersionHistoryProps {
  articleSlug: string;
  open: boolean;
  onClose: () => void;
  onRestore: () => void;
}

export default function VersionHistory({ articleSlug, open, onClose, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<ArticleVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<ArticleVersion | null>(null);
  const [error, setError] = useState<string>('');
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [compareVersion1, setCompareVersion1] = useState<ArticleVersion | null>(null);
  const [compareVersion2, setCompareVersion2] = useState<ArticleVersion | null>(null);

  useEffect(() => {
    if (open) {
      loadVersions();
    }
  }, [open, articleSlug]);

  const loadVersions = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.articles.getVersions(articleSlug);
      setVersions(data);
    } catch (err) {
      console.error('Failed to load versions:', err);
      setError('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleCompareToggle = () => {
    setCompareMode(!compareMode);
    setSelectedVersions([]);
  };

  const handleVersionSelect = (versionId: number) => {
    if (!compareMode) return;
    
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(selectedVersions.filter(id => id !== versionId));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, versionId]);
    }
  };

  const handleRestoreClick = (version: ArticleVersion) => {
    setVersionToRestore(version);
    setRestoreDialogOpen(true);
  };

  const handleRestoreConfirm = async () => {
    if (!versionToRestore) return;
    
    try {
      await api.articles.restoreVersion(articleSlug, versionToRestore.id);
      setRestoreDialogOpen(false);
      setVersionToRestore(null);
      onRestore();
      onClose();
    } catch (err) {
      console.error('Failed to restore version:', err);
      setError('Failed to restore version');
    }
  };

  const handleCompare = async () => {
    if (selectedVersions.length === 2) {
      try {
        const v1 = versions.find(v => v.id === selectedVersions[0]);
        const v2 = versions.find(v => v.id === selectedVersions[1]);
        if (v1 && v2) {
          // Ensure v1 is the older version
          if (v1.version > v2.version) {
            setCompareVersion1(v2);
            setCompareVersion2(v1);
          } else {
            setCompareVersion1(v1);
            setCompareVersion2(v2);
          }
          setCompareDialogOpen(true);
        }
      } catch (err) {
        console.error('Failed to load versions for comparison:', err);
        setError('Failed to load versions for comparison');
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 } }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box sx={{ 
            p: 2, 
            borderBottom: 1, 
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon />
              <Typography variant="h6">Version History</Typography>
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Compare mode toolbar */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button
                size="small"
                variant={compareMode ? 'contained' : 'outlined'}
                startIcon={<CompareIcon />}
                onClick={handleCompareToggle}
              >
                {compareMode ? 'Cancel Compare' : 'Compare Versions'}
              </Button>
              {compareMode && selectedVersions.length === 2 && (
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={handleCompare}
                >
                  View Diff
                </Button>
              )}
            </Box>
            {compareMode && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Select two versions to compare ({selectedVersions.length}/2 selected)
              </Typography>
            )}
          </Box>

          {/* Error message */}
          {error && (
            <Alert severity="error" onClose={() => setError('')} sx={{ m: 2 }}>
              {error}
            </Alert>
          )}

          {/* Version list */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : versions.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No version history available
                </Typography>
              </Box>
            ) : versions.length === 1 ? (
              <Box sx={{ p: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  This page has only one version. Make edits to create version history.
                </Alert>
                <List>
                  {versions.map((version) => {
                    const isCurrent = true;
                    return (
                      <ListItem
                        key={version.id}
                        sx={{
                          borderRadius: 1,
                          mb: 0.5
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Chip
                              label={`v${version.version}`}
                              size="small"
                              color="primary"
                            />
                            <Chip label="Current" size="small" color="success" />
                          </Box>
                          <ListItemText
                            primary={version.title}
                            secondary={formatDate(version.createdAt)}
                            primaryTypographyProps={{
                              variant: 'body2',
                              sx: { fontWeight: 600 }
                            }}
                            secondaryTypographyProps={{
                              variant: 'caption'
                            }}
                            sx={{ my: 0 }}
                          />
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            ) : (
              <List>
                {versions.map((version, index) => {
                  const isSelected = selectedVersions.includes(version.id);
                  const isCurrent = index === 0;
                  
                  return (
                    <React.Fragment key={version.id}>
                      <ListItem
                        sx={{
                          bgcolor: isSelected ? 'primary.50' : 'inherit',
                          cursor: compareMode ? 'pointer' : 'default',
                          '&:hover': compareMode ? { bgcolor: 'action.hover' } : {},
                          border: isSelected ? 2 : 0,
                          borderColor: isSelected ? 'primary.main' : 'transparent',
                          borderRadius: 1,
                          mb: 0.5
                        }}
                        onClick={() => handleVersionSelect(version.id)}
                      >
                        {compareMode && (
                          <Box sx={{ mr: 1 }}>
                            {isSelected ? (
                              <CheckBoxIcon color="primary" />
                            ) : (
                              <CheckBoxOutlineBlankIcon color="action" />
                            )}
                          </Box>
                        )}
                        
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Chip
                              label={`v${version.version}`}
                              size="small"
                              color={isCurrent ? 'primary' : 'default'}
                            />
                            {isCurrent && (
                              <Chip label="Current" size="small" color="success" />
                            )}
                            {version.restoredFrom && (
                              <Chip 
                                label={`Restored from v${version.restoredFrom}`} 
                                size="small" 
                                variant="outlined"
                              />
                            )}
                          </Box>
                          
                          <ListItemText
                            primary={version.title}
                            secondary={formatDate(version.createdAt)}
                            primaryTypographyProps={{
                              variant: 'body2',
                              sx: { fontWeight: isCurrent ? 600 : 400 }
                            }}
                            secondaryTypographyProps={{
                              variant: 'caption'
                            }}
                            sx={{ my: 0 }}
                          />
                        </Box>
                        
                        {!isCurrent && !compareMode && (
                          <Button
                            size="small"
                            startIcon={<RestoreIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestoreClick(version);
                            }}
                            sx={{ ml: 1, flexShrink: 0 }}
                          >
                            Restore
                          </Button>
                        )}
                      </ListItem>
                      {index < versions.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Restore confirmation dialog */}
      <Dialog
        open={restoreDialogOpen}
        onClose={() => setRestoreDialogOpen(false)}
      >
        <DialogTitle>Restore Version?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to restore to version {versionToRestore?.version}?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will create a new version with the content from v{versionToRestore?.version}. 
            The current version will be preserved in history.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRestoreConfirm} variant="contained" color="primary">
            Restore
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comparison modal dialog */}
      <Dialog
        open={compareDialogOpen}
        onClose={() => setCompareDialogOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Version Comparison</Typography>
            <IconButton onClick={() => setCompareDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {compareVersion1 && compareVersion2 && (
            <VersionComparisonView
              version1={compareVersion1}
              version2={compareVersion2}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Inline comparison view component
interface VersionComparisonViewProps {
  version1: ArticleVersion;
  version2: ArticleVersion;
}

function VersionComparisonView({ version1, version2 }: VersionComparisonViewProps) {
  const [viewMode, setViewMode] = React.useState<'split' | 'unified'>('split');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>Comparing Versions</Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setViewMode(viewMode === 'split' ? 'unified' : 'split')}
          >
            {viewMode === 'split' ? 'Unified View' : 'Split View'}
          </Button>
        </Box>

        {/* Version info headers */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1, p: 1.5, bgcolor: 'error.50', borderRadius: 1, border: 1, borderColor: 'error.200' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Chip label={`v${version1.version}`} size="small" color="error" />
              <Typography variant="subtitle2">Original</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formatDate(version1.createdAt)}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, p: 1.5, bgcolor: 'success.50', borderRadius: 1, border: 1, borderColor: 'success.200' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Chip label={`v${version2.version}`} size="small" color="success" />
              <Typography variant="subtitle2">Modified</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formatDate(version2.createdAt)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Diff content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* Title comparison */}
        {version1.title !== version2.title && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Title</Typography>
            <ReactDiffViewer
              oldValue={version1.title}
              newValue={version2.title}
              splitView={viewMode === 'split'}
              compareMethod={DiffMethod.WORDS}
              useDarkTheme={false}
              leftTitle=""
              rightTitle=""
              styles={{
                wordDiff: {
                  padding: '8px',
                }
              }}
            />
          </Box>
        )}

        {/* Content comparison */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Content</Typography>
          <ReactDiffViewer
            oldValue={version1.bodyMarkdown}
            newValue={version2.bodyMarkdown}
            splitView={viewMode === 'split'}
            compareMethod={DiffMethod.LINES}
            useDarkTheme={false}
            leftTitle=""
            rightTitle=""
            styles={{
              diffContainer: {
                fontSize: '14px',
                fontFamily: 'monospace',
                lineHeight: '1.6'
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
