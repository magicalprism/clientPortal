// components/design-tool/preview/ComprehensivePreviewSection.jsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  LinearProgress
} from '@mui/material';
import {
  Sparkle,
  TrendUp,
  CheckCircle,
  Warning,
  Info
} from '@phosphor-icons/react';

export default function ComprehensivePreviewSection({
  copyClassification,
  layoutAnalysis, 
  brandTokens,
  brandId,
  copyContent,
  selectedBrand,
  onLayoutGenerated
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [layoutResults, setLayoutResults] = useState(null);
  const [error, setError] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);

  // Check if all inputs are ready
  const allInputsReady = copyClassification && layoutAnalysis && (brandTokens || brandId);

  // Auto-generate when all inputs are ready
  useEffect(() => {
    if (allInputsReady && !isGenerating && !layoutResults) {
      console.log('🚀 Auto-generating comprehensive layout...');
      handleGenerateLayout();
    }
  }, [copyClassification, layoutAnalysis, brandTokens, brandId, allInputsReady]);

  const handleGenerateLayout = async () => {
    if (!allInputsReady) {
      setError('Missing required data for generation');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGenerationProgress(10);

    try {
      console.log('🎨 Calling comprehensive API with data:', {
        copyContent: !!copyContent,
        layoutAnalysis: !!layoutAnalysis,
        brandTokens: !!brandTokens
      });

      const response = await fetch('/api/ai/generate-with-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Content from copy analysis
          content: copyContent,
          
          // Formatted layout data
          extractedDesignData: layoutAnalysis,
          
          // Brand tokens
          brandTokens: brandTokens,
          
          // Additional context
          industryContext: selectedBrand?.industry || 'saas',
          layoutStyle: 'stripe',
          options: {
            useScreenshots: true,
            includeResponsive: true,
            generateCSS: true,
            contentAnalysis: copyClassification
          }
        })
      });

      setGenerationProgress(70);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Comprehensive layout generated:', result);
        
        const layoutData = {
          ...result.webpage,
          quality_score: result.quality_metrics,
          design_system: result.webpage.generation_metadata
        };
        
        setLayoutResults(layoutData);
        setGenerationProgress(100);
        
        if (onLayoutGenerated) {
          onLayoutGenerated(layoutData);
        }
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (err) {
      console.error('🚨 Comprehensive generation error:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Show loading state
  if (isGenerating) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Generating Comprehensive Design
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Combining your content, layout patterns, and brand styling with design system calculations...
          </Typography>
          
          {generationProgress > 0 && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={generationProgress} 
                sx={{ height: 6, borderRadius: 3 }}
              />
              <Typography variant="caption" color="text.secondary" mt={1}>
                {generationProgress < 30 ? 'Analyzing inputs...' :
                 generationProgress < 70 ? 'Applying design system...' :
                 'Finalizing layout...'}
              </Typography>
            </Box>
          )}
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
            <Typography variant="body2" gutterBottom>
              <strong>Generation Error:</strong>
            </Typography>
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
          <Button 
            onClick={handleGenerateLayout} 
            variant="outlined"
            disabled={!allInputsReady}
            startIcon={<Sparkle size={16} />}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show waiting state
  if (!allInputsReady) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Sparkle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom>
            Waiting for Complete Data
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Complete all steps on the left to generate your comprehensive design.
          </Typography>
          
          {/* Show what's missing */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
            <Chip 
              label="Copy Analysis" 
              color={copyClassification ? "success" : "default"} 
              size="small" 
              icon={copyClassification ? <CheckCircle size={16} /> : <div style={{width: 16, height: 16}} />}
            />
            <Chip 
              label="Layout Analysis" 
              color={layoutAnalysis ? "success" : "default"} 
              size="small" 
              icon={layoutAnalysis ? <CheckCircle size={16} /> : <div style={{width: 16, height: 16}} />}
            />
            <Chip 
              label="Brand Tokens" 
              color={(brandTokens || brandId) ? "success" : "default"} 
              size="small" 
              icon={(brandTokens || brandId) ? <CheckCircle size={16} /> : <div style={{width: 16, height: 16}} />}
            />
          </Box>

          <Button 
            onClick={handleGenerateLayout}
            variant="contained"
            disabled={!allInputsReady}
            startIcon={<Sparkle size={16} />}
          >
            Generate Comprehensive Layout
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show generated results
  if (layoutResults) {
    return (
      <>
        {/* Design Quality Dashboard */}
        <DesignQualityDashboard 
          qualityScore={layoutResults.quality_score}
          calculations={layoutResults.generation_metadata?.calculations_utilized}
        />

        {/* Data Sources Used */}
        <DataSourcesUsed 
          copyClassification={copyClassification}
          layoutAnalysis={layoutAnalysis}
          brandTokens={brandTokens}
          generationMetadata={layoutResults.generation_metadata}
        />

        {/* Generated HTML/CSS Preview */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Generated Comprehensive Design
            </Typography>
            
            <Box
              sx={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
                minHeight: '600px'
              }}
            >
              <iframe
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <style>
                        ${layoutResults.css || ''}
                        body { 
                          margin: 0; 
                          padding: 0; 
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
                        }
                      </style>
                    </head>
                    <body>
                      ${layoutResults.html || '<div style="padding: 40px; text-align: center;">No content generated</div>'}
                    </body>
                  </html>
                `}
                style={{
                  width: '100%',
                  height: '600px',
                  border: 'none'
                }}
                title="Generated Comprehensive Design"
              />
            </Box>
          </CardContent>
        </Card>

        {/* CSS Variables Display */}
        {layoutResults.css_variables && (
          <CSSVariablesDisplay variables={layoutResults.css_variables} />
        )}

        {/* Regenerate Button */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Button
            onClick={() => {
              setLayoutResults(null);
              handleGenerateLayout();
            }}
            variant="outlined"
            startIcon={<Sparkle size={16} />}
          >
            Regenerate Layout
          </Button>
        </Box>
      </>
    );
  }

  return null;
}

// Design Quality Dashboard Component
function DesignQualityDashboard({ qualityScore, calculations }) {
  const getScoreColor = (score) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score) => {
    if (score >= 0.8) return <CheckCircle size={24} style={{ color: '#4caf50' }} />;
    if (score >= 0.6) return <Warning size={24} style={{ color: '#ff9800' }} />;
    return <Info size={24} style={{ color: '#f44336' }} />;
  };

  const overallScore = qualityScore?.overall_score || qualityScore?.overall_quality || 0;

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
          <TrendUp size={24} />
          Design Quality Assessment
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              {getScoreIcon(overallScore)}
              <Typography variant="h4" fontWeight="bold" 
                color={`${getScoreColor(overallScore)}.main`}>
                {Math.round(overallScore * 100)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Overall Score
              </Typography>
            </Box>
          </Grid>
          
          {qualityScore?.breakdown && Object.entries(qualityScore.breakdown).map(([key, value]) => (
            <Grid item xs={6} md={3} key={key}>
              <Box textAlign="center">
                <Typography variant="h5" fontWeight="bold"
                  color={`${getScoreColor(value)}.main`}>
                  {Math.round(value * 100)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {key.replace('_', ' ').toUpperCase()}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Design System Calculations Used */}
        {calculations && calculations.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>Design System Calculations Applied</Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {calculations.map((calc, index) => (
                <Chip key={index} label={calc} size="small" variant="outlined" color="primary" />
              ))}
            </Box>
          </Box>
        )}

        {/* Quality Recommendations */}
        {overallScore < 0.8 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Suggestions:</strong> Consider refining content length, improving section hierarchy, 
              or adjusting brand token application for better design quality.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Data Sources Used Component
function DataSourcesUsed({ copyClassification, layoutAnalysis, brandTokens, generationMetadata }) {
  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Data Sources Used in Generation
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>Content Analysis</Typography>
            <Typography variant="body2" color="text.secondary">
              {copyClassification?.sections?.length || Array.isArray(copyClassification) ? copyClassification.length : 0} sections detected
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Source: Copy input & AI classification
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>Layout Inspiration</Typography>
            <Typography variant="body2" color="text.secondary">
              {layoutAnalysis?.url || 'No URL provided'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {layoutAnalysis?.source || 'Unknown source'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>Brand Tokens</Typography>
            <Typography variant="body2" color="text.secondary">
              {Object.keys(brandTokens || {}).length} tokens applied
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {generationMetadata?.brand_tokens_applied ? 'Applied successfully' : 'Not applied'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

// CSS Variables Display Component
function CSSVariablesDisplay({ variables }) {
  const [showVariables, setShowVariables] = useState(false);

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Button
          onClick={() => setShowVariables(!showVariables)}
          variant="outlined"
          size="small"
          sx={{ mb: 2 }}
        >
          {showVariables ? 'Hide' : 'Show'} CSS Variables ({Object.keys(variables).length})
        </Button>
        
        {showVariables && (
          <Box
            sx={{
              maxHeight: '300px',
              overflow: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#f8f9fa',
              p: 2
            }}
          >
            <pre style={{ margin: 0, fontSize: '12px', lineHeight: '1.4' }}>
              {Object.entries(variables)
                .map(([key, value]) => `${key}: ${value};`)
                .join('\n')}
            </pre>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}