// components/design-tool/inputs/UrlAnalyzerSection.jsx
'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Globe,
  MagnifyingGlass,
  CheckCircle,
  Warning,
  Layout,
  X
} from '@phosphor-icons/react';

export default function UrlAnalyzerSection({
  value,
  onChange,
  extractedLayout,
  onLayoutChange
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [lastAnalyzedUrl, setLastAnalyzedUrl] = useState('');

  // Validate URL format
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Analyze URL layout structure
  const handleAnalyze = useCallback(async () => {
    if (!value.trim() || !isValidUrl(value)) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const response = await fetch('/api/ai/extract-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: value })
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze URL: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        onLayoutChange(result.data);
        setLastAnalyzedUrl(value);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('URL analysis error:', error);
      setError(error.message);
      
      // Use mock layout as fallback for development
      const mockLayout = generateMockLayout(value);
      onLayoutChange(mockLayout);
      setLastAnalyzedUrl(value);
    } finally {
      setIsAnalyzing(false);
    }
  }, [value, onLayoutChange]);

  // Generate mock layout for development
  const generateMockLayout = (url) => {
    const layouts = [
      { type: 'hero', layout: 'centered', container: 'full-width', description: 'Main hero section with headline' },
      { type: 'features', layout: '3-col-grid', container: 'contained', description: 'Feature grid with icons' },
      { type: 'testimonial', layout: 'carousel', container: 'contained', description: 'Customer testimonials' },
      { type: 'cta', layout: 'centered', container: 'contained', description: 'Call-to-action section' }
    ];

    // Different layouts based on URL to simulate variety
    if (url.includes('stripe')) {
      return [
        { type: 'hero', layout: 'image-right', container: 'contained', description: 'Hero with product demo' },
        { type: 'features', layout: '2-col-grid', container: 'contained', description: 'Feature comparison' },
        { type: 'testimonial', layout: 'single-quote', container: 'contained', description: 'Customer quote' },
        { type: 'cta', layout: 'button-centered', container: 'full-width', description: 'Sign up CTA' }
      ];
    } else if (url.includes('apple')) {
      return [
        { type: 'hero', layout: 'image-background', container: 'full-width', description: 'Full-screen product hero' },
        { type: 'features', layout: 'stacked', container: 'contained', description: 'Feature showcase' },
        { type: 'gallery', layout: 'masonry', container: 'contained', description: 'Product gallery' }
      ];
    }

    return layouts;
  };

  // Remove a layout section
  const removeLayoutSection = (index) => {
    const updated = extractedLayout.filter((_, i) => i !== index);
    onLayoutChange(updated);
  };

  // Get layout type color
  const getLayoutColor = (type) => {
    const colors = {
      hero: 'primary',
      features: 'secondary',
      testimonial: 'success',
      cta: 'warning',
      gallery: 'info',
      about: 'default',
      navigation: 'default',
      footer: 'default'
    };
    return colors[type] || 'default';
  };

  // Get layout icon
  const getLayoutIcon = (layout) => {
    switch (layout) {
      case '3-col-grid':
      case '2-col-grid':
        return '⚏';
      case 'carousel':
        return '⟲';
      case 'centered':
        return '◉';
      case 'image-left':
      case 'image-right':
        return '🖼';
      case 'stacked':
        return '⚍';
      default:
        return '▢';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Globe size={20} weight="duotone" />
        <Typography variant="h6">Layout Inspiration</Typography>
      </Box>

      {/* URL Input */}
      <TextField
        fullWidth
        placeholder="https://stripe.com or https://linear.app"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{ mb: 2 }}
        variant="outlined"
        helperText="Enter a website URL to extract layout patterns"
        error={!!error && !isAnalyzing}
      />

      {/* Analyze Button */}
      <Button
        variant="contained"
        startIcon={isAnalyzing ? <CircularProgress size={16} /> : <MagnifyingGlass size={16} />}
        onClick={handleAnalyze}
        disabled={!value.trim() || isAnalyzing}
        fullWidth
        sx={{ mb: 2 }}
      >
        {isAnalyzing ? 'Analyzing Layout...' : 'Analyze Layout Structure'}
      </Button>

      {/* Error Alert */}
      {error && !isAnalyzing && (
        <Alert 
          severity="warning" 
          sx={{ mb: 2 }}
          icon={<Warning size={16} />}
        >
          {error}
        </Alert>
      )}

      {/* Extracted Layout */}
      {extractedLayout.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle size={16} weight="fill" color="green" />
            Layout Structure from {lastAnalyzedUrl}
          </Typography>

          <List dense sx={{ bgcolor: 'grey.50', borderRadius: 1 }}>
            {extractedLayout.map((section, index) => (
              <ListItem
                key={index}
                sx={{
                  border: 1,
                  borderColor: 'grey.200',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: 'white'
                }}
                secondaryAction={
                  <Tooltip title="Remove section">
                    <IconButton
                      size="small"
                      onClick={() => removeLayoutSection(index)}
                    >
                      <X size={14} />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip
                        label={section.type}
                        color={getLayoutColor(section.type)}
                        size="small"
                      />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {getLayoutIcon(section.layout)} {section.layout}
                      </Typography>
                      <Chip
                        label={section.container}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {section.description}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* Help Text */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        💡 Try URLs like stripe.com, linear.app, or apple.com for different layout styles
      </Typography>
    </Box>
  );
}