// BrandBoardContent.jsx - Complete working version with all functions properly defined
import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  Autocomplete
} from '@mui/material';
import { 
  DownloadSimple,
  Check,
  TextAa,
  Buildings,
  FolderOpen,
  ArrowsClockwise,
  Plus
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/browser';
import { InlineEditableField } from '@/components/fields/InlineEditableField';
import { regenerateAllColorTokens } from '@/components/fields/custom/brand/colors/colorTokenGenerator';

// Helper function to determine if a color is light or dark
const isColorLight = (hexColor) => {
  if (!hexColor) return true;
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

// Foundation Colors Component
const FoundationColors = ({ foundation, onCopy, groupedColors, semanticColors, onColorEdit, onAddAltColor, editable = true }) => {
  const coreColors = [
    { name: 'Primary', value: foundation?.primary_color, group: 'primary', key: 'primary_color' },
    { name: 'Secondary', value: foundation?.secondary_color, group: 'secondary', key: 'secondary_color' },
    { name: 'Light', value: foundation?.neutral_color_100, group: 'neutral', key: 'neutral_color_100' },
    { name: 'Dark', value: foundation?.neutral_color_900, group: 'neutral', key: 'neutral_color_900' }
  ];

  const altColorSlots = [
    { name: 'Alt 1', value: foundation?.alt_color_1, group: 'alt1', key: 'alt_color_1', slotNumber: 1 },
    { name: 'Alt 2', value: foundation?.alt_color_2, group: 'alt2', key: 'alt_color_2', slotNumber: 2 },
    { name: 'Alt 3', value: foundation?.alt_color_3, group: 'alt3', key: 'alt_color_3', slotNumber: 3 },
    { name: 'Alt 4', value: foundation?.alt_color_4, group: 'alt4', key: 'alt_color_4', slotNumber: 4 }
  ];

  const statusColors = [
    { name: 'Success', value: foundation?.success_color, group: 'success', key: 'success_color' },
    { name: 'Error', value: foundation?.error_color, group: 'error', key: 'error_color' },
    { name: 'Warning', value: foundation?.warning_color, group: 'warning', key: 'warning_color' },
    { name: 'Info', value: foundation?.info_color, group: 'info', key: 'info_color' }
  ];

  const ColorGroup = ({ title, colors, showGradients = true, allowEdit = false, isAltGroup = false }) => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" align="center" sx={{ mb: 3, fontWeight: 600, color: semanticColors?.text.primary }}>
        {title}
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: showGradients ? 3 : 0 }}>
        {isAltGroup ? (
          altColorSlots.map(({ name, value, group, key, slotNumber }) => (
            <Grid item xs={12} sm={6} md={3} key={key}>
              {value ? (
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
              ) : (
                <Paper 
                  elevation={1}
                  sx={{ 
                    textAlign: 'center', 
                    p: 2, 
                    borderRadius: 3,
                    bgcolor: 'transparent',
                    border: '2px dashed',
                    borderColor: semanticColors?.border.base || 'divider',
                    transition: 'all 0.2s ease',
                    cursor: editable ? 'pointer' : 'default',
                    '&:hover': editable ? { 
                      borderColor: semanticColors?.brand.primary || 'primary.main',
                      bgcolor: semanticColors?.background.surface || 'action.hover',
                      transform: 'translateY(-4px)'
                    } : {}
                  }}
                  onClick={() => editable && onAddAltColor && onAddAltColor(key)}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: 80,
                      borderRadius: 2,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed',
                      borderColor: semanticColors?.border.base || 'divider',
                      color: semanticColors?.text.secondary || 'text.secondary',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Plus size={32} />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: semanticColors?.text.secondary }}>
                    {name}
                  </Typography>
                  <Chip 
                    label="Click to add" 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      fontSize: '0.7rem',
                      borderColor: semanticColors?.border.base || 'divider',
                      color: semanticColors?.text.secondary
                    }}
                  />
                </Paper>
              )}
            </Grid>
          ))
        ) : (
          colors.map(({ name, value, group, key }) => (
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
          ))
        )}
      </Grid>

      {/* Gradients */}
      {showGradients && (
        isAltGroup ? (
          altColorSlots.map(({ group, name, value }) => {
            if (!value) return null;
            
            const groupColors = groupedColors[group];
            if (!groupColors || groupColors.length === 0) return null;

            const sortedColors = groupColors.sort((a, b) => {
              const aScale = parseInt(a.token?.split('.').pop() || '0');
              const bScale = parseInt(b.token?.split('.').pop() || '0');
              return aScale - bScale;
            });

            return (
              <Box key={group} sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, textTransform: 'capitalize', color: semanticColors?.text.primary }}>
                  {group} Scale
                </Typography>
                
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
                
                <Box sx={{ 
                  display: 'flex', 
                  borderRadius: 2, 
                  overflow: 'hidden', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid',
                  borderColor: semanticColors?.border.base || 'divider'
                }}>
                  {sortedColors.map((color, index) => {
                    const scale = color.token?.split('.').pop() || '';
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
                            mb: 0.5
                          }}
                        >
                          {scale}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontFamily: 'monospace',
                            fontSize: '0.7rem',
                            color: isLightColor ? '#000' : '#fff'
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
          })
        ) : (
          colors.map(({ group, name }) => {
            const groupColors = groupedColors[group];
            if (!groupColors || groupColors.length === 0) return null;

            const sortedColors = groupColors.sort((a, b) => {
              const aScale = parseInt(a.token?.split('.').pop() || '0');
              const bScale = parseInt(b.token?.split('.').pop() || '0');
              return aScale - bScale;
            });

            if (group === 'neutral' && name === 'Dark') return null;

            return (
              <Box key={group} sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, textTransform: 'capitalize', color: semanticColors?.text.primary }}>
                  {group} Scale
                </Typography>
                
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
                
                <Box sx={{ 
                  display: 'flex', 
                  borderRadius: 2, 
                  overflow: 'hidden', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid',
                  borderColor: semanticColors?.border.base || 'divider'
                }}>
                  {sortedColors.map((color, index) => {
                    const scale = color.token?.split('.').pop() || '';
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
                            mb: 0.5
                          }}
                        >
                          {scale}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontFamily: 'monospace',
                            fontSize: '0.7rem',
                            color: isLightColor ? '#000' : '#fff'
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
          })
        )
      )}
    </Box>
  );

  return (
    <Box sx={{ mb: 6 }}>
      <ColorGroup title="Core Colors" colors={coreColors} allowEdit={true} />
      <ColorGroup title="Alternative Colors" colors={[]} allowEdit={true} isAltGroup={true} />
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
      style.fontSize = token.font_size.startsWith?.('font.size.') 
        ? getFontSizeValue(token.font_size)
        : token.font_size;
    }
    if (token.font_weight) {
      style.fontWeight = token.font_weight.startsWith?.('font.weight.') 
        ? getFontWeightValue(token.font_weight)
        : token.font_weight;
    }
    if (token.line_height) {
      style.lineHeight = token.line_height.startsWith?.('font.lineHeight.') 
        ? getLineHeightValue(token.line_height)
        : token.line_height;
    }
    
    return style;
  };

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
            />
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
            />
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

