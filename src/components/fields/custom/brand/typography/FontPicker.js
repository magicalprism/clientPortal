'use client';

import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Tooltip,
  Typography,
  CircularProgress
} from '@mui/material';
import { Plus } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/browser';
import { MediaUploadModal } from '@/components/fields/media/modals/MediaUploadModal';
import * as collections from '@/collections';

export const FontPicker = ({
  value,
  onChange,
  label,
  size = 'small',
  required = false,
  disabled = false,
  record = null
}) => {
  const [fonts, setFonts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const supabase = createClient();
  const mediaConfig = collections.media;

  // Fetch fonts from media table
  const fetchFonts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('media')
        .select('id, title, url, mime_type, alt_text')
        .or('mime_type.ilike.%font%,mime_type.ilike.%woff%,mime_type.ilike.%ttf%,mime_type.ilike.%otf%')
        .eq('status', 'uploaded')
        .order('title', { ascending: true });

      if (error) {
        console.error('Error fetching fonts:', error);
        setFonts([]);
      } else {
        console.log('Fetched fonts:', data);
        setFonts(data || []);
      }
    } catch (err) {
      console.error('Error in fetchFonts:', err);
      setFonts([]);
    } finally {
      setLoading(false);
    }
  };

  // Load fonts on component mount
  useEffect(() => {
    fetchFonts();
  }, []);

  // Handle font selection
  const handleFontChange = (event) => {
    const fontId = event.target.value;
    onChange(fontId);
  };

  // Handle font upload completion
  const handleUploadComplete = (uploadedMedia) => {
    console.log('Font upload completed:', uploadedMedia);
    
    // If single file uploaded, select it automatically
    if (uploadedMedia && uploadedMedia.length > 0) {
      const newFont = uploadedMedia[0];
      onChange(newFont.id);
    }
    
    // Refresh the font list
    fetchFonts();
    setUploadModalOpen(false);
  };

  // Get font display name
  const getFontDisplayName = (font) => {
    return font.title || font.alt_text || `Font ${font.id}`;
  };

  // Get font type for display
  const getFontType = (mimeType) => {
    if (mimeType?.includes('woff2')) return 'WOFF2';
    if (mimeType?.includes('woff')) return 'WOFF';
    if (mimeType?.includes('ttf')) return 'TTF';
    if (mimeType?.includes('otf')) return 'OTF';
    if (mimeType?.includes('font')) return 'FONT';
    return 'FONT';
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        <FormControl fullWidth size={size} disabled={disabled}>
          <InputLabel required={required}>
            {label}
          </InputLabel>
          <Select
            value={value || ''}
            onChange={handleFontChange}
            label={label}
            disabled={loading || disabled}
            startAdornment={loading ? (
              <CircularProgress size={16} sx={{ mr: 1 }} />
            ) : null}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {fonts.map((font) => (
              <MenuItem key={font.id} value={font.id}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="body2">
                    {getFontDisplayName(font)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getFontType(font.mime_type)} • {font.url?.split('/').pop()?.substring(0, 30)}...
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Tooltip title="Upload new font">
          <IconButton
            onClick={() => setUploadModalOpen(true)}
            disabled={disabled}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              height: size === 'small' ? 40 : 56, // Match Select height
              width: size === 'small' ? 40 : 56,
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50'
              }
            }}
          >
            <Plus size={20} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Font Upload Modal */}
      <MediaUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
        record={record}
        field={{ name: 'font_upload' }}
        config={mediaConfig}
        isMulti={false}
        maxFiles={1}
        acceptedFileTypes={[
          '.woff',
          '.woff2',
          '.ttf',
          '.otf',
          'font/woff',
          'font/woff2',
          'font/truetype',
          'font/opentype',
          'application/font-woff',
          'application/font-woff2',
          'application/x-font-ttf',
          'application/x-font-otf'
        ]}
        maxFileSize={5 * 1024 * 1024} // 5MB for fonts
      />
    </>
  );
};