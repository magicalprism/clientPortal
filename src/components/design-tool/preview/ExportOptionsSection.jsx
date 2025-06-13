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
  generatedLayouts,
  selectedVariation,
  brandTokens
}) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('html');
  const [exportCode, setExportCode] = useState('');
  const [copied, setCopied] = useState(false);

  const currentLayout = generatedLayouts[selectedVariation];

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
    const code = generateExportCode(format, currentLayout, brandTokens);
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
    const filename = `${currentLayout.name.toLowerCase().replace(/\s+/g, '-')}.${getFileExtension(exportFormat)}`;
    
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

  if (!currentLayout) {
    return null;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Download size={20} weight="duotone" />
        <Typography variant="h6">Export Options</Typography>
        <Chip 
          label={currentLayout.name} 
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
    <title>${layout.name}</title>
    <style>
        ${css}
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: var(--font-body, 'Arial, sans-serif');
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
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            margin: 0.5rem;
        }
        
        .btn:hover {
            opacity: 0.9;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    ${layout.sections?.map(section => `
    <section class="section ${section.type}">
        <div class="container">
            ${generateSectionHTML(section)}
        </div>
    </section>`).join('') || '<section class="section"><div class="container"><h1>No sections to display</h1></div></section>'}
</body>
</html>`;
}

// Generate React code
function generateReactCode(layout, brandTokens) {
  return `import React from 'react';
import { Box, Typography, Button, Grid, Container } from '@mui/material';

// Brand tokens as theme overrides
const brandTheme = {
  palette: {
    primary: {
      main: '${brandTokens.colors?.primary?.value || '#3B82F6'}'
    },
    secondary: {
      main: '${brandTokens.colors?.secondary?.value || '#10B981'}'
    }
  },
  typography: {
    fontFamily: '${brandTokens.typography?.body?.value || 'Arial, sans-serif'}'
  }
};

export default function ${layout.name.replace(/\s+/g, '')}Layout() {
  return (
    <Box>
      ${layout.sections?.map((section, index) => `
      {/* ${section.type} Section */}
      <Box
        sx={{
          py: 6,
          px: 3,
          backgroundColor: '${section.style?.backgroundColor || 'transparent'}',
          color: '${section.style?.color || 'inherit'}'
        }}
      >
        <Container maxWidth="lg">
          ${generateSectionReact(section)}
        </Container>
      </Box>`).join('') || '      <Typography>No sections to display</Typography>'}
    </Box>
  );
}`;
}

// Generate JSON code
function generateJSONCode(layout, brandTokens) {
  return JSON.stringify({
    layout: {
      name: layout.name,
      sections: layout.sections || [],
      brandTokens: brandTokens,
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    }
  }, null, 2);
}

// Generate CSS code
function generateCSSCode(brandTokens) {
  let css = ':root {\n';
  
  // Colors
  if (brandTokens.colors) {
    Object.entries(brandTokens.colors).forEach(([name, token]) => {
      css += `  --color-${name}: ${token.value};\n`;
    });
  }
  
  // Typography
  if (brandTokens.typography) {
    Object.entries(brandTokens.typography).forEach(([name, token]) => {
      css += `  --font-${name}: ${token.value};\n`;
    });
  }
  
  // Spacing
  if (brandTokens.spacing) {
    Object.entries(brandTokens.spacing).forEach(([name, token]) => {
      css += `  --spacing-${name}: ${token.value};\n`;
    });
  }
  
  // Border Radius
  if (brandTokens.borderRadius) {
    Object.entries(brandTokens.borderRadius).forEach(([name, token]) => {
      css += `  --radius-${name}: ${token.value};\n`;
    });
  }
  
  css += '}';
  return css;
}

// Generate section HTML
function generateSectionHTML(section) {
  switch (section.type) {
    case 'hero':
      return `
        <h1>Transform Your Business</h1>
        <p>Discover powerful solutions that help you achieve your goals.</p>
        <a href="#" class="btn">Get Started</a>
      `;
    case 'features':
      return `
        <h2>Powerful Features</h2>
        <div class="features">
          <div>
            <h3>⚡ Fast Performance</h3>
            <p>Lightning-fast loading times and smooth interactions</p>
          </div>
          <div>
            <h3>🔒 Secure & Reliable</h3>
            <p>Enterprise-grade security with 99.9% uptime</p>
          </div>
          <div>
            <h3>🎨 Beautiful Design</h3>
            <p>Stunning interfaces that users love</p>
          </div>
        </div>
      `;
    case 'cta':
      return `
        <h2>Ready to Get Started?</h2>
        <p>Join thousands of satisfied customers today</p>
        <a href="#" class="btn">Start Free Trial</a>
      `;
    default:
      return `<h2>${section.type} Section</h2><p>${section.content || 'Content goes here'}</p>`;
  }
}

// Generate section React code
function generateSectionReact(section) {
  switch (section.type) {
    case 'hero':
      return `
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
            Transform Your Business
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, opacity: 0.8 }}>
            Discover powerful solutions that help you achieve your goals.
          </Typography>
          <Button variant="contained" size="large">
            Get Started
          </Button>`;
    case 'features':
      return `
          <Typography variant="h3" sx={{ textAlign: 'center', mb: 4 }}>
            Powerful Features
          </Typography>
          <Grid container spacing={4}>
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
            </Grid>
          </Grid>`;
    case 'cta':
      return `
          <Typography variant="h3" sx={{ textAlign: 'center', mb: 2 }}>
            Ready to Get Started?
          </Typography>
          <Typography variant="h6" sx={{ textAlign: 'center', mb: 3 }}>
            Join thousands of satisfied customers today
          </Typography>
          <Box sx={{ textAlign: 'center' }}>
            <Button variant="contained" size="large">
              Start Free Trial
            </Button>
          </Box>`;
    default:
      return `
          <Typography variant="h4" sx={{ mb: 2 }}>
            ${section.type} Section
          </Typography>
          <Typography>
            ${section.content || 'Content goes here'}
          </Typography>`;
  }
}