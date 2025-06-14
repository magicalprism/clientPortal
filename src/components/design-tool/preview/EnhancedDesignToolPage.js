// components/design-tool/EnhancedDesignToolPage.jsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Box, Container, Grid, Typography, Alert, Chip, LinearProgress, Button } from '@mui/material';
import { CheckCircle, Warning, Info, TrendUp, Circle } from '@phosphor-icons/react';

// Import existing components
import CopyInputSection from '@/components/design-tool/inputs/CopyInputSection';
import UrlAnalyzerSection from '@/components/design-tool/inputs/UrlAnalyzerSection';
import BrandTokensSection from '@/components/design-tool/inputs/BrandTokensSection';
import ExportOptionsSection from '@/components/design-tool/preview/ExportOptionsSection';

export default function EnhancedDesignToolPage() {
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data collection state - three separate sources
  const [copyContent, setCopyContent] = useState('');
  const [contentAnalysis, setContentAnalysis] = useState(null); // From classify-copy API
  const [inspirationData, setInspirationData] = useState(null); // From extract-layout API (formatted)
  const [rawInspirationData, setRawInspirationData] = useState(null); // For display purposes
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brandTokens, setBrandTokens] = useState(null); // From brand selection
  
  // Final generation results
  const [layoutResults, setLayoutResults] = useState(null); // From generate-with-analysis API
  const [qualityMetrics, setQualityMetrics] = useState(null);

  // Analysis state
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [designRecommendations, setDesignRecommendations] = useState(null);

  // Check if all data sources are collected
  const allDataCollected = contentAnalysis && inspirationData && brandTokens;

  // Enhanced content analysis with design intelligence
  const analyzeContent = useCallback(async (content) => {
    try {
      setLoading(true);
      setError(null);
      setAnalysisProgress(10);

      const response = await fetch('/api/ai/classify-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          brandTokens,
          industryContext: selectedBrand?.industry || 'saas'
        })
      });

      setAnalysisProgress(50);

      if (!response.ok) {
        throw new Error('Content analysis failed');
      }

      const result = await response.json();
      
      if (result.success) {
        setContentAnalysis(result.analysis);
        setQualityMetrics(result.analysis.quality_metrics);
        setAnalysisProgress(100);
        
        // Auto-advance to next step if quality is good
        if (result.analysis.quality_metrics.overall_quality > 0.7) {
          setTimeout(() => setCurrentStep(1), 1000);
        }
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err.message);
      console.error('Content analysis error:', err);
    } finally {
      setLoading(false);
      setAnalysisProgress(0);
    }
  }, [brandTokens, selectedBrand]);

  // UPDATED: Final comprehensive layout generation
  const generateLayouts = useCallback(async () => {
    if (!allDataCollected) {
      setError('Need content analysis, layout inspiration, and brand tokens for generation');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setAnalysisProgress(20);

      console.log('🎨 Calling comprehensive API with all data sources');

      // Use the comprehensive API with all collected data
      const response = await fetch('/api/ai/generate-with-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Data from content analysis step
          content: copyContent,
          
          // Data from URL analyzer step (formatted for comprehensive API)
          extractedDesignData: inspirationData,
          
          // Data from brand selection step
          brandTokens: brandTokens,
          
          // Additional context
          industryContext: selectedBrand?.industry || 'saas',
          layoutStyle: 'stripe',
          options: {
            useScreenshots: true,
            includeResponsive: true,
            generateCSS: true,
            inspirationUrl: rawInspirationData?.url,
            contentAnalysis: contentAnalysis // Pass the full content analysis
          }
        })
      });

      setAnalysisProgress(70);

      if (!response.ok) {
        throw new Error('Comprehensive layout generation failed');
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Comprehensive layout generated successfully');
        
        // The comprehensive API returns HTML, CSS, CSS variables, and quality metrics
        setLayoutResults({
          ...result.webpage,
          quality_score: result.quality_metrics,
          design_system: result.webpage.generation_metadata
        });
        setQualityMetrics(result.quality_metrics);
        setDesignRecommendations(result.webpage.generation_metadata);
        setAnalysisProgress(100);
        setCurrentStep(2); // Move to preview step
      } else {
        throw new Error(result.error || 'Layout generation failed');
      }
    } catch (err) {
      setError(err.message);
      console.error('Comprehensive generation error:', err);
    } finally {
      setLoading(false);
      setAnalysisProgress(0);
    }
  }, [copyContent, contentAnalysis, inspirationData, brandTokens, selectedBrand, rawInspirationData, allDataCollected]);

  // Handle content input
  const handleContentChange = useCallback((content) => {
    setCopyContent(content);
    setContentAnalysis(null);
    setLayoutResults(null);
    setCurrentStep(0);
  }, []);

  // Handle brand selection
  const handleBrandSelection = useCallback((brand, tokens) => {
    setSelectedBrand(brand);
    setBrandTokens(tokens);
    
    // Re-analyze content with brand context if content exists
    if (copyContent && !contentAnalysis) {
      analyzeContent(copyContent);
    }
  }, [copyContent, contentAnalysis, analyzeContent]);

  // UPDATED: Handle inspiration data - keep raw for display, format for API
  const handleInspirationData = useCallback((rawData) => {
    setRawInspirationData(rawData);
  }, []);

  const handleLayoutAnalyzed = useCallback((formattedData) => {
    setInspirationData(formattedData);
  }, []);

  // Auto-analyze content when it changes
  useEffect(() => {
    if (copyContent.length > 50) {
      const timeoutId = setTimeout(() => {
        analyzeContent(copyContent);
      }, 1000); // Debounce

      return () => clearTimeout(timeoutId);
    }
  }, [copyContent, analyzeContent]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header with Progress */}
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          AI Design Tool
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Transform your copy into professional designs with intelligent analysis
        </Typography>
        
        {/* Progress Indicator */}
        {loading && (
          <Box mt={2}>
            <LinearProgress 
              variant="determinate" 
              value={analysisProgress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary" mt={1}>
              {analysisProgress < 30 ? 'Analyzing content...' :
               analysisProgress < 70 ? 'Generating comprehensive design...' :
               'Finalizing design...'}
            </Typography>
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Box>

      <Grid container spacing={4}>
        {/* Left Panel - Data Collection */}
        <Grid item xs={12} lg={5}>
          {/* Step 1: Content Input & Analysis */}
          <Box mb={4}>
            <CopyInputSection
              value={copyContent}
              onChange={handleContentChange}
              analysis={contentAnalysis}
              loading={loading}
            />
            
            {/* Content Analysis Results */}
            {contentAnalysis && (
              <ContentAnalysisDisplay 
                analysis={contentAnalysis}
                qualityMetrics={qualityMetrics}
              />
            )}
          </Box>

          {/* Step 2: URL Layout Analysis */}
          <Box mb={4}>
            <UrlAnalyzerSection
              onAnalysisComplete={handleInspirationData}
              onLayoutAnalyzed={handleLayoutAnalyzed}
              onError={setError}
              disabled={!contentAnalysis}
            />
          </Box>

          {/* Step 3: Brand Token Selection */}
          <Box mb={4}>
            <BrandTokensSection
              onBrandSelect={handleBrandSelection}
              selectedBrand={selectedBrand}
              disabled={!contentAnalysis}
            />
          </Box>

          {/* Data Collection Progress */}
          <Box mb={4}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Data Collection Progress
            </Typography>
            <Box display="flex" justifyContent="center" gap={1} mb={2} flexWrap="wrap">
              <Chip 
                label="Content Analysis" 
                color={contentAnalysis ? "success" : "default"} 
                size="small" 
                icon={contentAnalysis ? <CheckCircle size={16} /> : <Circle size={16} />}
              />
              <Chip 
                label="Layout Inspiration" 
                color={inspirationData ? "success" : "default"} 
                size="small" 
                icon={inspirationData ? <CheckCircle size={16} /> : <Circle size={16} />}
              />
              <Chip 
                label="Brand Tokens" 
                color={brandTokens ? "success" : "default"} 
                size="small" 
                icon={brandTokens ? <CheckCircle size={16} /> : <Circle size={16} />}
              />
            </Box>
            
            {allDataCollected && (
              <Alert severity="success" sx={{ textAlign: 'center', mb: 2 }}>
                All data collected! Ready to generate comprehensive design.
              </Alert>
            )}
          </Box>

          {/* Final Generation Button */}
          {allDataCollected && (
            <Box textAlign="center" mt={3}>
              <button
                onClick={generateLayouts}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? 'Generating Comprehensive Design...' : 'Generate AI Design'}
              </button>
            </Box>
          )}
        </Grid>

        {/* Right Panel - Final Generated Result */}
        <Grid item xs={12} lg={7}>
          {layoutResults ? (
            <>
              {/* Design Quality Dashboard */}
              <DesignQualityDashboard 
                qualityScore={layoutResults.quality_score}
                designSystem={layoutResults.design_system}
                calculations={layoutResults.generation_metadata?.calculations_utilized}
              />

              {/* Data Sources Used Display */}
              <DataSourcesUsed 
                contentAnalysis={contentAnalysis}
                inspirationData={rawInspirationData}
                brandTokens={brandTokens}
                generationMetadata={layoutResults.generation_metadata}
              />

              {/* Generated HTML/CSS Preview */}
              <Box mb={4}>
                <Typography variant="h6" gutterBottom>
                  Comprehensive Generated Design
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
                    title="Comprehensive Generated Design"
                  />
                </Box>
              </Box>

              {/* CSS Variables Display */}
              {layoutResults.css_variables && (
                <CSSVariablesDisplay variables={layoutResults.css_variables} />
              )}

              {/* Export Options */}
              <ExportOptionsSection
                layoutData={layoutResults}
                designSystem={layoutResults.design_system}
              />
            </>
          ) : (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              height="400px"
              bgcolor="grey.50"
              borderRadius={2}
              border="2px dashed"
              borderColor="grey.300"
            >
              <Box textAlign="center">
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {!allDataCollected 
                    ? 'Complete all three steps to generate design' 
                    : 'Ready to generate comprehensive design'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Content Analysis → Layout Inspiration → Brand Tokens → Generate
                </Typography>
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

// Content Analysis Results Component
function ContentAnalysisDisplay({ analysis, qualityMetrics }) {
  return (
    <Box mt={3} p={3} bgcolor="grey.50" borderRadius={2}>
      <Typography variant="h6" gutterBottom>
        Content Analysis
      </Typography>
      
      {/* Quality Score */}
      <Box mb={2}>
        <Box display="flex" alignItems="center" justifyContent="between" mb={1}>
          <Typography variant="body2" fontWeight="medium">
            Overall Quality Score
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {Math.round(qualityMetrics.overall_quality * 100)}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={qualityMetrics.overall_quality * 100}
          color={qualityMetrics.overall_quality > 0.7 ? 'success' : 'warning'}
          sx={{ height: 6, borderRadius: 3 }}
        />
      </Box>

      {/* Content Sections */}
      <Box mb={2}>
        <Typography variant="body2" fontWeight="medium" mb={1}>
          Detected Sections
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {analysis.sections.map((section, index) => (
            <Chip
              key={index}
              label={section.type}
              size="small"
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      </Box>

      {/* Design Recommendations */}
      {analysis.design_analysis && (
        <Box>
          <Typography variant="body2" fontWeight="medium" mb={1}>
            Layout Recommendation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {analysis.design_analysis.optimal_layout_type || 'Single column with sections'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// Design Quality Dashboard Component
function DesignQualityDashboard({ qualityScore, designSystem, calculations }) {
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

  return (
    <Box mb={4} p={3} bgcolor="background.paper" borderRadius={2} boxShadow={1}>
      <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
        <TrendUp size={24} />
        Design Quality Assessment
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={6} md={3}>
          <Box textAlign="center">
            {getScoreIcon(qualityScore.overall_score || qualityScore.overall_quality)}
            <Typography variant="h4" fontWeight="bold" 
              color={`${getScoreColor(qualityScore.overall_score || qualityScore.overall_quality)}.main`}>
              {Math.round((qualityScore.overall_score || qualityScore.overall_quality) * 100)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Overall Score
            </Typography>
          </Box>
        </Grid>
        
        {qualityScore.breakdown && Object.entries(qualityScore.breakdown).map(([key, value]) => (
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
      {(qualityScore.overall_score || qualityScore.overall_quality) < 0.8 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Suggestions:</strong> Consider refining content length, improving section hierarchy, 
            or adjusting brand token application for better design quality.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}

// Component to show what data sources were used
function DataSourcesUsed({ contentAnalysis, inspirationData, brandTokens, generationMetadata }) {
  return (
    <Box mb={4} p={3} bgcolor="grey.50" borderRadius={2}>
      <Typography variant="h6" gutterBottom>
        Data Sources Used in Generation
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" gutterBottom>Content Analysis</Typography>
          <Typography variant="body2" color="text.secondary">
            {contentAnalysis?.sections?.length || 0} sections detected
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {Math.round((contentAnalysis?.quality_metrics?.overall_quality || 0) * 100)}% quality score
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" gutterBottom>Layout Inspiration</Typography>
          <Typography variant="body2" color="text.secondary">
            {inspirationData?.url || 'No URL'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {inspirationData?.source || 'Unknown source'}
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
    </Box>
  );
}

// CSS Variables Display Component
function CSSVariablesDisplay({ variables }) {
  const [showVariables, setShowVariables] = useState(false);

  return (
    <Box mb={4}>
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
    </Box>
  );
}