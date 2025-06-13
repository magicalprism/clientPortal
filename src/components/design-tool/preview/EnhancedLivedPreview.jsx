// components/design-tool/preview/EnhancedLivePreview.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Desktop,
  DeviceMobile,
  DeviceTablet,
  Sparkle
} from '@phosphor-icons/react';

export default function EnhancedLivePreview({ 
  copyClassification, 
  layoutAnalysis, 
  brandTokens, 
  brandId 
}) {
  const [generatedLayout, setGeneratedLayout] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewportMode, setViewportMode] = useState('desktop');
  const [error, setError] = useState('');

  const viewportSizes = {
    desktop: { width: '100%', maxWidth: '1200px' },
    tablet: { width: '768px', maxWidth: '768px' },
    mobile: { width: '375px', maxWidth: '375px' }
  };

  // Generate layout when all inputs are available
  useEffect(() => {
    if (copyClassification && layoutAnalysis && (brandTokens || brandId)) {
      generateCombinedLayout();
    }
  }, [copyClassification, layoutAnalysis, brandTokens, brandId]);

  const generateCombinedLayout = async () => {
    if (!copyClassification || !layoutAnalysis) {
      setError('Copy classification and layout analysis are required');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      console.log('🎨 Generating combined layout...');
      
      const response = await fetch('/api/ai/generate-layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          copyClassification,
          layoutAnalysis,
          brandTokens,
          brandId
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('🎨 Layout generated successfully:', result.data);
        setGeneratedLayout(result.data);
      } else {
        setError(result.error || 'Layout generation failed');
      }
    } catch (err) {
      console.error('Layout generation error:', err);
      setError('Failed to generate layout');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderSection = (section, index) => {
    const SectionComponent = getSectionComponent(section.type);
    
    return (
      <Box
        key={section.id || index}
        sx={{
          width: '100%',
          backgroundColor: section.styling?.backgroundColor || '#ffffff',
          color: section.styling?.textColor || '#000000',
          padding: section.styling?.padding || '32px 0',
          ...getResponsiveStyles(section, viewportMode)
        }}
      >
        <Box
          sx={{
            maxWidth: section.styling?.containerMaxWidth || '1200px',
            margin: '0 auto',
            padding: '0 16px',
            ...getStructureStyles(section)
          }}
        >
          <SectionComponent section={section} viewportMode={viewportMode} />
        </Box>
      </Box>
    );
  };

  const getSectionComponent = (type) => {
    const components = {
      hero: HeroSection,
      features: FeaturesSection,
      testimonial: TestimonialSection,
      cta: CTASection,
      gallery: GallerySection
    };
    
    return components[type] || DefaultSection;
  };

  const getStructureStyles = (section) => {
    switch (section.structure) {
      case 'grid':
        return {
          display: 'grid',
          gridTemplateColumns: section.gridTemplate || 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: section.styling?.gridGap || '24px',
          alignItems: 'center'
        };
      case 'flex-column':
        return {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        };
      default:
        return {
          display: 'flex',
          flexDirection: 'column'
        };
    }
  };

  const getResponsiveStyles = (section, viewport) => {
    if (viewport === 'mobile') {
      return {
        '& .grid-section': {
          gridTemplateColumns: '1fr !important'
        },
        fontSize: '14px'
      };
    }
    if (viewport === 'tablet') {
      return {
        '& .grid-section': {
          gridTemplateColumns: 'repeat(2, 1fr) !important'
        }
      };
    }
    return {};
  };

  if (isGenerating) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Generating Your Design
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Combining your copy, layout patterns, and brand styling...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button onClick={generateCombinedLayout} variant="outlined">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!generatedLayout) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Sparkle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom>
            Ready to Generate Your Design
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add your copy, analyze a layout, and select your brand to generate an intelligent design.
          </Typography>
          <Button 
            onClick={generateCombinedLayout}
            variant="contained"
            disabled={!copyClassification || !layoutAnalysis}
          >
            Generate Combined Layout
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header with Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6">Live Preview</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip 
                label={`${generatedLayout.sections?.length || 0} sections`}
                size="small" 
                variant="outlined" 
              />
              <Chip 
                label={generatedLayout.generation?.layoutSource || 'Unknown'}
                size="small" 
                variant="outlined" 
                color="primary"
              />
              <Chip 
                label={generatedLayout.generation?.brandSource || 'Default'}
                size="small" 
                variant="outlined" 
                color="secondary"
              />
            </Box>
          </Box>

          {/* Viewport Controls */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={() => setViewportMode('desktop')}
              color={viewportMode === 'desktop' ? 'primary' : 'default'}
            >
              <Desktop />
            </IconButton>
            <IconButton
              onClick={() => setViewportMode('tablet')}
              color={viewportMode === 'tablet' ? 'primary' : 'default'}
            >
              <DeviceTablet />
            </IconButton>
            <IconButton
              onClick={() => setViewportMode('mobile')}
              color={viewportMode === 'mobile' ? 'primary' : 'default'}
            >
              <DeviceMobile />
            </IconButton>
          </Box>
        </Box>

        {/* Preview Container */}
        <Box
          sx={{
            width: '100%',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#ffffff'
          }}
        >
          <Box
            sx={{
              width: viewportSizes[viewportMode].width,
              maxWidth: viewportSizes[viewportMode].maxWidth,
              margin: '0 auto',
              minHeight: '400px',
              transition: 'all 0.3s ease'
            }}
          >
            {generatedLayout.sections?.map((section, index) => renderSection(section, index))}
          </Box>
        </Box>

        {/* Regenerate Button */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            onClick={generateCombinedLayout}
            variant="outlined"
            startIcon={<Sparkle />}
            disabled={isGenerating}
          >
            Regenerate Layout
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// Section Components
function HeroSection({ section, viewportMode }) {
  const { content, styling } = section;
  
  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h1"
          sx={{
            fontSize: styling?.headlineSize || '48px',
            fontWeight: styling?.headlineWeight || '600',
            fontFamily: styling?.headlineFont || 'Inter',
            lineHeight: 1.2,
            mb: 2,
            ...(viewportMode === 'mobile' && { fontSize: '32px' })
          }}
        >
          {content?.headline || 'Your Headline Here'}
        </Typography>
        
        {content?.subheadline && (
          <Typography
            variant="subtitle1"
            sx={{
              fontSize: styling?.subheadlineSize || '18px',
              color: 'text.secondary',
              mb: 3,
              maxWidth: '600px',
              ...(viewportMode === 'mobile' && { fontSize: '16px' })
            }}
          >
            {content.subheadline}
          </Typography>
        )}
        
        <Button
          variant="contained"
          size="large"
          sx={{
            backgroundColor: styling?.ctaBackgroundColor || '#0070f3',
            color: styling?.ctaTextColor || '#ffffff',
            fontSize: '16px',
            padding: '12px 24px'
          }}
        >
          {content?.cta || 'Get Started'}
        </Button>
      </Box>
      
      {content?.image && section.layout === 'split-content' && (
        <Box
          sx={{
            width: '100%',
            height: '300px',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary'
          }}
        >
          <Typography>Image Placeholder</Typography>
        </Box>
      )}
    </>
  );
}

function FeaturesSection({ section, viewportMode }) {
  const { content, styling } = section;
  
  return (
    <>
      {content?.title && (
        <Typography
          variant="h2"
          sx={{
            fontSize: styling?.titleSize || '32px',
            fontWeight: styling?.titleWeight || '600',
            fontFamily: styling?.titleFont || 'Inter',
            textAlign: 'center',
            mb: 4,
            ...(viewportMode === 'mobile' && { fontSize: '24px' })
          }}
        >
          {content.title}
        </Typography>
      )}
      
      <Box
        className="grid-section"
        sx={{
          display: 'grid',
          gridTemplateColumns: section.gridTemplate || 'repeat(3, 1fr)',
          gap: styling?.gridGap || '32px',
          ...(viewportMode === 'mobile' && { gridTemplateColumns: '1fr' }),
          ...(viewportMode === 'tablet' && { gridTemplateColumns: 'repeat(2, 1fr)' })
        }}
      >
        {content?.features?.map((feature, index) => (
          <Box key={feature.id || index} sx={{ textAlign: 'center' }}>
            <Box sx={{ fontSize: '32px', mb: 2 }}>{feature.icon}</Box>
            <Typography
              variant="h6"
              sx={{
                fontSize: styling?.featureTitleSize || '20px',
                fontWeight: '500',
                mb: 1
              }}
            >
              {feature.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: styling?.featureTextSize || '16px',
                color: 'text.secondary'
              }}
            >
              {feature.description}
            </Typography>
          </Box>
        ))}
      </Box>
    </>
  );
}

function TestimonialSection({ section, viewportMode }) {
  const { content, styling } = section;
  
  return (
    <Box sx={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <Typography
        variant="h3"
        sx={{
          fontSize: styling?.quoteSize || '24px',
          fontWeight: styling?.quoteWeight || '400',
          fontFamily: styling?.quoteFont || 'Inter',
          fontStyle: 'italic',
          mb: 3,
          ...(viewportMode === 'mobile' && { fontSize: '20px' })
        }}
      >
        "{content?.quote || 'This is an amazing product that has transformed our business.'}"
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          👤
        </Box>
        <Box sx={{ textAlign: 'left' }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontSize: styling?.authorSize || '14px',
              fontWeight: styling?.authorWeight || '500'
            }}
          >
            {content?.author || 'Customer Name'}
          </Typography>
          {content?.company && (
            <Typography variant="caption" color="text.secondary">
              {content.company}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function CTASection({ section, viewportMode }) {
  const { content, styling } = section;
  
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography
        variant="h2"
        sx={{
          fontSize: styling?.headlineSize || '36px',
          fontWeight: styling?.headlineWeight || '600',
          fontFamily: styling?.headlineFont || 'Inter',
          mb: 2,
          ...(viewportMode === 'mobile' && { fontSize: '28px' })
        }}
      >
        {content?.headline || 'Ready to get started?'}
      </Typography>
      
      {content?.description && (
        <Typography
          variant="subtitle1"
          sx={{
            fontSize: styling?.descriptionSize || '18px',
            mb: 3,
            opacity: 0.9,
            ...(viewportMode === 'mobile' && { fontSize: '16px' })
          }}
        >
          {content.description}
        </Typography>
      )}
      
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          size="large"
          sx={{
            backgroundColor: styling?.primaryCTABg || '#ffffff',
            color: styling?.primaryCTAText || '#0070f3',
            fontSize: '16px',
            padding: '12px 24px'
          }}
        >
          {content?.primaryCTA || 'Get Started'}
        </Button>
        
        {content?.secondaryCTA && (
          <Button
            variant="outlined"
            size="large"
            sx={{
              borderColor: styling?.secondaryCTAText || '#ffffff',
              color: styling?.secondaryCTAText || '#ffffff',
              fontSize: '16px',
              padding: '12px 24px'
            }}
          >
            {content.secondaryCTA}
          </Button>
        )}
      </Box>
    </Box>
  );
}

function DefaultSection({ section }) {
  const { content, styling } = section;
  
  return (
    <Box>
      {content?.title && (
        <Typography variant="h3" sx={{ mb: 2, fontSize: styling?.fontSize || '16px' }}>
          {content.title}
        </Typography>
      )}
      {content?.text && (
        <Typography variant="body1" sx={{ fontSize: styling?.fontSize || '16px' }}>
          {content.text}
        </Typography>
      )}
    </Box>
  );
}