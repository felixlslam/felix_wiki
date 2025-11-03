import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Space {
  id: number;
  slug: string;
  name: string;
  homePageSlug?: string | null;
  createdAt: string;
}

interface SpaceManagerProps {
  currentSpace: Space;
  onSpaceUpdate: (space: Space, updates: { name?: string; homePageSlug?: string | null }) => void;
  onSpaceDelete: (space: Space) => void;
}

export default function SpaceManager({
  currentSpace,
  onSpaceUpdate,
  onSpaceDelete
}: SpaceManagerProps) {
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const navigate = useNavigate();

  const handleUpdateSpace = () => {
    if (newSpaceName.trim()) {
      onSpaceUpdate(currentSpace, { name: newSpaceName.trim() });
      setNewSpaceName('');
      setEditDialogOpen(false);
    }
  };

  const openEditDialog = () => {
    setNewSpaceName(currentSpace.name);
    setEditDialogOpen(true);
  };

  const handleSpaceNameClick = () => {
    if (currentSpace.homePageSlug) {
      navigate(`/a/${currentSpace.homePageSlug}`);
    } else {
      navigate('/');
    }
  };

  return (
    <Box 
      sx={{ 
        position: 'sticky',
        top: 0,
        zIndex: 1,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        // reduced vertical padding to save vertical space
        py: 1,
        px: 1,
        mb: 0.5
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 600,
            cursor: 'pointer',
            lineHeight: 1.1,
            '&:hover': {
              color: 'primary.main'
            },
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          onClick={handleSpaceNameClick}
          title={`${currentSpace.name} (click to go to home)`}
        >
          {currentSpace.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
          <IconButton
            size="small"
            onClick={openEditDialog}
            title="Rename space"
            sx={{ p: 0.5 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onSpaceDelete(currentSpace)}
            title="Delete space"
            sx={{ p: 0.5 }}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Edit Space Dialog */}
      <Dialog open={isEditDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Rename Space</DialogTitle>
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
                handleUpdateSpace();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateSpace} disabled={!newSpaceName.trim()} variant="contained">
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
