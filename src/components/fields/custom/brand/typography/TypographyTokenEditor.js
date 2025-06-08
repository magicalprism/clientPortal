'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { 
  Box,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  TextAa,
  CaretDown,
  Plus,
  Copy,
  Check,
  PencilSimple,
  DownloadSimple,
  Eye,
  EyeOff,
  ArrowsClockwise,
  Warning,
  UploadSimple
} from '@phosphor-icons/react';
import { InlineEditableField } from '@/components/fields/InlineEditableField';
import { regenerateAllTypographyTokens } from '@/components/fields/custom/brand/typography/typographyTokenGenerator';
import { FontPicker } from '@/components/fields/custom/brand/typography/FontPicker';
/**
 * Fetch typography tokens for a specific brand
 */
const fetchTypographyTokensByBrandId = async (brandId) => {
  const supabase = createClient();
  
  try {
    console.log('[fetchTypographyTokensByBrandId] Fetching typography for brand:', brandId);
    
    const { data, error } = await supabase
      .from('typography')
      .select(`
        id,
        title,
        token,
        description,
        font_family,
        font_size,
        line_height,
        font_weight,
        letter_spacing,
        text_transform,
        font_style,
        category,
        type,
        group_name,
        has_italic,
        regular_font_data,
        italic_font_data,
        brand_id,
        author_id,
        created_at,
        updated_at,
        parent_id
      `)
      .eq('brand_id', brandId)
      .order('group_name', { ascending: true });

    if (error) {
      console.error('[fetchTypographyTokensByBrandId] Supabase error:', error);
      throw error;
    }

    console.log('[fetchTypographyTokensByBrandId] Found typography tokens:', data?.length || 0);
    return data || [];
    
  } catch (error) {
    console.error('[fetchTypographyTokensByBrandId] Error:', error);
    throw error;
  }
};

/**
 * Update a typography token
 */
const updateTypographyToken = async (tokenId, updates) => {
  const supabase = createClient();
  
  try {
    console.log('[updateTypographyToken] Updating typography:', { tokenId, updates });
    
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('typography')
      .update(updateData)
      .eq('id', tokenId)
      .select()
      .single();

    if (error) {
      console.error('[updateTypographyToken] Supabase error:', error);
      throw error;
    }

    console.log('[updateTypographyToken] Typography updated:', data);
    return data;
    
  } catch (error) {
    console.error('[updateTypographyToken] Error:', error);
    throw error;
  }
};

