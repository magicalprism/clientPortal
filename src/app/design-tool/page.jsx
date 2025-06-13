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

// Import your existing components
import CopyInputSection from '@/components/design-tool/inputs/CopyInputSection';
import UrlAnalyzerSection from '@/components/design-tool/inputs/UrlAnalyzerSection';
import BrandTokensSection from '@/components/design-tool/inputs/BrandTokensSection';
import EnhancedLivePreview from '@/components/design-tool/preview/EnhancedLivePreview';
import ExportOptionsSection from '@/components/design-tool/preview/ExportOptionsSection';

export default function DesignToolPage() {
  // === STATE FOR EXISTING COMPONENTS ===
  // Copy input state (for your existing CopyInputSection)
  const [copyText, setCopyText] = useState('');
  const [classifiedCopy, setClassifiedCopy] = useState([]);
  
  // Brand state (for your existing BrandTokensSection)
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [existingBrandTokens, setExistingBrandTokens] = useState({});
  
  // === STATE FOR LAYOUT GENERATION ===
  // These are the variables that were missing and causing your error
  const [copyClassification, setCopyClassification] = useState(null);
  const [layoutAnalysis, setLayoutAnalysis] = useState(null);
  const [brandTokens, setBrandTokens] = useState(null);
  const [brandId, setBrandId] = useState(null);
  const [generatedLayout, setGeneratedLayout] = useState(null);

  // === LOADING STATES ===
  const [isAnalyzingCopy, setIsAnalyzingCopy] = useState(false);
  const [isAnalyzingLayout, setIsAnalyzingLayout] = useState(false);
  const [isLoadingBrand, setIsLoadingBrand] = useState(false);

  // === ERROR STATES ===
  const [copyError, setCopyError] = useState('');
  const [layoutError, setLayoutError] = useState('');
  const [brandError, setBrandError] = useState('');

  // === STEP TRACKING ===
  const [activeStep, setActiveStep] = useState(0);

  // === CALLBACK HANDLERS ===
  
  // Handle copy analysis completion
  const handleCopyAnalyzed = (classificationData) => {
    console.log('📝 Copy analyzed:', classificationData);
    setCopyClassification(classificationData);
    setCopyError('');
    
    // Move to next step if this was successful
    if (classificationData && activeStep === 0) {
      setActiveStep(1);
    }
  };

  const handleCopyError = (error) => {
    console.error('📝 Copy analysis error:', error);
    setCopyError(error);
    setCopyClassification(null);
  };

  // Handle layout analysis completion  
  const handleLayoutAnalyzed = (analysisData) => {
    console.log('🎨 Layout analyzed:', analysisData);
    setLayoutAnalysis(analysisData);
    setLayoutError('');
    
    // Move to next step if this was successful
    if (analysisData && activeStep === 1) {
      setActiveStep(2);
    }
  };

  const handleLayoutError = (error) => {
    console.error('🎨 Layout analysis error:', error);
    setLayoutError(error);
    setLayoutAnalysis(null);
  };

  // Handle brand selection completion
  const handleBrandSelected = (selectedBrandId, tokens) => {
    console.log('🏷️ Brand selected:', { selectedBrandId, tokens });
    setBrandId(selectedBrandId);
    setBrandTokens(tokens);
    setBrandError('');
    
    // Move to next step if this was successful
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

  // Handle layout generation completion
  const handleLayoutGenerated = (layout) => {
    console.log('✨ Layout generated:', layout);
    setGeneratedLayout(layout);
  };

  // === VALIDATION HELPERS ===
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
              🎉 All inputs ready! Your layout should generate automatically below.
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
                    onClassifiedChange={(classified) => {
                      setClassifiedCopy(classified);
                      handleCopyAnalyzed(classified);
                    }}
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
                    onAnalysisComplete={handleLayoutAnalyzed}
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
                        // FIX: Also set brandId here
                        if (brand && brand.id) {
                          setBrandId(brand.id);
                        }
                      }}
                      brandTokens={existingBrandTokens}
                      onTokensChange={(tokens) => {
                        setExistingBrandTokens(tokens);
                        // FIX: Call the handler with both brandId and tokens
                        if (selectedBrand?.id) {
                          handleBrandSelected(selectedBrand.id, tokens);
                        }
                      }}
                      // ADD THESE TWO MISSING PROPS:
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
                      ? "🎉 Ready to generate! Check the preview on the right."
                      : "Complete the steps above to unlock layout generation."
                    }
                  </Typography>
                </Paper>
              </StepContent>
            </Step>

          </Stepper>
        </Grid>

        {/* Right Column - Preview & Export */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Live Preview */}
            <EnhancedLivePreview
              copyClassification={copyClassification}
              layoutAnalysis={layoutAnalysis}
              brandTokens={brandTokens}
              brandId={brandId}
              onLayoutGenerated={handleLayoutGenerated}
            />

            {/* Export Options */}
            {generatedLayout && (
              <ExportOptionsSection
                generatedLayout={generatedLayout}
                brandTokens={brandTokens}
              />
            )}

            {/* Debug Panel (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <Card>
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

          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}