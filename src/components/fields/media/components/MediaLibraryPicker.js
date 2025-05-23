'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  Stack,
  FormControl,
  InputLabel
} from '@mui/material';
import { createClient } from '@/lib/supabase/browser';
import { useSearchParams } from 'next/navigation';

export const MediaLibraryPicker = ({ 
  open, 
  onClose, 
  onSelect, 
  record, 
  inline = false, 
  multi = false,
  selectedMediaIds = []
}) => {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const companyIdFromParams = searchParams.get('company_id');

  const [mediaList, setMediaList] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filters, setFilters] = useState({
    alt_text: '',
    mime_type: '',
    company_id: companyIdFromParams || '',
    project_id: '',
  });
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (open || inline) {
      if (!filters.company_id && record?.company_id) {
        setFilters((prev) => ({
          ...prev,
          company_id: record.company_id
        }));
      }
      loadMedia();
      loadCompanies();
      loadProjects();
    }
  }, [open, inline, filters]);

  // Reset selected items when modal opens
  useEffect(() => {
    if (open) {
      setSelectedItems([]);
    }
  }, [open]);

  const loadMedia = async () => {
    let query = supabase.from('media').select('id, url, alt_text, mime_type, copyright, company_id, project_id, is_folder, title');

    if (filters.alt_text) query = query.ilike('alt_text', `%${filters.alt_text}%`);
    if (filters.mime_type) query = query.ilike('mime_type', `%${filters.mime_type}%`);
    if (filters.company_id) query = query.eq('company_id', filters.company_id);
    if (filters.project_id) query = query.eq('project_id', filters.project_id);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error) setMediaList(data || []);
  };

  const loadCompanies = async () => {
    const { data } = await supabase.from('company').select('id, title');
    if (data) setCompanies(data);
  };

  const loadProjects = async () => {
    const { data } = await supabase.from('project').select('id, title');
    if (data) setProjects(data);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle media selection for both single and multi modes
  const handleMediaSelect = (media) => {
    if (multi) {
      // Multi mode - toggle selection
      setSelectedItems(prev => {
        const isAlreadySelected = prev.some(item => item.id === media.id);
        if (isAlreadySelected) {
          return prev.filter(item => item.id !== media.id);
        } else {
          return [...prev, media];
        }
      });
    } else {
      // Single mode - select immediately and close
      onSelect(media);
      if (!inline) onClose();
    }
  };

  // Handle confirm selection for multi mode
  const handleConfirmSelection = () => {
    if (selectedItems.length > 0) {
      onSelect(selectedItems);
    }
    onClose();
  };

  // Check if media is selected
  const isMediaSelected = (mediaId) => {
    return selectedItems.some(item => item.id === mediaId) || selectedMediaIds.includes(mediaId);
  };

  const groupedMedia = mediaList.reduce((acc, item) => {
    const key = item.folder || item.mime_type?.split('/')[0] || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const content = (
    <>
      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
        <TextField 
          label="Search" 
          value={filters.alt_text} 
          onChange={(e) => handleFilterChange('alt_text', e.target.value)} 
          size="small" 
        />
        <FormControl size="small">
          <InputLabel>Type</InputLabel>
          <Select 
            value={filters.mime_type} 
            onChange={(e) => handleFilterChange('mime_type', e.target.value)} 
            label="Type"
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="image">Images</MenuItem>
            <MenuItem value="video">Videos</MenuItem>
            <MenuItem value="application">Documents</MenuItem>
            <MenuItem value="external">External Links</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Company</InputLabel>
          <Select 
            value={filters.company_id} 
            onChange={(e) => handleFilterChange('company_id', e.target.value)} 
            label="Company"
          >
            <MenuItem value="">All Companies</MenuItem>
            {companies.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Project</InputLabel>
          <Select 
            value={filters.project_id} 
            onChange={(e) => handleFilterChange('project_id', e.target.value)} 
            label="Project"
          >
            <MenuItem value="">All Projects</MenuItem>
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.title}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Selection counter for multi mode */}
      {multi && selectedItems.length > 0 && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
          <Typography variant="body2" color="primary.main">
            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
          </Typography>
        </Box>
      )}

      {/* Media Grid */}
      <Box>
        {Object.entries(groupedMedia).length > 0 ? (
          Object.entries(groupedMedia).map(([group, items]) => (
            <Box key={group} sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>{group.toUpperCase()}</Typography>
              <Grid container spacing={2}>
                {items.map((media) => {
                  const isImage = media.mime_type?.startsWith('image');
                  const isSelected = isMediaSelected(media.id);
                  
                  return (
                    <Grid item xs={4} sm={3} md={2} key={media.id}>
                      <Box
                        sx={{
                          border: '2px solid',
                          borderColor: isSelected ? 'primary.main' : '#ccc',
                          borderRadius: 2,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'primary.50' : '#f5f5f5',
                          '&:hover': { 
                            opacity: 0.8,
                            borderColor: 'primary.main'
                          },
                          height: 120,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          position: 'relative'
                        }}
                        onClick={() => handleMediaSelect(media)}
                      >
                        {isImage ? (
                          <img
                            src={media.url}
                            alt={media.alt_text || media.title || 'Media'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              {media.mime_type}
                            </Typography>
                            <Typography variant="caption" display="block" noWrap sx={{ mt: 0.5 }}>
                              {media.title || media.alt_text || 'Untitled'}
                            </Typography>
                          </Box>
                        )}
                        
                        {/* Selection indicator */}
                        {isSelected && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              backgroundColor: 'primary.main',
                              color: 'white',
                              borderRadius: '50%',
                              width: 20,
                              height: 20,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            ✓
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">No media found</Typography>
        )}
      </Box>
    </>
  );

  if (inline) return <Box>{content}</Box>;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {multi ? 'Select Media Items' : 'Choose Media Item'}
      </DialogTitle>
      <DialogContent>{content}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {/* Confirm button for multi mode */}
        {multi && (
          <Button 
            onClick={handleConfirmSelection}
            variant="contained"
            disabled={selectedItems.length === 0}
          >
            Select {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};