// Typography token card component
const TypographyTokenCard = ({ token, onChange }) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [fontFamilyName, setFontFamilyName] = useState('');
  const [currentFontId, setCurrentFontId] = useState(null);
  const [fontPickerOpen, setFontPickerOpen] = useState(false);

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFieldSave = async (field, value) => {
    try {
      await onChange({ ...token, [field]: value });
    } catch (error) {
      console.error('Error saving field:', error);
      throw error;
    }
  };

  const isAlias = token.type === 'alias';
  const isFontFamily = token.category === 'family'; // ADD THIS LINE
  const sampleText = token.category === 'display' ? 'Typography' : 
                     token.category === 'heading' ? 'Sample Heading' :
                     token.category === 'body' ? 'The quick brown fox jumps over the lazy dog.' :
                     token.category === 'ui' ? 'Button Text' : 'Sample Text';

  // Load font file and get current font ID
  useEffect(() => {
    const loadFontFile = async () => {
      // For font family tokens, use the stored font data
      if (isFontFamily && (token.regular_font_data || token.italic_font_data)) {
        const regularData = token.regular_font_data;
        const italicData = token.italic_font_data;
        
        if (regularData?.title) {
          setFontFamilyName(regularData.title);
          setCurrentFontId(regularData.id);
        } else if (italicData?.title) {
          setFontFamilyName(italicData.title);
          setCurrentFontId(italicData.id);
        }
        
        try {
          // Load regular font if available
          if (regularData?.url && regularData?.title) {
            const fontFace = new FontFace(regularData.title, `url(${regularData.url})`);
            await fontFace.load();
            document.fonts.add(fontFace);
            console.log(`✅ Loaded regular font: ${regularData.title}`);
          }
          
          // Load italic font if available
          if (italicData?.url && italicData?.title) {
            const fontFace = new FontFace(italicData.title, `url(${italicData.url})`);
            await fontFace.load();
            document.fonts.add(fontFace);
            console.log(`✅ Loaded italic font: ${italicData.title}`);
          }
          
          setFontLoaded(true);
        } catch (err) {
          console.log(`⚠️ Could not load font family`, err);
          setFontLoaded(true); // Still set to true to show the preview
        }
        
        return;
      }
      
      // For other tokens, use the existing logic
      if (token.font_family && token.font_family.includes('"')) {
        // Extract font family name from font stack
        const fontName = token.font_family.split('"')[1];
        setFontFamilyName(fontName);

        // Try to load the font file and get font ID
        if (fontName && fontName !== 'system-ui' && fontName !== 'sans-serif') {
          try {
            // Fetch both regular and italic font variants
            const supabase = createClient();
            const { data, error } = await supabase
              .from('media')
              .select('id, url, title')
              .ilike('title', `%${fontName}%`)
              .or('mime_type.ilike.%font%,mime_type.ilike.%woff%')
              .order('title', { ascending: true });

            if (data && data.length > 0 && !error) {
              // Set the current font ID for the picker (use first match)
              setCurrentFontId(data[0].id);
              
              // Load all available font variants (regular, italic, etc.)
              for (const fontFile of data) {
                try {
                  const fontFace = new FontFace(fontName, `url(${fontFile.url})`);
                  await fontFace.load();
                  document.fonts.add(fontFace);
                  console.log(`✅ Loaded font variant: ${fontFile.title}`);
                } catch (fontLoadError) {
                  console.log(`⚠️ Could not load font variant: ${fontFile.title}`, fontLoadError);
                }
              }
              
              setFontLoaded(true);
              console.log(`✅ Loaded font family: ${fontName} (${data.length} variants)`);
            }
          } catch (err) {
            console.log(`⚠️ Could not load font: ${fontName}`, err);
            // Font loading failed, but that's OK - we'll use fallback
          }
        } else {
          setFontLoaded(true); // System fonts are always "loaded"
        }
      }
    };

    loadFontFile();
  }, [token.font_family, token.regular_font_data, token.italic_font_data, isFontFamily]);

  // Convert token values to CSS
  const getFontStyle = () => {
    const style = {};
    
    if (token.font_family) {
      style.fontFamily = token.font_family.startsWith('font.family.') 
        ? 'var(--font-family)' // Would need CSS custom properties
        : token.font_family;
    }
    
    if (token.font_size) {
      style.fontSize = token.font_size.startsWith('font.size.') 
        ? getFontSizeValue(token.font_size)
        : token.font_size;
    }
    
    if (token.font_weight) {
      style.fontWeight = token.font_weight.startsWith('font.weight.') 
        ? getFontWeightValue(token.font_weight)
        : token.font_weight;
    }
    
    if (token.line_height) {
      style.lineHeight = token.line_height.startsWith('font.lineHeight.') 
        ? getLineHeightValue(token.line_height)
        : token.line_height;
    }
    
    if (token.letter_spacing) {
      style.letterSpacing = token.letter_spacing.startsWith('font.letterSpacing.') 
        ? getLetterSpacingValue(token.letter_spacing)
        : token.letter_spacing;
    }
    
    if (token.text_transform) {
      style.textTransform = token.text_transform;
    }
    
    if (token.font_style) {
      style.fontStyle = token.font_style;
    }
    
    return style;
  };

  // Helper functions to resolve token references
  const getFontSizeValue = (tokenRef) => {
    const sizeMap = {
      'font.size.2xs': '0.75rem',
      'font.size.xs': '0.875rem',
      'font.size.sm': '1rem',
      'font.size.md': '1.125rem',
      'font.size.lg': '1.25rem',
      'font.size.xl': '1.5rem',
      'font.size.2xl': '1.875rem',
      'font.size.3xl': '2.25rem',
      'font.size.4xl': '3rem',
      'font.size.5xl': '3.75rem',
      'font.size.6xl': '4.5rem'
    };
    return sizeMap[tokenRef] || '1rem';
  };

  const getFontWeightValue = (tokenRef) => {
    const weightMap = {
      'font.weight.thin': '100',
      'font.weight.light': '300',
      'font.weight.normal': '400',
      'font.weight.medium': '500',
      'font.weight.semibold': '600',
      'font.weight.bold': '700',
      'font.weight.extrabold': '800',
      'font.weight.black': '900'
    };
    return weightMap[tokenRef] || '400';
  };

  const getLineHeightValue = (tokenRef) => {
    const lineHeightMap = {
      'font.lineHeight.tight': '1.25',
      'font.lineHeight.snug': '1.375',
      'font.lineHeight.normal': '1.5',
      'font.lineHeight.relaxed': '1.625',
      'font.lineHeight.loose': '2'
    };
    return lineHeightMap[tokenRef] || '1.5';
  };

  const getLetterSpacingValue = (tokenRef) => {
    const spacingMap = {
      'font.letterSpacing.tighter': '-0.05em',
      'font.letterSpacing.tight': '-0.025em',
      'font.letterSpacing.normal': '0em',
      'font.letterSpacing.wide': '0.025em',
      'font.letterSpacing.wider': '0.05em',
      'font.letterSpacing.widest': '0.1em'
    };
    return spacingMap[tokenRef] || '0em';
  };

  const handleFontChange = async (newFontId) => {
    // Fetch the new font details
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('media')
        .select('title, url')
        .eq('id', newFontId)
        .single();

      if (error) throw error;

      const fontName = data.title || 'Custom Font';
      const newFontFamily = `"${fontName}", system-ui, -apple-system, sans-serif`;
      
      await handleFieldSave('font_family', newFontFamily);
      setFontPickerOpen(false);
    } catch (error) {
      console.error('Error updating font:', error);
    }
  };

  // Extract font file URL for download (prioritize the specific style)
  const getFontDownloadUrl = async () => {
    if (fontFamilyName) {
      try {
        const supabase = createClient();
        
        // First try to find the specific style (italic vs regular)
        let query = supabase
          .from('media')
          .select('url, title')
          .ilike('title', `%${fontFamilyName}%`)
          .or('mime_type.ilike.%font%,mime_type.ilike.%woff%');
        
        // If this token has italic style, prefer italic fonts
        if (token.font_style === 'italic') {
          query = query.ilike('title', '%italic%');
        } else {
          // For regular style, prefer non-italic fonts
          query = query.not('title', 'ilike', '%italic%');
        }
        
        const { data, error } = await query.limit(1).single();
        
        if (data?.url && !error) {
          return data.url;
        }
        
        // Fallback: get any font with this name
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('media')
          .select('url')
          .ilike('title', `%${fontFamilyName}%`)
          .or('mime_type.ilike.%font%,mime_type.ilike.%woff%')
          .limit(1)
          .single();
          
        return fallbackData?.url || null;
      } catch (err) {
        return null;
      }
    }
    return null;
  };

  const handleDownloadFont = async () => {
    const fontUrl = await getFontDownloadUrl();
    if (fontUrl) {
      window.open(fontUrl, '_blank');
    }
  };

  return (
    <Paper sx={{ 
      p: 3, 
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', // Increased shadow
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
        transform: 'translateY(-2px)'
      }
    }}>
      {/* Typography Preview */}
      <Box
        sx={{
          minHeight: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid',
          borderColor: 'divider',
          borderRadius: 2,
          mb: 2,
          p: 2,
          bgcolor: 'grey.50',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Typography 
          sx={{
            ...getFontStyle(),
            textAlign: 'center',
            color: 'text.primary',
            wordBreak: 'break-word',
            opacity: fontLoaded ? 1 : 0.7,
            transition: 'opacity 0.3s ease'
          }}
        >
          {sampleText}
        </Typography>
        
        {/* Font loading indicator */}
        {!fontLoaded && fontFamilyName && (
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              backgroundColor: 'warning.main',
              color: 'white',
              fontSize: '0.7rem',
              px: 1,
              py: 0.5,
              borderRadius: 1
            }}
          >
            Loading font...
          </Box>
        )}
      </Box>

      {/* Token Info */}
      <Box sx={{ mb: 2, flexGrow: 1 }}>
        <InlineEditableField
          value={token.title}
          onChange={(value) => handleFieldSave('title', value)}
          variant="subtitle2"
          sx={{ fontWeight: 600, mb: 1 }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <TextAa size={14} color="var(--mui-palette-primary-main)" />
          <InlineEditableField
            value={token.token}
            onChange={(value) => handleFieldSave('token', value)}
            variant="caption"
            sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
          />
          <IconButton size="small" onClick={() => copyToClipboard(token.token)}>
            {copied ? <Check size={12} color="green" /> : <Copy size={12} />}
          </IconButton>
        </Box>

        {token.description && (
          <InlineEditableField
            value={token.description}
            onChange={(value) => handleFieldSave('description', value)}
            variant="caption"
            multiline
            sx={{ color: 'text.secondary', display: 'block', mb: 1 }}
          />
        )}

        {/* Typography Properties - Now Editable */}
        <Box sx={{ mt: 2 }}>
          {token.font_family && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  <strong>Font:</strong>
                </Typography>
                <Typography variant="caption" sx={{ wordBreak: 'break-word' }}>
                  {fontFamilyName || token.font_family}
                </Typography>
              </Box>
              {fontFamilyName && (
                <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                  <IconButton size="small" onClick={handleDownloadFont} title="Download font">
                    <DownloadSimple size={12} />
                  </IconButton>
                  <IconButton size="small" onClick={() => setFontPickerOpen(true)} title="Change font">
                    <PencilSimple size={12} />
                  </IconButton>
                </Box>
              )}
            </Box>
          )}
          
          {token.font_size && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                <strong>Size:</strong>
              </Typography>
              <InlineEditableField
                value={token.font_size}
                onChange={(value) => handleFieldSave('font_size', value)}
                variant="caption"
                sx={{ fontFamily: 'monospace' }}
              />
            </Box>
          )}
          
          {token.font_weight && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                <strong>Weight:</strong>
              </Typography>
              <InlineEditableField
                value={token.font_weight}
                onChange={(value) => handleFieldSave('font_weight', value)}
                variant="caption"
                sx={{ fontFamily: 'monospace' }}
              />
            </Box>
          )}
          
          {token.line_height && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                <strong>Line Height:</strong>
              </Typography>
              <InlineEditableField
                value={token.line_height}
                onChange={(value) => handleFieldSave('line_height', value)}
                variant="caption"
                sx={{ fontFamily: 'monospace' }}
              />
            </Box>
          )}
          
          {token.letter_spacing && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                <strong>Letter Spacing:</strong>
              </Typography>
              <InlineEditableField
                value={token.letter_spacing}
                onChange={(value) => handleFieldSave('letter_spacing', value)}
                variant="caption"
                sx={{ fontFamily: 'monospace' }}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Type badge */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
        <Chip 
          size="small" 
          label={isAlias ? 'Semantic' : 'Base'} 
          color={isAlias ? 'primary' : 'secondary'}
          variant="outlined"
        />
        {token.category && (
          <Chip size="small" label={token.category} variant="filled" />
        )}
      </Box>

      {/* Font Picker Modal */}
      {fontPickerOpen && (
        <Dialog open={fontPickerOpen} onClose={() => setFontPickerOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Change Font</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <FontPicker
                value={currentFontId || ''}
                onChange={handleFontChange}
                label="Font"
                size="medium"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFontPickerOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      )}
    </Paper>
  );
};

