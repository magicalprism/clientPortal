'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Tab,
  Tabs,
  Grid,
  Paper
} from '@mui/material';
import {
  CheckCircle,
  Eye,
  Code,
  Layout,
} from '@phosphor-icons/react';

// Import our refactored modules
import { parseHTMLToSemanticStructure } from './utils/htmlParser';
import { parseContentQuantitatively } from './utils/quantitativeParser';
import { WireframeSection, WireframeAnalysis } from './components/WireframeComponents';



export default function CopyInputSection({
  value = '',
  onChange,
  classifiedCopy = [],
  onClassifiedChange,
  onCopyAnalyzed,
  onError,
  analysis,
  loading = false
}) {
  const [isClassifying, setIsClassifying] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [apiError, setApiError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [wireframeData, setWireframeData] = useState(null);
  const [richTextContent, setRichTextContent] = useState('');
  const [htmlStructure, setHtmlStructure] = useState(null);

  // Handle rich text paste with HTML structure preservation
  const handleRichTextPaste = (e) => {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');
    
    console.log('📋 Rich text paste detected:', {
      hasHTML: !!htmlData,
      htmlLength: htmlData?.length,
      textLength: textData?.length,
      htmlPreview: htmlData?.substring(0, 300)
    });

    if (htmlData && htmlData.length > 0) {
      e.target.innerHTML = htmlData;
      setRichTextContent(htmlData);
      
      const parsedContent = parseHTMLToSemanticStructure(htmlData);
      console.log('📊 Parsed semantic structure:', parsedContent);
      
      setHtmlStructure(parsedContent);
      
      if (onChange) {
        onChange(parsedContent.plainText);
      }
    } else if (textData) {
      e.target.innerHTML = textData.replace(/\n/g, '<br>');
      setRichTextContent(textData);
      setHtmlStructure(null);
      if (onChange) {
        onChange(textData);
      }
    }
  };

  const handleRichTextInput = (e) => {
    const htmlContent = e.target.innerHTML;
    const textContent = e.target.innerText || e.target.textContent;
    
    setRichTextContent(htmlContent);
    
    if (htmlContent.includes('<')) {
      const parsedContent = parseHTMLToSemanticStructure(htmlContent);
      setHtmlStructure(parsedContent);
      if (onChange) {
        onChange(parsedContent.plainText);
      }
    } else {
      setHtmlStructure(null);
      if (onChange) {
        onChange(textContent);
      }
    }
  };

  // Generate wireframe data whenever content changes
  useEffect(() => {
    if (value.trim()) {
      console.log('🔬 Using RESEARCH-BASED universal parser with AIDA, PAS, and landing page patterns');
      const wireframes = parseContentQuantitatively(value, htmlStructure);
      setWireframeData(wireframes);
    }
  }, [value, htmlStructure]);

  const handleClassify = async () => {
    if (!value.trim()) return;
    setIsClassifying(true);
    setApiError('');
    
    try {
      const response = await fetch('/api/ai/classify-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: value.trim(),
          brandTokens: {},
          industryContext: 'saas'
        })
      });

      if (!response.ok) throw new Error(`API Error (${response.status})`);
      const result = await response.json();

      if (result.success && result.analysis) {
        const classifiedSections = result.analysis.sections || [];
        if (onClassifiedChange) onClassifiedChange(classifiedSections);
        if (onCopyAnalyzed) onCopyAnalyzed(classifiedSections);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      setApiError(error.message);
      if (onError) onError('Failed to analyze copy: ' + error.message);
    } finally {
      setIsClassifying(false);
    }
  };

  const handleLoadDemo = () => {
    if (onChange) {
      onChange(DEMO_CONTENT);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Layout size={20} weight="duotone" />
        <Typography variant="h6">Universal Content Parser</Typography>
      </Box>

      
      {/* Rich Text Input */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Paste your content here:</Typography>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>🔬 Universal Parsing:</strong> Works with any content type! 
          Uses <strong>research-based patterns</strong> from AIDA, PAS, landing pages, and web content analysis for accurate detection.
        </Typography>
      </Alert>

      <Box 
        sx={{ 
          border: '2px solid #1976d2', 
          borderRadius: '8px', 
          p: 1, 
          mb: 3,
          backgroundColor: '#f8f9fa'
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
          ✨ Rich Text Paste Area (preserves semantic structure):
        </Typography>
        <Box
          contentEditable
          suppressContentEditableWarning={true}
          onPaste={handleRichTextPaste}
          onInput={handleRichTextInput}
          sx={{
            minHeight: '200px',
            p: 2,
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            fontSize: '14px',
            lineHeight: 1.5,
            maxHeight: '400px',
            overflowY: 'auto',
            '&:focus': {
              outline: '2px solid #1976d2',
              outlineOffset: '-2px'
            },
            '&:empty::before': {
              content: '"Paste your Google Docs content here... Semantic HTML structure will be preserved!"',
              color: '#999',
              fontStyle: 'italic'
            }
          }}
        />
      </Box>

      {/* Auto-Generate Button */}
      <Button
        variant="contained"
        startIcon={isClassifying || loading ? <CircularProgress size={16} /> : <Layout size={16} />}
        onClick={handleClassify}
        disabled={!value.trim() || isClassifying || loading}
        fullWidth
        sx={{ mb: 2 }}
      >
        {isClassifying || loading ? 'Analyzing with Research Patterns...' : 'Generate Wireframes (Universal Analysis)'}
      </Button>

      {/* API Error */}
      {apiError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Error:</strong> {apiError}
          </Typography>
        </Alert>
      )}

      {/* SEMANTIC LOW-FI WIREFRAMES */}
      {wireframeData && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                <Tab icon={<Eye size={16} />} label="Universal Wireframes" />
                <Tab icon={<Code size={16} />} label="Framework Analysis" />
              </Tabs>
            </Box>

            {activeTab === 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                  <Typography variant="h6">🔬 Research-Based Wireframes</Typography>
                  <Chip label={`${wireframeData.sections.length} sections`} size="small" color="primary" />
                  <Chip label="Universal Patterns" size="small" color="success" />
                  {wireframeData.hasSemanticStructure && (
                    <Chip label="Rich Text Detected" size="small" color="secondary" />
                  )}
                </Box>

                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>🔬 Research-Based Wireframes Generated!</strong> Created {wireframeData.sections.length} wireframe sections using universal copywriting patterns. Framework matches: {wireframeData.stats?.frameworkPatterns || 'analyzing...'}
                  </Typography>
                </Alert>

                {wireframeData.sections.map((section, index) => (
                  <WireframeSection key={section.id} section={section} index={index} />
                ))}
              </Box>
            )}

            {activeTab === 1 && (
              <WireframeAnalysis wireframeData={wireframeData} />
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}