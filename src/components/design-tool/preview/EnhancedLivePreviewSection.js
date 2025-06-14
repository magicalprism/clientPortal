'use client';

import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  IconButton, 
  Typography, 
  Card, 
  Switch, 
  FormControlLabel,
  Chip,
  Alert
} from '@mui/material';
import { 
  DeviceMobile, 
  DeviceTablet, 
  Desktop, 
  Palette, 
  Gauge, 
  Eye 
} from '@phosphor-icons/react';

export default function EnhancedLivePreviewSection({ 
  layouts, 
  designSystem, 
  contentAnalysis 
}) {
  const [selectedVariation, setSelectedVariation] = useState(0);
  const [previewMode, setPreviewMode] = useState('desktop'); // mobile, tablet, desktop
  const [showDesignSpecs, setShowDesignSpecs] = useState(false);
  const [showQualityIndicators, setShowQualityIndicators] = useState(true);

  // Generate layout variations based on design system
  const layoutVariations = useMemo(() => {
    if (!layouts || !designSystem) return [];

    return [
      {
        name: 'Professional',
        description: 'Clean, trustworthy design optimized for business',
        style: 'stripe',
        preview_url: generateLayoutPreview(layouts, designSystem, 'professional')
      },
      {
        name: 'Modern',
        description: 'Contemporary design with bold typography',
        style: 'linear',
        preview_url: generateLayoutPreview(layouts, designSystem, 'modern')
      },
      {
        name: 'Minimal',
        description: 'Clean, spacious design focused on content',
        style: 'apple',
        preview_url: generateLayoutPreview(layouts, designSystem, 'minimal')
      }
    ];
  }, [layouts, designSystem]);

  // Get responsive dimensions
  const getPreviewDimensions = () => {
    const dimensions = {
      mobile: { width: '375px', height: '667px' },
      tablet: { width: '768px', height: '1024px' },
      desktop: { width: '100%', height: '800px' }
    };
    return dimensions[previewMode];
  };

  // Get quality indicators for current layout
  const getQualityIndicators = () => {
    if (!layouts?.quality_validations) return [];

    const indicators = [];
    const validations = layouts.quality_validations;

    if (validations.overall_pass) {
      indicators.push({ 
        type: 'success', 
        label: 'Professional Quality', 
        score: Math.round(validations.score * 100) 
      });
    }

    if (validations.validations?.responsive_design) {
      indicators.push({ 
        type: 'info', 
        label: 'Responsive Ready', 
        score: 100 
      });
    }

    if (validations.validations?.design_consistency) {
      indicators.push({ 
        type: 'success', 
        label: 'Design Consistent', 
        score: 95 
      });
    }

    return indicators;
  };

  return (
    <Card sx={{ p: 3 }}>
      {/* Header Controls */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Live Preview
        </Typography>
        
        <Box display="flex" gap={2} alignItems="center">
          {/* Preview Mode Toggle */}
          <Box display="flex" gap={1}>
            <IconButton
              color={previewMode === 'mobile' ? 'primary' : 'default'}
              onClick={() => setPreviewMode('mobile')}
              size="small"
            >
              <DeviceMobile size={20} />
            </IconButton>
            <IconButton
              color={previewMode === 'tablet' ? 'primary' : 'default'}
              onClick={() => setPreviewMode('tablet')}
              size="small"
            >
              <DeviceTablet size={20} />
            </IconButton>
            <IconButton
              color={previewMode === 'desktop' ? 'primary' : 'default'}
              onClick={() => setPreviewMode('desktop')}
              size="small"
            >
              <Desktop size={20} />
            </IconButton>
          </Box>

          {/* Toggle Controls */}
          <FormControlLabel
            control={
              <Switch
                checked={showQualityIndicators}
                onChange={(e) => setShowQualityIndicators(e.target.checked)}
                size="small"
              />
            }
            label="Quality"
            sx={{ ml: 2 }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={showDesignSpecs}
                onChange={(e) => setShowDesignSpecs(e.target.checked)}
                size="small"
              />
            }
            label="Specs"
          />
        </Box>
      </Box>

      {/* Quality Indicators */}
      {showQualityIndicators && (
        <Box mb={3}>
          <Box display="flex" gap={1} flexWrap="wrap">
            {getQualityIndicators().map((indicator, index) => (
              <Chip
                key={index}
                label={`${indicator.label} (${indicator.score}%)`}
                color={indicator.type}
                size="small"
                icon={indicator.type === 'success' ? <Gauge size={16} /> : <Eye size={16} />}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Layout Variation Tabs */}
      <Box mb={3}>
        <Tabs
          value={selectedVariation}
          onChange={(e, newValue) => setSelectedVariation(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {layoutVariations.map((variation, index) => (
            <Tab
              key={index}
              label={
                <Box textAlign="left">
                  <Typography variant="body2" fontWeight="medium">
                    {variation.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {variation.description}
                  </Typography>
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Preview Area */}
      <Box 
        position="relative"
        bgcolor="grey.100"
        borderRadius={2}
        p={2}
        minHeight="600px"
        overflow="auto"
      >
        {layoutVariations.length > 0 ? (
          <Box
            sx={{
              ...getPreviewDimensions(),
              margin: previewMode === 'desktop' ? '0' : '0 auto',
              bgcolor: 'white',
              borderRadius: 1,
              boxShadow: previewMode !== 'desktop' ? 3 : 0,
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            <LayoutPreviewRenderer
              layout={layouts}
              designSystem={designSystem}
              variation={layoutVariations[selectedVariation]}
              previewMode={previewMode}
              contentAnalysis={contentAnalysis}
            />
          </Box>
        ) : (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height="100%"
            color="text.secondary"
          >
            <Typography>Generate layouts to see preview</Typography>
          </Box>
        )}
      </Box>

      {/* Design Specifications Panel */}
      {showDesignSpecs && designSystem && (
        <DesignSpecsPanel 
          designSystem={designSystem}
          layout={layouts}
          variation={layoutVariations[selectedVariation]}
        />
      )}
    </Card>
  );
}

// Layout Preview Renderer Component
function LayoutPreviewRenderer({ layout, designSystem, variation, previewMode, contentAnalysis }) {
  if (!layout?.sections) return null;

  const designTokens = layout.design_tokens || designSystem?.design_tokens;
  
  return (
    <Box>
      {layout.sections.map((section, index) => (
        <SectionRenderer
          key={section.id || index}
          section={section}
          designTokens={designTokens}
          previewMode={previewMode}
          variationStyle={variation?.style}
        />
      ))}
    </Box>
  );
}

// Individual Section Renderer
function SectionRenderer({ section, designTokens, previewMode, variationStyle }) {
  const responsiveStyles = section.responsive_styles?.[previewMode] || {};
  const sectionStyling = section.styling || {};
  
  // Generate CSS styles from design tokens and section specifications
  const sectionStyles = {
    padding: responsiveStyles.spacing || sectionStyling.spacing?.padding || '40px 20px',
    backgroundColor: sectionStyling.colors?.background || designTokens?.colors?.background || 'white',
    color: sectionStyling.colors?.text || designTokens?.colors?.text_primary || '#212529',
    textAlign: responsiveStyles.text_align || sectionStyling.text_align || 'left',
    maxWidth: section.layout_approach?.max_width || '100%',
    margin: '0 auto',
    position: 'relative'
  };

  return (
    <Box sx={sectionStyles}>
      {/* Section Type Indicator */}
      <Typography 
        variant="caption" 
        color="text.secondary" 
        sx={{ 
          position: 'absolute', 
          top: 8, 
          right: 8,
          bgcolor: 'rgba(0,0,0,0.1)',
          px: 1,
          py: 0.5,
          borderRadius: 1
        }}
      >
        {section.type}
      </Typography>

      {/* Render Content Chunks */}
      {section.content_chunks?.map((chunk, index) => (
        <ChunkRenderer
          key={index}
          chunk={chunk}
          designTokens={designTokens}
          sectionType={section.type}
          variationStyle={variationStyle}
        />
      ))}

      {/* Quality Score Indicator */}
      {section.quality_score && (
        <Box mt={2}>
          <Chip
            label={`Quality: ${Math.round(section.quality_score * 100)}%`}
            size="small"
            color={section.quality_score > 0.7 ? 'success' : 'warning'}
            variant="outlined"
          />
        </Box>
      )}
    </Box>
  );
}

// Content Chunk Renderer
function ChunkRenderer({ chunk, designTokens, sectionType, variationStyle }) {
  const getChunkStyles = () => {
    const baseStyles = {
      marginBottom: '16px',
      fontFamily: designTokens?.typography?.font_family_primary || 'Inter, sans-serif'
    };

    // Style based on chunk type and section
    if (chunk.type === 'headline') {
      return {
        ...baseStyles,
        fontSize: sectionType === 'hero' ? '2.5rem' : '1.75rem',
        fontWeight: 'bold',
        lineHeight: 1.2,
        color: designTokens?.colors?.text_primary || '#1a1a1a'
      };
    }

    if (chunk.type === 'subtext' || chunk.type === 'description') {
      return {
        ...baseStyles,
        fontSize: '1.125rem',
        lineHeight: 1.5,
        color: designTokens?.colors?.text_secondary || '#6c757d'
      };
    }

    if (chunk.type === 'title') {
      return {
        ...baseStyles,
        fontSize: '1.5rem',
        fontWeight: '600',
        lineHeight: 1.3
      };
    }

    return baseStyles;
  };

  return (
    <Typography
      component="div"
      sx={getChunkStyles()}
    >
      {chunk.content}
    </Typography>
  );
}

// Design Specifications Panel
function DesignSpecsPanel({ designSystem, layout, variation }) {
  return (
    <Box mt={3} p={3} bgcolor="grey.50" borderRadius={2}>
      <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
        <Palette size={24} />
        Design Specifications
      </Typography>

      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={3}>
        {/* Typography Specs */}
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" mb={1}>
            Typography
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Font: {designSystem?.typography?.font_family_primary || 'Inter'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Scale: {designSystem?.typography?.scale || '1.25'}
          </Typography>
        </Box>

        {/* Color Specs */}
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" mb={1}>
            Colors
          </Typography>
          <Box display="flex" gap={1} mt={1}>
            {designSystem?.colors && Object.entries(designSystem.colors).slice(0, 4).map(([key, value]) => (
              <Box
                key={key}
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: value,
                  borderRadius: '50%',
                  border: '1px solid rgba(0,0,0,0.1)'
                }}
                title={`${key}: ${value}`}
              />
            ))}
          </Box>
        </Box>

        {/* Spacing Specs */}
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" mb={1}>
            Spacing
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Base: {designSystem?.spacing?.base_unit || 8}px
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Grid: {layout?.layout_pattern?.grid_system || '12-column'}
          </Typography>
        </Box>

        {/* Quality Metrics */}
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" mb={1}>
            Quality
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Score: {Math.round((layout?.quality_validations?.score || 0) * 100)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Status: {layout?.quality_validations?.overall_pass ? 'Professional' : 'Needs improvement'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// Helper function to generate layout preview
function generateLayoutPreview(layouts, designSystem, variationType) {
  // This would generate actual preview HTML/CSS
  // For now, return a placeholder
  return `preview_${variationType}_${Date.now()}`;
}