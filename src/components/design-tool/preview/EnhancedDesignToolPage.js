'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Box, Container, Grid, Typography, Alert, Chip, LinearProgress } from '@mui/material';
import { CheckCircle, Warning, Info, TrendingUp } from '@mui/icons-material';

// Import existing components
import CopyInputSection from '@/components/design-tool/inputs/CopyInputSection';
import UrlAnalyzerSection from '@/components/design-tool/inputs/UrlAnalyzerSection';
import BrandTokensSection from '@/components/design-tool/inputs/BrandTokensSection';
import EnhancedLivePreviewSection from '@/components/design-tool/preview/EnhancedLivePreviewSection';
import ExportOptionsSection from '@/components/design-tool/preview/ExportOptionsSection';

export default function EnhancedDesignToolPage() {
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data state
  const [copyContent, setCopyContent] = useState('');
  const [contentAnalysis, setContentAnalysis] = useState(null);
  const [inspirationData, setInspirationData] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brandTokens, setBrandTokens] = useState(null);
  const [layoutResults, setLayoutResults] = useState(null);
  const [qualityMetrics, setQualityMetrics] = useState(null);

  // Analysis state
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [designRecommendations, setDesignRecommendations] = useState(null);

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

  // Enhanced layout generation
  const generateLayouts = useCallback(async () => {
    if (!contentAnalysis) return;

    try {
      setLoading(true);
      setError(null);
      setAnalysisProgress(20);

      const response = await fetch('/api/ai/generate-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentAnalysis: {
            ...contentAnalysis,
            original_content: copyContent,
            industry_context: selectedBrand?.industry
          },
          brandTokens,
          layoutStyle: 'stripe', // Can be made configurable
          inspirationData
        })
      });

      setAnalysisProgress(70);

      if (!response.ok) {
        throw new Error('Layout generation failed');
      }

      const result = await response.json();
      
      if (result.success) {
        setLayoutResults(result);
        setDesignRecommendations(result.design_system);
        setAnalysisProgress(100);
        setCurrentStep(2); // Move to preview step
      } else {
        throw new Error(result.error || 'Layout generation failed');
      }
    } catch (err) {
      setError(err.message);
      console.error('Layout generation error:', err);
    } finally {
      setLoading(false);
      setAnalysisProgress(0);
    }
  }, [contentAnalysis, copyContent, brandTokens, selectedBrand, inspirationData]);

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

  // Handle inspiration data
  const handleInspirationData = useCallback((data) => {
    setInspirationData(data);
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
               analysisProgress < 70 ? 'Generating layouts...' :
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
        {/* Left Panel - Inputs and Configuration */}
        <Grid item xs={12} lg={5}>
          {/* Step 1: Content Input */}
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

          {/* Step 2: Inspiration Analysis */}
          <Box mb={4}>
            <UrlAnalyzerSection
              onAnalysisComplete={handleInspirationData}
              disabled={!contentAnalysis}
            />
          </Box>

          {/* Step 3: Brand Configuration */}
          <Box mb={4}>
            <BrandTokensSection
              onBrandSelect={handleBrandSelection}
              selectedBrand={selectedBrand}
              disabled={!contentAnalysis}
            />
          </Box>

          {/* Generate Button */}
          {contentAnalysis && brandTokens && (
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
                {loading ? 'Generating...' : 'Generate AI Layouts'}
              </button>
            </Box>
          )}
        </Grid>

        {/* Right Panel - Preview and Export */}
        <Grid item xs={12} lg={7}>
          {layoutResults ? (
            <>
              {/* Design Quality Dashboard */}
              <DesignQualityDashboard 
                qualityScore={layoutResults.quality_score}
                designSystem={layoutResults.design_system}
              />

              {/* Live Preview */}
              <Box mb={4}>
                <EnhancedLivePreviewSection
                  layouts={layoutResults.layout}
                  designSystem={layoutResults.design_system}
                  contentAnalysis={contentAnalysis}
                />
              </Box>

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
              <Typography variant="h6" color="text.secondary">
                {!contentAnalysis 
                  ? 'Add content to see live preview' 
                  : 'Select brand and generate layouts to preview'}
              </Typography>
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
function DesignQualityDashboard({ qualityScore, designSystem }) {
  const getScoreColor = (score) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score) => {
    if (score >= 0.8) return <CheckCircle color="success" />;
    if (score >= 0.6) return <Warning color="warning" />;
    return <Info color="error" />;
  };

  return (
    <Box mb={4} p={3} bgcolor="background.paper" borderRadius={2} boxShadow={1}>
      <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
        <TrendingUp color="primary" />
        Design Quality Assessment
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={6} md={3}>
          <Box textAlign="center">
            {getScoreIcon(qualityScore.overall_quality)}
            <Typography variant="h4" fontWeight="bold" 
              color={`${getScoreColor(qualityScore.overall_quality)}.main`}>
              {Math.round(qualityScore.overall_quality * 100)}
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

      {/* Quality Recommendations */}
      {qualityScore.overall_quality < 0.8 && (
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