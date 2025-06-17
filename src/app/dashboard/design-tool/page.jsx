// src/app/dashboard/design-tool/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  Divider
} from '@mui/material';
import {
  FileText,
  Link as LinkIcon,
  Palette,
  Eye,
  CheckCircle,
  CaretDown,
  CaretUp
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
  const [copyClassification, setCopyClassification] = useState(null);
  const [layoutAnalysis, setLayoutAnalysis] = useState(null);
  const [brandTokens, setBrandTokens] = useState(null);
  const [brandId, setBrandId] = useState(null);
  const [generatedLayout, setGeneratedLayout] = useState(null);

  // === LOADING & ERROR STATES ===
  const [isAnalyzingCopy, setIsAnalyzingCopy] = useState(false);
  const [isAnalyzingLayout, setIsAnalyzingLayout] = useState(false);
  const [isLoadingBrand, setIsLoadingBrand] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [layoutError, setLayoutError] = useState('');
  const [brandError, setBrandError] = useState('');

  // === STEP TRACKING ===
  const [activeStep, setActiveStep] = useState(0);
  const [expandedSteps, setExpandedSteps] = useState({ 0: true }); // Track which steps are expanded

  // === COMPREHENSIVE API INTEGRATION ===

  // 1. Handle copy analysis completion
  const handleCopyAnalyzed = async (classificationData) => {
    console.log('📝 Copy analyzed:', classificationData);
    setClassifiedCopy(classificationData);
    setCopyError('');
    
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
            
            // Move to next step and expand it
            setActiveStep(1);
            setExpandedSteps(prev => ({ ...prev, 1: true }));
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
      
      source: analysisData.source,
      confidence: analysisData.data?.confidence,
      url: analysisData.url,
      data: analysisData.data
    };
    
    setLayoutAnalysis(formattedData);
    setLayoutError('');
    
    if (analysisData && activeStep === 1) {
      setActiveStep(2);
      setExpandedSteps(prev => ({ ...prev, 2: true }));
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
    
    setBrandId(selectedBrandId);
    setBrandTokens(tokens || existingBrandTokens);
    setBrandError('');
    
    if ((selectedBrandId || tokens) && activeStep === 2) {
      setActiveStep(3);
      setExpandedSteps(prev => ({ ...prev, 3: true }));
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

  // === STEP EXPANSION TOGGLE ===
  const toggleStepExpansion = (stepIndex) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepIndex]: !prev[stepIndex]
    }));
  };

  // === STEPS CONFIGURATION ===
  const steps = [
    {
      label: 'Add Your Copy',
      description: 'Paste or upload your marketing content',
      icon: <FileText size={20} />,
      completed: hasValidCopy,
      error: copyError,
      results: copyClassification ? {
        type: 'copy_analysis',
        data: copyClassification,
        summary: `${copyClassification.sections?.length || 0} sections analyzed`
      } : null
    },
    {
      label: 'Analyze Layout Inspiration',
      description: 'Enter a URL to extract design patterns',
      icon: <LinkIcon size={20} />,
      completed: hasValidLayout,
      error: layoutError,
      results: layoutAnalysis ? {
        type: 'layout_analysis',
        data: layoutAnalysis,
        summary: `Design system extracted from ${layoutAnalysis.url || 'URL'}`
      } : null
    },
    {
      label: 'Select Your Brand',
      description: 'Choose brand and load design tokens',
      icon: <Palette size={20} />,
      completed: hasValidBrand,
      error: brandError,
      results: (brandTokens || brandId) ? {
        type: 'brand_selection',
        data: { brandTokens, brandId, selectedBrand },
        summary: `Brand ${brandId || 'tokens'} configured`
      } : null
    },
    {
      label: 'Generate & Export',
      description: 'Create your AI-powered layout',
      icon: <Eye size={20} />,
      completed: !!generatedLayout,
      error: '',
      results: generatedLayout ? {
        type: 'generated_layout',
        data: generatedLayout,
        summary: 'Comprehensive layout generated'
      } : null
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

      {/* Main Content - Full Width */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        
        {/* Input Steps with Persistent Results - Full Width */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          {steps.map((step, stepIndex) => (
              <Card 
                key={stepIndex}
                sx={{ 
                  border: activeStep === stepIndex ? '2px solid' : '1px solid',
                  borderColor: activeStep === stepIndex ? 'primary.main' : 'divider',
                  backgroundColor: step.completed ? 'success.light' : 'background.paper',
                  opacity: step.completed ? 1 : activeStep === stepIndex ? 1 : 0.7
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  {/* Step Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%',
                      bgcolor: step.completed ? 'success.main' : step.error ? 'error.main' : activeStep === stepIndex ? 'primary.main' : 'grey.300',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      {step.completed ? <CheckCircle size={20} /> : step.icon}
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {step.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {step.description}
                      </Typography>
                    </Box>

                    {/* Expand/Collapse Button */}
                    <IconButton 
                      size="small" 
                      onClick={() => toggleStepExpansion(stepIndex)}
                      disabled={!step.completed && activeStep !== stepIndex}
                    >
                      {expandedSteps[stepIndex] ? <CaretUp size={16} /> : <CaretDown size={16} />}
                    </IconButton>
                  </Box>

                  {/* Results Summary (Always Visible for Completed Steps) */}
                  {step.completed && step.results && (
                    <Alert severity="success" sx={{ mb: 1, py: 0.5 }}>
                      <Typography variant="caption">
                        ✅ {step.results.summary}
                      </Typography>
                    </Alert>
                  )}

                  {/* Error Display */}
                  {step.error && (
                    <Alert severity="error" sx={{ mb: 1, py: 0.5 }}>
                      <Typography variant="caption">
                        ❌ {step.error}
                      </Typography>
                    </Alert>
                  )}
                </CardContent>

                {/* Expandable Content */}
                <Collapse in={expandedSteps[stepIndex]} timeout="auto" unmountOnExit>
                  <CardContent sx={{ pt: 0 }}>
                    <Divider sx={{ mb: 2 }} />
                    
                    {/* Step 1: Copy Input */}
                    {stepIndex === 0 && (
                      <CopyInputSection
                        value={copyText}
                        onChange={(text) => {
                          setCopyText(text);
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
                    )}

                    {/* Step 2: URL Analysis */}
                    {stepIndex === 1 && (
                      <UrlAnalyzerSection
                        onAnalysisComplete={(result) => {
                          console.log('Raw analysis result:', result);
                        }}
                        onLayoutAnalyzed={handleLayoutAnalyzed}
                        onError={handleLayoutError}
                      />
                    )}

                    {/* Step 3: Brand Selection */}
                    {stepIndex === 2 && (
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
                    )}

                    {/* Step 4: Results Info */}
                    {stepIndex === 3 && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {allInputsReady 
                            ? "🎉 Ready! Your comprehensive design will appear on the right."
                            : "Complete the steps above to unlock comprehensive layout generation."}
                        </Typography>
                        
                        {generatedLayout && (
                          <Alert severity="success" sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              <strong>Layout Generated Successfully!</strong><br />
                              View your design on the right and use export options below.
                            </Typography>
                          </Alert>
                        )}
                      </Box>
                    )}

                    {/* Detailed Results Display */}
                    {step.completed && step.results && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle size={16} weight="fill" style={{ color: 'green' }} />
                          Results Summary
                        </Typography>
                        
                        {/* Copy Analysis Results */}
                        {step.results.type === 'copy_analysis' && (
                          <Box>
                            <Typography variant="caption" display="block">
                              Sections: {step.results.data.sections?.length || 0}
                            </Typography>
                            {step.results.data.quality_metrics && (
                              <Typography variant="caption" display="block">
                                Quality Score: {Math.round(step.results.data.quality_metrics.overall_quality * 100)}%
                              </Typography>
                            )}
                          </Box>
                        )}

                        {/* Layout Analysis Results */}
                        {step.results.type === 'layout_analysis' && (
                          <Box>
                            <Typography variant="caption" display="block">
                              Colors: {step.results.data.colors?.palette?.length || 0}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Components: {step.results.data.buttons?.length || 0} buttons
                            </Typography>
                            {step.results.data.url && (
                              <Typography variant="caption" display="block">
                                Source: {step.results.data.url}
                              </Typography>
                            )}
                          </Box>
                        )}

                        {/* Brand Selection Results */}
                        {step.results.type === 'brand_selection' && (
                          <Box>
                            {step.results.data.brandId && (
                              <Typography variant="caption" display="block">
                                Brand ID: {step.results.data.brandId}
                              </Typography>
                            )}
                            {step.results.data.brandTokens && (
                              <Typography variant="caption" display="block">
                                Tokens: {Object.keys(step.results.data.brandTokens).length} configured
                              </Typography>
                            )}
                          </Box>
                        )}

                        {/* Generated Layout Results */}
                        {step.results.type === 'generated_layout' && (
                          <Box>
                            <Typography variant="caption" display="block">
                              Layout successfully generated and ready for export
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Collapse>
              </Card>
            ))}
        </Box>

        {/* Comprehensive Preview & Results - Full Width */}
        <Box>
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
        </Box>
      </Box>
    </Container>
  );
}