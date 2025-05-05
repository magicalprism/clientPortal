import { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Stack,
  Divider,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Switch,
} from '@mui/material';
import { DownloadSimple } from '@phosphor-icons/react';
import { getBrandColors, getBrandFonts, getBrandLogos } from '@/data/brandBoardFields';

export const BrandBoardPreview = ({ brand }) => {
  const [mode, setMode] = useState('light');
  const colors = getBrandColors(brand);
  const fonts = getBrandFonts(brand);
  const logos = getBrandLogos(brand);

  const primaryLogo = logos.find(l => l.label.toLowerCase().includes('primary square'));
  const secondaryLogo = logos.find(l => l.label.toLowerCase().includes('secondary square'));
  const otherLogos = logos.filter(l => l !== primaryLogo && l !== secondaryLogo);

  const altColors = colors.filter(c => c.label.toLowerCase().includes('alt'));
  const mainColors = colors.filter(c => !c.label.toLowerCase().includes('alt'));

  if (!brand) return null;

  const primaryColor = brand.primary_color;
  const secondaryColor = brand.secondary_color;
  const primaryBg = brand.background_primary_color;
  const secondaryBg = brand.background_secondary_color;
  const primaryBorder = brand.border_primary_color;
  const secondaryBorder = brand.border_secondary_color;

  const bgColor = mode === 'primary' ? primaryBg : secondaryBg;
  const textColor = mode === 'primary' ? primaryColor : secondaryColor;


  return (
    <Box sx={{ px: 2 }}>
      {/* Header Row with Switch + Print */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4} px={2}>
      <Switch
            checked={mode === 'primary'}
            onChange={() => setMode(mode === 'secondary' ? 'primary' : 'secondary')}
            inputProps={{ 'aria-label': 'Toggle between primary and secondary brand modes' }}
            sx={{
                width: 56,
                height: 32,
                padding: 0,
                display: 'flex',
                '& .MuiSwitch-switchBase': {
                padding: 0.5,
                '&.Mui-checked': {
                    transform: 'translateX(24px)',
                    color: textColor, // ✅ thumb text color matches current text color
                    '& + .MuiSwitch-track': {
                    backgroundColor: bgColor, // ✅ track color matches background
                    opacity: 1
                    }
                }
                },
                '& .MuiSwitch-thumb': {
                width: 24,
                height: 24,
                boxShadow: 'none',
                backgroundColor: textColor // ✅ thumb background matches text color
                },
                '& .MuiSwitch-track': {
                borderRadius: 16,
                backgroundColor: bgColor,
                opacity: 1
                }
            }}
            />

  
        <IconButton
          onClick={() => window.print()}
          title="Download / Print Brand Board"
          sx={{ color: '#333' }}
          aria-label="Print brand board"
        >
          <DownloadSimple />
        </IconButton>
      </Box>
  


      <Box
        sx={{
          p: 6,
          borderRadius: 2,
          backgroundColor: bgColor || 'background.paper',
          color: textColor,
          boxShadow: 3,
          maxWidth: 1000,
          margin: '0 auto',
          fontFamily: 'sans-serif',
          minHeight: '100vh'
        }}
      >
        
        {/* Primary Logo */}
        {(primaryLogo || secondaryLogo) && (
  <Box display="flex" justifyContent="center" mb={4}>
    <Box
      component="img"
      src={mode === 'primary' ? primaryLogo?.url : secondaryLogo?.url}
      alt={mode === 'primary' ? primaryLogo?.label : secondaryLogo?.label}
      sx={{ maxHeight: 100, objectFit: 'contain' }}
    />
  </Box>
            )}

        <Box display="flex" justifyContent="center" mb={5}>
        <Typography
            variant="h2"
            align="center"
            sx={{
            maxWidth: '500px',
            color: `${textColor} !important`
            }}
        >
            {brand.title || 'Brand Board'}
        </Typography>
        </Box>



            {/* Color Palette - Single Row, Flex, Fixed Size */}
            {mainColors.length > 0 && (
            <>
    <Typography variant="h6" align="center" mb={5} gutterBottom>
      Color Palette
    </Typography>
    <Box
      display="flex"
      justifyContent="center"
      alignItems="flex-start"
      flexWrap="nowrap"
      overflow="auto"
      gap={2} // smaller gap to fit more
      mb={6}
      px={2}
    >
      {mainColors.map(({ label, value }) => (
        <Box
          key={label}
          textAlign="center"
          sx={{
            width: 90,
            flexShrink: 0
          }}
        >
          <Box
            sx={{
              width: 90,
              height: 90,
              borderRadius: 2,
              backgroundColor: value,
              border: `1px solid ${value === bgColor ? textColor : bgColor}`,
              marginBottom: 1,
              scrollbarColor: `${secondaryColor} ${primaryColor}`,
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
                height: 8
              },
              '&::-webkit-scrollbar-track': {
                background: primaryColor
              },
              '&::-webkit-scrollbar-thumb': {
                background: secondaryColor,
                borderRadius: 4
              }
            }}
          />
          <Typography variant="caption" display="block">
            {label}
          </Typography>
        </Box>
      ))}
    </Box>
  </>
)}

<Divider sx={{ my: 6 }} />

{/* Alternate Colors */}
{altColors.length > 0 && (
  <>
    <Typography variant="h6" align="center" mb={5} gutterBottom>
      Alternate Colors
    </Typography>
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'nowrap',
        overflowX: 'auto',
        gap: 2,
        px: 2,
        mb: 6,
        scrollbarColor: `${secondaryColor} ${primaryColor}`,
        scrollbarWidth: 'thin',
        '&::-webkit-scrollbar': {
          height: 8
        },
        '&::-webkit-scrollbar-track': {
          background: primaryColor
        },
        '&::-webkit-scrollbar-thumb': {
          background: secondaryColor,
          borderRadius: 4
        }
      }}
    >
      {altColors.map(({ label, value }) => (
        <Box
          key={label}
          textAlign="center"
          sx={{ width: 90, flexShrink: 0 }}
        >
          <Box
            sx={{
              width: 90,
              height: 90,
              borderRadius: 2,
              backgroundColor: value,
              border: `1px solid ${value === bgColor ? textColor : bgColor}`,
              mb: 1
            }}
          />
          <Typography variant="caption" display="block">
            {label}
          </Typography>
        </Box>
      ))}
    </Box>
  </>
)}


