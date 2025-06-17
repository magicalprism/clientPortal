// components/brand/BrandBoardContent.jsx - Enhanced to handle brand arrays and related collections
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
  Autocomplete,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import { 
  DownloadSimple,
  Check,
  TextAa,
  Buildings,
  FolderOpen,
  ArrowsClockwise,
  Plus,
  X
} from '@phosphor-icons/react';
import { InlineEditableField } from '@/components/fields/InlineEditableField';
import { regenerateAllColorTokens } from '@/components/fields/custom/brand/colors/colorTokenGenerator';

// Import functions directly from table modules
import { 
  fetchBrandColorTokens, 
  fetchBrandById, 
  updateBrandTitle, 
  updateBrandCompany, 
  linkProjectsToBrand, 
  updateBrandColorTokens, 
  removeAltColor,
  fetchAllBrands
} from '@/lib/supabase/queries/table/brand';
import { fetchColorsByBrand, deleteColorsByBrandAndGroup } from '@/lib/supabase/queries/table/color';
import { fetchSemanticTypography } from '@/lib/supabase/queries/table/typography';
import { fetchCompanyBasicInfo, fetchAllCompanies } from '@/lib/supabase/queries/table/company';
import { fetchAllProjects } from '@/lib/supabase/queries/table/project';

// Import sub-components
import { FoundationColors } from '@/components/fields/custom/brand/brandBoard/components/FoundationColors';
import { TypographySample } from '@/components/fields/custom/brand/brandBoard/components/TypographySample';
import { ColorEditDialog } from '@/components/fields/custom/brand/brandBoard/components/ColorEditDialog';
import { CopyFeedback } from '@/components/fields/custom/brand/brandBoard/components/CopyFeedback';

