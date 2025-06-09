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
  DialogActions
} from '@mui/material';
import {
  Palette,
  CaretDown,
  Plus,
  Copy,
  Check,
  PencilSimple,
  DownloadSimple,
  Eye,
  EyeOff,
  Link,
  Tag,
  Sun,
  Moon,
  ArrowsClockwise,
  Warning
} from '@phosphor-icons/react';
import { InlineEditableField } from '@/components/fields/InlineEditableField';
import { regenerateAllColorTokens } from '@/components/fields/custom/brand/colors/colorTokenGenerator'; // Import the generator

/**
 * Fetch color tokens for a specific brand
 */
const fetchColorTokensByBrandId = async (brandId) => {
  const supabase = createClient();
  
  try {
    console.log('[fetchColorTokensByBrandId] Fetching colors for brand:', brandId);
    
    const { data, error } = await supabase
      .from('color')
      .select(`
        id,
        title,
        token,
        description,
        value,
        resolved,
        mode,
        group,
        type,
        brand_id,
        author_id,
        created_at,
        updated_at,
        parent_id
      `)
      .eq('brand_id', brandId)
      .order('group', { ascending: true });

    if (error) {
      console.error('[fetchColorTokensByBrandId] Supabase error:', error);
      throw error;
    }

    console.log('[fetchColorTokensByBrandId] Found color tokens:', data?.length || 0);
    return data || [];
    
  } catch (error) {
    console.error('[fetchColorTokensByBrandId] Error:', error);
    throw error;
  }
};

/**
 * Update a color token
 */
const updateColorToken = async (colorId, updates) => {
  const supabase = createClient();
  
  try {
    console.log('[updateColorToken] Updating color:', { colorId, updates });
    
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('color')
      .update(updateData)
      .eq('id', colorId)
      .select()
      .single();

    if (error) {
      console.error('[updateColorToken] Supabase error:', error);
      throw error;
    }

    console.log('[updateColorToken] Color updated:', data);
    return data;
    
  } catch (error) {
    console.error('[updateColorToken] Error:', error);
    throw error;
  }
};

/**
 * Create a new color token
 */
