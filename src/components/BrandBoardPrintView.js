'use client';
import { Box, Typography, Divider, Grid } from '@mui/material';
import { getBrandColors, getBrandFonts, getBrandLogos } from '@/data/brandBoardFields';

export const BrandBoardPrintView = ({ brand }) => {
  const colors = getBrandColors(brand);
  const fonts = getBrandFonts(brand);
  const logos = getBrandLogos(brand);

  const primaryLogo = logos.find(l => l.label.toLowerCase().includes('primary square'));
  const altColors = colors.filter(c => c.label.toLowerCase().includes('alt'));
  const mainColors = colors.filter(c => !c.label.toLowerCase().includes('alt'));

  return (
    <Box
      className="brand-board-print"
      sx={{
        backgroundColor: '#fff',
        color: '#000',
        p: 4,
        fontFamily: 'sans-serif',
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
      }}
    >
      {primaryLogo && (
        <Box textAlign="center" mb={4}>
          <img src={primaryLogo.url} alt={primaryLogo.label} style={{ maxHeight: 100 }} />
        </Box>
      )}
      <Typography variant="h4" align="center" mb={4}>
        {brand.title || 'Brand Board'}
      </Typography>

      {/* Color Palette */}
      <Typography variant="h6" mb={2}>Color Palette</Typography>
      <Box display="flex" flexWrap="wrap" gap={2} mb={4}>
        {mainColors.map(({ label, value }) => (
          <Box key={label} textAlign="center">
            <Box sx={{ width: 60, height: 60, backgroundColor: value, border: '1px solid #ccc', mb: 1 }} />
            <Typography variant="caption">{label}</Typography>
            <Typography variant="caption">{value}</Typography>
          </Box>
        ))}
      </Box>

      {/* Alternate Colors */}
      {altColors.length > 0 && (
        <>
          <Typography variant="h6" mb={2}>Alternate Colors</Typography>
          <Box display="flex" flexWrap="wrap" gap={2} mb={4}>
            {altColors.map(({ label, value }) => (
              <Box key={label} textAlign="center">
                <Box sx={{ width: 60, height: 60, backgroundColor: value, border: '1px solid #ccc', mb: 1 }} />
                <Typography variant="caption">{label}</Typography>
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* Fonts */}
      <Typography variant="h6" mb={2}>Typography</Typography>
      <Grid container spacing={4}>
        {fonts.map(({ label, url }) => {
          const fontName = label.replace(/\s+/g, '-');
          return (
            <Grid item xs={6} key={label}>
              <style>{`
                @font-face {
                  font-family: '${fontName}';
                  src: url('${url}') format('truetype');
                }
              `}</style>
              <Typography variant="subtitle2">{label}</Typography>
              <Box sx={{ fontFamily: fontName, fontSize: 28 }}>
                Aa Bb Cc 1234
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
