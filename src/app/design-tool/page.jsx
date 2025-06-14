// src/app/design-tool/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  FileText,
  Link as LinkIcon,
  Palette,
  Eye,
  CheckCircle
} from '@phosphor-icons/react';

// Import components
import CopyInputSection from '@/components/design-tool/inputs/CopyInputSection';
import UrlAnalyzerSection from '@/components/design-tool/inputs/UrlAnalyzerSection';
import BrandTokensSection from '@/components/design-tool/inputs/BrandTokensSection';
import ComprehensivePreviewSection from '@/components/design-tool/preview/ComprehensivePreviewSection';
import ExportOptionsSection from '@/components/design-tool/preview/ExportOptionsSection';

export default function DesignToolPage() {
  // === STATE FOR STEPPER WORKFLOW ===
  const [copyText, setCopyText] = useState('');
  const [classifiedCopy, setClassifiedCopy] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [existingBrandTokens, setExistingBrandTokens] = useState({});
  
  // === STATE FOR COMPREHENSIVE API ===
  const [copyClassification, setCopyClassification] = useState(null); // From classify-copy API
  const [layoutAnalysis, setLayoutAnalysis] = useState(null); // From extract-layout API (formatted)
  const [brandTokens, setBrandTokens] = useState(null); // From brand selection
  const [brandId, setBrandId] = useState(null);
  const [generatedLayout, setGeneratedLayout] = useState(null); // Final comprehensive result

  // === LOADING & ERROR STATES ===
  const [isAnalyzingCopy, setIsAnalyzingCopy] = useState(false);
  const [isAnalyzingLayout, setIsAnalyzingLayout] = useState(false);
  const [isLoadingBrand, setIsLoadingBrand] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [layoutError, setLayoutError] = useState('');
  const [brandError, setBrandError] = useState('');

  // === STEP TRACKING ===
  const [activeStep, setActiveStep] = useState(0);

  // === COMPREHENSIVE API INTEGRATION ===

  // 1. Handle copy analysis completion
  const handleCopyAnalyzed = async (classificationData) => {
    console.log('📝 Copy analyzed:', classificationData);
    setClassifiedCopy(classificationData);
    setCopyError('');
    
    // Call the comprehensive classify-copy API for full analysis
    if (copyText.trim()) {
      setIsAnalyzingCopy(true);
      try {
        const response = await fetch('/api/ai/classify-copy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: copyText,
            brandTokens: existingBrandTokens,
            industryContext: selectedBrand?.industry || 'saas'
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setCopyClassification(result.analysis);
            console.log('✅ Content analysis complete:', result.analysis);
            
            // Move to next step
            if (activeStep === 0) {
              setActiveStep(1);
            }
          }
        } else {
          throw new Error('Content analysis failed');
        }
      } catch (error) {
        console.error('Content analysis error:', error);
        setCopyError('Failed to analyze content: ' + error.message);
      } finally {
        setIsAnalyzingCopy(false);
      }
    }
  };

  const handleCopyError = (error) => {
    console.error('📝 Copy analysis error:', error);
    setCopyError(error);
    setCopyClassification(null);
  };

  // 2. Handle layout analysis completion  
  const handleLayoutAnalyzed = (analysisData) => {
    console.log('🎨 Layout analyzed:', analysisData);
    
    // Format the data for the comprehensive API
    const formattedData = {
      buttons: analysisData.data?.components?.buttons?.map(btn => ({
        backgroundColor: btn.backgroundColor || 'transparent',
        fontSize: btn.fontSize || '14px',
        padding: btn.padding,
        borderRadius: btn.borderRadius
      })) || [],
      
      icons: analysisData.data?.icons ? [{
        size: analysisData.data.icons.size?.[0] || '16px',
        strokeWidth: '1.5px',
        style: analysisData.data.icons.style,
        library: analysisData.data.icons.library
      }] : [],
      
      colors: {
        palette: [
          ...(analysisData.data?.colors?.primary?.map(c => c.hex) || []),
          ...(analysisData.data?.colors?.neutral?.map(c => c.hex) || [])
        ],
        primary: analysisData.data?.colors?.primary?.[0]?.hex,
        neutral: analysisData.data?.colors?.neutral?.[0]?.hex
      },
      
      typography: analysisData.data?.typography || {},
      spacing: analysisData.data?.spacing || {},
      sections: analysisData.data?.sections || [],
      designSystem: analysisData.data?.designSystem || {},
      
      // Include metadata
      source: analysisData.source,
      confidence: analysisData.data?.confidence,
      url: analysisData.url,
      
      // Store original data for reference
      data: analysisData.data
    };
    
    setLayoutAnalysis(formattedData);
    setLayoutError('');
    
    // Move to next step
    if (analysisData && activeStep === 1) {
      setActiveStep(2);
    }
  };

  const handleLayoutError = (error) => {
    console.error('🎨 Layout analysis error:', error);
    setLayoutError(error);
    setLayoutAnalysis(null);
  };

  // 3. Handle brand selection completion
  const handleBrandSelected = (selectedBrandId, tokens) => {
    console.log('🏷️ Brand selected:', { selectedBrandId, tokens });
    
    // Set both brand ID and tokens
    setBrandId(selectedBrandId);
    setBrandTokens(tokens || existingBrandTokens);
    setBrandError('');
    
    // Move to final step
    if ((selectedBrandId || tokens) && activeStep === 2) {
      setActiveStep(3);
    }
  };

  const handleBrandError = (error) => {
    console.error('🏷️ Brand selection error:', error);
    setBrandError(error);
    setBrandTokens(null);
    setBrandId(null);
  };

  // 4. Handle final layout generation
  const handleLayoutGenerated = (layout) => {
    console.log('✨ Comprehensive layout generated:', layout);
    setGeneratedLayout(layout);
  };

  // === VALIDATION HELPERS ===
  const hasValidCopy = copyClassification && 
    typeof copyClassification === 'object' && 
    (copyClassification.sections || copyClassification.length > 0);

  const hasValidLayout = layoutAnalysis && 
    typeof layoutAnalysis === 'object' && 
    Object.keys(layoutAnalysis).length > 0;

  const hasValidBrand = (brandTokens && 
    typeof brandTokens === 'object' && 
    Object.keys(brandTokens).length > 0) || brandId;

  const allInputsReady = hasValidCopy && hasValidLayout && hasValidBrand;

  // === DEBUG LOGGING ===
  useEffect(() => {
    console.log('🔍 State Update:', {
      copyClassification: !!copyClassification,
      layoutAnalysis: !!layoutAnalysis,
      brandTokens: !!brandTokens,
      brandId: !!brandId,
      allInputsReady,
      hasValidCopy,
      hasValidLayout,
      hasValidBrand
    });
  }, [copyClassification, layoutAnalysis, brandTokens, brandId, allInputsReady]);

  // === STEPS CONFIGURATION ===
  const steps = [
    {
      label: 'Add Your Copy',
      description: 'Paste or upload your marketing content',
      icon: <FileText size={20} />,
      completed: hasValidCopy,
      error: copyError
    },
    {
      label: 'Analyze Layout Inspiration',
      description: 'Enter a URL to extract design patterns',
      icon: <LinkIcon size={20} />,
      completed: hasValidLayout,
      error: layoutError
    },
    {
      label: 'Select Your Brand',
      description: 'Choose brand and load design tokens',
      icon: <Palette size={20} />,
      completed: hasValidBrand,
      error: brandError
    },
    {
      label: 'Generate & Export',
      description: 'Create your AI-powered layout',
      icon: <Eye size={20} />,
      completed: !!generatedLayout,
      error: ''
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          🎨 AI Design Tool
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Transform your copy into beautiful, branded layouts
        </Typography>
      </Box>

      {/* Progress Overview */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6">Progress</Typography>
            <Chip 
              label={`${steps.filter(s => s.completed).length}/${steps.length} Complete`}
              color={allInputsReady ? "success" : "default"}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {steps.map((step, index) => (
              <Chip
                key={index}
                icon={step.completed ? <CheckCircle size={16} /> : step.icon}
                label={step.label}
                color={step.completed ? "success" : step.error ? "error" : "default"}
                variant={step.completed ? "filled" : "outlined"}
                size="small"
              />
            ))}
          </Box>

          {allInputsReady && (
            <Alert severity="success" sx={{ mt: 2 }}>
              🎉 All inputs ready! Your comprehensive layout will generate automatically on the right.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column - Input Steps */}
        <Grid item xs={12} lg={4}>
          <Stepper orientation="vertical" activeStep={activeStep}>
            
            {/* Step 1: Copy Input */}
            <Step>
              <StepLabel 
                error={!!copyError}
                StepIconComponent={() => (
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%',
                    bgcolor: hasValidCopy ? 'success.main' : copyError ? 'error.main' : 'grey.300',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    {hasValidCopy ? <CheckCircle size={16} /> : <FileText size={16} />}
                  </Box>
                )}
              >
                <Typography variant="subtitle1">Add Your Copy</Typography>
              </StepLabel>
              <StepContent>
                <Paper sx={{ p: 3, mb: 2 }}>
                  <CopyInputSection
                    value={copyText}
                    onChange={(text) => {
                      setCopyText(text);
                      // Clear previous classification when text changes
                      if (copyClassification && text !== copyText) {
                        setCopyClassification(null);
                      }
                    }}
                    classifiedCopy={classifiedCopy}
                    onClassifiedChange={setClassifiedCopy}
                    onCopyAnalyzed={handleCopyAnalyzed}
                    onError={handleCopyError}
                    analysis={copyClassification}
                    loading={isAnalyzingCopy}
                  />
                  {copyError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {copyError}
                    </Alert>
                  )}
                </Paper>
              </StepContent>
            </Step>

            {/* Step 2: URL Analysis */}
            <Step>
              <StepLabel 
                error={!!layoutError}
                StepIconComponent={() => (
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%',
                    bgcolor: hasValidLayout ? 'success.main' : layoutError ? 'error.main' : 'grey.300',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    {hasValidLayout ? <CheckCircle size={16} /> : <LinkIcon size={16} />}
                  </Box>
                )}
              >
                <Typography variant="subtitle1">Analyze Layout Inspiration</Typography>
              </StepLabel>
              <StepContent>
                <Paper sx={{ p: 3, mb: 2 }}>
                  <UrlAnalyzerSection
                    onAnalysisComplete={(result) => {
                      // Keep for display purposes
                      console.log('Raw analysis result:', result);
                    }}
                    onLayoutAnalyzed={handleLayoutAnalyzed}
                    onError={handleLayoutError}
                  />
                  {layoutError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {layoutError}
                    </Alert>
                  )}
                </Paper>
              </StepContent>
            </Step>

            {/* Step 3: Brand Selection */}
            <Step>
              <StepLabel 
                error={!!brandError}
                StepIconComponent={() => (
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%',
                    bgcolor: hasValidBrand ? 'success.main' : brandError ? 'error.main' : 'grey.300',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    {hasValidBrand ? <CheckCircle size={16} /> : <Palette size={16} />}
                  </Box>
                )}
              >
                <Typography variant="subtitle1">Select Your Brand</Typography>
              </StepLabel>
              <StepContent>
                <Paper sx={{ p: 3, mb: 2 }}>
                  <BrandTokensSection
                    selectedBrand={selectedBrand}
                    onBrandChange={(brand) => {
                      setSelectedBrand(brand);
                      if (brand && brand.id) {
                        setBrandId(brand.id);
                      }
                    }}
                    brandTokens={existingBrandTokens}
                    onTokensChange={(tokens) => {
                      setExistingBrandTokens(tokens);
                      if (selectedBrand?.id) {
                        handleBrandSelected(selectedBrand.id, tokens);
                      }
                    }}
                    onBrandSelected={handleBrandSelected}
                    onError={handleBrandError}
                  />
                  {brandError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {brandError}
                    </Alert>
                  )}
                </Paper>
              </StepContent>
            </Step>

            {/* Step 4: Generate */}
            <Step>
              <StepLabel
                StepIconComponent={() => (
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%',
                    bgcolor: generatedLayout ? 'success.main' : 'grey.300',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    {generatedLayout ? <CheckCircle size={16} /> : <Eye size={16} />}
                  </Box>
                )}
              >
                <Typography variant="subtitle1">Generate & Export</Typography>
              </StepLabel>
              <StepContent>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    {allInputsReady 
                      ? "🎉 Ready! Your comprehensive design will appear on the right."
                      : "Complete the steps above to unlock comprehensive layout generation."}
                  </Typography>
                </Paper>
              </StepContent>
            </Step>

          </Stepper>
        </Grid>

        {/* Right Column - Comprehensive Preview & Results */}
        <Grid item xs={12} lg={8}>
          <ComprehensivePreviewSection
            copyClassification={copyClassification}
            layoutAnalysis={layoutAnalysis}
            brandTokens={brandTokens}
            brandId={brandId}
            copyContent={copyText}
            selectedBrand={selectedBrand}
            onLayoutGenerated={handleLayoutGenerated}
          />

          {/* Export Options */}
          {generatedLayout && (
            <Box mt={4}>
              <ExportOptionsSection
                generatedLayout={generatedLayout}
                brandTokens={brandTokens}
              />
            </Box>
          )}

          {/* Debug Panel (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <Card sx={{ mt: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>🐛 Debug Info</Typography>
                <Box sx={{ fontFamily: 'monospace', fontSize: '0.8rem', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <div><strong>Copy Classification:</strong> {copyClassification ? '✅' : '❌'} ({typeof copyClassification})</div>
                  <div><strong>Layout Analysis:</strong> {layoutAnalysis ? '✅' : '❌'} ({typeof layoutAnalysis})</div>
                  <div><strong>Brand Tokens:</strong> {brandTokens ? '✅' : '❌'} ({typeof brandTokens})</div>
                  <div><strong>Brand ID:</strong> {brandId ? '✅' : '❌'} ({brandId})</div>
                  <div><strong>All Ready:</strong> {allInputsReady ? '✅' : '❌'}</div>
                  <div><strong>Generated Layout:</strong> {generatedLayout ? '✅' : '❌'}</div>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}