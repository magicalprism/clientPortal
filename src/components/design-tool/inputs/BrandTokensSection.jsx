// components/design-tool/inputs/BrandTokensSection.jsx
'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Grid
} from '@mui/material';
import { Palette, CheckCircle, Warning } from '@phosphor-icons/react';

// Import your existing queries - using direct brand_id relationships
import { fetchAllBrands } from '@/lib/supabase/queries/table/brand';
import { fetchColorsByBrandId } from '@/lib/supabase/queries/table/color';
import { fetchTypographyByBrandId } from '@/lib/supabase/queries/table/typography';

export default function BrandTokensSection({
  selectedBrand = null,
  onBrandChange = () => {},
  brandTokens = {},
  onTokensChange = () => {}
}) {
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [error, setError] = useState('');

  // Load available brands on mount
  useEffect(() => {
    loadBrands();
  }, []);

  // Load brands from Supabase
  const loadBrands = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await fetchAllBrands({
        sort: 'title:asc'
      });

      if (error) {
        throw new Error(error.message);
      }

      setBrands(data || []);
    } catch (err) {
      setError('Failed to load brands: ' + err.message);
      console.error('Brand loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load design tokens for selected brand
  const loadBrandTokens = async (brandId) => {
    if (!brandId) return;

    setIsLoadingTokens(true);
    setError('');

    try {
      // Fetch colors and typography directly by brand_id
      const [colorsResult, typographyResult] = await Promise.all([
        fetchColorsByBrandId(brandId),
        fetchTypographyByBrandId(brandId)
      ]);

      if (colorsResult.error) {
        throw new Error('Failed to load colors: ' + colorsResult.error.message);
      }

      if (typographyResult.error) {
        throw new Error('Failed to load typography: ' + typographyResult.error.message);
      }

      // Group colors by their group field
      const groupedColors = (colorsResult.data || []).reduce((acc, color) => {
        const group = color.group || 'other';
        if (!acc[group]) {
          acc[group] = {};
        }
        
        acc[group][color.token] = {
          id: color.id,
          value: color.resolved || color.value,
          type: color.type,
          mode: color.mode,
          description: color.description,
          title: color.title
        };
        
        return acc;
      }, {});

      // Group typography by category
      const groupedTypography = (typographyResult.data || []).reduce((acc, typo) => {
        const group = typo.category || typo.group_name || 'other';
        if (!acc[group]) {
          acc[group] = {};
        }
        
        acc[group][typo.token] = {
          id: typo.id,
          value: typo.font_family,
          fontSize: typo.font_size,
          fontWeight: typo.font_weight,
          lineHeight: typo.line_height,
          letterSpacing: typo.letter_spacing,
          type: typo.type,
          category: typo.category,
          description: typo.description,
          title: typo.title
        };
        
        return acc;
      }, {});

      // Combine into a single tokens object
      const combinedTokens = {
        colors: groupedColors,
        typography: groupedTypography
      };

      // Add some computed spacing tokens for layout generation
      combinedTokens.spacing = {
        xs: { value: '8px', type: 'spacing' },
        sm: { value: '16px', type: 'spacing' },
        md: { value: '24px', type: 'spacing' },
        lg: { value: '48px', type: 'spacing' },
        xl: { value: '96px', type: 'spacing' }
      };

      combinedTokens.borderRadius = {
        sm: { value: '4px', type: 'borderRadius' },
        md: { value: '8px', type: 'borderRadius' },
        lg: { value: '16px', type: 'borderRadius' }
      };

      onTokensChange(combinedTokens);
    } catch (err) {
      setError('Failed to load brand tokens: ' + err.message);
      console.error('Token loading error:', err);
      
      // Use mock tokens as fallback
      onTokensChange(generateMockTokens());
    } finally {
      setIsLoadingTokens(false);
    }
  };

  // Handle brand selection
  const handleBrandChange = (event) => {
    const brandId = event.target.value;
    const brand = brands.find(b => b.id === brandId);
    
    onBrandChange(brand);
    
    if (brand) {
      loadBrandTokens(brand.id);
    } else {
      onTokensChange({});
    }
  };

  // Generate mock tokens for development
  const generateMockTokens = () => ({
    colors: {
      primary: {
        primary: { value: '#3B82F6', type: 'color' },
        secondary: { value: '#10B981', type: 'color' },
        neutral: { value: '#6B7280', type: 'color' }
      },
      semantic: {
        success: { value: '#10B981', type: 'color' },
        error: { value: '#EF4444', type: 'color' },
        warning: { value: '#F59E0B', type: 'color' }
      }
    },
    typography: {
      heading: {
        heading: { value: 'Inter', type: 'fontFamily' },
        display: { value: 'Inter', type: 'fontFamily' }
      },
      body: {
        body: { value: 'Inter', type: 'fontFamily' },
        caption: { value: 'Inter', type: 'fontFamily' }
      }
    },
    spacing: {
      xs: { value: '8px', type: 'spacing' },
      sm: { value: '16px', type: 'spacing' },
      md: { value: '24px', type: 'spacing' },
      lg: { value: '48px', type: 'spacing' }
    },
    borderRadius: {
      sm: { value: '4px', type: 'borderRadius' },
      md: { value: '8px', type: 'borderRadius' },
      lg: { value: '16px', type: 'borderRadius' }
    }
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Palette size={20} weight="duotone" />
        <Typography variant="h6">Brand Tokens</Typography>
      </Box>

      {/* Brand Selection */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Select Brand</InputLabel>
        <Select
          value={selectedBrand?.id || ''}
          onChange={handleBrandChange}
          label="Select Brand"
          disabled={isLoading}
        >
          {isLoading ? (
            <MenuItem disabled>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              Loading brands...
            </MenuItem>
          ) : (
            brands.map((brand) => (
              <MenuItem key={brand.id} value={brand.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      bgcolor: brand.primary_color || 'grey.300',
                      borderRadius: 0.5
                    }}
                  />
                  <Box>
                    <Typography variant="body2">{brand.title}</Typography>
                    {brand.company && (
                      <Typography variant="caption" color="text.secondary">
                        {brand.company.title}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} icon={<Warning size={16} />}>
          {error}
        </Alert>
      )}

      {/* Loading Tokens */}
      {isLoadingTokens && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="body2">Loading brand tokens...</Typography>
        </Box>
      )}

      {/* Brand Tokens Display */}
      {selectedBrand && !isLoadingTokens && Object.keys(brandTokens).length > 0 && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CheckCircle size={16} weight="fill" color="green" />
            <Typography variant="subtitle2">
              {selectedBrand.title} Design Tokens
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {Object.entries(brandTokens).map(([groupName, tokens]) => (
              <Grid item xs={12} key={groupName}>
                <Typography variant="subtitle2" sx={{ mb: 1, textTransform: 'capitalize' }}>
                  {groupName} ({getTotalTokenCount(tokens)})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {renderTokenPreviews(tokens, groupName)}
                </Box>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Empty State */}
      {selectedBrand && !isLoadingTokens && Object.keys(brandTokens).length === 0 && (
        <Alert severity="info">
          No design tokens found for this brand. The component will use default values.
        </Alert>
      )}

      {/* Help Text */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        💡 Design tokens from your color and typography tables will be applied automatically
      </Typography>
    </Box>
  );

  // Helper to count total tokens in a group
  function getTotalTokenCount(tokens) {
    if (typeof tokens === 'object' && tokens !== null) {
      return Object.values(tokens).reduce((total, subGroup) => {
        if (typeof subGroup === 'object' && subGroup !== null) {
          return total + Object.keys(subGroup).length;
        }
        return total + 1;
      }, 0);
    }
    return 0;
  }

  // Helper to render token previews
  function renderTokenPreviews(tokens, groupName) {
    const previews = [];
    
    if (groupName === 'colors') {
      // Flatten color groups and show previews
      Object.entries(tokens).forEach(([subGroup, colors]) => {
        Object.entries(colors).slice(0, 4).forEach(([name, token]) => {
          previews.push(
            <Box
              key={`${subGroup}-${name}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                p: 0.5,
                border: 1,
                borderColor: 'grey.300',
                borderRadius: 0.5,
                bgcolor: 'white'
              }}
            >
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  bgcolor: token.value,
                  borderRadius: 0.5,
                  border: 1,
                  borderColor: 'grey.300'
                }}
              />
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                {name}
              </Typography>
            </Box>
          );
        });
      });
    } else if (groupName === 'typography') {
      // Show typography previews
      Object.entries(tokens).forEach(([subGroup, fonts]) => {
        Object.entries(fonts).slice(0, 3).forEach(([name, token]) => {
          previews.push(
            <Chip
              key={`${subGroup}-${name}`}
              label={`${name}: ${token.value}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          );
        });
      });
    } else {
      // Show other tokens as chips
      Object.entries(tokens).slice(0, 4).forEach(([name, token]) => {
        previews.push(
          <Chip
            key={name}
            label={`${name}: ${token.value}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem' }}
          />
        );
      });
    }

    const totalCount = getTotalTokenCount(tokens);
    if (totalCount > previews.length) {
      previews.push(
        <Chip
          key="more"
          label={`+${totalCount - previews.length} more`}
          size="small"
          color="primary"
          sx={{ fontSize: '0.7rem' }}
        />
      );
    }

    return previews;
  }
}