// Main BrandBoardContent Component - NAMED EXPORT
export const BrandBoardContent = ({
  brand,
  mode = 'light',
  editable = true,
  useBrandBackground = false
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
  const [colorEditDialog, setColorEditDialog] = useState({ 
    open: false, 
    colorKey: '', 
    currentValue: '', 
    colorName: '' 
  });
  const [regeneratingColor, setRegeneratingColor] = useState(false);
  
  // For handling multiple brands
  const [availableBrands, setAvailableBrands] = useState([]);
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Determine if we're dealing with a single brand or multiple brands
  const isMultipleBrands = useMemo(() => {
    // Check if brand is an array
    if (Array.isArray(brand)) return true;
    
    // Check if brand has a brands property that is an array
    if (brand?.brands && Array.isArray(brand.brands) && brand.brands.length > 0) return true;
    
    // Check if brand has a brands_details property that is an array
    if (brand?.brands_details && Array.isArray(brand.brands_details) && brand.brands_details.length > 0) return true;
    
    return false;
  }, [brand]);

  // Extract brand ID based on the current context
  const brandId = useMemo(() => {
    if (!brand) return null;
    
    // If selectedBrandId is set, use it
    if (selectedBrandId) return selectedBrandId;
    
    // If dealing with a single brand, use its ID
    if (!isMultipleBrands) return brand.id;
    
    // If brand is an array, use the first brand's ID
    if (Array.isArray(brand) && brand.length > 0) {
      return brand[0].id;
    }
    
    // If brand has a brands property, use the first brand's ID
    if (brand.brands && Array.isArray(brand.brands) && brand.brands.length > 0) {
      // Check if it's an array of objects or IDs
      if (typeof brand.brands[0] === 'object') {
        return brand.brands[0].id;
      } else {
        return brand.brands[0];
      }
    }
    
    // If brand has a brands_details property, use the first brand's ID
    if (brand.brands_details && Array.isArray(brand.brands_details) && brand.brands_details.length > 0) {
      // Check if it has a nested brand property
      if (brand.brands_details[0].brand) {
        return brand.brands_details[0].brand.id;
      } else {
        return brand.brands_details[0].id;
      }
    }
    
    // Fallback to the brand's own ID if available
    return brand.id || null;
  }, [brand, isMultipleBrands, selectedBrandId]);

  // Database functions using direct imports
  const fetchColorTokens = async (brandId) => {
    if (!brandId) return [];
    
    try {
      const { data, error } = await fetchColorsByBrand(brandId);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching color tokens:', error);
      return [];
    }
  };

  const fetchTypographyTokens = async (brandId) => {
    if (!brandId) return [];
    
    try {
      const { data, error } = await fetchSemanticTypography(brandId);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching typography tokens:', error);
      return [];
    }
  };

  const fetchBrandFoundation = async (brandId) => {
    if (!brandId) return null;
    
    try {
      const { data, error } = await fetchBrandColorTokens(brandId);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching brand foundation:', error);
      return null;
    }
  };

  const fetchCompanyInfo = async (companyId) => {
    if (!companyId) return null;
    
    try {
      const { data, error } = await fetchCompanyBasicInfo(companyId);
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
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
    
    try {
      const { data, error } = await fetchBrandById(brandId);
      if (error) {
        console.error('Brand project error:', error);
        return [];
      }
      return data?.projects || [];
    } catch (error) {
      console.error('Error fetching brand projects:', error);
      return [];
    }
  };

  const fetchCompaniesData = async () => {
    try {
      const { data, error } = await fetchAllCompanies();
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching companies:', error);
      return [];
    }
  };

  const fetchProjectsData = async () => {
    try {
      const { data, error } = await fetchAllProjects();
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  };

  const fetchAvailableBrands = async () => {
    // If we already have brand data in various formats, extract it
    if (Array.isArray(brand)) {
      return brand;
    }
    
    if (brand?.brands && Array.isArray(brand.brands)) {
      // If brands is an array of IDs, fetch the full brand objects
      if (brand.brands.length > 0 && typeof brand.brands[0] !== 'object') {
        try {
          const brandPromises = brand.brands.map(async (brandId) => {
            const { data } = await fetchBrandById(brandId);
            return data;
          });
          
          const brandsData = await Promise.all(brandPromises);
          return brandsData.filter(Boolean);
        } catch (error) {
          console.error('Error fetching brands by IDs:', error);
          return [];
        }
      }
      
      return brand.brands;
    }
    
    if (brand?.brands_details && Array.isArray(brand.brands_details)) {
      // Extract brand objects from brands_details
      return brand.brands_details.map(detail => detail.brand || detail).filter(Boolean);
    }
    
    // If we have a company_id, fetch all brands for that company
    if (brand?.company_id) {
      try {
        const { data, error } = await fetchAllBrands();
        if (error) throw error;
        
        // Filter brands by company_id
        return data.filter(b => b.company_id === brand.company_id) || [];
      } catch (error) {
        console.error('Error fetching brands for company:', error);
        return [];
      }
    }
    
    // If we have a single brand, return it as an array
    if (brand?.id) {
      return [brand];
    }
    
    return [];
  };

  const updateBrandCompanyData = async (brandId, companyId) => {
    try {
      const { data, error } = await updateBrandCompany(brandId, companyId);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating brand company:', error);
      throw error;
    }
  };

  const updateBrandProjectsData = async (brandId, projectIds) => {
    try {
      const { data, error } = await linkProjectsToBrand(brandId, projectIds);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating brand projects:', error);
      throw error;
    }
  };

  const updateBrandColorsData = async (brandId, colorUpdates) => {
    try {
      const { data, error } = await updateBrandColorTokens(brandId, colorUpdates);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating brand colors:', error);
      throw error;
    }
  };

  // Function to remove alt color and associated tokens
  const removeAltColorAndTokens = async (brandId, colorKey, groupName) => {
    try {
      // Remove the alt color from brand
      const { error: brandError } = await removeAltColor(brandId, colorKey);
      if (brandError) throw brandError;

      // Delete all color tokens associated with this alt color group
      const { error: tokensError } = await deleteColorsByBrandAndGroup(brandId, groupName);
      if (tokensError) throw tokensError;

      return true;
    } catch (error) {
      console.error('Error removing alt color and tokens:', error);
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

    const neutralLight = foundation?.neutral_color_100 || '#ffffff';
    const neutralDark = foundation?.neutral_color_900 || '#1a1a1a';

    return {
      text: {
        primary: findToken('color.text.primary') || (mode === 'light' ? '#1a1a1a' : '#ffffff'),
        secondary: findToken('color.text.secondary') || (mode === 'light' ? '#666666' : '#cccccc'),
      },
      background: {
        default: findToken('color.bg.default') ||
          (useBrandBackground ? (mode === 'light' ? neutralLight : neutralDark) : (mode === 'light' ? '#ffffff' : '#1a1a1a')),
        surface: findToken('color.bg.surface') ||
          (useBrandBackground ? (mode === 'light' ? neutralLight : neutralDark) : (mode === 'light' ? '#f8f9fa' : '#2d2d2d')),
      },
      border: {
        base: findToken('color.border.base') || (mode === 'light' ? '#e0e0e0' : '#404040'),
      },
      brand: {
        primary: findToken('color.brand.primary') || foundation?.primary_color || (mode === 'light' ? '#3B82F6' : '#60A5FA'),
      }
    };
  }, [colorTokens, mode, foundation?.primary_color, foundation?.neutral_color_100, foundation?.neutral_color_900, useBrandBackground]);

  const surfaceBg = useBrandBackground
    ? mode === 'light'
      ? foundation?.neutral_color_100 || '#ffffff'
      : foundation?.neutral_color_900 || '#1a1a1a'
    : '#ffffff';

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

  // Group colors by their base type
  const groupedColors = useMemo(() => {
    return colorTokens.reduce((groups, color) => {
      if (color.type === 'base') {
        const group = color.group || 'other';
        if (!groups[group]) groups[group] = [];
        groups[group].push(color);
      }
      return groups;
    }, {});
  }, [colorTokens]);

  // Load available brands when component mounts
  useEffect(() => {
    const loadAvailableBrands = async () => {
      const brands = await fetchAvailableBrands();
      setAvailableBrands(brands);
      
      // Set the selected brand ID if we have brands and no selection yet
      if (brands.length > 0 && !selectedBrandId) {
        // Try to find a primary brand first
        const primaryBrand = brands.find(b => b.status === 'primary');
        setSelectedBrandId(primaryBrand?.id || brands[0].id);
      }
    };
    
    loadAvailableBrands();
  }, [brand]);

  // Load brand data when brandId changes
  useEffect(() => {
    if (!brandId) {
      setLoading(false);
      return;
    }

    const loadBrandData = async () => {
      setLoading(true);
      try {
        // Find the current brand object
        let currentBrand;
        
        if (isMultipleBrands) {
          currentBrand = availableBrands.find(b => b.id === brandId);
        } else {
          currentBrand = brand;
        }
        
        setBrandData(currentBrand);
        
        const [colors, typography, foundationData, companyData, projectsData, companiesData, allProjectsData] = await Promise.all([
          fetchColorTokens(brandId),
          fetchTypographyTokens(brandId),
          fetchBrandFoundation(brandId),
          currentBrand?.company_id ? fetchCompanyInfo(currentBrand.company_id) : Promise.resolve(null),
          fetchBrandProjects(brandId),
          fetchCompaniesData(),
          fetchProjectsData()
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
  }, [brandId, brand, isMultipleBrands, availableBrands]);

  // Event handlers
  const handleTitleUpdate = async (newTitle) => {
    if (!brandId || !newTitle?.trim()) {
      throw new Error('Brand ID and title are required');
    }
    
    try {
      const updatedBrand = await updateBrandTitle(brandId, newTitle.trim());
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
      await updateBrandProjectsData(brandId, projectIds);
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
      
      await updateBrandColorsData(brandId, updates);
      setFoundation(prev => ({ ...prev, [colorKey]: defaultColor }));
      setBrandData(prev => ({ ...prev, [colorKey]: defaultColor }));
    } catch (error) {
      console.error('Error adding alt color:', error);
    }
  };

  const handleRemoveAltColor = async (colorKey, groupName) => {
    if (!editable || !brandId || !colorKey) return;
    
    try {
      await removeAltColorAndTokens(brandId, colorKey, groupName);
      
      // Update local state
      setFoundation(prev => ({ ...prev, [colorKey]: null }));
      setBrandData(prev => ({ ...prev, [colorKey]: null }));
      
      // Remove the color tokens from local state
      setColorTokens(prev => prev.filter(token => token.group !== groupName));
    } catch (error) {
      console.error('Error removing alt color:', error);
    }
  };

  const handleColorSave = async (newColor) => {
    if (!brandId || !colorEditDialog.colorKey) return;
    
    try {
      const updates = { [colorEditDialog.colorKey]: newColor };
      await updateBrandColorsData(brandId, updates);
      
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
      
      await updateBrandColorsData(brandId, { [colorEditDialog.colorKey]: colorEditDialog.currentValue });
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

  const handleBrandChange = (event, newValue) => {
    setActiveTab(newValue);
    setSelectedBrandId(availableBrands[newValue]?.id);
  };

  const copyToClipboard = async (color) => {
    await navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  // If no brand data is available
  if (!brand) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        <Typography variant="body2">
          No brand data available to preview.
        </Typography>
      </Alert>
    );
  }

  // If we have multiple brands but none are loaded yet
  if (isMultipleBrands && availableBrands.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography>Loading brands...</Typography>
      </Box>
    );
  }

  // If we have a single brand but no ID
  if (!isMultipleBrands && !brandId) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        <Typography variant="body2">
          No brand ID available to preview.
        </Typography>
      </Alert>
    );
  }

  // If loading brand data
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
      {/* Brand Tabs - Only show if we have multiple brands */}
      {isMultipleBrands && availableBrands.length > 1 && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleBrandChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                color: semanticColors?.text.secondary,
                '&.Mui-selected': {
                  color: semanticColors?.brand.primary
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: semanticColors?.brand.primary
              }
            }}
          >
            {availableBrands.map((brand, index) => (
              <Tab 
                key={brand.id} 
                label={brand.title || `Brand ${index + 1}`}
                sx={{ 
                  textTransform: 'none',
                  fontWeight: brand.status === 'primary' ? 600 : 400,
                }}
              />
            ))}
          </Tabs>
        </Box>
      )}
      
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
          value={brandData?.title || 'Brand Board'}
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
          onRemoveAltColor={handleRemoveAltColor}
          editable={editable}
          surfaceBg={surfaceBg}
        />
      )}

      {/* Typography */}
      {typographyTokens.length > 0 && (
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
            bgcolor: surfaceBg,
            border: '1px solid',
            borderColor: semanticColors?.border.base || 'divider'
          }}>
            {typographyTokens
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
      <CopyFeedback copiedColor={copiedColor} />

      {/* Color Edit Dialog */}
      <ColorEditDialog
        open={colorEditDialog.open}
        colorKey={colorEditDialog.colorKey}
        currentValue={colorEditDialog.currentValue}
        colorName={colorEditDialog.colorName}
        regeneratingColor={regeneratingColor}
        onClose={() => setColorEditDialog({ open: false, colorKey: '', currentValue: '', colorName: '' })}
        onValueChange={(value) => setColorEditDialog(prev => ({ ...prev, currentValue: value }))}
        onSaveColor={handleColorSave}
        onRegenerateScale={handleRegenerateColorScale}
      />
    </Box>
  );
};

// Also provide a default export for flexibility
export default BrandBoardContent;