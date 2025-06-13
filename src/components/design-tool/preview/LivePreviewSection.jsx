// components/design-tool/preview/LivePreviewSection.jsx
'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import {
  Sparkle,
  Eye,
  Lightning,
  Devices,
  ArrowsClockwise
} from '@phosphor-icons/react';

export default function LivePreviewSection({
  generatedLayouts = [],
  selectedVariation = 0,
  onVariationChange = () => {},
  isGenerating = false,
  generationProgress = 0,
  generationMetadata = null,
  onGenerate = () => {},
  canGenerate = false,
  brandTokens = {}
}) {
  const [previewMode, setPreviewMode] = useState('desktop');

  // Get current layout
  const currentLayout = generatedLayouts[selectedVariation];

  // Preview modes
  const previewModes = [
    { key: 'desktop', label: 'Desktop', width: '100%' },
    { key: 'tablet', label: 'Tablet', width: '768px' },
    { key: 'mobile', label: 'Mobile', width: '375px' }
  ];

  // Handle tab change
  const handleVariationChange = (event, newValue) => {
    onVariationChange(newValue);
  };

  // Handle generation
  const handleGenerate = async () => {
    await onGenerate();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Eye size={20} weight="duotone" />
            <Typography variant="h6">Live Preview</Typography>
          </Box>

          {/* Preview Mode Toggles */}
          {currentLayout && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {previewModes.map(mode => (
                <Tooltip key={mode.key} title={mode.label}>
                  <IconButton
                    size="small"
                    onClick={() => setPreviewMode(mode.key)}
                    color={previewMode === mode.key ? 'primary' : 'default'}
                    sx={{
                      border: 1,
                      borderColor: previewMode === mode.key ? 'primary.main' : 'grey.300'
                    }}
                  >
                    <Devices size={16} />
                  </IconButton>
                </Tooltip>
              ))}
            </Box>
          )}
        </Box>

        {/* Generate Button */}
        {!currentLayout && (
          <Button
            variant="contained"
            size="large"
            startIcon={isGenerating ? <CircularProgress size={16} /> : <Sparkle size={16} />}
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            fullWidth
            sx={{ py: 1.5 }}
          >
            {isGenerating ? 'Generating Layouts...' : 'Generate AI Layouts'}
          </Button>
        )}

        {/* Layout Variation Tabs */}
        {generatedLayouts.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Tabs
              value={selectedVariation}
              onChange={handleVariationChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              {generatedLayouts.map((layout, index) => (
                <Tab
                  key={index}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getLayoutIcon(layout.name)}
                      <Typography variant="body2">{layout.name}</Typography>
                    </Box>
                  }
                />
              ))}
            </Tabs>

            <Tooltip title="Regenerate variations">
              <IconButton
                onClick={handleGenerate}
                disabled={isGenerating}
                size="small"
              >
                <ArrowsClockwise size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Requirements Alert */}
        {!canGenerate && !currentLayout && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Complete all inputs (copy, URL, brand) to generate layouts
          </Alert>
        )}
      </Box>

      {/* Preview Content */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        display: 'flex',
        justifyContent: 'center',
        bgcolor: 'grey.50',
        p: 2
      }}>
        {isGenerating ? (
          <GeneratingState progress={generationProgress} />
        ) : currentLayout ? (
          <PreviewContainer 
            layout={currentLayout} 
            previewMode={previewMode}
            maxWidth={previewModes.find(m => m.key === previewMode)?.width}
            metadata={generationMetadata}
            brandTokens={brandTokens}
          />
        ) : (
          <EmptyState canGenerate={canGenerate} />
        )}
      </Box>
    </Box>
  );
}

// Generating State Component
function GeneratingState({ progress = 0 }) {
  const getProgressMessage = () => {
    if (progress < 20) return 'Analyzing your content...';
    if (progress < 40) return 'Extracting layout patterns...';
    if (progress < 60) return 'Applying brand styling...';
    if (progress < 80) return 'Generating variations...';
    if (progress < 100) return 'Finalizing layouts...';
    return 'Almost ready!';
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100%',
      gap: 3
    }}>
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress 
          variant="determinate" 
          value={progress} 
          size={80} 
          thickness={4}
          sx={{ color: 'primary.main' }}
        />
        <Lightning 
          size={28} 
          weight="fill" 
          style={{ 
            position: 'absolute',
            color: '#1976d2'
          }} 
        />
      </Box>
      
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Generating AI Layouts
        </Typography>
        <Typography variant="body1" color="primary" sx={{ fontWeight: 500, mb: 1 }}>
          {Math.round(progress)}% Complete
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
          {getProgressMessage()}
        </Typography>
      </Box>
    </Box>
  );
}

