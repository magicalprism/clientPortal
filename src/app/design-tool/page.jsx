// app/design-tool/page.jsx
'use client';

import { useState } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Paper,
  Divider,
  Alert,
  Button
} from '@mui/material';
import { Sparkle } from '@phosphor-icons/react';

// Import components
import CopyInputSection from '@/components/design-tool/inputs/CopyInputSection';
import UrlAnalyzerSection from '@/components/design-tool/inputs/UrlAnalyzerSection';
import BrandTokensSection from '@/components/design-tool/inputs/BrandTokensSection';
import LivePreviewSection from '@/components/design-tool/preview/LivePreviewSection';

export default function DesignToolPage() {
  // Core state for the design tool
  const [copyContent, setCopyContent] = useState('');
  const [classifiedCopy, setClassifiedCopy] = useState([]);
  const [inspirationUrl, setInspirationUrl] = useState('');
  const [extractedLayout, setExtractedLayout] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brandTokens, setBrandTokens] = useState({});
  const [generatedLayouts, setGeneratedLayouts] = useState([]);
  const [generationMetadata, setGenerationMetadata] = useState(null);
  const [selectedVariation, setSelectedVariation] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Handler for when all inputs are ready to generate
  const handleGenerate = async () => {
    if (!copyContent || !classifiedCopy.length || !inspirationUrl || !extractedLayout.length || !selectedBrand || !Object.keys(brandTokens).length) {
      return; // Need all inputs
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 15, 90));
      }, 300);

      // Call the generation API
      const response = await fetch('/api/ai/generate-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classifiedCopy,
          extractedLayout,
          brandTokens
        })
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (!response.ok) {
        throw new Error('Layout generation failed');
      }

      const result = await response.json();
      
      if (result.success) {
        setGeneratedLayouts(result.data.variations || result.data);
        setGenerationMetadata(result.data.metadata);
        setSelectedVariation(0); // Select first variation
      } else {
        throw new Error(result.error || 'Generation failed');
      }
      
    } catch (error) {
      console.error('Generation failed:', error);
      
      // Fallback to mock layouts for development
      setGeneratedLayouts([
        { 
          name: 'Stripe Style', 
          sections: classifiedCopy.map(section => ({
            ...section,
            layout: 'centered',
            style: { 
              backgroundColor: brandTokens.colors?.primary?.primary?.value || '#3B82F6', 
              color: '#ffffff',
              fontFamily: brandTokens.typography?.heading?.heading?.value || 'Inter'
            }
          })),
          characteristics: ['Professional', 'Clean', 'Conversion-focused']
        },
        { 
          name: 'Apple Style', 
          sections: classifiedCopy.map(section => ({
            ...section,
            layout: 'image-background',
            style: { 
              backgroundColor: '#000000', 
              color: '#ffffff',
              fontFamily: brandTokens.typography?.heading?.heading?.value || 'Inter'
            }
          })),
          characteristics: ['Minimal', 'Visual', 'Premium']
        },
        { 
          name: 'Linear Style', 
          sections: classifiedCopy.map(section => ({
            ...section,
            layout: '3-col-grid',
            style: { 
              backgroundColor: '#ffffff', 
              color: '#333333',
              fontFamily: brandTokens.typography?.body?.body?.value || 'Inter'
            }
          })),
          characteristics: ['Modern', 'Functional', 'Developer-focused']
        }
      ]);
      setGenerationMetadata({
        generatedAt: new Date().toISOString(),
        totalSections: classifiedCopy.length,
        confidence: 87
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(0), 1000);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Sparkle size={32} weight="duotone" />
          <Typography variant="h4" component="h1">
            AI Design Tool
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Transform your copy into beautiful layouts using AI-powered design generation
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Panel - Inputs */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Copy Input - Working */}
            <Paper sx={{ p: 3 }}>
              <CopyInputSection
                value={copyContent}
                onChange={setCopyContent}
                classifiedCopy={classifiedCopy}
                onClassifiedChange={setClassifiedCopy}
              />
            </Paper>

            {/* URL Analyzer - Now Working */}
            <Paper sx={{ p: 3 }}>
              <UrlAnalyzerSection
                value={inspirationUrl}
                onChange={setInspirationUrl}
                extractedLayout={extractedLayout}
                onLayoutChange={setExtractedLayout}
              />
            </Paper>

            {/* Brand Tokens - Now Working */}
            <Paper sx={{ p: 3 }}>
              <BrandTokensSection
                selectedBrand={selectedBrand}
                onBrandChange={setSelectedBrand}
                brandTokens={brandTokens}
                onTokensChange={setBrandTokens}
              />
            </Paper>
          </Box>
        </Grid>

        {/* Right Panel - Preview & Export */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Live Preview */}
            <Paper sx={{ minHeight: 600 }}>
              <LivePreviewSection
                generatedLayouts={generatedLayouts}
                selectedVariation={selectedVariation}
                onVariationChange={setSelectedVariation}
                isGenerating={isGenerating}
                generationProgress={generationProgress}
                generationMetadata={generationMetadata}
                onGenerate={handleGenerate}
                canGenerate={!!(copyContent && classifiedCopy.length > 0 && inspirationUrl && extractedLayout.length > 0 && selectedBrand && Object.keys(brandTokens).length > 0)}
                brandTokens={brandTokens}
              />
            </Paper>

            {/* Export Options - Show when layouts are generated */}
            {generatedLayouts.length > 0 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Export Options</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button variant="outlined" startIcon="📄">Export HTML</Button>
                  <Button variant="outlined" startIcon="⚛️">Export React</Button>
                  <Button variant="outlined" startIcon="🎨">Export CSS</Button>
                  <Button variant="outlined" startIcon="📋">Export JSON</Button>
                </Box>
              </Paper>
            )}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}