// Main BrandBoardContent Component - NAMED EXPORT
export const BrandBoardContent = ({ 
  brand, 
  mode = 'light', 
  editable = true
}) => {
  const [copiedColor, setCopiedColor] = useState(null);
  const [colorTokens, setColorTokens] = useState([]);
  const [typographyTokens, setTypographyTokens] = useState([]);
  const [foundation, setFoundation] = useState(null);
  const [company, setCompany] = useState(null);
  const [projects, setProjects] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [brandData, setBrandData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [colorEditDialog, setColorEditDialog] = useState({ open: false, colorKey: '', currentValue: '', colorName: '' });
  const [regeneratingColor, setRegeneratingColor] = useState(false);

  const brandId = brand?.id;

  // Define data fetching functions within the component scope
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
          alt_color_4
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

  const fetchCompanyInfo = async (companyId) => {
    if (!companyId) return null;
    
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('company')
        .select('id, title')
        .eq('id', companyId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching company info:', error);
      return null;
    }
  };

  const fetchBrandProjects = async (brandId) => {
    if (!brandId) return [];
    
    const supabase = createClient();
    
    try {
      const { data: brandProjects, error: brandProjectError } = await supabase
        .from('brand_project')
        .select('project_id')
        .eq('brand_id', brandId);

      if (brandProjectError) {
        console.error('Brand project error:', brandProjectError);
        return [];
      }

      if (!brandProjects || brandProjects.length === 0) {
        return [];
      }

      const projectIds = brandProjects.map(bp => bp.project_id).filter(Boolean);

      if (projectIds.length === 0) {
        return [];
      }

      const { data: projects, error: projectsError } = await supabase
        .from('project')
        .select('id, title')
        .in('id', projectIds);

      if (projectsError) {
        console.error('Projects error:', projectsError);
        return [];
      }

      return projects || [];
    } catch (error) {
      console.error('Error fetching brand projects:', error);
      return [];
    }
  };

  const fetchAllCompanies = async () => {
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('company')
        .select('id, title')
        .order('title', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching companies:', error);
      return [];
    }
  };

  const fetchAllProjects = async () => {
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('project')
        .select('id, title')
        .order('title', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  };

  const updateBrandCompany = async (brandId, companyId) => {
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('brand')
        .update({ company_id: companyId })
        .eq('id', brandId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating brand company:', error);
      throw error;
    }
  };

  const updateBrandProjects = async (brandId, projectIds) => {
    const supabase = createClient();
    
    try {
      const { error: deleteError } = await supabase
        .from('brand_project')
        .delete()
        .eq('brand_id', brandId);
        
      if (deleteError) throw deleteError;
      
      if (projectIds && projectIds.length > 0) {
        const relationships = projectIds.map(projectId => ({
          brand_id: brandId,
          project_id: projectId
        }));
        
        const { error: insertError } = await supabase
          .from('brand_project')
          .insert(relationships);
          
        if (insertError) throw insertError;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating brand projects:', error);
      throw error;
    }
  };

  const updateBrandColors = async (brandId, colorUpdates) => {
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('brand')
        .update(colorUpdates)
        .eq('id', brandId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating brand colors:', error);
      throw error;
    }
  };

  // Get semantic colors based on current mode
  const semanticColors = useMemo(() => {
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
  }, [colorTokens, mode, foundation?.primary_color]);

  // Fixed title color calculation
  const titleColor = useMemo(() => {
    const lightModeBrandToken = colorTokens.find(t => t.token === 'lightmode.color.brand.primary');
    const darkModeBrandToken = colorTokens.find(t => t.token === 'darkmode.color.brand.primary');
    
    if (mode === 'light' && lightModeBrandToken?.resolved) {
      return lightModeBrandToken.resolved;
    }
    if (mode === 'dark' && darkModeBrandToken?.resolved) {
      return darkModeBrandToken.resolved;
    }
    
    if (foundation?.primary_color) {
      if (mode === 'dark') {
        const hex = foundation.primary_color.replace('#', '');
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        if (luminance < 0.5) {
          const factor = Math.max(1.5, 0.7 / luminance);
          const newR = Math.min(255, Math.round(r * factor));
          const newG = Math.min(255, Math.round(g * factor));
          const newB = Math.min(255, Math.round(b * factor));
          return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
        }
        return foundation.primary_color;
      } else {
        return foundation.primary_color;
      }
    }
    
    return semanticColors?.text?.primary || (mode === 'light' ? '#1a1a1a' : '#ffffff');
  }, [colorTokens, foundation?.primary_color, mode, semanticColors?.text?.primary]);

  useEffect(() => {
    if (!brandId) {
      setLoading(false);
      return;
    }

    const loadBrandData = async () => {
      setLoading(true);
      try {
        setBrandData(brand);
        
        const [colors, typography, foundationData, companyData, projectsData, companiesData, allProjectsData] = await Promise.all([
          fetchColorTokens(brandId),
          fetchTypographyTokens(brandId),
          fetchBrandFoundation(brandId),
          brand?.company_id ? fetchCompanyInfo(brand.company_id) : Promise.resolve(null),
          fetchBrandProjects(brandId),
          fetchAllCompanies(),
          fetchAllProjects()
        ]);
        
        setColorTokens(colors || []);
        setTypographyTokens(typography || []);
        setFoundation(foundationData);
        setCompany(companyData);
        setProjects(projectsData || []);
        setAllCompanies(companiesData || []);
        setAllProjects(allProjectsData || []);
      } catch (error) {
        console.error('Error loading brand data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBrandData();
  }, [brandId, brand]);

  // Event handlers
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

  const handleCompanySelect = async (companyId) => {
    if (!brandId) return;
    
    try {
      await updateBrandCompany(brandId, companyId);
      const selectedCompany = allCompanies.find(c => c.id === companyId);
      setCompany(selectedCompany || null);
      setBrandData(prev => ({ ...prev, company_id: companyId }));
    } catch (error) {
      console.error('Error updating company:', error);
    }
  };

  const handleProjectsSelect = async (projectIds) => {
    if (!brandId) return;
    
    try {
      await updateBrandProjects(brandId, projectIds);
      const selectedProjects = allProjects.filter(p => projectIds.includes(p.id));
      setProjects(selectedProjects);
    } catch (error) {
      console.error('Error updating projects:', error);
    }
  };

  const handleColorEdit = (colorKey, currentValue, colorName) => {
    if (!editable) return;
    setColorEditDialog({
      open: true,
      colorKey,
      currentValue,
      colorName
    });
  };

  const handleAddAltColor = async (colorKey) => {
    if (!editable || !brandId || !colorKey) return;
    
    try {
      const defaultColor = '#6366F1';
      const updates = { [colorKey]: defaultColor };
      
      await updateBrandColors(brandId, updates);
      setFoundation(prev => ({ ...prev, [colorKey]: defaultColor }));
      setBrandData(prev => ({ ...prev, [colorKey]: defaultColor }));
    } catch (error) {
      console.error('Error adding alt color:', error);
    }
  };

  const handleColorSave = async (newColor) => {
    if (!brandId || !colorEditDialog.colorKey) return;
    
    try {
      const updates = { [colorEditDialog.colorKey]: newColor };
      await updateBrandColors(brandId, updates);
      
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
      const updatedFoundation = {
        ...foundation,
        [colorEditDialog.colorKey]: colorEditDialog.currentValue
      };
      
      await updateBrandColors(brandId, { [colorEditDialog.colorKey]: colorEditDialog.currentValue });
      await regenerateAllColorTokens(brandId, 25, updatedFoundation);
      
      setFoundation(updatedFoundation);
      setBrandData(prev => ({ ...prev, [colorEditDialog.colorKey]: colorEditDialog.currentValue }));
      
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
    <Box sx={{ color: semanticColors?.text.primary || (mode === 'light' ? '#000000' : '#ffffff') }}>
      {/* Brand Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        {/* Company Information */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: 1, 
          mb: 2,
          color: semanticColors?.text.secondary || 'text.secondary'
        }}>
          <Buildings size={18} />
          {editable ? (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={company?.id || ''}
                onChange={(e) => handleCompanySelect(e.target.value)}
                displayEmpty
                variant="standard"
                sx={{ 
                  color: 'inherit',
                  fontSize: '1.25rem',
                  fontWeight: 500,
                  '&:before, &:after': { borderBottom: 'none' },
                  '&:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
                  '& .MuiSelect-select': { paddingBottom: 0 }
                }}
              >
                <MenuItem value="">
                  <em>Select Company</em>
                </MenuItem>
                {allCompanies.map((comp) => (
                  <MenuItem key={comp.id} value={comp.id}>
                    {comp.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            company?.title && (
              <Typography variant="h6" sx={{ color: 'inherit' }}>
                {company.title}
              </Typography>
            )
          )}
        </Box>

        {/* Brand Title */}
        <InlineEditableField
          value={brandData?.title || brand?.title || 'Brand Board'}
          onChange={handleTitleUpdate}
          variant="h3"
          sx={{
            fontWeight: 700,
            color: titleColor,
            mb: 3,
            textAlign: 'center',
            '& .MuiTypography-root': {
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              color: `${titleColor} !important`,
              fontWeight: 700
            },
            '& .MuiTypography-h3': {
              color: `${titleColor} !important`
            },
            '& h3': {
              color: `${titleColor} !important`
            },
            '& *': {
              color: `${titleColor} !important`
            }
          }}
        />

        {/* Projects Information */}
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
              Projects:
            </Typography>
          </Box>
          {editable ? (
            <Autocomplete
              multiple
              size="small"
              options={allProjects}
              getOptionLabel={(option) => option.title}
              value={projects}
              onChange={(event, newValue) => {
                const projectIds = newValue.map(p => p.id);
                handleProjectsSelect(projectIds);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="standard"
                  placeholder="Select projects"
                  sx={{
                    minWidth: 200,
                    '& .MuiInput-root': {
                      color: semanticColors?.text.secondary,
                      '&:before, &:after': { borderBottom: 'none' },
                      '&:hover:not(.Mui-disabled):before': { borderBottom: 'none' }
                    }
                  }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option.title}
                    size="small"
                    {...getTagProps({ index })}
                    key={option.id}
                    sx={{
                      borderColor: semanticColors?.border.base || 'divider',
                      color: semanticColors?.text.secondary,
                      '&:hover': {
                        backgroundColor: semanticColors?.background.surface || 'action.hover'
                      }
                    }}
                  />
                ))
              }
              sx={{ flexGrow: 1, maxWidth: 400 }}
            />
          ) : (
            projects && projects.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {projects.map((project, index) => (
                  <Box key={project.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip
                      label={project.title}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: semanticColors?.border.base || 'divider',
                        color: semanticColors?.text.secondary
                      }}
                    />
                    {index < projects.length - 1 && (
                      <Typography variant="body2" sx={{ mx: 1, color: 'inherit' }}>•</Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )
          )}
        </Box>
      </Box>

      {/* Foundation Colors with Gradients */}
      {foundation && (
        <FoundationColors 
          foundation={foundation} 
          onCopy={copyToClipboard}
          groupedColors={groupedColors}
          semanticColors={semanticColors}
          onColorEdit={handleColorEdit}
          onAddAltColor={handleAddAltColor}
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
            
            <TextField
              type="color"
              label="Color"
              value={colorEditDialog.currentValue}
              onChange={(e) => setColorEditDialog(prev => ({ ...prev, currentValue: e.target.value }))}
              fullWidth
              sx={{ mb: 1 }}
            />
            
            <TextField
              label="Hex Value"
              value={colorEditDialog.currentValue}
              onChange={(e) => setColorEditDialog(prev => ({ ...prev, currentValue: e.target.value }))}
              fullWidth
              placeholder="#000000"
            />

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Save Color Only:</strong> Updates just this base color<br/>
                <strong>Save & Regenerate Scale:</strong> Updates this color and regenerates all 100-900 scale variations plus related tokens
              </Typography>
            </Alert>

            {colorEditDialog.colorKey?.includes('alt_color') && (
              <Alert severity="success" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  💡 <strong>Tip:</strong> You can add up to 4 alternative colors using the dotted "+" boxes in the Alternative Colors section.
                </Typography>
              </Alert>
            )}
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

// Also provide a default export for flexibility
export default BrandBoardContent;