// Token group component
const TypographyTokenGroup = ({ title, tokens, onChange, expanded, onToggle, showSemantics }) => {
  const baseTokens = tokens.filter(t => t.type === 'base');
  const semanticTokens = tokens.filter(t => t.type === 'alias');
  
  const displayTokens = showSemantics ? [...baseTokens, ...semanticTokens] : baseTokens;

  return (
    <Accordion expanded={expanded} onChange={onToggle}>
      <AccordionSummary expandIcon={<CaretDown />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextAa size={20} color="var(--mui-palette-primary-main)" />
          <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
            {title}
          </Typography>
          <Chip 
            size="small" 
            label={`${baseTokens.length} base${showSemantics ? `, ${semanticTokens.length} semantic` : ''}`}
          />
        </Box>
      </AccordionSummary>
      
      <AccordionDetails>
        <Grid container spacing={2}>
          {displayTokens.map((token) => (
            <Grid item xs={12} md={6} key={token.id}>
              <TypographyTokenCard
                token={token}
                onChange={(updatedToken) => onChange(updatedToken)}
              />
            </Grid>
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

// Font regeneration dialog
const FontRegenerationDialog = ({ open, onClose, onConfirm, loading, brandId, record }) => {
  const [brandFonts, setBrandFonts] = useState({
    primary_font: null,
    secondary_font: null,
    body_font: null,
    accent_font: null,
    italic_primary_font: null,
    italic_secondary_font: null,
    italic_body_font: null,
    italic_accent_font: null
  });
  const [loadingFonts, setLoadingFonts] = useState(false);

  useEffect(() => {
    if (open && brandId) {
      fetchBrandFonts();
    }
  }, [open, brandId]);

  const fetchBrandFonts = async () => {
    setLoadingFonts(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('brand')
        .select(`
          primary_font,
          secondary_font,
          body_font,
          accent_font,
          italic_primary_font,
          italic_secondary_font,
          italic_body_font,
          italic_accent_font
        `)
        .eq('id', brandId)
        .single();

      if (error) throw error;
      setBrandFonts(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error fetching brand fonts:', error);
    } finally {
      setLoadingFonts(false);
    }
  };

  const handleFontChange = (fontKey, fontId) => {
    setBrandFonts(prev => ({
      ...prev,
      [fontKey]: fontId
    }));
  };

  const handleConfirm = () => {
    onConfirm(brandFonts);
  };

  const fontConfigs = [
    { 
      key: 'primary_font', 
      italicKey: 'italic_primary_font',
      label: 'Primary', 
      description: 'Headings & branding' 
    },
    { 
      key: 'secondary_font', 
      italicKey: 'italic_secondary_font',
      label: 'Secondary', 
      description: 'Subheadings' 
    },
    { 
      key: 'body_font', 
      italicKey: 'italic_body_font',
      label: 'Body', 
      description: 'Body text & UI' 
    },
    { 
      key: 'accent_font', 
      italicKey: 'italic_accent_font',
      label: 'Accent', 
      description: 'Buttons & emphasis' 
    }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning size={24} color="var(--mui-palette-warning-main)" />
        Regenerate Typography Tokens
      </DialogTitle>
      <DialogContent>
        {/* Font Selection */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextAa size={20} />
            Brand Typography Fonts
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Select your brand fonts before regenerating. All typography tokens will be based on these fonts.
          </Typography>
          
          {loadingFonts ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2">Loading fonts...</Typography>
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {fontConfigs.map(({ key, italicKey, label, description }) => (
                <Grid item xs={12} key={key}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    {label} Font Family
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    {description}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {/* Regular Font */}
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <FontPicker
                          value={brandFonts[key] || ''}
                          onChange={(fontId) => handleFontChange(key, fontId)}
                          label={`${label} Regular`}
                          size="small"
                          record={record}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Regular/Normal weight
                        </Typography>
                      </Box>
                    </Grid>
                    
                    {/* Italic Font */}
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <FontPicker
                          value={brandFonts[italicKey] || ''}
                          onChange={(fontId) => handleFontChange(italicKey, fontId)}
                          label={`${label} Italic`}
                          size="small"
                          record={record}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Italic/Oblique style
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {/* Divider between font families */}
                  {fontConfigs.indexOf(fontConfigs.find(f => f.key === key)) < fontConfigs.length - 1 && (
                    <Divider sx={{ mt: 3 }} />
                  )}
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body1" gutterBottom>
          This will <strong>permanently delete all existing typography tokens</strong> for this brand and generate a new complete set.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          The new tokens will include:
        </Typography>
        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
          <Typography component="li" variant="body2">Base tokens (font sizes, weights, line heights, letter spacing)</Typography>
          <Typography component="li" variant="body2">Font family tokens based on your selected fonts</Typography>
          <Typography component="li" variant="body2">Semantic typography styles (headings, body, buttons, etc.)</Typography>
        </Box>
        <Alert severity="warning" sx={{ mt: 2 }}>
          Any custom modifications to existing tokens will be lost.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          color="warning"
          disabled={loading || loadingFonts}
          startIcon={loading ? <CircularProgress size={16} /> : <ArrowsClockwise size={16} />}
        >
          {loading ? 'Regenerating...' : 'Regenerate Tokens'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main Typography Token Editor component
export const TypographyTokenEditor = ({ record, field, editable = true }) => {
  const [showSemantics, setShowSemantics] = useState(true);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerationDialog, setRegenerationDialog] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    'font-families': true,
    'font-sizes': true,
    'font-weights': false,
    'line-heights': false,
    'letter-spacings': false,
    headings: true,
    body: true,
    display: false,
    buttons: false,
    forms: false,
    captions: false
  });

  const brandId = record?.id;

  useEffect(() => {
    if (!brandId) return;
    loadTypographyTokens();
  }, [brandId]);

  const loadTypographyTokens = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchTypographyTokensByBrandId(brandId);
      setTokens(data);
    } catch (err) {
      setError('Failed to load typography tokens: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const groupTokens = () => {
    const groups = {};
    
    tokens.forEach(token => {
      const groupKey = token.group_name || 'other';
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(token);
    });
    
    return groups;
  };

  const tokenGroups = groupTokens();

  const updateToken = async (updatedToken) => {
    try {
      const savedToken = await updateTypographyToken(updatedToken.id, updatedToken);
      setTokens(tokens.map(t => 
        t.id === updatedToken.id ? savedToken : t
      ));
    } catch (error) {
      console.error('Error updating token:', error);
      throw error;
    }
  };

  const handleRegenerateTokens = async (updatedBrandFonts) => {
    setRegenerating(true);
    setRegenerationDialog(false);
    
    try {
      // Update brand fonts in database first
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('brand')
        .update(updatedBrandFonts)
        .eq('id', brandId);
        
      if (updateError) {
        throw new Error(`Failed to update brand fonts: ${updateError.message}`);
      }
      
      // Then regenerate tokens
      const newTokens = await regenerateAllTypographyTokens(brandId, 25, updatedBrandFonts);
      setTokens(newTokens);
    } catch (error) {
      setError('Failed to regenerate typography tokens: ' + error.message);
    } finally {
      setRegenerating(false);
    }
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  if (!brandId) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        <Typography variant="body2">
          No brand selected. Typography tokens will be available when viewing a specific brand.
        </Typography>
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography>Loading typography tokens...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        <Typography variant="body2" gutterBottom>{error}</Typography>
        <Button variant="outlined" onClick={loadTypographyTokens} size="small">
          Try Again
        </Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ my: 2 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Typography Design Tokens
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tokens.length} tokens • {record?.title || 'Brand'} Design System
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={showSemantics} 
                onChange={(e) => setShowSemantics(e.target.checked)}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {showSemantics ? <Eye size={16} /> : <EyeOff size={16} />}
                <span>Show semantic tokens</span>
              </Box>
            }
          />
          
          {editable && (
            <Button 
              variant="outlined" 
              startIcon={regenerating ? <CircularProgress size={16} /> : <ArrowsClockwise size={16} />}
              onClick={() => setRegenerationDialog(true)}
              size="small"
              disabled={regenerating}
              color="warning"
            >
              {regenerating ? 'Regenerating...' : 'Regenerate All'}
            </Button>
          )}
          
          <IconButton>
            <DownloadSimple size={20} />
          </IconButton>
        </Box>
      </Box>

      {/* Loading overlay for regeneration */}
      {regenerating && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2">
              Regenerating all typography tokens... This may take a moment.
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Token Groups */}
      <Box sx={{ space: 2 }}>
        {Object.entries(tokenGroups)
          .sort(([a], [b]) => {
            const order = ['font-families', 'font-sizes', 'font-weights', 'line-heights', 'letter-spacings', 'display', 'headings', 'body', 'buttons', 'forms', 'captions', 'other'];
            return order.indexOf(a) - order.indexOf(b);
          })
          .map(([groupName, groupTokens]) => (
            <TypographyTokenGroup
              key={groupName}
              title={groupName.replace('-', ' ')}
              tokens={groupTokens}
              onChange={updateToken}
              expanded={expandedGroups[groupName] ?? false}
              onToggle={() => toggleGroup(groupName)}
              showSemantics={showSemantics}
            />
          ))}
      </Box>

      {tokens.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            No typography tokens found for this brand. Generate your first tokens to get started!
          </Typography>
          {editable && (
            <Button 
              variant="outlined" 
              startIcon={<ArrowsClockwise size={16} />}
              onClick={() => setRegenerationDialog(true)}
              size="small"
              sx={{ mt: 1 }}
            >
              Generate Initial Tokens
            </Button>
          )}
        </Alert>
      )}

      {/* Regeneration Dialog */}
      <FontRegenerationDialog 
        open={regenerationDialog}
        onClose={() => setRegenerationDialog(false)}
        onConfirm={handleRegenerateTokens}
        loading={regenerating}
        brandId={brandId}
        record={record}
      />
    </Box>
  );
};

export default TypographyTokenEditor;