// Empty State Component
function EmptyState({ canGenerate }) {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100%',
      gap: 2,
      textAlign: 'center'
    }}>
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: 2,
          border: 2,
          borderStyle: 'dashed',
          borderColor: 'grey.300',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'white'
        }}
      >
        <Eye size={48} color="grey" weight="duotone" />
      </Box>
      
      <Typography variant="h6" color="text.secondary">
        {canGenerate ? 'Ready to Generate' : 'Preview Your AI Designs'}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
        {canGenerate 
          ? 'Click the generate button to create AI-powered layout variations using your content and brand'
          : 'Complete the inputs on the left to see your generated layouts here'
        }
      </Typography>
    </Box>
  );
}

// Preview Container Component
function PreviewContainer({ layout, previewMode, maxWidth, metadata, brandTokens }) {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: maxWidth,
        bgcolor: 'white',
        borderRadius: 1,
        boxShadow: 2,
        overflow: 'hidden',
        transition: 'max-width 0.3s ease'
      }}
    >
      {/* Preview Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'grey.50',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getLayoutIcon(layout.name)}
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {layout.name}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            label={`${layout.sections?.length || 0} sections`} 
            size="small" 
            variant="outlined" 
          />
          <Chip 
            label={previewMode} 
            size="small" 
            color="primary"
          />
          {metadata?.confidence && (
            <Chip 
              label={`${metadata.confidence}% confidence`} 
              size="small" 
              color="success"
            />
          )}
        </Box>
      </Box>

      {/* Layout Characteristics */}
      {layout.characteristics && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.25' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Style Characteristics:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {layout.characteristics.map((characteristic, index) => (
              <Chip
                key={index}
                label={characteristic}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Rendered Sections */}
      <Box sx={{ minHeight: 400 }}>
        {layout.sections && layout.sections.length > 0 ? (
          layout.sections.map((section, index) => (
            <SectionPreview 
              key={index}
              section={section}
              previewMode={previewMode}
              brandTokens={brandTokens}
            />
          ))
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No sections to preview yet
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// Simple Section Preview Component
function SectionPreview({ section, previewMode, brandTokens }) {
  const sectionStyle = {
    padding: previewMode === 'mobile' ? '2rem 1rem' : '3rem 1.5rem',
    backgroundColor: section.style?.backgroundColor || '#ffffff',
    color: section.style?.color || '#000000',
    fontFamily: section.style?.fontFamily || 'Arial, sans-serif',
    borderBottom: '1px solid #f0f0f0'
  };

  const renderContent = () => {
    switch (section.type) {
      case 'hero':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              {section.content?.split('.')[0] || 'Transform Your Business'}
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, opacity: 0.8 }}>
              Discover powerful solutions that help you achieve your goals
            </Typography>
            <Button variant="contained" size="large" sx={{ borderRadius: 2 }}>
              Get Started
            </Button>
          </Box>
        );
      
      case 'features':
        return (
          <Box>
            <Typography variant="h4" sx={{ textAlign: 'center', mb: 4 }}>
              Powerful Features
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: previewMode === 'mobile' ? '1fr' : 'repeat(3, 1fr)',
              gap: 3 
            }}>
              {['⚡ Fast Performance', '🔒 Secure & Reliable', '🎨 Beautiful Design'].map((feature, i) => (
                <Card key={i} sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>{feature}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Amazing feature description goes here
                  </Typography>
                </Card>
              ))}
            </Box>
          </Box>
        );
      
      case 'testimonial':
        return (
          <Box sx={{ textAlign: 'center', maxWidth: '600px', mx: 'auto' }}>
            <Typography variant="h4" sx={{ mb: 3 }}>
              What Our Customers Say
            </Typography>
            <Typography variant="h5" sx={{ fontStyle: 'italic', mb: 3 }}>
              "This product has completely transformed how we work. The results speak for themselves."
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Sarah Johnson, CEO at TechCorp
            </Typography>
          </Box>
        );
      
      case 'cta':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
              Ready to Get Started?
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, opacity: 0.8 }}>
              Join thousands of satisfied customers today
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexDirection: previewMode === 'mobile' ? 'column' : 'row' }}>
              <Button variant="contained" size="large">Start Free Trial</Button>
              <Button variant="outlined" size="large">Contact Sales</Button>
            </Box>
          </Box>
        );
      
      default:
        return (
          <Typography variant="h5">
            {section.type} Section - {section.content?.substring(0, 100) || 'Content goes here'}
          </Typography>
        );
    }
  };

  return (
    <Box sx={sectionStyle}>
      <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
        {renderContent()}
      </Box>
    </Box>
  );
}

// Get layout icon helper
function getLayoutIcon(layoutName) {
  const icons = {
    'Stripe Style': '💳',
    'Apple Style': '🍎', 
    'Linear Style': '📐',
    'Notion Style': '📝',
    'Default': '🎨'
  };
  
  return icons[layoutName] || icons['Default'];
}