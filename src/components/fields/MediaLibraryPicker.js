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

export const MediaLibraryPicker = ({ open, onClose, onSelect, record }) => {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const companyIdFromParams = searchParams.get('company_id');

  const [mediaList, setMediaList] = useState([]);
  const [filters, setFilters] = useState({
    alt_text: '',
    mime_type: '',
    company_id: companyIdFromParams || '',
    project_id: '',
  });
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (open) {
      // If company_id isn't already set, try using record
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

  // Grouping media by folder or mime type
    const groupedMedia = mediaList.reduce((acc, item) => {
      const key = item.folder || item.mime_type?.split('/')[0] || 'Other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});


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
  
          {/* Grouped Media Grid */}
          <Box>
            {Object.entries(groupedMedia).length > 0 ? (
              Object.entries(groupedMedia).map(([group, items]) => (
                <Box key={group} sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>{group.toUpperCase()}</Typography>
                  <Grid container spacing={2}>
                  {items.map((media) => {
  const isImage = media.mime_type?.startsWith('image');

  return (
    <Grid item xs={4} sm={3} md={2} key={media.id}>
      <Box
        sx={{
          border: '1px solid #ccc',
          borderRadius: 2,
          overflow: 'hidden',
          cursor: 'pointer',
          '&:hover': { opacity: 0.8 },
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          backgroundColor: '#f5f5f5',
        }}
        onClick={() => {
          onSelect(media);
          onClose();
        }}
      >
        {isImage ? (
          <img
            src={media.url}
            alt={media.alt_text || 'Media'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            width="100%"
            px={1}
          >
            <Typography
              variant="caption"
              fontWeight="bold"
              align="center"
              noWrap
              sx={{ width: '100%' }}
            >
              {media.alt_text || 'Unnamed file'}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              sx={{ width: '100%' }}
            >
              {media.mime_type || 'Unknown'}
            </Typography>
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
              <Typography variant="body2" color="text.secondary">
                No media found
              </Typography>
            )}
          </Box>
        </DialogContent>
  
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    );
  };