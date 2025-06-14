// components/design-tool/inputs/CopyInputSection.jsx
'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  FileText,
  Upload,
  Sparkle,
  X,
  CheckCircle
} from '@phosphor-icons/react';

export default function CopyInputSection({
  value = '',
  onChange,
  classifiedCopy = [], // Add default empty array
  onClassifiedChange,
  onCopyAnalyzed,      // Callback for when copy is analyzed
  onError,             // Callback for errors
  analysis,            // Analysis results from parent
  loading = false      // Loading state from parent
}) {
  const [isClassifying, setIsClassifying] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Use classifiedCopy prop or fall back to empty array
  const sections = Array.isArray(classifiedCopy) ? classifiedCopy : [];

  // Handle file upload
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadError('');

    // Check file type
    const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a .txt, .pdf, or .docx file');
      return;
    }

    try {
      let content = '';
      
      if (file.type === 'text/plain') {
        content = await file.text();
      } else {
        // For PDF/DOCX, we'd need additional libraries
        // For now, show an error asking for plain text
        setUploadError('PDF and DOCX support coming soon. Please use plain text files for now.');
        return;
      }

      if (onChange) {
        onChange(content);
      }
      
      // Clear the file input
      event.target.value = '';
    } catch (error) {
      setUploadError('Failed to read file: ' + error.message);
    }
  }, [onChange]);

  // Classify copy using AI - this creates the initial classification
  const handleClassify = async () => {
    if (!value.trim()) return;

    setIsClassifying(true);
    try {
      // Use mock classification to trigger the workflow
      // The comprehensive API call will happen in the parent component
      const mockClassified = mockClassifyContent(value);

      if (onClassifiedChange) {
        onClassifiedChange(mockClassified);
      }
      
      // Call the parent callback to trigger the comprehensive API
      if (onCopyAnalyzed) {
        onCopyAnalyzed(mockClassified);
      }
    } catch (error) {
      console.error('Classification error:', error);
      
      // Call error callback
      if (onError) {
        onError('Failed to analyze copy: ' + error.message);
      }
      
      // Use mock classification as fallback
      const mockClassified = mockClassifyContent(value);
      if (onClassifiedChange) {
        onClassifiedChange(mockClassified);
      }
      
      if (onCopyAnalyzed) {
        onCopyAnalyzed(mockClassified);
      }
    } finally {
      setIsClassifying(false);
    }
  };

  // Mock classification for development - creates section structure
  const mockClassifyContent = (text) => {
    const sections = [];
    
    if (text.toLowerCase().includes('hero') || text.toLowerCase().includes('welcome')) {
      sections.push({ type: 'hero', content: text.substring(0, 200), priority: 1 });
    }
    if (text.toLowerCase().includes('feature') || text.toLowerCase().includes('benefit')) {
      sections.push({ type: 'features', content: 'Feature content...', priority: 2 });
    }
    if (text.toLowerCase().includes('testimonial') || text.toLowerCase().includes('review')) {
      sections.push({ type: 'testimonial', content: 'Testimonial content...', priority: 3 });
    }
    if (text.toLowerCase().includes('contact') || text.toLowerCase().includes('get started')) {
      sections.push({ type: 'cta', content: 'CTA content...', priority: 4 });
    }
    
    // Default section if no matches
    if (sections.length === 0) {
      sections.push({ type: 'content', content: text.substring(0, 200), priority: 1 });
    }
    
    return sections;
  };

  // Remove a classified section
  const removeClassifiedSection = (index) => {
    const updated = sections.filter((_, i) => i !== index);
    if (onClassifiedChange) {
      onClassifiedChange(updated);
    }
  };

  // Section type colors
  const getSectionColor = (type) => {
    const colors = {
      hero: 'primary',
      features: 'secondary',
      testimonial: 'success',
      cta: 'warning',
      about: 'info',
      content: 'default'
    };
    return colors[type] || 'default';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <FileText size={20} weight="duotone" />
        <Typography variant="h6">Copy Content</Typography>
      </Box>

      {/* File Upload */}
      <Box sx={{ mb: 2 }}>
        <input
          type="file"
          id="copy-file-upload"
          accept=".txt,.pdf,.docx"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <label htmlFor="copy-file-upload">
          <Button
            component="span"
            variant="outlined"
            startIcon={<Upload size={16} />}
            size="small"
            fullWidth
          >
            Upload Text File
          </Button>
        </label>
      </Box>

      {/* Upload Error */}
      {uploadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {uploadError}
        </Alert>
      )}

      {/* Text Input */}
      <TextField
        multiline
        rows={8}
        fullWidth
        placeholder="Paste your website copy here... Include headlines, features, testimonials, call-to-actions, etc."
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        sx={{ mb: 2 }}
        variant="outlined"
        disabled={loading}
      />

      {/* Classify Button */}
      <Button
        variant="contained"
        startIcon={isClassifying || loading ? <CircularProgress size={16} /> : <Sparkle size={16} />}
        onClick={handleClassify}
        disabled={!value.trim() || isClassifying || loading}
        fullWidth
        sx={{ mb: 2 }}
      >
        {isClassifying || loading ? 'Analyzing Content...' : 'Analyze Content with AI'}
      </Button>

      {/* Analysis Results from Parent */}
      {analysis && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Analysis Complete:</strong> {analysis.sections?.length || 0} sections detected
          </Typography>
        </Alert>
      )}

      {/* Classified Sections */}
      {sections.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle size={16} weight="fill" style={{ color: 'green' }} />
            Content Sections ({sections.length})
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {sections
              .sort((a, b) => (a.priority || 0) - (b.priority || 0))
              .map((section, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    bgcolor: 'grey.50',
                    borderRadius: 1
                  }}
                >
                  <Chip
                    label={section.type || 'content'}
                    color={getSectionColor(section.type)}
                    size="small"
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {(section.content || '').substring(0, 50)}...
                  </Typography>
                  <Tooltip title="Remove section">
                    <IconButton
                      size="small"
                      onClick={() => removeClassifiedSection(index)}
                    >
                      <X size={14} />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
          </Box>
        </>
      )}

      {/* Help Text */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        💡 Tip: Include different content types (headlines, features, testimonials) for better AI classification
      </Typography>
    </Box>
  );
}