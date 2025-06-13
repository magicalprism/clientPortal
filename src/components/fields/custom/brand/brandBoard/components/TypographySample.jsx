// components/brand/components/TypographySample.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Tooltip
} from '@mui/material';
import { DownloadSimple } from '@phosphor-icons/react';
import { table } from '@/lib/supabase/queries';

export const TypographySample = ({ token, semanticColors }) => {
  const [fontLoaded, setFontLoaded] = useState(false);
  const [fontFamilyName, setFontFamilyName] = useState('');

  useEffect(() => {
    const loadFont = async () => {
      if (token.font_family && token.font_family.includes('"')) {
        const fontName = token.font_family.split('"')[1];
        setFontFamilyName(fontName);
        
        if (fontName && fontName !== 'system-ui' && fontName !== 'sans-serif') {
          try {
            const { data } = await table.media.fetchFontsByName(fontName);

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
      try {
        const { data } = style === 'italic' 
          ? await table.media.fetchItalicFont(fontFamilyName)
          : await table.media.fetchRegularFont(fontFamilyName);
          
        if (data?.url) {
          window.open(data.url, '_blank');
        }
      } catch (error) {
        console.error('Error downloading font:', error);
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