// Enhanced BrandBoardPreview.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Divider,
  IconButton,
  Switch,
  Alert,
  CircularProgress,
  Paper,
  Button,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { 
  DownloadSimple,
  ClipboardText,
  Check,
  Sun,
  Moon,
  Palette,
  TextAa,
  Buildings,
  FolderOpen,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/browser';
import { InlineEditableField } from '@/components/fields/InlineEditableField';
import { regenerateAllColorTokens } from '@/components/fields/custom/brand/colors/colorTokenGenerator';

// Helper function to determine if a color is light or dark
const isColorLight = (hexColor) => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

// Fetch color tokens for brand
const fetchColorTokens = async (brandId) => {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('color')
      .select('*')
      .eq('brand_id', brandId)
      .order('group', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching color tokens:', error);
    return [];
  }
};

// Fetch typography tokens for brand
const fetchTypographyTokens = async (brandId) => {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('typography')
      .select('*')
      .eq('brand_id', brandId)
      .order('group_name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching typography tokens:', error);
    return [];
  }
};

// Fetch brand foundation colors
const fetchBrandFoundation = async (brandId) => {
  const supabase = createClient();
  
  try {
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
        alt_color_4,
        alt_color_5
      `)
      .eq('id', brandId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching brand foundation:', error);
    return null;
  }
};

// Fetch company information
const fetchCompanyInfo = async (companyId) => {
  if (!companyId) return null;
  
  const supabase = createClient();
  
  try {
    console.log('[fetchCompanyInfo] Fetching company for ID:', companyId);
    
    const { data, error } = await supabase
      .from('company')
      .select('id, title')
      .eq('id', companyId)
      .single();

    if (error) {
      console.error('[fetchCompanyInfo] Supabase error:', error.message || error);
      // Don't throw on not found, just return null
      if (error.code === 'PGRST116') {
        console.log('[fetchCompanyInfo] Company not found, returning null');
        return null;
      }
      throw error;
    }

    console.log('[fetchCompanyInfo] Found company:', data);
    return data;
  } catch (error) {
    console.error('[fetchCompanyInfo] Error:', error.message || error);
    return null; // Return null instead of throwing to prevent blocking
  }
};

// Fetch projects associated with the brand - Alternative approach
const fetchBrandProjects = async (brandId) => {
  if (!brandId) return [];
  
  const supabase = createClient();
  
  try {
    console.log('[fetchBrandProjects] Fetching projects for brand ID:', brandId);
    
    // First get the brand_project relationships
    const { data: brandProjects, error: brandProjectError } = await supabase
      .from('brand_project')
      .select('project_id')
      .eq('brand_id', brandId);

    if (brandProjectError) {
      console.error('[fetchBrandProjects] Brand project error:', brandProjectError.message || brandProjectError);
      return [];
    }

    console.log('[fetchBrandProjects] Found brand_project records:', brandProjects);
    
    if (!brandProjects || brandProjects.length === 0) {
      console.log('[fetchBrandProjects] No project relationships found');
      return [];
    }

    // Get the project IDs
    const projectIds = brandProjects.map(bp => bp.project_id).filter(Boolean);
    console.log('[fetchBrandProjects] Project IDs:', projectIds);

    if (projectIds.length === 0) {
      return [];
    }

    // Then fetch the actual projects
    const { data: projects, error: projectsError } = await supabase
      .from('project')
      .select('id, title')
      .in('id', projectIds);

    if (projectsError) {
      console.error('[fetchBrandProjects] Projects error:', projectsError.message || projectsError);
      return [];
    }

    console.log('[fetchBrandProjects] Found projects:', projects);
    return projects || [];
  } catch (error) {
    console.error('[fetchBrandProjects] Error:', error.message || error);
    return []; // Return empty array instead of throwing to prevent blocking
  }
};

// Update brand colors
const updateBrandColors = async (brandId, colorUpdates) => {
  const supabase = createClient();
  
  try {
    console.log('[updateBrandColors] Updating colors:', colorUpdates);
    
    const { data, error } = await supabase
      .from('brand')
      .update(colorUpdates)
      .eq('id', brandId)
      .select()
      .single();

    if (error) throw error;
    console.log('[updateBrandColors] Updated successfully:', data);
    return data;
  } catch (error) {
    console.error('[updateBrandColors] Error:', error.message || error);
    throw error;
  }
};

// Foundation Colors Component
const FoundationColors = ({ foundation, onCopy, groupedColors, semanticColors, onColorEdit, editable = true }) => {
  const coreColors = [
    { name: 'Primary', value: foundation?.primary_color, group: 'primary', key: 'primary_color' },
    { name: 'Secondary', value: foundation?.secondary_color, group: 'secondary', key: 'secondary_color' },
    { name: 'Light', value: foundation?.neutral_color_100, group: 'neutral', key: 'neutral_color_100' },
    { name: 'Dark', value: foundation?.neutral_color_900, group: 'neutral', key: 'neutral_color_900' }
  ];

  // Alternative colors - only include those that are not null
  const altColors = [
    { name: 'Alt 1', value: foundation?.alt_color_1, group: 'alt1', key: 'alt_color_1' },
    { name: 'Alt 2', value: foundation?.alt_color_2, group: 'alt2', key: 'alt_color_2' },
    { name: 'Alt 3', value: foundation?.alt_color_3, group: 'alt3', key: 'alt_color_3' },
    { name: 'Alt 4', value: foundation?.alt_color_4, group: 'alt4', key: 'alt_color_4' },
    { name: 'Alt 5', value: foundation?.alt_color_5, group: 'alt5', key: 'alt_color_5' }
  ].filter(color => color.value && color.value !== null);

  const statusColors = [
    { name: 'Success', value: foundation?.success_color, group: 'success', key: 'success_color' },
    { name: 'Error', value: foundation?.error_color, group: 'error', key: 'error_color' },
    { name: 'Warning', value: foundation?.warning_color, group: 'warning', key: 'warning_color' },
    { name: 'Info', value: foundation?.info_color, group: 'info', key: 'info_color' }
  ];

  const ColorGroup = ({ title, colors, showGradients = true, allowEdit = false }) => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" align="center" sx={{ mb: 3, fontWeight: 600, color: semanticColors?.text.primary }}>
        {title}
      </Typography>
      
      {/* Foundation Colors */}
      <Grid container spacing={2} sx={{ mb: showGradients ? 3 : 0 }}>
        {colors.map(({ name, value, group, key }) => (
          value && (
            <Grid item xs={12} sm={6} md={3} key={name}>
              <Paper 
                elevation={3}
                sx={{ 
                  textAlign: 'center', 
                  p: 2, 
                  borderRadius: 3,
                  bgcolor: semanticColors?.background.surface || 'background.paper',
                  border: '1px solid',
                  borderColor: semanticColors?.border.base || 'divider',
                  transition: 'transform 0.2s ease',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: 80,
                    backgroundColor: value,
                    borderRadius: 2,
                    mb: 2,
                    border: '3px solid white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    cursor: 'pointer',
                    position: 'relative',
                    '&:hover': allowEdit && editable ? {
                      '&::after': {
                        content: '"Click to edit"',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        borderRadius: 2
                      }
                    } : {}
                  }}
                  onClick={() => {
                    if (allowEdit && editable && onColorEdit) {
                      onColorEdit(key, value, name);
                    } else {
                      onCopy(value);
                    }
                  }}
                />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: semanticColors?.text.primary }}>
                  {name}
                </Typography>
                <Chip 
                  label={value} 
                  size="small" 
                  sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.7rem',
                    cursor: 'pointer'
                  }}
                  onClick={() => onCopy(value)}
                />
              </Paper>
            </Grid>
          )
        ))}
      </Grid>

      {/* Gradients with Individual Swatches */}
      {showGradients && colors.map(({ group, name }) => {
        const groupColors = groupedColors[group];
        if (!groupColors || groupColors.length === 0) return null;

        const sortedColors = groupColors.sort((a, b) => {
          const aScale = parseInt(a.token.split('.').pop());
          const bScale = parseInt(b.token.split('.').pop());
          return aScale - bScale;
        });

        // Only show neutral gradient once (skip the duplicate)
        if (group === 'neutral' && name === 'Dark') return null;

        return (
          <Box key={group} sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, textTransform: 'capitalize', color: semanticColors?.text.primary }}>
              {group} Scale
            </Typography>
            
            {/* Gradient Bar */}
            <Box
              sx={{
                height: 40,
                borderRadius: 2,
                background: `linear-gradient(to right, ${sortedColors.map(c => c.resolved).join(', ')})`,
                border: '2px solid',
                borderColor: semanticColors?.border.base || 'divider',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                mb: 2
              }}
            />
            
            {/* Individual Color Swatches - Full Width Segments */}
            <Box sx={{ 
              display: 'flex', 
              borderRadius: 2, 
              overflow: 'hidden', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid',
              borderColor: semanticColors?.border.base || 'divider'
            }}>
              {sortedColors.map((color, index) => {
                const scale = color.token.split('.').pop();
                const isLightColor = isColorLight(color.resolved);
                const isLast = index === sortedColors.length - 1;
                
                return (
                  <Box
                    key={color.id}
                    sx={{
                      flex: 1,
                      backgroundColor: color.resolved,
                      p: 1.5,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.1s ease',
                      borderRight: !isLast ? '1px solid rgba(255,255,255,0.3)' : 'none',
                      '&:hover': { 
                        transform: 'scale(1.02)',
                        zIndex: 1,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }
                    }}
                    onClick={() => onCopy(color.resolved)}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 600,
                        color: isLightColor ? '#000' : '#fff',
                        display: 'block',
                        mb: 0.5,
                        '@media print': {
                          color: isLightColor ? '#000 !important' : '#fff !important'
                        }
                      }}
                    >
                      {scale}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                        color: isLightColor ? '#000' : '#fff',
                        '@media print': {
                          color: isLightColor ? '#000 !important' : '#fff !important'
                        }
                      }}
                    >
                      {color.resolved}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        );
      })}
    </Box>
  );

  return (
    <Box sx={{ mb: 6 }}>
      <ColorGroup title="Core Colors" colors={coreColors} allowEdit={true} />
      {altColors.length > 0 && (
        <ColorGroup title="Alternative Colors" colors={altColors} allowEdit={true} />
      )}
      <ColorGroup title="Status Colors" colors={statusColors} allowEdit={true} />
    </Box>
  );
};

// Typography Sample Component
const TypographySample = ({ token, semanticColors }) => {
  const [fontLoaded, setFontLoaded] = useState(false);
  const [fontFamilyName, setFontFamilyName] = useState('');

  useEffect(() => {
    const loadFont = async () => {
      if (token.font_family && token.font_family.includes('"')) {
        const fontName = token.font_family.split('"')[1];
        setFontFamilyName(fontName);
        
        if (fontName && fontName !== 'system-ui' && fontName !== 'sans-serif') {
          try {
            const supabase = createClient();
            const { data } = await supabase
              .from('media')
              .select('url, title')
              .ilike('title', `%${fontName}%`)
              .or('mime_type.ilike.%font%,mime_type.ilike.%woff%');

            if (data && data.length > 0) {
              for (const fontFile of data) {
                try {
                  const fontFace = new FontFace(fontName, `url(${fontFile.url})`);
                  await fontFace.load();
                  document.fonts.add(fontFace);
                } catch (err) {
                  console.log('Font load failed:', err);
                }
              }
              setFontLoaded(true);
            }
          } catch (err) {
            console.log('Font fetch failed:', err);
          }
        } else {
          setFontLoaded(true);
        }
      }
    };

    loadFont();
  }, [token.font_family]);

  const getFontStyle = () => {
    const style = {};
    
    if (token.font_family) style.fontFamily = token.font_family;
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
    
    return style;
  };

  // Helper functions for token resolution
  const getFontSizeValue = (tokenRef) => {
    const sizeMap = {
      'font.size.2xs': '0.75rem', 'font.size.xs': '0.875rem', 'font.size.sm': '1rem',
      'font.size.md': '1.125rem', 'font.size.lg': '1.25rem', 'font.size.xl': '1.5rem',
      'font.size.2xl': '1.875rem', 'font.size.3xl': '2.25rem', 'font.size.4xl': '3rem',
      'font.size.5xl': '3.75rem', 'font.size.6xl': '4.5rem'
    };
    return sizeMap[tokenRef] || '1rem';
  };

  const getFontWeightValue = (tokenRef) => {
    const weightMap = {
      'font.weight.thin': '100', 'font.weight.light': '300', 'font.weight.normal': '400',
      'font.weight.medium': '500', 'font.weight.semibold': '600', 'font.weight.bold': '700',
      'font.weight.extrabold': '800', 'font.weight.black': '900'
    };
    return weightMap[tokenRef] || '400';
  };

  const getLineHeightValue = (tokenRef) => {
    const lineHeightMap = {
      'font.lineHeight.tight': '1.25', 'font.lineHeight.snug': '1.375',
      'font.lineHeight.normal': '1.5', 'font.lineHeight.relaxed': '1.625',
      'font.lineHeight.loose': '2'
    };
    return lineHeightMap[tokenRef] || '1.5';
  };

  const getSampleText = () => {
    if (token.category === 'display') return 'Display Typography';
    if (token.category === 'heading') return 'Heading Text';
    if (token.category === 'body') return 'Body text and content';
    if (token.category === 'ui') return 'UI Element';
    return 'Sample Text';
  };

  const handleDownload = async (style = 'regular') => {
    if (fontFamilyName) {
      const supabase = createClient();
      let query = supabase
        .from('media')
        .select('url, title')
        .ilike('title', `%${fontFamilyName}%`)
        .or('mime_type.ilike.%font%,mime_type.ilike.%woff%');
      
      if (style === 'italic') {
        query = query.ilike('title', '%italic%');
      } else {
        query = query.not('title', 'ilike', '%italic%');
      }
      
      const { data } = await query.limit(1).single();
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      py: 2, 
      px: 3,
      borderBottom: '1px solid', 
      borderColor: semanticColors?.border.base || 'divider'
    }}>
      <Box sx={{ flexGrow: 1 }}>
        <Typography 
          sx={{
            ...getFontStyle(),
            color: semanticColors?.text.primary,
            opacity: fontLoaded ? 1 : 0.7,
            transition: 'opacity 0.3s ease',
            mb: 0.5
          }}
        >
          {getSampleText()}
        </Typography>
        <Typography variant="caption" color={semanticColors?.text.secondary || 'text.secondary'}>
          {token.title} • {fontFamilyName}
        </Typography>
      </Box>
      
      {fontFamilyName && (
        <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
          <Tooltip title="Download Regular">
            <Button 
              size="small" 
              variant="outlined"
              onClick={() => handleDownload('regular')}
              startIcon={<DownloadSimple size={14} />}
              endIcon={<span style={{ fontStyle: 'normal', fontSize: '12px' }}>Aa</span>}
              sx={{ 
                borderColor: semanticColors?.border.base || 'divider',
                color: semanticColors?.text.primary,
                '&:hover': {
                  borderColor: semanticColors?.brand.primary || 'primary.main',
                  backgroundColor: semanticColors?.background.surface || 'action.hover'
                }
              }}
            >
            </Button>
          </Tooltip>
          <Tooltip title="Download Italic">
            <Button 
              size="small" 
              variant="outlined"
              onClick={() => handleDownload('italic')}
              startIcon={<DownloadSimple size={14} />}
              endIcon={<span style={{ fontStyle: 'italic', fontSize: '12px' }}>Aa</span>}
              sx={{ 
                borderColor: semanticColors?.border.base || 'divider',
                color: semanticColors?.text.primary,
                '&:hover': {
                  borderColor: semanticColors?.brand.primary || 'primary.main',
                  backgroundColor: semanticColors?.background.surface || 'action.hover'
                }
              }}
            >
            </Button>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

export const BrandBoardPreview = (props) => {
  const [mode, setMode] = useState('light');
  const [copiedColor, setCopiedColor] = useState(null);
  const [colorTokens, setColorTokens] = useState([]);
  const [typographyTokens, setTypographyTokens] = useState([]);
  const [foundation, setFoundation] = useState(null);
  const [company, setCompany] = useState(null);
  const [projects, setProjects] = useState([]);
  const [brandData, setBrandData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [colorEditDialog, setColorEditDialog] = useState({ open: false, colorKey: '', currentValue: '', colorName: '' });
  const [regeneratingColor, setRegeneratingColor] = useState(false);

  // Handle different ways props might be passed
  const directBrand = props.brand || props.value || props.data;
  const record = props.record || {};
  const editable = props.editable !== false; // Default to true unless explicitly false
  
  // Determine brand data
  let brandToUse = null;
  if (directBrand && directBrand.id) {
    brandToUse = directBrand;
  } else if (record?.brands_details && record.brands_details.length > 0) {
    const primaryBrand = record.brands_details.find(b => b.brand?.status === 'primary');
    brandToUse = primaryBrand?.brand || record.brands_details[0].brand;
  } else if (record?.brands && record.brands.length > 0) {
    const primaryBrand = record.brands.find(b => b.status === 'primary');
    brandToUse = primaryBrand || record.brands[0];
  } else if (record?.id) {
    brandToUse = record;
  }

  const brandId = brandToUse?.id;

  // Get semantic colors based on current mode
  const getSemanticColors = () => {
    if (!colorTokens.length) return null;
    
    const modePrefix = mode === 'light' ? 'lightmode' : 'darkmode';
    
    const findToken = (tokenSuffix) => {
      const token = colorTokens.find(t => t.token === `${modePrefix}.${tokenSuffix}`);
      return token?.resolved || null;
    };

    return {
      text: {
        primary: findToken('color.text.primary') || (mode === 'light' ? '#1a1a1a' : '#ffffff'),
        secondary: findToken('color.text.secondary') || (mode === 'light' ? '#666666' : '#cccccc'),
      },
      background: {
        default: findToken('color.bg.default') || (mode === 'light' ? '#ffffff' : '#1a1a1a'),
        surface: findToken('color.bg.surface') || (mode === 'light' ? '#f8f9fa' : '#2d2d2d'),
      },
      border: {
        base: findToken('color.border.base') || (mode === 'light' ? '#e0e0e0' : '#404040'),
      },
      brand: {
        primary: findToken('color.brand.primary') || foundation?.primary_color || (mode === 'light' ? '#3B82F6' : '#60A5FA'),
      }
    };
  };

  const semanticColors = getSemanticColors();

  useEffect(() => {
    if (!brandId) {
      setLoading(false);
      return;
    }

    const loadBrandData = async () => {
      setLoading(true);
      try {
        // Set initial brand data
        setBrandData(brandToUse);
        console.log('[BrandBoardPreview] Loading data for brand:', { 
          brandId, 
          brandTitle: brandToUse?.title,
          companyId: brandToUse?.company_id 
        });
        
        const [colors, typography, foundationData, companyData, projectsData] = await Promise.all([
          fetchColorTokens(brandId),
          fetchTypographyTokens(brandId),
          fetchBrandFoundation(brandId),
          // Only fetch company if company_id exists and is not null
          brandToUse?.company_id ? fetchCompanyInfo(brandToUse.company_id) : Promise.resolve(null),
          fetchBrandProjects(brandId)
        ]);
        
        console.log('[BrandBoardPreview] Loaded data:', {
          colorsCount: colors?.length || 0,
          typographyCount: typography?.length || 0,
          foundation: !!foundationData,
          company: companyData,
          projectsCount: projectsData?.length || 0
        });
        
        setColorTokens(colors || []);
        setTypographyTokens(typography || []);
        setFoundation(foundationData);
        setCompany(companyData);
        setProjects(projectsData || []);
      } catch (error) {
        console.error('[BrandBoardPreview] Error loading brand data:', error.message || error);
      } finally {
        setLoading(false);
      }
    };

    loadBrandData();
  }, [brandId, brandToUse]);

  // Handle brand title update
  const handleTitleUpdate = async (newTitle) => {
    if (!brandId || !newTitle?.trim()) {
      throw new Error('Brand ID and title are required');
    }
    
    try {
      const updatedBrand = await updateBrandColors(brandId, { title: newTitle.trim() });
      setBrandData(prev => ({ ...prev, title: newTitle.trim() }));
      return updatedBrand;
    } catch (error) {
      console.error('Error updating brand title:', error);
      throw error;
    }
  };

  // Handle color editing
  const handleColorEdit = (colorKey, currentValue, colorName) => {
    if (!editable) return;
    setColorEditDialog({
      open: true,
      colorKey,
      currentValue,
      colorName
    });
  };

  const handleColorSave = async (newColor) => {
    if (!brandId || !colorEditDialog.colorKey) return;
    
    try {
      const updates = { [colorEditDialog.colorKey]: newColor };
      await updateBrandColors(brandId, updates);
      
      // Update local state
      setFoundation(prev => ({ ...prev, [colorEditDialog.colorKey]: newColor }));
      setBrandData(prev => ({ ...prev, [colorEditDialog.colorKey]: newColor }));
      
      setColorEditDialog({ open: false, colorKey: '', currentValue: '', colorName: '' });
    } catch (error) {
      console.error('Error updating color:', error);
    }
  };

  const handleRegenerateColorScale = async () => {
    if (!brandId || !colorEditDialog.colorKey) return;
    
    setRegeneratingColor(true);
    try {
      // Get current foundation colors with the updated color
      const updatedFoundation = {
        ...foundation,
        [colorEditDialog.colorKey]: colorEditDialog.currentValue
      };
      
      // First save the color change
      await updateBrandColors(brandId, { [colorEditDialog.colorKey]: colorEditDialog.currentValue });
      
      // Then regenerate all color tokens with the updated colors
      await regenerateAllColorTokens(brandId, 25, updatedFoundation);
      
      // Update local state
      setFoundation(updatedFoundation);
      setBrandData(prev => ({ ...prev, [colorEditDialog.colorKey]: colorEditDialog.currentValue }));
      
      // Reload color tokens to get the new generated ones
      const newTokens = await fetchColorTokens(brandId);
      setColorTokens(newTokens || []);
      
      setColorEditDialog({ open: false, colorKey: '', currentValue: '', colorName: '' });
    } catch (error) {
      console.error('Error regenerating color scale:', error);
    } finally {
      setRegeneratingColor(false);
    }
  };

  const copyToClipboard = async (color) => {
    await navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  // Group colors by their base type
  const groupedColors = colorTokens.reduce((groups, color) => {
    if (color.type === 'base') {
      const group = color.group || 'other';
      if (!groups[group]) groups[group] = [];
      groups[group].push(color);
    }
    return groups;
  }, {});

  // Filter typography for display
  const semanticTypography = typographyTokens.filter(t => 
    t.type === 'alias' && 
    ['display', 'heading', 'body', 'ui'].includes(t.category)
  );

  // Fallback colors if semantic colors aren't available
  const bgColor = mode === 'light' ? '#ffffff' : '#1a1a1a';
  const textColor = mode === 'light' ? '#000000' : '#ffffff';

  if (!brandId) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        <Typography variant="body2">
          No brand data available to preview.
        </Typography>
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography>Loading brand board...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2 }}>
      {/* Header with Controls */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4} px={1}>
        <Box display="flex" alignItems="center" gap={2}>
          <Switch
            checked={mode === 'light'}
            onChange={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            icon={
              <Box sx={{ 
                bgcolor: 'rgba(255,255,255,0.9)', 
                border: '2px solid rgba(0,0,0,0.1)',
                borderRadius: '50%', 
                width: 24, 
                height: 24, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Moon size={14} color="#424242" />
              </Box>
            }
            checkedIcon={
              <Box sx={{ 
                bgcolor: 'rgba(255,255,255,0.9)', 
                border: '2px solid rgba(255,152,0,0.3)',
                borderRadius: '50%', 
                width: 24, 
                height: 24, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Sun size={14} color="#ff9800" />
              </Box>
            }
            sx={{
              width: 56,
              height: 32,
              '& .MuiSwitch-switchBase': {
                padding: '4px',
                '&.Mui-checked': {
                  color: '#ffa726',
                  '& + .MuiSwitch-track': {
                    backgroundColor: '#ffcc80',
                  }
                },
              },
              '& .MuiSwitch-track': {
                backgroundColor: '#424242',
                borderRadius: 16,
              }
            }}
          />
          <Typography variant="body2" color={semanticColors?.text.secondary || 'text.secondary'}>
            {mode === 'light' ? 'Light' : 'Dark'} Mode
          </Typography>
        </Box>

        <IconButton
          onClick={() => window.print()}
          title="Print Brand Board"
          sx={{ color: semanticColors?.text.primary || 'text.primary' }}
        >
          <DownloadSimple />
        </IconButton>
      </Box>

      {/* Brand Board Content */}
      <Box
        sx={{
          backgroundColor: semanticColors?.background.default || bgColor,
          color: semanticColors?.text.primary || textColor,
          borderRadius: 3,
          p: 4,
          border: '1px solid',
          borderColor: semanticColors?.border.base || 'divider',
          transition: 'all 0.3s ease',
          '@media print': {
            backgroundColor: '#ffffff !important',
            color: '#000000 !important',
            border: 'none !important'
          }
        }}
      >
        {/* Brand Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          {/* Company Information - Above Title */}
          {company?.title && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 1, 
              mb: 2,
              color: semanticColors?.text.secondary || 'text.secondary'
            }}>
              <Buildings size={18} />
              <Typography variant="h6" sx={{ color: 'inherit' }}>
                {company.title}
              </Typography>
            </Box>
          )}

          {/* Brand Title with Inline Editing */}
          <InlineEditableField
            value={brandData?.title || brandToUse?.title || 'Brand Board'}
            onChange={handleTitleUpdate}
            variant="h3"
            sx={{
              fontWeight: 700,
              color: semanticColors?.brand.primary || foundation?.primary_color || semanticColors?.text.primary,
              mb: 3,
              textAlign: 'center',
              '& .MuiTypography-root': {
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
              }
            }}
          />

          {/* Projects Information - Below Title */}
          {projects && projects.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 1, 
              flexWrap: 'wrap',
              color: semanticColors?.text.secondary || 'text.secondary'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FolderOpen size={16} />
                <Typography variant="body2" sx={{ color: 'inherit' }}>
                  {projects.length === 1 ? 'Project:' : 'Projects:'}
                </Typography>
              </Box>
              {projects.filter(project => project?.id && project?.title).map((project, index) => (
                <Box key={project.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip
                    label={project.title}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: semanticColors?.border.base || 'divider',
                      color: semanticColors?.text.secondary,
                      '&:hover': {
                        backgroundColor: semanticColors?.background.surface || 'action.hover'
                      }
                    }}
                  />
                  {index < projects.filter(p => p?.id && p?.title).length - 1 && (
                    <Typography variant="body2" sx={{ mx: 1, color: 'inherit' }}>•</Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Foundation Colors with Gradients */}
        {foundation && (
          <FoundationColors 
            foundation={foundation} 
            onCopy={copyToClipboard}
            groupedColors={groupedColors}
            semanticColors={semanticColors}
            onColorEdit={handleColorEdit}
            editable={editable}
          />
        )}

        {/* Typography */}
        {semanticTypography.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <TextAa size={24} color={semanticColors?.brand.primary || foundation?.primary_color || semanticColors?.text.primary} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: semanticColors?.text.primary }}>
                Typography
              </Typography>
            </Box>
            <Paper sx={{ 
              borderRadius: 3, 
              overflow: 'hidden',
              bgcolor: semanticColors?.background.surface || 'background.paper',
              border: '1px solid',
              borderColor: semanticColors?.border.base || 'divider'
            }}>
              {semanticTypography
                .sort((a, b) => {
                  const order = ['display', 'heading', 'body', 'ui'];
                  return order.indexOf(a.category) - order.indexOf(b.category);
                })
                .map((token, index) => (
                  <TypographySample key={token.id} token={token} semanticColors={semanticColors} />
                ))}
            </Paper>
          </Box>
        )}

        {/* Copy Feedback */}
        {copiedColor && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              bgcolor: 'success.main',
              color: 'white',
              px: 2,
              py: 1,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              zIndex: 1000
            }}
          >
            <Check size={16} />
            <Typography variant="body2">
              Copied {copiedColor}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Color Edit Dialog */}
      <Dialog 
        open={colorEditDialog.open} 
        onClose={() => setColorEditDialog({ open: false, colorKey: '', currentValue: '', colorName: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit {colorEditDialog.colorName} Color
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Color Preview */}
            <Box
              sx={{
                width: '100%',
                height: 100,
                backgroundColor: colorEditDialog.currentValue,
                borderRadius: 2,
                border: '2px solid',
                borderColor: 'divider',
                mb: 2
              }}
            />
            
            {/* Color Input */}
            <TextField
              type="color"
              label="Color"
              value={colorEditDialog.currentValue}
              onChange={(e) => setColorEditDialog(prev => ({ ...prev, currentValue: e.target.value }))}
              fullWidth
              sx={{ mb: 1 }}
            />
            
            {/* Hex Input */}
            <TextField
              label="Hex Value"
              value={colorEditDialog.currentValue}
              onChange={(e) => setColorEditDialog(prev => ({ ...prev, currentValue: e.target.value }))}
              fullWidth
              placeholder="#000000"
            />

            {/* Regenerate Explanation */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Save Color Only:</strong> Updates just this base color<br/>
                <strong>Save & Regenerate Scale:</strong> Updates this color and regenerates all 100-900 scale variations plus related tokens
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setColorEditDialog({ open: false, colorKey: '', currentValue: '', colorName: '' })}
            disabled={regeneratingColor}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleColorSave(colorEditDialog.currentValue)}
            variant="outlined"
            disabled={!colorEditDialog.currentValue || regeneratingColor}
          >
            Save Color Only
          </Button>
          <Button 
            onClick={handleRegenerateColorScale}
            variant="contained"
            disabled={!colorEditDialog.currentValue || regeneratingColor}
            startIcon={regeneratingColor ? <CircularProgress size={16} /> : <ArrowsClockwise size={16} />}
          >
            {regeneratingColor ? 'Regenerating...' : 'Save & Regenerate Scale'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BrandBoardPreview;