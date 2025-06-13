// components/design-tool/DebugPanel.jsx
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { CaretDown, Bug } from '@phosphor-icons/react';

export default function DebugPanel({ 
  copyClassification, 
  layoutAnalysis, 
  brandTokens, 
  brandId,
  showDebug = true 
}) {
  if (!showDebug) return null;

  const getInputStatus = (input, name) => {
    if (!input) return { status: 'missing', color: 'error' };
    if (typeof input === 'object' && Object.keys(input).length === 0) {
      return { status: 'empty object', color: 'warning' };
    }
    if (Array.isArray(input) && input.length === 0) {
      return { status: 'empty array', color: 'warning' };
    }
    return { status: 'present', color: 'success' };
  };

  const copyStatus = getInputStatus(copyClassification, 'Copy Classification');
  const layoutStatus = getInputStatus(layoutAnalysis, 'Layout Analysis');
  const brandTokensStatus = getInputStatus(brandTokens, 'Brand Tokens');
  const brandIdStatus = getInputStatus(brandId, 'Brand ID');

  const allInputsReady = copyClassification && layoutAnalysis && (brandTokens || brandId);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Bug size={20} />
          <Typography variant="h6">Debug Panel</Typography>
        </Box>

        {/* Overall Status */}
        <Alert 
          severity={allInputsReady ? "success" : "warning"} 
          sx={{ mb: 2 }}
        >
          <Typography variant="body2">
            <strong>Generation Ready:</strong> {allInputsReady ? "✅ Yes" : "❌ No"}
          </Typography>
          <Typography variant="caption" display="block">
            Required: Copy Classification + Layout Analysis + (Brand Tokens OR Brand ID)
          </Typography>
        </Alert>

        {/* Input Status Chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`Copy: ${copyStatus.status}`} 
            color={copyStatus.color} 
            size="small" 
          />
          <Chip 
            label={`Layout: ${layoutStatus.status}`} 
            color={layoutStatus.color} 
            size="small" 
          />
          <Chip 
            label={`Brand Tokens: ${brandTokensStatus.status}`} 
            color={brandTokensStatus.color} 
            size="small" 
          />
          <Chip 
            label={`Brand ID: ${brandIdStatus.status}`} 
            color={brandIdStatus.color} 
            size="small" 
          />
        </Box>

        {/* Detailed Data Inspection */}
        <Accordion>
          <AccordionSummary expandIcon={<CaretDown />}>
            <Typography variant="subtitle2">Inspect Data Details</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              
              {/* Copy Classification */}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Copy Classification ({typeof copyClassification}):
                </Typography>
                <Box sx={{ 
                  backgroundColor: '#f5f5f5', 
                  p: 1, 
                  borderRadius: 1, 
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  maxHeight: '100px',
                  overflow: 'auto'
                }}>
                  {copyClassification ? 
                    JSON.stringify(copyClassification, null, 2) : 
                    'null/undefined'
                  }
                </Box>
              </Box>

              {/* Layout Analysis */}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Layout Analysis ({typeof layoutAnalysis}):
                </Typography>
                <Box sx={{ 
                  backgroundColor: '#f5f5f5', 
                  p: 1, 
                  borderRadius: 1, 
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  maxHeight: '100px',
                  overflow: 'auto'
                }}>
                  {layoutAnalysis ? 
                    JSON.stringify(layoutAnalysis, null, 2) : 
                    'null/undefined'
                  }
                </Box>
              </Box>

              {/* Brand Tokens */}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Brand Tokens ({typeof brandTokens}):
                </Typography>
                <Box sx={{ 
                  backgroundColor: '#f5f5f5', 
                  p: 1, 
                  borderRadius: 1, 
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  maxHeight: '100px',
                  overflow: 'auto'
                }}>
                  {brandTokens ? 
                    JSON.stringify(brandTokens, null, 2) : 
                    'null/undefined'
                  }
                </Box>
              </Box>

              {/* Brand ID */}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Brand ID ({typeof brandId}):
                </Typography>
                <Box sx={{ 
                  backgroundColor: '#f5f5f5', 
                  p: 1, 
                  borderRadius: 1, 
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}>
                  {brandId || 'null/undefined'}
                </Box>
              </Box>

            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Troubleshooting Tips */}
        {!allInputsReady && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="caption" component="div">
              <strong>Troubleshooting:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '16px' }}>
                {!copyClassification && (
                  <li>Copy Classification is missing - check if copy classification API call succeeded</li>
                )}
                {!layoutAnalysis && (
                  <li>Layout Analysis is missing - check if URL analysis API call succeeded</li>
                )}
                {!brandTokens && !brandId && (
                  <li>Brand data is missing - check if brand selection and token loading succeeded</li>
                )}
              </ul>
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}