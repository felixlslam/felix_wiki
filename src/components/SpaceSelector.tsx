import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

interface Space {
  id: number;
  slug: string;
  name: string;
  createdAt: string;
}

interface SpaceSelectorProps {
  spaces: Space[];
  currentSpace: Space;
  onSpaceChange: (space: Space) => void;
  onSpaceCreate: (name: string) => void;
  onSpaceUpdate: (space: Space, newName: string) => void;
  onSpaceDelete: (space: Space) => void;
}

export default function SpaceSelector({
  spaces,
  currentSpace,
  onSpaceChange,
  onSpaceCreate,
  onSpaceUpdate,
  onSpaceDelete
}: SpaceSelectorProps) {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);

  const handleCreateSpace = () => {
    if (newSpaceName.trim()) {
      onSpaceCreate(newSpaceName.trim());
      setNewSpaceName('');
      setCreateDialogOpen(false);
    }
  };

  const handleUpdateSpace = () => {
    if (editingSpace && newSpaceName.trim()) {
      onSpaceUpdate(editingSpace, newSpaceName.trim());
      setNewSpaceName('');
      setEditingSpace(null);
      setEditDialogOpen(false);
    }
  };

  const openEditDialog = (space: Space) => {
    setEditingSpace(space);
    setNewSpaceName(space.name);
    setEditDialogOpen(true);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Space</InputLabel>
          <Select
            value={currentSpace.id}
            onChange={(e) => {
              const space = spaces.find(s => s.id === e.target.value);
              if (space) onSpaceChange(space);
            }}
            label="Space"
          >
            {spaces.map(space => (
              <MenuItem key={space.id} value={space.id}>
                {space.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <IconButton 
          size="small" 
          onClick={() => setCreateDialogOpen(true)}
          sx={{ ml: 1 }}
          title="Create new space"
        >
          <AddIcon />
        </IconButton>
        
        {currentSpace.slug !== 'default' && (
          <>
            <IconButton
              size="small"
              onClick={() => openEditDialog(currentSpace)}
              sx={{ ml: 0.5 }}
              title="Edit space name"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onSpaceDelete(currentSpace)}
              sx={{ ml: 0.5 }}
              title="Delete space"
            >
              <DeleteIcon />
            </IconButton>
          </>
        )}
      </Box>

      {/* Create Space Dialog */}
      <Dialog open={isCreateDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Space</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Space Name"
            fullWidth
            value={newSpaceName}
            onChange={(e) => setNewSpaceName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateSpace} disabled={!newSpaceName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Space Dialog */}
      <Dialog open={isEditDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Space</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Space Name"
            fullWidth
            value={newSpaceName}
            onChange={(e) => setNewSpaceName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateSpace} disabled={!newSpaceName.trim()}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
