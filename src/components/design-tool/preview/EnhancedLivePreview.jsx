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
  brandId,
  onLayoutGenerated 
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

  // Check if all inputs are ready for generation
  const hasValidCopy = copyClassification && 
    typeof copyClassification === 'object' && 
    (Array.isArray(copyClassification) ? copyClassification.length > 0 : Object.keys(copyClassification).length > 0);

  const hasValidLayout = layoutAnalysis && 
    typeof layoutAnalysis === 'object' && 
    Object.keys(layoutAnalysis).length > 0;

  const hasValidBrand = (brandTokens && 
    typeof brandTokens === 'object' && 
    Object.keys(brandTokens).length > 0) || brandId;

  const allInputsReady = hasValidCopy && hasValidLayout && hasValidBrand;

  // Generate layout when all inputs are available
  useEffect(() => {
    if (allInputsReady && !isGenerating && !generatedLayout) {
      console.log('🚀 Auto-generating layout with inputs ready');
      generateCombinedLayout();
    }
  }, [copyClassification, layoutAnalysis, brandTokens, brandId, allInputsReady]);

  const generateCombinedLayout = async () => {
    if (!allInputsReady) {
      setError('All inputs are required: copy classification, layout analysis, and brand data');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      console.log('🎨 Generating combined layout with data:', {
        copyClassification: !!copyClassification,
        layoutAnalysis: !!layoutAnalysis,
        brandTokens: !!brandTokens,
        brandId: !!brandId
      });
      
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
        
        // Notify parent component about the generated layout
        if (onLayoutGenerated) {
          onLayoutGenerated(result.data);
        }
      } else {
        console.error('🚨 Layout generation failed:', result.error);
        setError(result.error || 'Layout generation failed');
      }
    } catch (err) {
      console.error('🚨 Layout generation error:', err);
      setError('Failed to generate layout. Please check your network connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderSection = (section, index) => {
    const SectionComponent = getSectionComponent(section.type);
    
    console.log(`🎨 Rendering section ${index} with styling:`, section.styling);
    
    return (
      <Box
        key={section.id || index}
        sx={{
          width: '100%',
          backgroundColor: section.styling?.backgroundColor || '#ffffff',
          color: section.styling?.textColor || '#000000',
          padding: section.styling?.padding || '48px 0',
          minHeight: 'auto',
          position: 'relative',
          ...getResponsiveStyles(section, viewportMode)
        }}
      >
        <Box
          sx={{
            maxWidth: section.styling?.containerMaxWidth || '1200px',
            margin: '0 auto',
            padding: '0 24px',
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

  // Show loading state
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

  // Show error state
  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button 
            onClick={generateCombinedLayout} 
            variant="outlined"
            disabled={!allInputsReady}
          >
            Try Again
          </Button>
          {!allInputsReady && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Make sure all inputs are completed first
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show waiting state when inputs are not ready
  if (!allInputsReady) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Sparkle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom>
            Ready to Generate Your Design
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Complete all steps on the left to generate your intelligent design.
          </Typography>
          
          {/* Show what's missing */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
            <Chip 
              label="Copy" 
              color={hasValidCopy ? "success" : "default"} 
              size="small" 
            />
            <Chip 
              label="Layout" 
              color={hasValidLayout ? "success" : "default"} 
              size="small" 
            />
            <Chip 
              label="Brand" 
              color={hasValidBrand ? "success" : "default"} 
              size="small" 
            />
          </Box>

          <Button 
            onClick={generateCombinedLayout}
            variant="contained"
            disabled={!allInputsReady}
          >
            Generate Combined Layout
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show generated layout
  if (generatedLayout) {
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
                size="small"
              >
                <Desktop />
              </IconButton>
              <IconButton
                onClick={() => setViewportMode('tablet')}
                color={viewportMode === 'tablet' ? 'primary' : 'default'}
                size="small"
              >
                <DeviceTablet />
              </IconButton>
              <IconButton
                onClick={() => setViewportMode('mobile')}
                color={viewportMode === 'mobile' ? 'primary' : 'default'}
                size="small"
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

  return null;
}

// Enhanced Hero Section with Stripe-like styling
function HeroSection({ section, viewportMode }) {
  const { content, styling } = section;
  
  console.log('🎨 Hero section styling:', styling);
  
  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h1"
          sx={{
            fontSize: styling?.headlineSize || '48px',
            fontWeight: styling?.headlineWeight || '600',
            fontFamily: styling?.headlineFont || 'Inter',
            lineHeight: styling?.headlineLineHeight || 1.2,
            mb: 3,
            textAlign: styling?.textAlign || 'center',
            ...(viewportMode === 'mobile' && { 
              fontSize: `calc(${styling?.headlineSize || '48px'} * 0.7)` 
            })
          }}
        >
          {content?.headline || 'Your Headline Here'}
        </Typography>
        
        {content?.subheadline && (
          <Typography
            variant="subtitle1"
            sx={{
              fontSize: styling?.subheadlineSize || '18px',
              fontWeight: styling?.subheadlineWeight || '400',
              color: 'inherit',
              mb: 4,
              maxWidth: '600px',
              margin: '0 auto 32px auto',
              textAlign: styling?.textAlign || 'center',
              opacity: 0.9,
              ...(viewportMode === 'mobile' && { 
                fontSize: `calc(${styling?.subheadlineSize || '18px'} * 0.9)` 
              })
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
            fontWeight: styling?.ctaFontWeight || '600',
            padding: styling?.ctaPadding || '12px 24px',
            borderRadius: styling?.ctaBorderRadius || '8px',
            textTransform: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '&:hover': {
              backgroundColor: styling?.ctaBackgroundColor || '#0070f3',
              opacity: 0.9,
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
            },
            transition: 'all 0.2s ease'
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
            borderRadius: styling?.borderRadius || '8px',
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

// Enhanced Features Section with Stripe-like styling
function FeaturesSection({ section, viewportMode }) {
  const { content, styling } = section;
  
  console.log('🎨 Features section styling:', styling);
  
  return (
    <>
      {content?.title && (
        <Typography
          variant="h2"
          sx={{
            fontSize: styling?.titleSize || '32px',
            fontWeight: styling?.titleWeight || '600',
            fontFamily: styling?.titleFont || 'Inter',
            lineHeight: styling?.titleLineHeight || 1.2,
            textAlign: 'center',
            mb: 6,
            color: 'inherit',
            ...(viewportMode === 'mobile' && { 
              fontSize: `calc(${styling?.titleSize || '32px'} * 0.8)`,
              mb: 4
            })
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
          ...(viewportMode === 'mobile' && { 
            gridTemplateColumns: '1fr',
            gap: `calc(${styling?.gridGap || '32px'} * 0.75)`
          }),
          ...(viewportMode === 'tablet' && { 
            gridTemplateColumns: 'repeat(2, 1fr)' 
          })
        }}
      >
        {content?.features?.map((feature, index) => (
          <Box 
            key={feature.id || index} 
            sx={{ 
              textAlign: 'center',
              padding: styling?.featurePadding || '24px',
              borderRadius: styling?.borderRadius || '8px',
              backgroundColor: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                backgroundColor: 'rgba(255,255,255,0.95)'
              }
            }}
          >
            <Box sx={{ 
              fontSize: '40px', 
              mb: 2,
              lineHeight: 1
            }}>
              {feature.icon}
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontSize: styling?.featureTitleSize || '20px',
                fontWeight: styling?.featureTitleWeight || '600',
                mb: 2,
                color: 'inherit',
                lineHeight: 1.3
              }}
            >
              {feature.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: styling?.featureTextSize || '16px',
                color: 'inherit',
                opacity: 0.8,
                lineHeight: styling?.featureTextLineHeight || 1.5
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

// Enhanced Testimonial Section
function TestimonialSection({ section, viewportMode }) {
  const { content, styling } = section;
  
  console.log('🎨 Testimonial section styling:', styling);
  
  return (
    <Box sx={{ 
      textAlign: 'center', 
      maxWidth: '700px', 
      margin: '0 auto',
      padding: styling?.featurePadding || '48px 32px',
      borderRadius: styling?.borderRadius || '12px',
      backgroundColor: 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.2)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
    }}>
      <Typography
        variant="h3"
        sx={{
          fontSize: styling?.quoteSize || '24px',
          fontWeight: styling?.quoteWeight || '400',
          fontFamily: styling?.quoteFont || 'Inter',
          fontStyle: 'italic',
          lineHeight: styling?.quoteLineHeight || 1.4,
          mb: 4,
          color: 'inherit',
          ...(viewportMode === 'mobile' && { 
            fontSize: `calc(${styling?.quoteSize || '24px'} * 0.85)` 
          })
        }}
      >
        "{content?.quote || 'This is an amazing product that has transformed our business.'}"
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 3,
        ...(viewportMode === 'mobile' && { 
          flexDirection: 'column',
          gap: 2
        })
      }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}
        >
          👤
        </Box>
        <Box sx={{ textAlign: viewportMode === 'mobile' ? 'center' : 'left' }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontSize: styling?.authorSize || '16px',
              fontWeight: styling?.authorWeight || '600',
              color: 'inherit',
              mb: 0.5
            }}
          >
            {content?.author || 'Customer Name'}
          </Typography>
          {content?.company && (
            <Typography 
              variant="caption" 
              sx={{
                color: 'inherit',
                opacity: 0.7,
                fontSize: '14px'
              }}
            >
              {content.company}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// Enhanced CTA Section
function CTASection({ section, viewportMode }) {
  const { content, styling } = section;
  
  console.log('🎨 CTA section styling:', styling);
  
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography
        variant="h2"
        sx={{
          fontSize: styling?.headlineSize || '36px',
          fontWeight: styling?.headlineWeight || '600',
          fontFamily: styling?.headlineFont || 'Inter',
          lineHeight: styling?.headlineLineHeight || 1.2,
          mb: 3,
          color: 'inherit',
          ...(viewportMode === 'mobile' && { 
            fontSize: `calc(${styling?.headlineSize || '36px'} * 0.8)` 
          })
        }}
      >
        {content?.headline || 'Ready to get started?'}
      </Typography>
      
      {content?.description && (
        <Typography
          variant="subtitle1"
          sx={{
            fontSize: styling?.descriptionSize || '18px',
            fontWeight: styling?.descriptionWeight || '400',
            mb: 4,
            opacity: 0.9,
            maxWidth: '600px',
            margin: '0 auto 32px auto',
            color: 'inherit',
            ...(viewportMode === 'mobile' && { 
              fontSize: `calc(${styling?.descriptionSize || '18px'} * 0.9)` 
            })
          }}
        >
          {content.description}
        </Typography>
      )}
      
      <Box sx={{ 
        display: 'flex', 
        gap: 3, 
        justifyContent: 'center', 
        flexWrap: 'wrap',
        ...(viewportMode === 'mobile' && { 
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        })
      }}>
        <Button
          variant="contained"
          size="large"
          sx={{
            backgroundColor: styling?.primaryCTABg || '#ffffff',
            color: styling?.primaryCTAText || '#0070f3',
            fontSize: '16px',
            fontWeight: styling?.primaryCTAFontWeight || '600',
            padding: styling?.primaryCTAPadding || '16px 32px',
            borderRadius: styling?.primaryCTABorderRadius || '8px',
            textTransform: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '180px',
            '&:hover': {
              backgroundColor: styling?.primaryCTABg || '#ffffff',
              opacity: 0.95,
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
            },
            transition: 'all 0.2s ease'
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
              fontWeight: '600',
              padding: '16px 32px',
              borderRadius: '8px',
              textTransform: 'none',
              minWidth: '180px',
              '&:hover': {
                borderColor: styling?.secondaryCTAText || '#ffffff',
                backgroundColor: 'rgba(255,255,255,0.1)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {content.secondaryCTA}
          </Button>
        )}
      </Box>
    </Box>
  );
}

// Gallery Section
function GallerySection({ section, viewportMode }) {
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
          gridTemplateColumns: section.gridTemplate || 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: styling?.gridGap || '24px',
          ...(viewportMode === 'mobile' && { gridTemplateColumns: '1fr' }),
          ...(viewportMode === 'tablet' && { gridTemplateColumns: 'repeat(2, 1fr)' })
        }}
      >
        {content?.images ? content.images.map((image, index) => (
          <Box
            key={index}
            sx={{
              width: '100%',
              height: '200px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary'
            }}
          >
            <Typography variant="caption">
              {image.alt || `Image ${index + 1}`}
            </Typography>
          </Box>
        )) : (
          [1, 2, 3, 4, 5, 6].map((item) => (
            <Box
              key={item}
              sx={{
                width: '100%',
                height: '200px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary'
              }}
            >
              <Typography variant="caption">
                Gallery Item {item}
              </Typography>
            </Box>
          ))
        )}
      </Box>
    </>
  );
}

// Default Section
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