const createColorToken = async (brandId, tokenData, authorId) => {
  const supabase = createClient();
  
  try {
    console.log('[createColorToken] Creating color:', { brandId, tokenData, authorId });
    
    const newTokenData = {
      ...tokenData,
      brand_id: brandId,
      author_id: authorId || 25, // Fallback author ID
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('[createColorToken] Insert data:', newTokenData);

    const { data, error } = await supabase
      .from('color')
      .insert(newTokenData)
      .select()
      .single();

    if (error) {
      console.error('[createColorToken] Supabase error:', error);
      console.error('[createColorToken] Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to create color token: ${error.message || 'Unknown error'}`);
    }

    console.log('[createColorToken] Color created:', data);
    return data;
    
  } catch (error) {
    console.error('[createColorToken] Error:', error);
    throw error;
  }
};

// Color token card component
const ColorTokenCard = ({ token, onChange }) => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(token.resolved);

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleColorSave = async () => {
    try {
      await onChange({ ...token, value: tempColor, resolved: tempColor });
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving color:', error);
    }
  };

  const handleFieldSave = async (field, value) => {
    try {
      await onChange({ ...token, [field]: value });
    } catch (error) {
      console.error('Error saving field:', error);
      throw error;
    }
  };

  // Fix: Ensure we're checking the type correctly
  const isAlias = token.type === 'alias';
  const isLight = token.mode === 'lightmode';
  const isDark = token.mode === 'darkmode';

  // Debug logging
  console.log('[ColorTokenCard] Token:', token.token, 'Type:', token.type, 'IsAlias:', isAlias);

  return (
    <Paper sx={{ p: 3, position: 'relative', overflow: 'visible', boxShadow: 5, }}>
      {/* Color Swatch */}
      <Box
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          boxShadow: 5,
          width: '100%',
          height: 80,
          backgroundColor: token.resolved,
          borderRadius: 2,
          cursor: 'pointer',
          mb: 2,
          border: '2px solid',
          borderColor: 'divider',
          transition: 'all 0.2s ease',
          position: 'relative',
          '&:hover': {
            borderColor: 'primary.main',
            transform: 'scale(1.02)'
          }
        }}
      >
        {/* Mode indicator - Only show for alias tokens */}
        {isAlias && (isDark || isLight) && (
          <Box sx={{ position: 'absolute', top: -8, right: -8 }}>
            {isDark ? (
              <Box sx={{ 
                color: 'primary.main', 
                bgcolor: 'background.paper', 
                borderRadius: '50%', 
                p: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 1
              }}>
                <Moon size={16} />
              </Box>
            ) : isLight ? (
              <Box sx={{ 
                color: 'warning.main', 
                bgcolor: 'background.paper', 
                borderRadius: '50%', 
                p: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 1
              }}>
                <Sun size={16} />
              </Box>
            ) : null}
          </Box>
        )}
      </Box>

      {/* Token Info */}
      <Box sx={{ mb: 2 }}>
        <InlineEditableField
          value={token.title}
          onChange={(value) => handleFieldSave('title', value)}
          variant="subtitle2"
          sx={{ fontWeight: 600, mb: 1 }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {/* Fixed: Show correct icon based on token type */}
          {isAlias ? (
            <Link size={14} color="var(--mui-palette-primary-main)" />
          ) : (
            <Tag size={14} color="var(--mui-palette-secondary-main)" />
          )}
          <InlineEditableField
            value={token.token}
            onChange={(value) => handleFieldSave('token', value)}
            variant="caption"
            sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
          />
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

        {/* Values */}
        <Box sx={{ space: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">Value:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                {isAlias ? token.value : token.resolved}
              </Typography>
              <IconButton size="small" onClick={() => copyToClipboard(isAlias ? token.value : token.resolved)}>
                {copied ? <Check size={12} color="green" /> : <Copy size={12} />}
              </IconButton>
            </Box>
          </Box>

          {isAlias && token.resolved !== token.value && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">Resolved:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{token.resolved}</Typography>
                <IconButton size="small" onClick={() => copyToClipboard(token.resolved)}>
                  {copied ? <Check size={12} color="green" /> : <Copy size={12} />}
                </IconButton>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Type badge */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip 
          size="small" 
          label={isAlias ? 'Alias' : 'Base'} 
          color={isAlias ? 'primary' : 'secondary'}
          variant="outlined"
        />
        {token.group && (
          <Chip size="small" label={token.group} variant="filled" />
        )}
      </Box>

      {/* Color picker popover */}
      {isOpen && (
        <Box
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            mt: 1,
            p: 2,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            boxShadow: 3
          }}
        >
          <Typography variant="subtitle2" gutterBottom>Edit Color</Typography>
          <TextField
            type="color"
            value={tempColor}
            onChange={(e) => setTempColor(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Hex Value"
            value={tempColor}
            onChange={(e) => setTempColor(e.target.value)}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={handleColorSave} size="small">
              Save
            </Button>
            <Button variant="outlined" onClick={() => setIsOpen(false)} size="small">
              Cancel
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

// Token group component with proper sorting
const TokenGroup = ({ title, tokens, onChange, expanded, onToggle, showAliases }) => {
  const baseTokens = tokens.filter(t => t.type === 'base');
  const aliasTokens = tokens.filter(t => t.type === 'alias');
  
  // Sort base tokens by scale (100, 200, 300, etc.)
  const sortedBaseTokens = baseTokens.sort((a, b) => {
    // Extract the scale number from token names like "primary.500"
    const getScale = (token) => {
      const parts = token.token.split('.');
      const lastPart = parts[parts.length - 1];
      const scale = parseInt(lastPart, 10);
      return isNaN(scale) ? 0 : scale;
    };
    
    return getScale(a) - getScale(b);
  });
  
  // Sort alias tokens alphabetically by token name for consistent ordering
  const sortedAliasTokens = aliasTokens.sort((a, b) => {
    return a.token.localeCompare(b.token);
  });
  
  const displayTokens = showAliases ? [...sortedBaseTokens, ...sortedAliasTokens] : sortedBaseTokens;

  return (
    <Accordion expanded={expanded} onChange={onToggle}>
      <AccordionSummary expandIcon={<CaretDown />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Palette size={20} color="var(--mui-palette-primary-main)" />
          <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
            {title}
          </Typography>
          <Chip 
            size="small" 
            label={`${sortedBaseTokens.length} base${showAliases ? `, ${sortedAliasTokens.length} alias` : ''}`}
          />
        </Box>
      </AccordionSummary>
      
      <AccordionDetails>
        <Grid container spacing={2}>
          {displayTokens.map((token) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={token.id}>
              <ColorTokenCard
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

// Regeneration confirmation dialog
const RegenerationDialog = ({ open, onClose, onConfirm, loading, brandId }) => {
  const [brandColors, setBrandColors] = useState({
    primary_color: '#3B82F6',
    secondary_color: '#8B5CF6',
    neutral_color_100: '#F3F4F6',
    neutral_color_900: '#111827',
    success_color: '#10B981',
    error_color: '#EF4444',
    warning_color: '#F59E0B',
    info_color: '#3B82F6',
    alt_color_1: null,
    alt_color_2: null,
    alt_color_3: null,
    alt_color_4: null
  });
  const [loadingColors, setLoadingColors] = useState(false);

  // Fetch brand colors when dialog opens
  useEffect(() => {
    if (open && brandId) {
      fetchBrandColors();
    }
  }, [open, brandId]);

  const fetchBrandColors = async () => {
    setLoadingColors(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('brand')
        .select(`
          primary_color,
          secondary_color,
          neutral_color_100,
          neutral_color_900,
          success_color,
          error_color,
          warning_color,
          info_color,
          alt_color_1,
          alt_color_2,
          alt_color_3,
          alt_color_4
        `)
        .eq('id', brandId)
        .single();

      if (error) throw error;
      
      // Update with fetched colors, keeping defaults for missing values
      setBrandColors(prev => ({
        ...prev,
        ...data
      }));
    } catch (error) {
      console.error('Error fetching brand colors:', error);
    } finally {
      setLoadingColors(false);
    }
  };

  const handleColorChange = (colorKey, value) => {
    setBrandColors(prev => ({
      ...prev,
      [colorKey]: value
    }));
  };

  const handleConfirm = () => {
    onConfirm(brandColors);
  };

  const coreColorConfigs = [
    { key: 'primary_color', label: 'Primary', description: 'Main brand color' },
    { key: 'secondary_color', label: 'Secondary', description: 'Supporting brand color' },
    { key: 'neutral_color_100', label: 'Neutral Light', description: 'Light neutral (backgrounds)' },
    { key: 'neutral_color_900', label: 'Neutral Dark', description: 'Dark neutral (text)' },
    { key: 'success_color', label: 'Success', description: 'Success/positive actions' },
    { key: 'error_color', label: 'Error', description: 'Error/destructive actions' },
    { key: 'warning_color', label: 'Warning', description: 'Warning/caution' },
    { key: 'info_color', label: 'Info', description: 'Informational' }
  ];

  const altColorConfigs = [
    { key: 'alt_color_1', label: 'Alt 1', description: 'Alternative color 1' },
    { key: 'alt_color_2', label: 'Alt 2', description: 'Alternative color 2' },
    { key: 'alt_color_3', label: 'Alt 3', description: 'Alternative color 3' },
    { key: 'alt_color_4', label: 'Alt 4', description: 'Alternative color 4' }
  ];

  // Filter alt colors to only show ones with values or recently edited ones
  const visibleAltColors = altColorConfigs.filter(config => 
    brandColors[config.key] !== null && brandColors[config.key] !== undefined
  );

  const addAltColor = () => {
    // Find the first null alt color and give it a default value
    for (const config of altColorConfigs) {
      if (!brandColors[config.key]) {
        handleColorChange(config.key, '#6366F1');
        break;
      }
    }
  };

  const removeAltColor = (colorKey) => {
    handleColorChange(colorKey, null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning size={24} color="var(--mui-palette-warning-main)" />
        Regenerate All Color Tokens
      </DialogTitle>
      <DialogContent>
        {/* Brand Color Pickers */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Palette size={20} />
            Brand Foundation Colors
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Adjust your brand colors before regenerating. All tokens will be based on these colors.
          </Typography>
          
          {loadingColors ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2">Loading colors...</Typography>
            </Box>
          ) : (
            <>
              {/* Core Colors */}
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                Core Colors
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {coreColorConfigs.map(({ key, label, description }) => (
                  <Grid item xs={6} sm={3} key={key}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" display="block" gutterBottom>
                        {label}
                      </Typography>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          backgroundColor: brandColors[key],
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: 'divider',
                          mx: 'auto',
                          mb: 1,
                          cursor: 'pointer',
                          transition: 'transform 0.1s ease',
                          '&:hover': {
                            transform: 'scale(1.05)'
                          }
                        }}
                      />
                      <TextField
                        type="color"
                        value={brandColors[key]}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        size="small"
                        sx={{ 
                          width: 60,
                          '& input': { 
                            height: 20, 
                            padding: 0,
                            border: 'none',
                            cursor: 'pointer'
                          }
                        }}
                      />
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.7rem' }}>
                        {description}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* Alternative Colors */}
              {(visibleAltColors.length > 0 || altColorConfigs.some(config => brandColors[config.key])) && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Alternative Colors
                    </Typography>
                    {visibleAltColors.length < 4 && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Plus size={14} />}
                        onClick={addAltColor}
                      >
                        Add Color
                      </Button>
                    )}
                  </Box>
                  <Grid container spacing={2}>
                    {altColorConfigs.map(({ key, label, description }) => {
                      if (!brandColors[key]) return null;
                      
                      return (
                        <Grid item xs={6} sm={4} md={3} key={key}>
                          <Box sx={{ textAlign: 'center', position: 'relative' }}>
                            <Typography variant="caption" display="block" gutterBottom>
                              {label}
                            </Typography>
                            <Box
                              sx={{
                                width: 50,
                                height: 50,
                                backgroundColor: brandColors[key],
                                borderRadius: 2,
                                border: '2px solid',
                                borderColor: 'divider',
                                mx: 'auto',
                                mb: 1,
                                cursor: 'pointer',
                                transition: 'transform 0.1s ease',
                                '&:hover': {
                                  transform: 'scale(1.05)'
                                }
                              }}
                            />
                            <TextField
                              type="color"
                              value={brandColors[key]}
                              onChange={(e) => handleColorChange(key, e.target.value)}
                              size="small"
                              sx={{ 
                                width: 50,
                                '& input': { 
                                  height: 16, 
                                  padding: 0,
                                  border: 'none',
                                  cursor: 'pointer'
                                }
                              }}
                            />
                            <Button
                              size="small"
                              color="error"
                              onClick={() => removeAltColor(key)}
                              sx={{ mt: 0.5, fontSize: '0.7rem', minWidth: 'auto', px: 1 }}
                            >
                              Remove
                            </Button>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </>
              )}
            </>
          )}
        </Paper>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body1" gutterBottom>
          This will <strong>permanently delete all existing color tokens</strong> for this brand and generate a new complete set based on the colors above.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          The new tokens will include:
        </Typography>
        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
          <Typography component="li" variant="body2">Base color tokens (scales 100-900) for all color types</Typography>
          <Typography component="li" variant="body2">Semantic alias tokens for text, backgrounds, buttons, etc.</Typography>
          <Typography component="li" variant="body2">Light mode and dark mode variations</Typography>
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
          disabled={loading || loadingColors}
          startIcon={loading ? <CircularProgress size={16} /> : <ArrowsClockwise size={16} />}
        >
          {loading ? 'Regenerating...' : 'Regenerate Tokens'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main Color Token Editor component
export const ColorTokenEditor = ({ record, field, editable = true }) => {
  const [showAliases, setShowAliases] = useState(true);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerationDialog, setRegenerationDialog] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    primary: true,
    secondary: true,
    neutral: true,
    alt1: false,
    alt2: false,
    alt3: false,
    alt4: false,
    success: false,
    error: false,
    warning: false,
    info: false,
    text: false,
    background: false,
    button: false
  });

  const brandId = record?.id;

  // Load color tokens when component mounts
  useEffect(() => {
    if (!brandId) return;
    loadColorTokens();
  }, [brandId]);

  const loadColorTokens = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[ColorTokenEditor] Loading color tokens for brand:', brandId);
      const data = await fetchColorTokensByBrandId(brandId);
      setTokens(data);
      console.log('[ColorTokenEditor] Loaded tokens:', data.length);
    } catch (err) {
      console.error('[ColorTokenEditor] Error loading tokens:', err);
      setError('Failed to load color tokens: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Group tokens by their group or by semantic category for aliases
  const groupTokens = () => {
    const groups = {};
    
    tokens.forEach(token => {
      let groupKey = token.group || 'other';
      
      // For alias tokens, group by semantic meaning
      if (token.type === 'alias') {
        if (token.token.includes('.text.')) groupKey = 'text';
        else if (token.token.includes('.bg.')) groupKey = 'background';
        else if (token.token.includes('.button.')) groupKey = 'button';
        else if (token.token.includes('.border.')) groupKey = 'border';
        else if (token.token.includes('.status.')) groupKey = 'status';
        else if (token.token.includes('.brand.')) groupKey = 'brand';
        else if (token.token.includes('.link')) groupKey = 'link';
        else groupKey = 'semantic';
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(token);
    });
    
    return groups;
  };

  const tokenGroups = groupTokens();

  const updateToken = async (updatedToken) => {
    try {
      const savedToken = await updateColorToken(updatedToken.id, updatedToken);
      setTokens(tokens.map(t => 
        t.id === updatedToken.id ? savedToken : t
      ));
    } catch (error) {
      console.error('Error updating token:', error);
      throw error;
    }
  };

  const addNewToken = async () => {
    try {
      const newToken = await createColorToken(brandId, {
        title: 'New Color',
        token: 'new.color',
        description: 'New color token',
        value: '#333333',
        resolved: '#333333',
        mode: 'base',
        group: 'neutral',
        type: 'base'
      }, 25); // You'd get author ID from your auth context
      
      setTokens([...tokens, newToken]);
    } catch (error) {
      console.error('Error creating token:', error);
    }
  };

  const handleRegenerateTokens = async (updatedBrandColors) => {
    setRegenerating(true);
    setRegenerationDialog(false);
    
    try {
      console.log('[ColorTokenEditor] Starting token regeneration for brand:', brandId);
      console.log('[ColorTokenEditor] Using brand colors:', updatedBrandColors);
      
      // First update the brand colors in the database
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('brand')
        .update(updatedBrandColors)
        .eq('id', brandId);
        
      if (updateError) {
        throw new Error(`Failed to update brand colors: ${updateError.message}`);
      }
      
      // Then regenerate tokens with the new colors
      const newTokens = await regenerateAllColorTokens(brandId, 25, updatedBrandColors); // Pass the updated colors
      setTokens(newTokens);
      console.log('[ColorTokenEditor] Token regeneration completed successfully');
    } catch (error) {
      console.error('[ColorTokenEditor] Error regenerating tokens:', error);
      setError('Failed to regenerate color tokens: ' + error.message);
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
          No brand selected. Color tokens will be available when viewing a specific brand.
        </Typography>
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography>Loading color tokens...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        <Typography variant="body2" gutterBottom>{error}</Typography>
        <Button variant="outlined" onClick={loadColorTokens} size="small">
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
            Color Design Tokens
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tokens.length} tokens • {record?.title || 'Brand'} Design System
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={showAliases} 
                onChange={(e) => setShowAliases(e.target.checked)}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {showAliases ? <Eye size={16} /> : <EyeOff size={16} />}
                <span>Show alias tokens</span>
              </Box>
            }
          />
          
          {editable && (
            <>
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
              
              <Button 
                variant="contained" 
                startIcon={<Plus size={16} />}
                onClick={addNewToken}
                size="small"
              >
                Add Token
              </Button>
            </>
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
              Regenerating all color tokens... This may take a moment.
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Token Groups */}
      <Box sx={{ space: 2 }}>
        {Object.entries(tokenGroups)
          .sort(([a], [b]) => {
            const order = ['primary', 'secondary', 'neutral', 'alt1', 'alt2', 'alt3', 'alt4', 'success', 'error', 'warning', 'info', 'text', 'background', 'button', 'border', 'status', 'brand', 'link', 'semantic', 'other'];
            return order.indexOf(a) - order.indexOf(b);
          })
          .map(([groupName, groupTokens]) => (
            <TokenGroup
              key={groupName}
              title={groupName}
              tokens={groupTokens}
              onChange={updateToken}
              expanded={expandedGroups[groupName] ?? false}
              onToggle={() => toggleGroup(groupName)}
              showAliases={showAliases}
            />
          ))}
      </Box>

      {tokens.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            No color tokens found for this brand. Create your first token to get started!
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

      {/* Footer info */}
      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Token Types</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tag size={16} color="var(--mui-palette-secondary-main)" />
              <Typography variant="body2">
                <strong>Base tokens:</strong> Foundation colors that don't change
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Link size={16} color="var(--mui-palette-primary-main)" />
              <Typography variant="body2">
                <strong>Alias tokens:</strong> Semantic references to base tokens
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Sun size={16} color="var(--mui-palette-warning-main)" />
              <Typography variant="body2">
                <strong>Light mode:</strong> Colors for light theme
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Moon size={16} color="var(--mui-palette-primary-main)" />
              <Typography variant="body2">
                <strong>Dark mode:</strong> Colors for dark theme
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Regeneration Dialog */}
      <RegenerationDialog 
        open={regenerationDialog}
        onClose={() => setRegenerationDialog(false)}
        onConfirm={handleRegenerateTokens}
        loading={regenerating}
        brandId={brandId}
      />
    </Box>
  );
};

export default ColorTokenEditor;