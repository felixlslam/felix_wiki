import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Breadcrumbs,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Chip
} from '@mui/material';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import * as api from '../api';
import { ArticleVersion } from '../api';

export default function VersionCompare() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [version1, setVersion1] = useState<ArticleVersion | null>(null);
  const [version2, setVersion2] = useState<ArticleVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  useEffect(() => {
    const v1Id = searchParams.get('v1');
    const v2Id = searchParams.get('v2');
    
    if (!slug || !v1Id || !v2Id) {
      setLoading(false);
      return;
    }

    Promise.all([
      api.articles.getVersion(slug, parseInt(v1Id, 10)),
      api.articles.getVersion(slug, parseInt(v2Id, 10))
    ])
      .then(([ver1, ver2]) => {
        setVersion1(ver1);
        setVersion2(ver2);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load versions:', err);
        setLoading(false);
      });
  }, [slug, searchParams]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!version1 || !version2) {
    return (
      <Paper elevation={0} sx={{ p: 3 }}>
        <Typography color="error">Failed to load versions for comparison</Typography>
      </Paper>
    );
  }

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
    <Box sx={{ p: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          Home
        </Link>
        {slug && (
          <Link to={`/a/${slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            {version1.title}
          </Link>
        )}
        <Typography color="text.primary">Compare Versions</Typography>
      </Breadcrumbs>

      <Paper elevation={0} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Version Comparison</Typography>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="split">Split View</ToggleButton>
            <ToggleButton value="unified">Unified View</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Version info headers */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1, p: 2, bgcolor: 'error.50', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip label={`v${version1.version}`} size="small" color="error" />
              <Typography variant="subtitle2">Original</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formatDate(version1.createdAt)}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip label={`v${version2.version}`} size="small" color="success" />
              <Typography variant="subtitle2">Modified</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formatDate(version2.createdAt)}
            </Typography>
          </Box>
        </Box>

        {/* Title comparison */}
        {version1.title !== version2.title && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Title</Typography>
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
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Content</Typography>
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
      </Paper>
    </Box>
  );
}
