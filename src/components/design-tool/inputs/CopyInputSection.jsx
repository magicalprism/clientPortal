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
  value,
  onChange,
  classifiedCopy,
  onClassifiedChange
}) {
  const [isClassifying, setIsClassifying] = useState(false);
  const [uploadError, setUploadError] = useState('');

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

      onChange(content);
      
      // Clear the file input
      event.target.value = '';
    } catch (error) {
      setUploadError('Failed to read file: ' + error.message);
    }
  }, [onChange]);

  // Classify copy using AI
  const handleClassify = async () => {
    if (!value.trim()) return;

    setIsClassifying(true);
    try {
      const response = await fetch('/api/ai/classify-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value })
      });

      if (!response.ok) {
        throw new Error('Classification failed');
      }

      const result = await response.json();
      
      // Transform the response into our expected format
      const classified = result.choices?.[0]?.message?.content 
        ? JSON.parse(result.choices[0].message.content)
        : mockClassifyContent(value); // Fallback to mock for now

      onClassifiedChange(classified);
    } catch (error) {
      console.error('Classification error:', error);
      // Use mock classification as fallback
      onClassifiedChange(mockClassifyContent(value));
    } finally {
      setIsClassifying(false);
    }
  };

  // Mock classification for development
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
    const updated = classifiedCopy.filter((_, i) => i !== index);
    onClassifiedChange(updated);
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
        onChange={(e) => onChange(e.target.value)}
        sx={{ mb: 2 }}
        variant="outlined"
      />

      {/* Classify Button */}
      <Button
        variant="contained"
        startIcon={isClassifying ? <CircularProgress size={16} /> : <Sparkle size={16} />}
        onClick={handleClassify}
        disabled={!value.trim() || isClassifying}
        fullWidth
        sx={{ mb: 2 }}
      >
        {isClassifying ? 'Analyzing Content...' : 'Analyze Content with AI'}
      </Button>

      {/* Classified Sections */}
      {classifiedCopy.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle size={16} weight="fill" color="green" />
            Content Sections ({classifiedCopy.length})
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {classifiedCopy
              .sort((a, b) => a.priority - b.priority)
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
                    label={section.type}
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
                    {section.content.substring(0, 50)}...
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