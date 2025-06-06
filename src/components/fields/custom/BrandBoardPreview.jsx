// BrandBoardPreview.jsx - Fixed to work with relationship data
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
} from '@mui/material';
import { 
    DownloadSimple,
    ClipboardText
 } from '@phosphor-icons/react';
import { getBrandColors, getBrandFonts, getBrandLogos } from '@/data/brandBoardFields';

export const BrandBoardPreview = (props) => {
  console.log('BrandBoardPreview all props:', props);
  
  // Handle different ways props might be passed
  const directBrand = props.brand || props.value || props.data;
  const record = props.record || {};
  const config = props.config || {};
  
  // Log what we found
  console.log('BrandBoardPreview data check:', {
    hasDirect: !!directBrand,
    directKeys: directBrand ? Object.keys(directBrand).length : 0,
    recordKeys: Object.keys(record).length,
    configName: config.name,
    // Show if we have colors in either
    directHasColors: directBrand?.primary_color || directBrand?.secondary_color,
    recordHasColors: record?.primary_color || record?.secondary_color,
    // Check for brands relationship
    hasBrandsRelation: !!record?.brands,
    brandsCount: record?.brands?.length || 0,
    hasBrandsDetails: !!record?.brands_details,
    brandsDetailsCount: record?.brands_details?.length || 0
  });

  // Determine which brand data to use
  let brandToUse = null;
  
  // Priority 1: Direct brand data (when used in brand collection)
  if (directBrand && (directBrand.primary_color || directBrand.secondary_color || directBrand.title)) {
    brandToUse = directBrand;
    console.log('Using direct brand:', directBrand.title);
  } 
  // Priority 2: Brand from relationships (when used in project/other collections)
  else if (record?.brands_details && record.brands_details.length > 0) {
    // Extract brand data from the relationship structure
    let brandData = null;
    
    // Handle different relationship structures
    if (record.brands_details[0].brand) {
      // Structure: brands_details[].brand (with junction table)
      const primaryBrand = record.brands_details.find(b => b.brand?.status === 'primary');
      brandData = primaryBrand?.brand || record.brands_details[0].brand;
    } else if (record.brands_details[0].id) {
      // Structure: brands_details[] (direct brand objects)
      const primaryBrand = record.brands_details.find(b => b.status === 'primary');
      brandData = primaryBrand || record.brands_details[0];
    }
    
    if (brandData) {
      brandToUse = brandData;
      console.log('Using brand from relationship:', brandToUse?.title, 'from', record.brands_details.length, 'brands');
    }
  }
  // Fallback: Try the simpler brands array
  else if (record?.brands && record.brands.length > 0) {
    // Use the first brand, or look for a primary brand
    const primaryBrand = record.brands.find(b => b.status === 'primary');
    brandToUse = primaryBrand || record.brands[0];
    console.log('Using brand from simple relationship:', brandToUse?.title, 'from', record.brands.length, 'brands');
  }
  // Priority 3: Record itself has brand data (fallback)
  else if (record && (record.primary_color || record.secondary_color || record.title)) {
    brandToUse = record;
    console.log('Using record as brand:', record.title);
  }
  // Priority 4: Check for company's primary brand (if available)
  else if (record?.company_details?.primary_brand) {
    brandToUse = record.company_details.primary_brand;
    console.log('Using company primary brand:', brandToUse?.title);
  }

  if (!brandToUse) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        No brand data available to preview.
        {config.name === 'project' && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            To show a brand board:
            <br />• Associate a brand with this project in the "Primary Brand" field above
            <br />• Or ensure the company has a primary brand configured
          </Typography>
        )}
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.75rem' }}>
            Debug Info (click to expand)
          </summary>
          <Box component="pre" sx={{ fontSize: '0.7rem', mt: 1, overflow: 'auto' }}>
            {JSON.stringify({ 
              directBrand: !!directBrand, 
              record: !!record, 
              config: config.name,
              directKeys: directBrand ? Object.keys(directBrand) : [],
              recordKeys: Object.keys(record),
              hasBrandsRelation: !!record?.brands,
              brandsCount: record?.brands?.length || 0,
              hasBrandsDetails: !!record?.brands_details,
              brandsDetailsCount: record?.brands_details?.length || 0,
              firstBrandTitle: record?.brands?.[0]?.title || record?.brands_details?.[0]?.title || record?.brands_details?.[0]?.brand?.title || 'none'
            }, null, 2)}
          </Box>
        </details>
      </Alert>
    );
  }

  return <BrandBoardDisplay brand={brandToUse} config={config} />;
};

