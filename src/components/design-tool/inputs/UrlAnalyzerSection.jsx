// components/design-tool/inputs/UrlAnalyzerSection.jsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip
} from '@mui/material';
import {
  Link,
  Eye,
  Palette,
  Layout,
  Sparkle,
  CaretDown,
  Info
} from '@phosphor-icons/react';

export default function UrlAnalyzerSection({ 
  onAnalysisComplete,
  onLayoutAnalyzed,    // NEW: Callback for formatted data for comprehensive API
  onError             // Callback for errors
}) {
  const [url, setUrl] = useState('');
  const [useScreenshots, setUseScreenshots] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!url) {
      const errorMsg = 'Please enter a valid URL';
      setError(errorMsg);
      
      if (onError) {
        onError(errorMsg);
      }
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai/extract-layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: url.trim(),
          useScreenshots 
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAnalysis(result);
        
        // Keep your existing callback for display
        if (onAnalysisComplete) {
          onAnalysisComplete(result);
        }
        
        // NEW: Format data specifically for comprehensive API
        if (onLayoutAnalyzed) {
          const formattedForComprehensiveAPI = {
            // Format buttons for comprehensive API
            buttons: result.data?.components?.buttons?.map(btn => ({
              backgroundColor: btn.backgroundColor || 'transparent',
              fontSize: btn.fontSize || '14px',
              padding: btn.padding,
              borderRadius: btn.borderRadius
            })) || [],
            
            // Format icons for comprehensive API
            icons: result.data?.icons ? [{
              size: result.data.icons.size?.[0] || '16px',
              strokeWidth: '1.5px',
              style: result.data.icons.style,
              library: result.data.icons.library
            }] : [],
            
            // Format colors for comprehensive API
            colors: {
              palette: [
                ...(result.data?.colors?.primary?.map(c => c.hex) || []),
                ...(result.data?.colors?.neutral?.map(c => c.hex) || [])
              ],
              primary: result.data?.colors?.primary?.[0]?.hex,
              neutral: result.data?.colors?.neutral?.[0]?.hex
            },
            
            // Pass through typography, spacing, etc.
            typography: result.data?.typography || {},
            spacing: result.data?.spacing || {},
            sections: result.data?.sections || [],
            designSystem: result.data?.designSystem || {},
            
            // Include important metadata
            source: result.source,
            confidence: result.data?.confidence,
            url: url.trim(),
            
            // Store original data for reference
            data: result.data
          };
          
          console.log('🎨 Formatted data for comprehensive API:', formattedForComprehensiveAPI);
          onLayoutAnalyzed(formattedForComprehensiveAPI);
        }
      } else {
        const errorMsg = result.error || 'Analysis failed';
        setError(errorMsg);
        
        if (onError) {
          onError(errorMsg);
        }
      }
    } catch (err) {
      console.error('Analysis error:', err);
      const errorMsg = 'Failed to analyze URL. Please try again.';
      setError(errorMsg);
      
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceBadge = (source) => {
    const sourceConfig = {
      'complete_analysis': { label: 'AI + Screenshots', color: 'success', icon: <Sparkle size={16} /> },
      'html_ai_analysis': { label: 'AI + HTML', color: 'primary', icon: <Eye size={16} /> },
      'enhanced_mock': { label: 'Smart Mock', color: 'warning', icon: <Layout size={16} /> },
      'basic_mock': { label: 'Basic Mock', color: 'default', icon: <Link size={16} /> }
    };

    const config = sourceConfig[source] || sourceConfig['basic_mock'];
    
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const renderAnalysisResults = () => {
    if (!analysis) return null;

    // Debug logging to see what we actually received
    console.log('🖥️ UI - Analysis data received:', analysis);
    console.log('🖥️ UI - Analysis.data keys:', Object.keys(analysis.data || {}));
    console.log('🖥️ UI - Containers available:', !!analysis.data?.containers);
    console.log('🖥️ UI - Grids available:', !!analysis.data?.grids);
    console.log('🖥️ UI - Spacing available:', !!analysis.data?.spacing);

    return (
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6">Layout Analysis Results</Typography>
          {getSourceBadge(analysis.source)}
          {analysis.data?.confidence && (
            <Chip 
              label={`${Math.round(analysis.data.confidence * 100)}% confidence`}
              size="small"
              color={analysis.data.confidence > 0.7 ? 'success' : 'warning'}
            />
          )}
        </Box>

        {/* Sections Overview */}
        {analysis.data?.sections && (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<CaretDown />}>
              <Typography variant="subtitle1">
                Detected Sections ({analysis.data.sections.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {analysis.data.sections.map((section, index) => (
                  <Grid item xs={12} key={index}>
                    <Card variant="outlined">
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                            {section.type}
                          </Typography>
                          <Chip 
                            label={section.layout} 
                            size="small" 
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {section.description}
                        </Typography>
                        {section.confidence && (
                          <Typography variant="caption" color="text.secondary">
                            {Math.round(section.confidence * 100)}% match
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Enhanced Layout Patterns */}
        {analysis.data && Object.keys(analysis.data).length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<CaretDown />}>
              <Typography variant="subtitle1">
                Detailed Layout Patterns & Design System
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {/* Containers */}
              {analysis.data.containers && analysis.data.containers.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Container System</Typography>
                  {analysis.data.containers.map((container, index) => (
                    <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {container.value || container.className} - {container.usage}
                      </Typography>
                      {container.description && (
                        <Typography variant="caption" color="text.secondary">
                          {container.description}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
              
              {/* Typography Hierarchy */}
              {analysis.data.typography && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Typography Hierarchy</Typography>
                  
                  {/* Headings */}
                  {analysis.data.typography.headings && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>Headings</Typography>
                      {analysis.data.typography.headings.map((heading, index) => (
                        <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="body2">
                            <strong>{heading.element}</strong>: {heading.size} / {heading.weight} / {heading.lineHeight}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {heading.description}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                  
                  {/* Body Text */}
                  {analysis.data.typography.body && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>Body Text</Typography>
                      {analysis.data.typography.body.map((body, index) => (
                        <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="body2">
                            <strong>{body.element}</strong>: {body.size} / {body.weight} / {body.lineHeight}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {body.description}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                  
                  {/* Typography Scale */}
                  {analysis.data.typography.scale && (
                    <Box sx={{ p: 1, bgcolor: 'primary.50', borderRadius: 1, mb: 2 }}>
                      <Typography variant="caption" color="primary.main">
                        Scale: {analysis.data.typography.scale.ratio} ratio, {analysis.data.typography.scale.base} base
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
              
              {/* Color System */}
              {analysis.data.colors && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Color System</Typography>
                  
                  {/* Primary Colors */}
                  {analysis.data.colors.primary && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>Primary Colors</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {analysis.data.colors.primary.map((color, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                bgcolor: color.hex,
                                borderRadius: '4px',
                                border: '1px solid #ddd'
                              }}
                              title={color.hex}
                            />
                            <Box>
                              <Typography variant="caption" display="block">{color.hex}</Typography>
                              <Typography variant="caption" color="text.secondary">{color.usage}</Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {/* Neutral Colors */}
                  {analysis.data.colors.neutral && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>Neutral Colors</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {analysis.data.colors.neutral.map((color, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                bgcolor: color.hex,
                                borderRadius: '4px',
                                border: '1px solid #ddd'
                              }}
                              title={color.hex}
                            />
                            <Box>
                              <Typography variant="caption" display="block">{color.hex}</Typography>
                              <Typography variant="caption" color="text.secondary">{color.usage}</Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
              
              {/* Spacing System */}
              {analysis.data.spacing && analysis.data.spacing.common && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Spacing System</Typography>
                  {analysis.data.spacing.common.map((spacing, index) => (
                    <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2">
                        <strong>{spacing.value}</strong> ({spacing.count}× used) - {spacing.usage}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {spacing.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
              
              {/* Icons System */}
              {analysis.data.icons && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Icon System</Typography>
                  <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>Style:</strong> {analysis.data.icons.style} | 
                      <strong> Library:</strong> {analysis.data.icons.library}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {analysis.data.icons.description}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">Sizes: </Typography>
                      {analysis.data.icons.size?.map((size, index) => (
                        <Chip key={index} label={size} size="small" variant="outlined" sx={{ mr: 0.5 }} />
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}
              
              {/* Imagery System */}
              {analysis.data.imagery && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Imagery System</Typography>
                  <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Treatment:</strong> {analysis.data.imagery.treatment?.cornerRadius} border radius, {analysis.data.imagery.treatment?.shadow} shadows
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      {analysis.data.imagery.treatment?.description}
                    </Typography>
                    {analysis.data.imagery.aspectRatios && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Aspect Ratios: </Typography>
                        {analysis.data.imagery.aspectRatios.map((ratio, index) => (
                          <Chip key={index} label={`${ratio.ratio} (${ratio.usage})`} size="small" variant="outlined" sx={{ mr: 0.5 }} />
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
              
              {/* Design System Tokens */}
              {analysis.data.designSystem && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Design System Tokens</Typography>
                  <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    {analysis.data.designSystem.borderRadius && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Border Radius:</strong> {analysis.data.designSystem.borderRadius.join(', ')}
                      </Typography>
                    )}
                    {analysis.data.designSystem.animation && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Animation:</strong> {analysis.data.designSystem.animation.duration?.join(', ')} duration, {analysis.data.designSystem.animation.easing} easing
                      </Typography>
                    )}
                    {analysis.data.designSystem.shadows && (
                      <Box>
                        <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>Shadow System:</Typography>
                        {analysis.data.designSystem.shadows.map((shadow, index) => (
                          <Typography key={index} variant="caption" display="block" color="text.secondary">
                            {shadow.name}: {shadow.usage}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
              
              {/* Grid Systems */}
              {analysis.data.grids && analysis.data.grids.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Grid Systems</Typography>
                  {analysis.data.grids.map((grid, index) => (
                    <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {grid.type} {grid.columns && `(${grid.columns} columns)`} - {grid.usage}
                      </Typography>
                      {grid.description && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {grid.description}
                        </Typography>
                      )}
                      {grid.template && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Template: {grid.template}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
              
              {/* Responsive Strategy */}
              {analysis.data.responsive && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Responsive Strategy</Typography>
                  <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Strategy:</strong> {analysis.data.responsive.strategy}
                    </Typography>
                    {analysis.data.responsive.breakpoints && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>Breakpoints:</Typography>
                        {analysis.data.responsive.breakpoints.map((bp, index) => (
                          <Typography key={index} variant="caption" display="block" color="text.secondary">
                            {bp.size} - {bp.name}: {bp.description}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
              
              {/* Frameworks */}
              {analysis.data.frameworks && analysis.data.frameworks.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Detected Frameworks & Systems</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {analysis.data.frameworks.map((framework, index) => (
                      <Chip
                        key={index}
                        label={framework}
                        color="secondary"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        )}

        {/* AI Insights (if available) */}
        {analysis.data?.aiInsights && (
          <Accordion>
            <AccordionSummary expandIcon={<CaretDown />}>
              <Typography variant="subtitle1">
                AI Design Insights
              </Typography>
              {analysis.data.aiInsights.error && (
                <Chip 
                  label="Limited Data" 
                  color="warning" 
                  size="small" 
                  sx={{ ml: 1 }}
                />
              )}
            </AccordionSummary>
            <AccordionDetails>
              {analysis.data.aiInsights.error ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  AI analysis encountered an issue: {analysis.data.aiInsights.error}
                </Alert>
              ) : null}
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {analysis.data.aiInsights.style && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Style</Typography>
                    <Typography variant="body2">{analysis.data.aiInsights.style}</Typography>
                  </Box>
                )}
                {analysis.data.aiInsights.approach && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Approach</Typography>
                    <Typography variant="body2">{analysis.data.aiInsights.approach}</Typography>
                  </Box>
                )}
                {analysis.data.aiInsights.hierarchy && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Hierarchy</Typography>
                    <Typography variant="body2">{analysis.data.aiInsights.hierarchy}</Typography>
                  </Box>
                )}
                {analysis.data.aiInsights.framework && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Framework</Typography>
                    <Typography variant="body2">{analysis.data.aiInsights.framework}</Typography>
                  </Box>
                )}
              </Box>
              
              {analysis.data.aiInsights.confidence && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    AI Confidence: {Math.round(analysis.data.aiInsights.confidence * 100)}%
                  </Typography>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        )}

        {/* Visual Analysis (if screenshots were used) */}
        {analysis.fullAnalysis?.analysis?.visual && (
          <Accordion>
            <AccordionSummary expandIcon={<CaretDown />}>
              <Typography variant="subtitle1">
                Visual Analysis (Screenshots)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Advanced visual analysis with GPT-4 Vision provides detailed insights about spacing, 
                typography, and responsive behavior patterns.
              </Typography>
              {/* Add visual analysis details here */}
            </AccordionDetails>
          </Accordion>
        )}
      </Box>
    );
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Link size={24} />
          <Typography variant="h6">URL Layout Analyzer</Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Analyze any website's layout patterns and design system to inspire your design.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="Website URL"
            placeholder="https://stripe.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            error={!!error}
            helperText={error}
          />
          <Button
            variant="contained"
            onClick={handleAnalyze}
            disabled={isLoading || !url}
            startIcon={isLoading ? <CircularProgress size={20} /> : <Eye />}
            sx={{ whiteSpace: 'nowrap', minWidth: 120 }}
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={useScreenshots}
                onChange={(e) => setUseScreenshots(e.target.checked)}
                disabled={isLoading}
              />
            }
            label="Use Screenshots (Enhanced Analysis)"
          />
          <Tooltip title="Screenshot analysis provides detailed visual insights about spacing, typography, and imagery">
            <Info size={16} style={{ color: '#666' }} />
          </Tooltip>
        </Box>

        {useScreenshots && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Screenshot analysis captures visual layout details including exact spacing, 
            typography hierarchy, and image treatments for more accurate design replication.
          </Alert>
        )}

        {renderAnalysisResults()}
      </CardContent>
    </Card>
  );
}