// components/design-tool/inputs/CopyInputSection.jsx (FIXED VERSION)
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
  CheckCircle,
  Warning
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
  const [apiError, setApiError] = useState('');

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
    setApiError('');
    
    try {
      console.log('🎨 Starting content analysis...');
      
      // Call the API with the correct parameter name
      const response = await fetch('/api/ai/classify-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: value.trim(), // Using 'content' as the API now handles both
          brandTokens: {},
          industryContext: 'saas'
        })
      });

      console.log('🔍 API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('📊 API Result:', result);

      if (result.success && result.analysis) {
        // Use the analysis.sections as the classified copy
        const classifiedSections = result.analysis.sections || [];
        
        if (onClassifiedChange) {
          onClassifiedChange(classifiedSections);
        }
        
        // Call the parent callback to trigger the comprehensive API
        if (onCopyAnalyzed) {
          onCopyAnalyzed(classifiedSections);
        }
        
        console.log('✅ Content analysis successful');
        setApiError('');
      } else {
        throw new Error(result.error || 'API returned success=false');
      }
    } catch (error) {
      console.error('❌ Classification error:', error);
      const errorMessage = error.message || 'Failed to analyze copy';
      setApiError(errorMessage);
      
      // Call error callback
      if (onError) {
        onError('Failed to analyze copy: ' + errorMessage);
      }
      
      // Use mock classification as fallback
      console.log('🔄 Using mock classification as fallback');
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

      {/* API Error */}
      {apiError && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button size="small" onClick={() => setApiError('')}>
              Dismiss
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>API Error:</strong> {apiError}
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.8 }}>
            Using fallback mock classification. Check console for details.
          </Typography>
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
        disabled={loading || isClassifying}
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
          {analysis.quality_metrics && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Quality Score: {Math.round(analysis.quality_metrics.overall_quality * 100)}%
            </Typography>
          )}
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
                  {section.confidence && (
                    <Chip
                      label={section.confidence}
                      size="small"
                      variant="outlined"
                      color={section.confidence === 'high' ? 'success' : 'default'}
                      sx={{ fontSize: '0.7rem' }}
                    />
                  )}
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
      
      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="caption">
            <strong>Debug Info:</strong><br />
            API Status: {apiError ? '❌ Error' : '✅ Ready'}<br />
            Sections: {sections.length}<br />
            Analysis: {analysis ? '✅ Available' : '❌ Not available'}
          </Typography>
        </Alert>
      )}
    </Box>
  );
}