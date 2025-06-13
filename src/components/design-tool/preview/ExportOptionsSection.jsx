// components/design-tool/preview/ExportOptionsSection.jsx
'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  TextField,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Download,
  Code,
  FileHtml,
  FileJs,
  FileText,
  Copy,
  CheckCircle
} from '@phosphor-icons/react';

export default function ExportOptionsSection({
  generatedLayout,  // Fixed: singular instead of plural
  brandTokens
}) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('html');
  const [exportCode, setExportCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Export formats
  const exportFormats = [
    { 
      key: 'html', 
      label: 'HTML/CSS', 
      icon: <FileHtml size={16} />,
      description: 'Complete HTML page with inline CSS'
    },
    { 
      key: 'react', 
      label: 'React JSX', 
      icon: <FileJs size={16} />,
      description: 'React component with Material-UI'
    },
    { 
      key: 'json', 
      label: 'JSON Data', 
      icon: <FileText size={16} />,
      description: 'Layout structure and configuration'
    },
    { 
      key: 'css', 
      label: 'CSS Variables', 
      icon: <Code size={16} />,
      description: 'Brand tokens as CSS custom properties'
    }
  ];

  // Handle export
  const handleExport = (format) => {
    setExportFormat(format);
    const code = generateExportCode(format, generatedLayout, brandTokens);
    setExportCode(code);
    setExportDialogOpen(true);
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Download file
  const handleDownload = () => {
    const format = exportFormats.find(f => f.key === exportFormat);
    const filename = `design-tool-layout.${getFileExtension(exportFormat)}`;
    
    const blob = new Blob([exportCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get file extension
  const getFileExtension = (format) => {
    const extensions = {
      html: 'html',
      react: 'jsx',
      json: 'json',
      css: 'css'
    };
    return extensions[format] || 'txt';
  };

  // Don't render if no layout
  if (!generatedLayout) {
    return null;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Download size={20} weight="duotone" />
        <Typography variant="h6">Export Options</Typography>
        <Chip 
          label="Generated Layout" 
          color="primary" 
          size="small"
          sx={{ ml: 'auto' }}
        />
      </Box>

      {/* Export Buttons */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
        {exportFormats.map((format) => (
          <Button
            key={format.key}
            variant="outlined"
            startIcon={format.icon}
            onClick={() => handleExport(format.key)}
            sx={{
              p: 2,
              height: 'auto',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'left',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'primary.50'
              }
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {format.label}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
              {format.description}
            </Typography>
          </Button>
        ))}
      </Box>

      {/* Export Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {exportFormats.find(f => f.key === exportFormat)?.icon}
          Export as {exportFormats.find(f => f.key === exportFormat)?.label}
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Copy the code below or download it as a file. You can use this code in your own projects.
          </Alert>

          <TextField
            multiline
            fullWidth
            rows={20}
            value={exportCode}
            variant="outlined"
            InputProps={{
              readOnly: true,
              sx: { 
                fontFamily: 'monospace', 
                fontSize: '0.875rem',
                '& .MuiInputBase-input': {
                  padding: '12px'
                }
              }
            }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setExportDialogOpen(false)}>
            Close
          </Button>
          
          <Button
            variant="outlined"
            startIcon={copied ? <CheckCircle size={16} /> : <Copy size={16} />}
            onClick={handleCopy}
            color={copied ? 'success' : 'primary'}
          >
            {copied ? 'Copied!' : 'Copy Code'}
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Download size={16} />}
            onClick={handleDownload}
          >
            Download File
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Generate export code based on format
function generateExportCode(format, layout, brandTokens) {
  switch (format) {
    case 'html':
      return generateHTMLCode(layout, brandTokens);
    case 'react':
      return generateReactCode(layout, brandTokens);
    case 'json':
      return generateJSONCode(layout, brandTokens);
    case 'css':
      return generateCSSCode(brandTokens);
    default:
      return '';
  }
}

// Generate HTML code
function generateHTMLCode(layout, brandTokens) {
  const css = generateCSSCode(brandTokens);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Layout</title>
    <style>
        ${css}
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: var(--font-body, 'Inter, Arial, sans-serif');
            line-height: 1.6;
            color: var(--color-text, #333);
        }
        
        .section {
            padding: 3rem 1.5rem;
            min-height: 200px;
        }
        
        .hero {
            background-color: var(--color-primary, #3B82F6);
            color: white;
            text-align: center;
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            padding: 4rem 1.5rem;
        }
        
        .cta {
            background-color: var(--color-secondary, #10B981);
            color: white;
            text-align: center;
        }
        
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: var(--color-primary, #3B82F6);
            color: white;
            text-decoration: none;
            border-radius: var(--radius-md, 8px);
            border: none;
            cursor: pointer;
            font-size: 1rem;
            margin: 0.5rem;
            transition: opacity 0.2s;
        }
        
        .btn:hover {
            opacity: 0.9;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .feature-item {
            text-align: center;
            padding: 1.5rem;
        }
        
        @media (max-width: 768px) {
            .section {
                padding: 2rem 1rem;
            }
            
            .features {
                grid-template-columns: 1fr;
                gap: 1.5rem;
            }
        }
    </style>
</head>
<body>
    ${layout.sections?.map(section => `
    <section class="section ${section.type}">
        <div class="container">
            ${generateSectionHTML(section)}
        </div>
    </section>`).join('') || `
    <section class="section hero">
        <div class="container">
            <h1>Generated Layout</h1>
            <p>Your AI-generated design will appear here</p>
            <a href="#" class="btn">Get Started</a>
        </div>
    </section>`}
</body>
</html>`;
}

// Generate React code
function generateReactCode(layout, brandTokens) {
  const primaryColor = extractTokenValue(brandTokens, 'colors.primary.primary') || '#3B82F6';
  const secondaryColor = extractTokenValue(brandTokens, 'colors.primary.secondary') || '#10B981';
  const fontFamily = extractTokenValue(brandTokens, 'typography.body.body') || 'Inter, Arial, sans-serif';

  return `import React from 'react';
import { Box, Typography, Button, Grid, Container } from '@mui/material';

// Brand tokens as theme overrides
const brandTheme = {
  palette: {
    primary: {
      main: '${primaryColor}'
    },
    secondary: {
      main: '${secondaryColor}'
    }
  },
  typography: {
    fontFamily: '${fontFamily}'
  }
};

export default function GeneratedLayout() {
  return (
    <Box>
      ${layout.sections?.map((section, index) => `
      {/* ${section.type} Section */}
      <Box
        sx={{
          py: 6,
          px: 3,
          backgroundColor: '${section.styling?.backgroundColor || (section.type === 'hero' ? primaryColor : 'transparent')}',
          color: '${section.styling?.textColor || (section.type === 'hero' ? 'white' : 'inherit')}'
        }}
      >
        <Container maxWidth="lg">
          ${generateSectionReact(section)}
        </Container>
      </Box>`).join('') || `
      <Box sx={{ py: 6, px: 3, backgroundColor: '${primaryColor}', color: 'white', textAlign: 'center' }}>
        <Container maxWidth="lg">
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
            Generated Layout
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, opacity: 0.8 }}>
            Your AI-generated design will appear here
          </Typography>
          <Button variant="contained" size="large">
            Get Started
          </Button>
        </Container>
      </Box>`}
    </Box>
  );
}`;
}

// Generate JSON code
function generateJSONCode(layout, brandTokens) {
  return JSON.stringify({
    layout: {
      sections: layout.sections || [],
      generation: layout.generation || {},
      brandTokens: brandTokens,
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        tool: 'AI Design Tool'
      }
    }
  }, null, 2);
}

// Generate CSS code
function generateCSSCode(brandTokens) {
  let css = ':root {\n';
  
  // Colors
  if (brandTokens?.colors) {
    Object.entries(brandTokens.colors).forEach(([groupName, group]) => {
      if (typeof group === 'object') {
        Object.entries(group).forEach(([tokenName, token]) => {
          css += `  --color-${groupName}-${tokenName}: ${token.value};\n`;
        });
      }
    });
  }
  
  // Typography
  if (brandTokens?.typography) {
    Object.entries(brandTokens.typography).forEach(([groupName, group]) => {
      if (typeof group === 'object') {
        Object.entries(group).forEach(([tokenName, token]) => {
          css += `  --font-${groupName}-${tokenName}: ${token.value};\n`;
          if (token.fontSize) css += `  --font-size-${groupName}-${tokenName}: ${token.fontSize};\n`;
          if (token.fontWeight) css += `  --font-weight-${groupName}-${tokenName}: ${token.fontWeight};\n`;
          if (token.lineHeight) css += `  --line-height-${groupName}-${tokenName}: ${token.lineHeight};\n`;
        });
      }
    });
  }
  
  // Spacing
  if (brandTokens?.spacing) {
    Object.entries(brandTokens.spacing).forEach(([name, token]) => {
      css += `  --spacing-${name}: ${token.value};\n`;
    });
  }
  
  // Border Radius
  if (brandTokens?.borderRadius) {
    Object.entries(brandTokens.borderRadius).forEach(([name, token]) => {
      css += `  --radius-${name}: ${token.value};\n`;
    });
  }
  
  // Fallback variables
  css += `
  /* Fallback variables */
  --color-primary: var(--color-primary-primary, #3B82F6);
  --color-secondary: var(--color-primary-secondary, #10B981);
  --color-text: var(--color-neutral-text, #333333);
  --font-body: var(--font-body-body, 'Inter, Arial, sans-serif');
`;
  
  css += '}';
  return css;
}

// Helper to extract token values
function extractTokenValue(brandTokens, path) {
  const keys = path.split('.');
  let value = brandTokens;
  
  for (const key of keys) {
    value = value?.[key];
    if (!value) return null;
  }
  
  return value?.value || value;
}

// Generate section HTML
function generateSectionHTML(section) {
  switch (section.type) {
    case 'hero':
      return `
        <h1>${section.content?.headline || 'Transform Your Business'}</h1>
        <p>${section.content?.subheadline || 'Discover powerful solutions that help you achieve your goals.'}</p>
        <a href="#" class="btn">${section.content?.cta || 'Get Started'}</a>
      `;
    case 'features':
      return `
        <h2>${section.content?.title || 'Powerful Features'}</h2>
        <div class="features">
          ${section.content?.features ? section.content.features.map(feature => `
            <div class="feature-item">
              <h3>${feature.icon || '⭐'} ${feature.title || 'Feature'}</h3>
              <p>${feature.description || 'Feature description'}</p>
            </div>
          `).join('') : `
            <div class="feature-item">
              <h3>⚡ Fast Performance</h3>
              <p>Lightning-fast loading times and smooth interactions</p>
            </div>
            <div class="feature-item">
              <h3>🔒 Secure & Reliable</h3>
              <p>Enterprise-grade security with 99.9% uptime</p>
            </div>
            <div class="feature-item">
              <h3>🎨 Beautiful Design</h3>
              <p>Stunning interfaces that users love</p>
            </div>
          `}
        </div>
      `;
    case 'testimonial':
      return `
        <blockquote>
          <p>"${section.content?.quote || 'This product has transformed our business completely.'}"</p>
          <cite>— ${section.content?.author || 'Happy Customer'}</cite>
        </blockquote>
      `;
    case 'cta':
      return `
        <h2>${section.content?.headline || 'Ready to Get Started?'}</h2>
        <p>${section.content?.description || 'Join thousands of satisfied customers today'}</p>
        <a href="#" class="btn">${section.content?.primaryCTA || 'Start Free Trial'}</a>
      `;
    default:
      return `<h2>${section.type} Section</h2><p>${section.content?.text || 'Content goes here'}</p>`;
  }
}

// Generate section React code
function generateSectionReact(section) {
  switch (section.type) {
    case 'hero':
      return `
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
            ${section.content?.headline || 'Transform Your Business'}
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, opacity: 0.8 }}>
            ${section.content?.subheadline || 'Discover powerful solutions that help you achieve your goals.'}
          </Typography>
          <Button variant="contained" size="large">
            ${section.content?.cta || 'Get Started'}
          </Button>`;
    case 'features':
      return `
          <Typography variant="h3" sx={{ textAlign: 'center', mb: 4 }}>
            ${section.content?.title || 'Powerful Features'}
          </Typography>
          <Grid container spacing={4}>
            ${section.content?.features ? section.content.features.map((feature, index) => `
            <Grid item xs={12} md={4}>
              <Typography variant="h5" sx={{ mb: 2 }}>${feature.icon || '⭐'} ${feature.title || 'Feature'}</Typography>
              <Typography>${feature.description || 'Feature description'}</Typography>
            </Grid>`).join('') : `
            <Grid item xs={12} md={4}>
              <Typography variant="h5" sx={{ mb: 2 }}>⚡ Fast Performance</Typography>
              <Typography>Lightning-fast loading times and smooth interactions</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h5" sx={{ mb: 2 }}>🔒 Secure & Reliable</Typography>
              <Typography>Enterprise-grade security with 99.9% uptime</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h5" sx={{ mb: 2 }}>🎨 Beautiful Design</Typography>
              <Typography>Stunning interfaces that users love</Typography>
            </Grid>`}
          </Grid>`;
    case 'testimonial':
      return `
          <Box sx={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <Typography variant="h4" sx={{ fontStyle: 'italic', mb: 2 }}>
              "${section.content?.quote || 'This product has transformed our business completely.'}"
            </Typography>
            <Typography variant="subtitle1">
              — ${section.content?.author || 'Happy Customer'}
            </Typography>
          </Box>`;
    case 'cta':
      return `
          <Typography variant="h3" sx={{ textAlign: 'center', mb: 2 }}>
            ${section.content?.headline || 'Ready to Get Started?'}
          </Typography>
          <Typography variant="h6" sx={{ textAlign: 'center', mb: 3 }}>
            ${section.content?.description || 'Join thousands of satisfied customers today'}
          </Typography>
          <Box sx={{ textAlign: 'center' }}>
            <Button variant="contained" size="large">
              ${section.content?.primaryCTA || 'Start Free Trial'}
            </Button>
          </Box>`;
    default:
      return `
          <Typography variant="h4" sx={{ mb: 2 }}>
            ${section.type} Section
          </Typography>
          <Typography>
            ${section.content?.text || 'Content goes here'}
          </Typography>`;
  }
}