// Separate display component (unchanged)
const BrandBoardDisplay = ({ brand, config }) => {
  const [mode, setMode] = useState('primary');
  const [copiedColor, setCopiedColor] = useState(null);

  console.log('BrandBoardDisplay received brand:', {
    title: brand.title,
    keys: Object.keys(brand),
    hasColors: !!(brand.primary_color || brand.secondary_color),
    fontKeys: Object.keys(brand).filter(k => k.includes('font')),
    logoKeys: Object.keys(brand).filter(k => k.includes('logo') || k.includes('favicon'))
  });

  const colors = getBrandColors(brand);
  const fonts = getBrandFonts(brand);
  const logos = getBrandLogos(brand);

  console.log('Processed brand data:', {
    colors: colors.length,
    fonts: fonts.length,
    logos: logos.length
  });

  const primaryLogo = logos.find(l => l.label.toLowerCase().includes('primary square'));
  const secondaryLogo = logos.find(l => l.label.toLowerCase().includes('secondary square'));
  const otherLogos = logos.filter(l => l !== primaryLogo && l !== secondaryLogo);

  const altColors = colors.filter(c => c.label.toLowerCase().includes('alt'));
  const mainColors = colors.filter(c => !c.label.toLowerCase().includes('alt'));

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
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4} px={1}>
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
                color: textColor,
                '& + .MuiSwitch-track': {
                  backgroundColor: bgColor,
                  opacity: 1,
                  
                }
              },
            },
            '& .MuiSwitch-thumb': {
              width: 24,
              height: 24,
              boxShadow: 'none',
              backgroundColor: textColor
            },
            '& .MuiSwitch-track': {
              borderRadius: 16,
              backgroundColor: bgColor,
              opacity: 1,
              borderColor:'textColor',
              border: 'solid 1px',
              
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

      <Box className="print-area"
        sx={{
          '@media print': {
            overflow: 'visible',
            flexWrap: 'wrap',
            backgroundColor: '#fff !important',
            color: '#000 !important',
            boxShadow: 'none',
            padding: '0 !important',
          }
        }}>
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
            minHeight: '50vh',
            '@media print': {
              backgroundColor: '#ffffff !important',
              color: '#000000 !important',
              boxShadow: 'none',
            }
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
                color: textColor,
                fontSize: '3rem',
                '@media print': {
                  color: '#000 !important',
                  WebkitPrintColorAdjust: 'exact'
                }
              }}
            >
              {brand.title || 'Brand Board'}
            </Typography>
          </Box>

          {/* Color Palette */}
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
                sx={{
                  '@media print': {
                    overflowX: 'visible',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: 1
                  }
                }}
                gap={2}
                mb={6}
                px={1}
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
                      }}
                    />
                    <Typography 
                      variant="caption" 
                      display="block" 
                      sx={{
                        whiteSpace: 'nowrap',
                        '@media print': {
                          fontSize: '0.7rem',
                          color: '#000 !important',
                          WebkitPrintColorAdjust: 'exact'
                        }
                      }}
                    >
                      {label}
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} >
                      <IconButton
                        size="small"
                        onClick={() => {
                          navigator.clipboard.writeText(value);
                          setCopiedColor(label);
                          setTimeout(() => setCopiedColor(null), 1500);
                        }}
                        title={`Copy ${value}`}
                        sx={{
                          p: 0.5,
                          color: textColor
                        }}
                      >
                        <ClipboardText size={14} color={textColor} />
                      </IconButton>
                      {copiedColor === label ? (
                        <Typography variant="caption" sx={{ 
                          color: textColor, 
                          '@media print': {
                            color: '#000 !important',
                            WebkitPrintColorAdjust: 'exact'
                          }  
                        }}>
                          Copied!
                        </Typography>
                      ) : (
                        <Typography variant="caption" 
                          sx={{ 
                            color: textColor, 
                            whiteSpace: 'nowrap',
                            '@media print': {
                              fontSize: '0.7rem',
                              color: '#000 !important',
                              WebkitPrintColorAdjust: 'exact'
                            }
                          }}
                        >
                          {value}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </>
          )}

          {/* Alternate Colors */}
          {altColors.length > 0 && (
            <>
              <Divider sx={{ my: 6 }} />
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
                  '@media print': {
                    overflowX: 'visible',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: 1
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
                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          navigator.clipboard.writeText(value);
                          setCopiedColor(label);
                          setTimeout(() => setCopiedColor(null), 1500);
                        }}
                        title={`Copy ${value}`}
                        sx={{
                          p: 0.5,
                          color: textColor,
                        }}
                      >
                        <ClipboardText size={14} color={textColor} />
                      </IconButton>
                      {copiedColor === label ? (
                        <Typography variant="caption" sx={{ color: textColor }}>
                          Copied!
                        </Typography>
                      ) : (
                        <Typography
                          variant="caption"
                          sx={{
                            color: textColor,
                            whiteSpace: 'nowrap',
                            '@media print': {
                              color: '#000 !important',
                              WebkitPrintColorAdjust: 'exact'
                            }
                          }}
                        >
                          {value}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </>
          )}

          {/* Typography */}
          {fonts.length > 0 && (
            <>
              <Divider sx={{ my: 6, breakAfter: 'page'}} />
              <Typography variant="h6" align="center" mb={5} gutterBottom sx={{ 
                color: textColor,   
                '@media print': {
                  color: '#000 !important',
                  WebkitPrintColorAdjust: 'exact',
                  marginTop: 8,
                } 
              }}>
                Typography
              </Typography>
              <Grid container spacing={4} justifyContent="center" mb={6}>
                {fonts.map(({ label, url, name }) => {
                  const fontFamily = `'${(name || label).replace(/\s+/g, '-')}'`;
                  return (
                    <Grid item xs={12} sm={6} md={6} key={label} textAlign="center">
                      <style>
                        {`
                          @font-face {
                            font-family: ${fontFamily};
                            src: url(${url}) format('truetype');
                            font-display: swap;
                          }
                        `}
                      </style>
                      <Typography variant="subtitle2" sx={{ 
                        color: textColor, 
                        '@media print': {
                          color: '#000 !important',
                          WebkitPrintColorAdjust: 'exact'
                        } 
                      }}>
                        {label}
                      </Typography>
                      <Box sx={{ fontFamily, fontSize: 28, mb: 1 }}>
                        Aa Bb Cc <br/>1234
                      </Box>
                      {name && (
                        <Typography variant="caption" sx={{ 
                          color: textColor, 
                          '@media print': {
                            color: '#000 !important',
                            WebkitPrintColorAdjust: 'exact'
                          } 
                        }}>
                          {name}
                        </Typography>
                      )}
                    </Grid>
                  );
                })}
              </Grid>
            </>
          )}

          {/* Logos */}
          {logos.length > 0 && (
            <>
              <Divider sx={{ my: 6 }} />
              <Typography variant="h6" align="center" gutterBottom sx={{ 
                color: textColor, 
                pb: 3, 
                '@media print': {
                  color: '#000 !important',
                  WebkitPrintColorAdjust: 'exact'
                } 
              }}>
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
                  '@media print': {
                    overflowX: 'visible',
                    flexWrap: 'no-wrap',
                    justifyContent: 'center',
                    gap: 1
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

          {/* Show info if no complete content */}
          {mainColors.length === 0 && fonts.length === 0 && logos.length === 0 && (
            <Alert severity="info" sx={{ mt: 4 }}>
              <Typography variant="body2" gutterBottom>
                This brand doesn't have colors, fonts, or logos configured yet.
              </Typography>
              
              {config?.name === 'project' && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  To show brand assets for projects, either:
                  <br />• Associate a brand with this project
                  <br />• Create a primary brand for the company
                </Typography>
              )}

              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: 'pointer', fontSize: '0.75rem' }}>
                  Debug Brand Data (click to expand)
                </summary>
                <Box component="pre" sx={{ fontSize: '0.7rem', mt: 1, overflow: 'auto', maxHeight: 200 }}>
                  {JSON.stringify(brand, null, 2)}
                </Box>
              </details>
            </Alert>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default BrandBoardPreview;