<Divider sx={{ my: 6 }} />

{/* Typography */}
<Typography variant="h6" align="center" mb={5} gutterBottom sx={{ color: textColor }}>
  Typography
</Typography>
<Grid container spacing={4} justifyContent="center" mb={6}>
  {fonts.map(({ label, url }) => {
    const fontFamily = `'${label.replace(/\s+/g, '-')}'`;
    return (
      <Grid item xs={12} sm={6} md={3} key={label} textAlign="center">
        <style>
          {`
            @font-face {
              font-family: ${fontFamily};
              src: url(${url}) format('truetype');
              font-display: swap;
            }
          `}
        </style>
        <Typography variant="subtitle2" sx={{ color: textColor }}>
          {label}
        </Typography>
        <Box sx={{ fontFamily, fontSize: 28 }}>Aa Bb Cc 1234</Box>
      </Grid>
    );
  })}
</Grid>

<Divider sx={{ my: 6 }} />

 {/* Logos */}
{logos.length > 0 && (
  <>
    <Typography variant="h6" align="center" gutterBottom sx={{ color: textColor }}>
      Logos
    </Typography>
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        overflowX: 'auto',
        justifyContent: 'center',
        gap: 2,
        px: 2,
        mb: 6,
        scrollbarColor: `${secondaryColor} ${primaryColor}`,
        scrollbarWidth: 'thin',
        '&::-webkit-scrollbar': {
          height: 8
        },
        '&::-webkit-scrollbar-track': {
          background: primaryColor
        },
        '&::-webkit-scrollbar-thumb': {
          background: secondaryColor,
          borderRadius: 4
        }
      }}
    >
      {[primaryLogo, secondaryLogo, ...otherLogos].filter(Boolean).map(({ label, url }) => {
        const isPrimary = label.toLowerCase().includes('primary');
        const isSecondary = label.toLowerCase().includes('secondary');

        const logoBg = mode === 'primary'
          ? (isPrimary ? primaryBg : secondaryBg)
          : (isSecondary ? secondaryBg : primaryBg);

        return (
          <Box
            key={label}
            sx={{
              backgroundColor: logoBg,
              p: 3,
              borderRadius: 2,
              border: `1px solid ${mode === 'primary' ? primaryBorder : secondaryBorder}`,
              height: 120,
              width: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Box
              component="img"
              src={url}
              alt={label}
              sx={{ maxHeight: 80, maxWidth: 100, objectFit: 'contain' }}
            />
          </Box>
        );
      })}
    </Box>
  </>
)}


      </Box>
    </Box>
  );
};
