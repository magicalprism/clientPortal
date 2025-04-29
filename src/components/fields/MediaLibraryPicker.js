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

export const MediaLibraryPicker = ({ open, onClose, onSelect }) => {
  const supabase = createClient();

  const [mediaList, setMediaList] = useState([]);
  const [filters, setFilters] = useState({
    alt_text: '',
    mime_type: '',
    company_id: '',
    project_id: '',
  });
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (open) {
      loadMedia();
      loadCompanies();
      loadProjects();
    }
  }, [open, filters]);

  const loadMedia = async () => {
    let query = supabase.from('media').select('id, url, alt_text, mime_type, copyright, company_id, project_id');

    if (filters.alt_text) {
      query = query.ilike('alt_text', `%${filters.alt_text}%`);
    }
    if (filters.mime_type) {
      query = query.ilike('mime_type', `%${filters.mime_type}%`);
    }
    if (filters.company_id) {
      query = query.eq('company_id', filters.company_id);
    }
    if (filters.project_id) {
      query = query.eq('project_id', filters.project_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error loading media:', error);
      return;
    }

    setMediaList(data || []);
  };

  const loadCompanies = async () => {
    const { data, error } = await supabase.from('company').select('id, title');
    if (!error) {
      setCompanies(data);
    }
  };

  const loadProjects = async () => {
    const { data, error } = await supabase.from('project').select('id, title');
    if (!error) {
      setProjects(data);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Choose an Image</DialogTitle>

      <DialogContent>
        {/* Filters */}
        <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
  <TextField
    label="Search"
    value={filters.alt_text}
    onChange={(e) => handleFilterChange('alt_text', e.target.value)}
    size="small"
    sx={{ minWidth: 150 }}
  />

  <FormControl size="small" sx={{ minWidth: 150 }}>
    <InputLabel>Type</InputLabel>
    <Select
      value={filters.mime_type}
      onChange={(e) => handleFilterChange('mime_type', e.target.value)}
      label="Type"
    >
      <MenuItem value="">All Types</MenuItem>
      <MenuItem value="image">Images</MenuItem>
      <MenuItem value="video">Videos</MenuItem>
    </Select>
  </FormControl>

  <FormControl size="small" sx={{ minWidth: 150 }}>
    <InputLabel>Company</InputLabel>
    <Select
      value={filters.company_id}
      onChange={(e) => handleFilterChange('company_id', e.target.value)}
      label="Company"
    >
      <MenuItem value="">All Companies</MenuItem>
      {companies.map((company) => (
        <MenuItem key={company.id} value={company.id}>
          {company.title}
        </MenuItem>
      ))}
    </Select>
  </FormControl>

  <FormControl size="small" sx={{ minWidth: 150 }}>
    <InputLabel>Project</InputLabel>
    <Select
      value={filters.project_id}
      onChange={(e) => handleFilterChange('project_id', e.target.value)}
      label="Project"
    >
      <MenuItem value="">All Projects</MenuItem>
      {projects.map((project) => (
        <MenuItem key={project.id} value={project.id}>
          {project.title}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
</Stack>


        {/* Grid of Media Items */}
        <Grid container spacing={2}>
          {mediaList.length > 0 ? (
            mediaList.map((media) => (
              <Grid item xs={4} sm={3} md={2} key={media.id}>
                <Box
                  sx={{
                    border: '1px solid #ccc',
                    borderRadius: 2,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.8 },
                  }}
                  onClick={() => {
                    onSelect(media);
                    onClose();
                  }}
                >
                  <img
                    src={media.url}
                    alt={media.alt_text || 'Media'}
                    style={{ width: '100%', height: 120, objectFit: 'cover' }}
                  />
                </Box>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                No media found
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};
