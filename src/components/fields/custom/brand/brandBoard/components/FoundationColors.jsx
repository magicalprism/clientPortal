// components/brand/components/FoundationColors.jsx
import {
  Box,
  Grid,
  Typography,
  Paper,
  Chip,
  IconButton
} from '@mui/material';
import { Plus, X } from '@phosphor-icons/react';

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

export const FoundationColors = ({ 
  foundation, 
  onCopy, 
  groupedColors, 
  semanticColors, 
  onColorEdit, 
  onAddAltColor, 
  onRemoveAltColor, 
  editable = true, 
  surfaceBg 
}) => {
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
                    bgcolor: surfaceBg,
                    border: '1px solid',
                    borderColor: semanticColors?.border.base || 'divider',
                    transition: 'transform 0.2s ease',
                    position: 'relative',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}
                >
                  {/* Remove Button */}
                  {editable && (
                    <IconButton
                      size="small"
                      onClick={() => onRemoveAltColor && onRemoveAltColor(key, group)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: '#d32f2f',
                        width: 24,
                        height: 24,
                        '&:hover': {
                          backgroundColor: '#d32f2f',
                          color: 'white'
                        },
                        zIndex: 2
                      }}
                    >
                      <X size={14} />
                    </IconButton>
                  )}

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
                    bgcolor: surfaceBg,
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