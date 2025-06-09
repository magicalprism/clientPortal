import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { createClient } from '@/lib/supabase/browser';

/**
 * Generates and downloads an Elementor-compatible ZIP file
 * @param {string|object} brandInput - Either a brandId (string) or complete brand object
 * @param {string} exportMode - 'optimized' (default) or 'full'
 */
export async function generateElementorExportZip(brandInput, exportMode = 'optimized') {
  try {
    // Handle both brandId and brand object inputs
    let brandData;
    
    if (typeof brandInput === 'string') {
      // brandInput is a brandId, fetch the data
      brandData = await fetchBrandWithTokens(brandInput);
    } else if (brandInput && brandInput.id) {
      // brandInput is a brand object, fetch additional token data
      const brandId = brandInput.id;
      const tokenData = await fetchBrandTokens(brandId);
      brandData = {
        ...brandInput,
        ...tokenData
      };
    } else {
      throw new Error('Invalid brand input: must be a brandId string or brand object with id');
    }
    
    // Log relational data found for manifest
    console.log(`🏢 Author: ${brandData.company?.title || 'No company found'}`);
    console.log(`🌐 Site URL: ${brandData.projects?.[0]?.url || 'No project URLs found'}`);
    console.log(`📁 Projects: ${brandData.projects?.length || 0} linked`);
    
    // Debug color and font data
    console.log(`🎨 Color tokens found: ${brandData.colorTokens?.length || 0}`);
    console.log(`🔤 Typography tokens found: ${brandData.typographyTokens?.length || 0}`);
    console.log(`📱 Font files found: ${brandData.fontFiles?.length || 0}`);
    
    if (brandData.fontFiles?.length > 0) {
      console.log('📱 Font files:', brandData.fontFiles.map(f => ({ id: f.id, title: f.title })));
    }
    
    if (brandData.colorTokens?.length === 0) {
      console.warn('⚠️ No color tokens found! Colors will not be exported.');
    }
    
    const zip = new JSZip();

    // 1. Create manifest.json with real relational data
    const manifest = await buildManifest(brandData);

    // 2. Create site-settings.json with FIXED design tokens
    const settings = buildSiteSettings(brandData, exportMode);

    // 3. Generate font upload instructions
    const customFonts = generateFontUploadInstructions(brandData);
    
    if (customFonts.length > 0) {
      const fontInstructions = {
        instructions: "Upload these custom fonts to WordPress before importing the design system",
        fonts: customFonts,
        upload_methods: [
          "1. Elementor Pro → Custom Fonts (recommended)",
          "2. WordPress plugin like 'Easy Google Fonts' or 'Custom Fonts'", 
          "3. Upload via FTP to /wp-content/themes/your-theme/assets/fonts/"
        ],
        elementor_steps: [
          "1. Go to Elementor → Custom Fonts",
          "2. Click 'Add New Font'", 
          "3. Upload WOFF2 and WOFF files for each font",
          "4. Set proper font family name exactly as shown",
          "5. Import this design system after fonts are uploaded"
        ]
      };
      
      zip.file("font-upload-instructions.json", JSON.stringify(fontInstructions, null, 2));
    }

    // 4. Add files to zip
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    zip.file("site-settings.json", JSON.stringify(settings, null, 2));

    // 5. Generate zip and download with proper filename
    const blob = await zip.generateAsync({ type: 'blob' });
    const safeBrandName = (brandData.title || 'brand')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const modeIndicator = exportMode === 'full' ? '-complete' : '';
    const filename = `elementor-${safeBrandName}-design-system${modeIndicator}.zip`;
    saveAs(blob, filename);

    const colorCount = brandData.colorTokens?.length || 0;
    const exportedCount = exportMode === 'optimized' ? '~30-50' : `${colorCount}+`;
    const fontMessage = customFonts.length > 0 
      ? ` (${customFonts.length} custom fonts need upload - see font-upload-instructions.json)`
      : ' (using Google Fonts/system fonts)';
    
    console.log(`✅ Elementor export (${exportMode}) generated successfully:`, filename);
    return { 
      success: true, 
      filename,
      customFonts,
      message: `Design system exported successfully as ${filename} (${exportedCount} colors)${fontMessage}`
    };

  } catch (error) {
    console.error('[generateElementorExportZip] Error:', error);
    throw error;
  }
}

/**
 * Fetches brand data with all design tokens AND relational data for manifest
 */
async function fetchBrandWithTokens(brandId) {
  const supabase = createClient();
  
  try {
    // Fetch brand data
    const { data: brand, error: brandError } = await supabase
      .from('brand')
      .select('*')
      .eq('id', brandId)
      .single();

    if (brandError) throw brandError;

    // Fetch company data for author info
    let companyData = null;
    if (brand.company_id) {
      const { data: company, error: companyError } = await supabase
        .from('company')
        .select('id, title, url')
        .eq('id', brand.company_id)
        .single();
      
      if (!companyError && company) {
        companyData = company;
      }
    }

    // Fetch project data through brand_project junction
    let projectsData = [];
    const { data: brandProjects, error: brandProjectError } = await supabase
      .from('brand_project')
      .select(`
        project_id,
        project:project_id (
          id,
          title,
          url,
          staging_url
        )
      `)
      .eq('brand_id', brandId);

    if (!brandProjectError && brandProjects) {
      projectsData = brandProjects
        .map(bp => bp.project)
        .filter(Boolean); // Remove any null projects
    }

    // Fetch color tokens
    const { data: colorTokens, error: colorError } = await supabase
      .from('color')
      .select('*')
      .eq('brand_id', brandId)
      .order('group', { ascending: true });

    if (colorError) throw colorError;

    // Fetch typography tokens
    const { data: typographyTokens, error: typographyError } = await supabase
      .from('typography')
      .select('*')
      .eq('brand_id', brandId)
      .order('group_name', { ascending: true });

    if (typographyError) throw typographyError;

    // Fetch font files for the brand
    const fontIds = [
      brand.primary_font,
      brand.secondary_font,
      brand.body_font,
      brand.accent_font,
      brand.italic_primary_font,
      brand.italic_secondary_font,
      brand.italic_body_font,
      brand.italic_accent_font
    ].filter(Boolean);

    let fontFiles = [];
    if (fontIds.length > 0) {
      const { data: fonts, error: fontError } = await supabase
        .from('media')
        .select('id, title, url')
        .in('id', fontIds);

      if (!fontError) {
        fontFiles = fonts || [];
      }
    }

    return {
      ...brand,
      colorTokens: colorTokens || [],
      typographyTokens: typographyTokens || [],
      fontFiles,
      company: companyData,
      projects: projectsData
    };

  } catch (error) {
    console.error('Error fetching brand data:', error);
    throw error;
  }
}

/**
 * Fetches just the design tokens and relational data for a brand (when brand data already exists)
 */
async function fetchBrandTokens(brandId) {
  const supabase = createClient();
  
  try {
    // Fetch company data for author info
    const { data: brand, error: brandError } = await supabase
      .from('brand')
      .select('company_id')
      .eq('id', brandId)
      .single();

    if (brandError) throw brandError;

    let companyData = null;
    if (brand.company_id) {
      const { data: company, error: companyError } = await supabase
        .from('company')
        .select('id, title, url')
        .eq('id', brand.company_id)
        .single();
      
      if (!companyError && company) {
        companyData = company;
      }
    }

    // Fetch project data through brand_project junction
    let projectsData = [];
    const { data: brandProjects, error: brandProjectError } = await supabase
      .from('brand_project')
      .select(`
        project_id,
        project:project_id (
          id,
          title,
          url,
          staging_url
        )
      `)
      .eq('brand_id', brandId);

    if (!brandProjectError && brandProjects) {
      projectsData = brandProjects
        .map(bp => bp.project)
        .filter(Boolean);
    }

    // Fetch color tokens
    const { data: colorTokens, error: colorError } = await supabase
      .from('color')
      .select('*')
      .eq('brand_id', brandId)
      .order('group', { ascending: true });

    if (colorError) throw colorError;

    // Fetch typography tokens
    const { data: typographyTokens, error: typographyError } = await supabase
      .from('typography')
      .select('*')
      .eq('brand_id', brandId)
      .order('group_name', { ascending: true });

    if (typographyError) throw typographyError;

    return {
      colorTokens: colorTokens || [],
      typographyTokens: typographyTokens || [],
      fontFiles: [], // Could fetch font files here if needed
      company: companyData,
      projects: projectsData
    };

  } catch (error) {
    console.error('Error fetching brand tokens:', error);
    throw error;
  }
}

/**
 * Fetches the latest Elementor version from WordPress.org API
 */
async function fetchLatestElementorVersion() {
  try {
    const response = await fetch('https://api.wordpress.org/plugins/info/1.0/elementor.json');
    const data = await response.json();
    
    if (data && data.version) {
      console.log(`📦 Latest Elementor version: ${data.version}`);
      return data.version;
    }
    
    // Fallback to recent known version based on search results
    return "3.29.2";
  } catch (error) {
    console.warn('Could not fetch latest Elementor version, using fallback:', error);
    // Fallback to recent known version
    return "3.29.2";
  }
}

/**
 * Enhanced manifest builder with real relational data
 */
async function buildManifest(brand) {
  // Get latest Elementor version
  const elementorVersion = await fetchLatestElementorVersion();
  
  // Determine author from company relationship
  const author = brand.company?.title || "Design System Export";
  
  // Get primary project URL for site field
  const primaryProject = brand.projects?.find(p => p.url) || brand.projects?.[0];
  const siteUrl = primaryProject?.url || `https://${brand.title?.toLowerCase().replace(/\s+/g, '')}.com`;
  
  // Create comprehensive description
  const description = `Complete design system export for ${brand.title || 'Brand'}${brand.company ? ` by ${brand.company.title}` : ''} including colors, typography, and global styles optimized for Elementor.`;
  
  const projectCount = brand.projects?.length || 0;
  const projectsList = projectCount > 0 
    ? ` Used across ${projectCount} project${projectCount > 1 ? 's' : ''}: ${brand.projects.map(p => p.title).join(', ')}.`
    : '';

  return {
    name: "",
    title: `${brand.title || 'Brand'} Design System`,
    description: description + projectsList,
    author: author,
    version: "2.0",
    elementor_version: elementorVersion,
    created: new Date().toISOString(),
    thumbnail: false,
    site: siteUrl,
    "site-settings": [
      "global-colors",
      "global-typography", 
      "theme-style-typography",
      "theme-style-buttons",
      "theme-style-images",
      "theme-style-form-fields",
      "settings-background",
      "settings-layout",
      "settings-lightbox"
    ],
    plugins: [
      {
        name: "Elementor",
        plugin: "elementor/elementor",
        pluginUri: "https://elementor.com",
        version: elementorVersion
      }
    ],
    // Additional metadata for better organization
    metadata: {
      brand_id: brand.id,
      company_id: brand.company?.id || null,
      project_count: projectCount,
      color_count: brand.colorTokens?.length || 0,
      typography_count: brand.typographyTokens?.length || 0,
      export_timestamp: new Date().toISOString()
    }
  };
}

/**
 * Builds the site-settings.json with design tokens
 */
function buildSiteSettings(brand, exportMode = 'optimized') {
  console.log('⚙️ Building site settings...');
  console.log('⚙️ Brand data keys:', Object.keys(brand));
  
  const systemColors = buildSystemColors(brand);
  const customColors = buildCustomColors(brand.colorTokens, exportMode);
  const systemTypography = buildSystemTypography(brand);
  const customTypography = buildCustomTypography(brand.typographyTokens);
  const themeStyles = buildThemeStyles(brand);
  
  const settings = {
    content: [],
    settings: {
      template: "default",
      
      // System colors (Elementor's built-in color slots)
      system_colors: systemColors,
      
      // Custom colors (from your color tokens)
      custom_colors: customColors,
      
      // System typography (Elementor's built-in typography)
      system_typography: systemTypography,
      
      // Custom typography (from your typography tokens)
      custom_typography: customTypography,
      
      // Default font fallback
      default_generic_fonts: "Sans-serif",
      
      // Page title styling
      page_title_selector: "h1.entry-title",
      
      // Theme styling
      ...themeStyles,
      
      // Viewport settings
      viewport_md: 768,
      viewport_lg: 1141,
      viewport_tablet: 1140,
      container_width_tablet: { unit: "px", size: 1140, sizes: [] }
    },
    metadata: []
  };
  
  console.log('⚙️ Final site settings structure:', {
    systemColorsCount: systemColors.length,
    customColorsCount: customColors.length,
    systemTypographyCount: systemTypography.length,
    customTypographyCount: customTypography.length,
    hasThemeStyles: Object.keys(themeStyles).length > 0
  });
  
  return settings;
}

/**
 * Maps brand foundation colors to Elementor's weird system naming
 * Elementor uses: primary=heading, secondary=heading, text=body, accent=brand
 */
function buildSystemColors(brand) {
  console.log('🎨 Building system colors from brand:', {
    primary_color: brand.primary_color,
    secondary_color: brand.secondary_color,
    neutral_color_100: brand.neutral_color_100,
    neutral_color_900: brand.neutral_color_900
  });
  
  const systemColors = [
    {
      _id: "primary",
      title: "Primary Heading Text", // Elementor: primary heading text color
      color: brand.neutral_color_900 || "#1D1B18"
    },
    {
      _id: "secondary", 
      title: "Secondary Heading Text", // Elementor: secondary heading or inverted text
      color: brand.neutral_color_100 || "#FFFFFF"
    },
    {
      _id: "text",
      title: "Body Text", // Elementor: body text color
      color: brand.neutral_color_900 || "#1D1B18"
    },
    {
      _id: "accent",
      title: "Brand Accent", // Elementor: what we'd call "primary brand color"
      color: brand.primary_color || "#3B82F6"
    }
  ];
  
  console.log('🎨 Generated system colors:', systemColors);
  return systemColors;
}

/**
 * Converts color tokens to Elementor custom colors 
 * @param {Array} colorTokens - Array of color tokens
 * @param {string} exportMode - 'optimized' or 'full'
 */
function buildCustomColors(colorTokens, exportMode = 'optimized') {
  // Add debugging
  console.log(`🎨 buildCustomColors called with ${colorTokens?.length || 0} tokens, mode: ${exportMode}`);
  
  if (!colorTokens || colorTokens.length === 0) {
    console.warn('⚠️ No color tokens provided to buildCustomColors');
    return [];
  }
  
  if (exportMode === 'full') {
    return buildCustomColorsComplete(colorTokens);
  }
  
  return buildCustomColorsOptimized(colorTokens);
}

/**
 * PERFORMANCE OPTIMIZED export - only essential colors (~30-50 colors)
 */
function buildCustomColorsOptimized(colorTokens) {
  console.log(`🎨 Building optimized colors from ${colorTokens.length} tokens`);
  
  const customColors = [];
  
  // Helper to create color entry with mode indication
  const createColorEntry = (token, modePrefix = '') => {
    const colorId = generateColorId(token.token);
    const title = modePrefix 
      ? `${modePrefix} ${token.title || formatTokenName(token.token)}`
      : token.title || formatTokenName(token.token);
    
    const entry = {
      _id: colorId,
      title: title,
      color: token.resolved || token.value || '#000000'
    };
    
    console.log(`🎨 Created color entry:`, entry);
    return entry;
  };

  // Helper to get key scales only (100, 500, 900 - most commonly used)
  const getKeyScales = (tokens) => {
    const keyScales = ['100', '500', '900'];
    const filtered = tokens.filter(token => {
      const scale = token.token.split('.').pop();
      return keyScales.includes(scale);
    }).sort((a, b) => {
      const getScale = (token) => parseInt(token.token.split('.').pop(), 10);
      return getScale(a) - getScale(b);
    });
    
    console.log(`🎨 Filtered ${tokens.length} tokens to ${filtered.length} key scales:`, filtered.map(t => t.token));
    return filtered;
  };

  // 1. ESSENTIAL SEMANTIC COLORS ONLY
  const essentialSemanticTokens = colorTokens.filter(token => {
    if (token.type !== 'alias') return false;
    
    const tokenName = token.token.toLowerCase();
    const isEssential = (
      tokenName.includes('text.primary') ||
      tokenName.includes('text.secondary') ||
      tokenName.includes('bg.default') ||
      tokenName.includes('bg.surface') ||
      tokenName.includes('button.primary.bg') ||
      tokenName.includes('button.secondary.bg') ||
      tokenName.includes('brand.primary') ||
      tokenName.includes('border.base')
    );
    
    if (isEssential) {
      console.log(`🎨 Found essential semantic token: ${token.token}`);
    }
    
    return isEssential;
  });
  
  console.log(`🎨 Found ${essentialSemanticTokens.length} essential semantic tokens`);
  
  essentialSemanticTokens.forEach(token => {
    const modePrefix = token.mode === 'lightmode' ? 'Light' : 
                      token.mode === 'darkmode' ? 'Dark' : '';
    customColors.push(createColorEntry(token, modePrefix));
  });

  // 2. KEY BASE COLORS (only 100, 500, 900 scales)
  const baseGroups = ['primary', 'secondary', 'neutral'];
  
  baseGroups.forEach(group => {
    const groupTokens = colorTokens.filter(token => 
      token.type === 'base' && token.group === group
    );
    
    console.log(`🎨 Found ${groupTokens.length} base tokens for group: ${group}`);
    
    getKeyScales(groupTokens).forEach(token => {
      customColors.push(createColorEntry(token));
    });
  });

  // 3. ALWAYS INCLUDE WHITE AND TRANSPARENT
  customColors.push({
    _id: "ffffff",
    title: "White",
    color: "#FFFFFF"
  });
  
  customColors.push({
    _id: "transparent", 
    title: "Transparent",
    color: "#FFFFFF00"
  });

  // 4. ALT COLORS (only if they exist, only key scales)
  const altGroups = ['alt1', 'alt2', 'alt3', 'alt4'];
  
  altGroups.forEach(group => {
    const groupTokens = colorTokens.filter(token => 
      token.type === 'base' && token.group === group
    );
    
    if (groupTokens.length > 0) {
      console.log(`🎨 Found ${groupTokens.length} alt tokens for group: ${group}`);
      getKeyScales(groupTokens).forEach(token => {
        customColors.push(createColorEntry(token, 'Alt'));
      });
    }
  });

  // 5. STATUS COLORS (only the main 500 scale)
  const statusGroups = ['success', 'error', 'warning', 'info'];
  
  statusGroups.forEach(group => {
    const mainToken = colorTokens.find(token => 
      token.type === 'base' && 
      token.group === group && 
      token.token.endsWith('.500')
    );
    
    if (mainToken) {
      console.log(`🎨 Found status token for ${group}: ${mainToken.token}`);
      customColors.push(createColorEntry(mainToken, 'Status'));
    }
  });

  console.log(`📊 Elementor export (optimized): Generated ${customColors.length} colors`);
  console.log('🎨 Final custom colors:', customColors);
  return customColors;
}

/**
 * COMPLETE export - all color tokens (100-200+ colors)
 */
function buildCustomColorsComplete(colorTokens) {
  const customColors = [];
  
  // Helper to sort colors by scale (100, 200, 300, etc.)
  const sortByScale = (tokens) => {
    return tokens.sort((a, b) => {
      const getScale = (token) => {
        const parts = token.token.split('.');
        const lastPart = parts[parts.length - 1];
        const scale = parseInt(lastPart, 10);
        return isNaN(scale) ? 0 : scale;
      };
      return getScale(a) - getScale(b);
    });
  };

  // Helper to create color entry with mode indication
  const createColorEntry = (token, modePrefix = '') => {
    const colorId = generateColorId(token.token);
    const title = modePrefix 
      ? `${modePrefix} ${token.title || formatTokenName(token.token)}`
      : token.title || formatTokenName(token.token);
    
    return {
      _id: colorId,
      title: title,
      color: token.resolved || token.value
    };
  };

  // 1. ALL SEMANTIC COLORS
  const semanticTokens = colorTokens.filter(token => token.type === 'alias');
  
  semanticTokens.forEach(token => {
    const modePrefix = token.mode === 'lightmode' ? 'Light' : 
                      token.mode === 'darkmode' ? 'Dark' : '';
    customColors.push(createColorEntry(token, modePrefix));
  });

  // 2. ALL BASE COLOR SCALES (complete 100-900)
  const baseGroups = ['primary', 'secondary', 'neutral'];
  
  baseGroups.forEach(group => {
    const groupTokens = colorTokens.filter(token => 
      token.type === 'base' && token.group === group
    );
    
    sortByScale(groupTokens).forEach(token => {
      customColors.push(createColorEntry(token));
    });
  });

  // 3. WHITE AND TRANSPARENT
  customColors.push({
    _id: "ffffff",
    title: "White",
    color: "#FFFFFF"
  });
  
  customColors.push({
    _id: "transparent", 
    title: "Transparent",
    color: "#FFFFFF00"
  });

  // 4. ALL ALT COLORS (complete scales)
  const altGroups = ['alt1', 'alt2', 'alt3', 'alt4'];
  
  altGroups.forEach(group => {
    const groupTokens = colorTokens.filter(token => 
      token.type === 'base' && token.group === group
    );
    
    if (groupTokens.length > 0) {
      sortByScale(groupTokens).forEach(token => {
        customColors.push(createColorEntry(token, 'Alt'));
      });
    }
  });

  // 5. ALL STATUS COLORS (complete scales)
  const statusGroups = ['success', 'error', 'warning', 'info'];
  
  statusGroups.forEach(group => {
    const groupTokens = colorTokens.filter(token => 
      token.type === 'base' && token.group === group
    );
    
    if (groupTokens.length > 0) {
      sortByScale(groupTokens).forEach(token => {
        customColors.push(createColorEntry(token, 'Status'));
      });
    }
  });

  console.log(`📊 Elementor export (complete): ${customColors.length} colors`);
  return customColors;
}

// === FIXED TYPOGRAPHY FUNCTIONS ===

/**
 * FIXED: Maps brand fonts to Elementor's system typography with proper font handling
 */
function buildSystemTypography(brand) {
  console.log('🔤 Building system typography with proper font mapping...');
  
  const typography = [];
  
  // Map fonts with proper fallbacks and Google Font detection
  const primaryFont = getElementorFontFamily(brand.primary_font, brand.fontFiles, 'sans-serif');
  const secondaryFont = getElementorFontFamily(brand.secondary_font, brand.fontFiles, 'sans-serif'); 
  const bodyFont = getElementorFontFamily(brand.body_font, brand.fontFiles, 'sans-serif');
  const accentFont = getElementorFontFamily(brand.accent_font, brand.fontFiles, 'sans-serif');
  
  console.log('🔤 Final font mappings:', {
    primary: primaryFont,
    secondary: secondaryFont, 
    body: bodyFont,
    accent: accentFont
  });
  
  // Primary = Main headings (H1, H2)
  typography.push({
    _id: "primary",
    title: "Primary Headings",
    typography_typography: "custom",
    typography_font_family: primaryFont,
    typography_font_weight: "700",
    typography_font_size: { unit: "rem", size: 2.5, sizes: [] },
    typography_letter_spacing: { unit: "px", size: -0.5, sizes: [] },
    typography_line_height: { unit: "em", size: 1.1, sizes: [] },
    typography_font_style: "normal"
  });
  
  // Secondary = Sub headings  
  typography.push({
    _id: "secondary",
    title: "Secondary Headings", 
    typography_typography: "custom",
    typography_font_family: secondaryFont,
    typography_font_weight: "600",
    typography_font_size: { unit: "rem", size: 1.5, sizes: [] },
    typography_letter_spacing: { unit: "px", size: 0, sizes: [] },
    typography_line_height: { unit: "em", size: 1.3, sizes: [] }
  });
  
  // Text = Body text
  typography.push({
    _id: "text", 
    title: "Body Text",
    typography_typography: "custom",
    typography_font_family: bodyFont,
    typography_font_weight: "400",
    typography_font_size: { unit: "rem", size: 1, sizes: [] },
    typography_line_height: { unit: "em", size: 1.6, sizes: [] },
    typography_letter_spacing: { unit: "px", size: 0, sizes: [] }
  });
  
  // Accent = Brand elements
  typography.push({
    _id: "accent",
    title: "Brand Accent",
    typography_typography: "custom",
    typography_font_family: accentFont, 
    typography_font_weight: "600",
    typography_font_size: { unit: "rem", size: 1, sizes: [] },
    typography_letter_spacing: { unit: "px", size: 0.5, sizes: [] },
    typography_line_height: { unit: "em", size: 1.4, sizes: [] }
  });
  
  console.log(`🔤 Generated ${typography.length} system typography styles with proper fonts`);
  return typography;
}

/**
 * Converts typography tokens to Elementor custom typography
 */
function buildCustomTypography(typographyTokens) {
  const customTypography = [];
  
  // Focus on semantic typography tokens that map well to Elementor usage
  const semanticTokens = typographyTokens.filter(token => 
    token.type === 'alias' && token.category && 
    ['display', 'heading', 'body', 'ui'].includes(token.category)
  );
  
  semanticTokens.forEach(token => {
    const typographyId = generateTypographyId(token.token);
    
    customTypography.push({
      _id: typographyId,
      title: token.title || formatTypographyTokenName(token.token),
      typography_typography: "custom",
      typography_font_family: extractFontFamily(token.font_family),
      typography_font_size: convertToElementorSize(token.font_size),
      typography_font_weight: convertToElementorWeight(token.font_weight),
      typography_line_height: convertToElementorLineHeight(token.line_height),
      typography_letter_spacing: convertToElementorSpacing(token.letter_spacing),
      typography_text_transform: token.text_transform || "none",
      typography_font_style: token.font_style || "normal"
    });
  });
  
  return customTypography;
}

/**
 * FIXED: Build theme-specific styling with proper font families
 */
function buildThemeStyles(brand) {
  console.log('🎨 Building theme styles with proper fonts...');
  
  // Get proper font families for all headings and body
  const h1Font = getElementorFontFamily(brand.primary_font, brand.fontFiles, 'sans-serif');
  const h2Font = getElementorFontFamily(brand.primary_font, brand.fontFiles, 'sans-serif');
  const h3Font = getElementorFontFamily(brand.secondary_font, brand.fontFiles, 'sans-serif');
  const h4Font = getElementorFontFamily(brand.secondary_font, brand.fontFiles, 'sans-serif');
  const bodyFont = getElementorFontFamily(brand.body_font, brand.fontFiles, 'sans-serif');
  
  const themeStyles = {
    // Global link colors
    link_normal_color: brand.primary_color || "#3B82F6",
    
    // H1 - Main headings
    h1_typography_typography: "custom",
    h1_typography_font_family: h1Font,
    h1_typography_font_size: { unit: "rem", size: 3, sizes: [] },
    h1_typography_font_weight: "700",
    h1_typography_line_height: { unit: "em", size: 1.1, sizes: [] },
    h1_typography_letter_spacing: { unit: "px", size: -0.5, sizes: [] },
    
    // H2 - Major headings  
    h2_typography_typography: "custom",
    h2_typography_font_family: h2Font,
    h2_typography_font_size: { unit: "rem", size: 2.2, sizes: [] },
    h2_typography_font_weight: "700",
    h2_typography_line_height: { unit: "em", size: 1.2, sizes: [] },
    h2_typography_letter_spacing: { unit: "px", size: -0.3, sizes: [] },
    
    // H3 - Sub headings
    h3_typography_typography: "custom", 
    h3_typography_font_family: h3Font,
    h3_typography_font_size: { unit: "rem", size: 1.8, sizes: [] },
    h3_typography_font_weight: "600",
    h3_typography_line_height: { unit: "em", size: 1.3, sizes: [] },
    h3_typography_letter_spacing: { unit: "px", size: 0, sizes: [] },
    
    // H4 - Smaller headings
    h4_typography_typography: "custom",
    h4_typography_font_family: h4Font,
    h4_typography_font_size: { unit: "rem", size: 1.4, sizes: [] },
    h4_typography_font_weight: "600", 
    h4_typography_line_height: { unit: "em", size: 1.4, sizes: [] },
    
    // Body typography
    body_typography_typography: "custom",
    body_typography_font_family: bodyFont,
    body_typography_font_weight: "400",
    body_typography_line_height: { unit: "em", size: 1.6, sizes: [] },
    body_typography_font_size: { unit: "rem", size: 1, sizes: [] },
    
    // Button styling
    button_text_color: brand.neutral_color_100 || "#FFFFFF",
    button_background_color: brand.primary_color || "#3B82F6",
    button_padding: { unit: "px", top: "12", right: "24", bottom: "12", left: "24", isLinked: false },
    
    // Border styling  
    border_color: brand.neutral_color_300 || "#E5E7EB"
  };
  
  console.log('🎨 Generated theme styles with proper font families');
  return themeStyles;
}

// === FONT DETECTION AND MAPPING FUNCTIONS ===

/**
 * Maps font names to Google Fonts or provides proper fallbacks
 */
function getElementorFontFamily(fontId, fontFiles, fallbackCategory = 'sans-serif') {
  console.log(`🔤 Getting Elementor font family for fontId: ${fontId}`);
  
  // 1. Try to get custom font name from files
  let fontName = getFontNameFromId(fontId, fontFiles);
  
  // 2. Check if it matches a Google Font
  if (fontName) {
    const googleFontName = mapToGoogleFont(fontName);
    if (googleFontName) {
      console.log(`🔤 Mapped to Google Font: ${googleFontName}`);
      return googleFontName;
    }
  }
  
  // 3. Create proper font family with fallbacks
  if (fontName) {
    const cleanName = cleanFontName(fontName);
    const fallback = getFallbackStack(fallbackCategory);
    const fontFamily = `"${cleanName}", ${fallback}`;
    console.log(`🔤 Custom font with fallbacks: ${fontFamily}`);
    return fontFamily;
  }
  
  // 4. Return system fallback
  const systemFallback = getSystemFontStack(fallbackCategory);
  console.log(`🔤 Using system fallback: ${systemFallback}`);
  return systemFallback;
}

/**
 * Maps common font names to Google Fonts
 */
function mapToGoogleFont(fontName) {
  const googleFontMap = {
    // Popular Google Fonts
    'Inter': 'Inter',
    'Roboto': 'Roboto', 
    'Open Sans': 'Open Sans',
    'Lato': 'Lato',
    'Montserrat': 'Montserrat',
    'Source Sans Pro': 'Source Sans Pro',
    'Raleway': 'Raleway',
    'Ubuntu': 'Ubuntu',
    'Nunito': 'Nunito',
    'Poppins': 'Poppins',
    'Playfair Display': 'Playfair Display',
    'Merriweather': 'Merriweather',
    'PT Sans': 'PT Sans',
    'Noto Sans': 'Noto Sans',
    'Work Sans': 'Work Sans',
    'Fira Sans': 'Fira Sans',
    'DM Sans': 'DM Sans',
    'Plus Jakarta Sans': 'Plus Jakarta Sans',
    
    // Common variations/aliases
    'Inter UI': 'Inter',
    'OpenSans': 'Open Sans',
    'SourceSansPro': 'Source Sans Pro',
    'PlayfairDisplay': 'Playfair Display',
    'WorkSans': 'Work Sans',
    'FiraSans': 'Fira Sans',
    'DMSans': 'DM Sans',
  };
  
  // Try exact match first
  if (googleFontMap[fontName]) {
    return googleFontMap[fontName];
  }
  
  // Try case-insensitive match
  const normalizedInput = fontName.toLowerCase().replace(/\s+/g, '');
  for (const [key, value] of Object.entries(googleFontMap)) {
    const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
    if (normalizedInput === normalizedKey) {
      return value;
    }
  }
  
  return null;
}

/**
 * Cleans font names for proper usage
 */
function cleanFontName(fontName) {
  return fontName
    .replace(/\.(woff2?|ttf|otf)$/i, '') // Remove extensions
    .replace(/[_-]/g, ' ') // Replace separators with spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

/**
 * Gets proper fallback stack by category
 */
function getFallbackStack(category) {
  const fallbacks = {
    'serif': 'Georgia, "Times New Roman", Times, serif',
    'sans-serif': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'monospace': '"SF Mono", Monaco, Inconsolata, "Roboto Mono", "Consolas", monospace',
    'display': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  };
  
  return fallbacks[category] || fallbacks['sans-serif'];
}

/**
 * Gets system font stack by category  
 */
function getSystemFontStack(category) {
  const systemStacks = {
    'serif': 'Georgia, "Times New Roman", Times, serif',
    'sans-serif': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
    'monospace': '"SF Mono", Monaco, Inconsolata, "Roboto Mono", Consolas, "Courier New", monospace',
    'display': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  };
  
  return systemStacks[category] || systemStacks['sans-serif'];
}

/**
 * Generates instructions for uploading custom fonts to WordPress/Elementor
 */
function generateFontUploadInstructions(brand) {
  const customFonts = [];
  
  // Check each brand font
  [
    { id: brand.primary_font, usage: 'Primary headings (H1, H2)' },
    { id: brand.secondary_font, usage: 'Secondary headings (H3, H4)' }, 
    { id: brand.body_font, usage: 'Body text and paragraphs' },
    { id: brand.accent_font, usage: 'Buttons and CTAs' }
  ].forEach(({ id, usage }) => {
    if (id && brand.fontFiles) {
      const fontFile = brand.fontFiles.find(f => f.id === id);
      if (fontFile) {
        const fontName = cleanFontName(fontFile.title);
        if (!mapToGoogleFont(fontName)) {
          customFonts.push({
            name: fontName,
            file: fontFile.title,
            url: fontFile.url,
            usage: usage
          });
        }
      }
    }
  });
  
  return customFonts;
}

// === Helper Functions ===

/**
 * Gets font name from media ID with fallback to brand font family strings
 */
function getFontNameFromId(fontId, fontFiles) {
  console.log(`🔤 getFontNameFromId called with fontId: ${fontId}, fontFiles: ${fontFiles?.length || 0}`);
  
  if (!fontId) {
    console.log('🔤 No fontId provided, returning null');
    return null;
  }
  
  if (fontFiles && fontFiles.length > 0) {
    const fontFile = fontFiles.find(f => f.id === fontId);
    console.log(`🔤 Found font file:`, fontFile);
    
    if (fontFile?.title) {
      // Clean up font title for Elementor
      const cleanName = fontFile.title
        .replace(/\.(woff2?|ttf|otf)$/i, '') // Remove file extensions
        .replace(/[_-]/g, ' ') // Replace underscores/hyphens with spaces
        .trim();
      
      console.log(`🔤 Cleaned font name: "${cleanName}"`);
      return cleanName;
    }
  }
  
  console.log(`🔤 No font found for ID ${fontId}, returning null`);
  return null;
}

/**
 * Generates a unique color ID for Elementor
 */
function generateColorId(tokenName) {
  const baseId = tokenName
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 7)
    .toLowerCase();
    
  const randomSuffix = Math.random().toString(36).substring(2, 4);
  const fullId = baseId + randomSuffix;
  
  console.log(`🎨 Generated color ID: ${tokenName} → ${fullId}`);
  return fullId;
}

/**
 * Generates a unique typography ID for Elementor
 */
function generateTypographyId(tokenName) {
  return tokenName
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 7)
    .toLowerCase() + Math.random().toString(36).substring(2, 4);
}

/**
 * Format token names for better display in Elementor
 */
function formatTokenName(tokenName) {
  return tokenName
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .replace(/lightmode|darkmode/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Formats typography token names for display
 */
function formatTypographyTokenName(tokenName) {
  return tokenName
    .replace('typography.', '')
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Extracts clean font family name from font stack
 */
function extractFontFamily(fontFamily) {
  if (!fontFamily) return "Inter";
  
  // Extract first font from stack (remove quotes and fallbacks)
  const match = fontFamily.match(/^["']?([^"',]+)["']?/);
  return match ? match[1].trim() : "Inter";
}

/**
 * Converts token font size to Elementor format
 */
function convertToElementorSize(fontSize) {
  if (!fontSize) return { unit: "px", size: 16, sizes: [] };
  
  // Handle token references
  if (fontSize.startsWith('font.size.')) {
    const sizeMap = {
      'font.size.2xs': 12, 'font.size.xs': 14, 'font.size.sm': 16,
      'font.size.md': 18, 'font.size.lg': 20, 'font.size.xl': 24,
      'font.size.2xl': 30, 'font.size.3xl': 36, 'font.size.4xl': 48,
      'font.size.5xl': 60, 'font.size.6xl': 72
    };
    return { unit: "px", size: sizeMap[fontSize] || 16, sizes: [] };
  }
  
  // Handle direct values
  const numValue = parseFloat(fontSize);
  if (fontSize.includes('rem')) {
    return { unit: "rem", size: numValue, sizes: [] };
  } else if (fontSize.includes('px')) {
    return { unit: "px", size: numValue, sizes: [] };
  }
  
  return { unit: "px", size: 16, sizes: [] };
}

/**
 * Converts token font weight to Elementor format
 */
function convertToElementorWeight(fontWeight) {
  if (!fontWeight) return "400";
  
  // Handle token references
  if (fontWeight.startsWith('font.weight.')) {
    const weightMap = {
      'font.weight.thin': '100', 'font.weight.light': '300',
      'font.weight.normal': '400', 'font.weight.medium': '500',
      'font.weight.semibold': '600', 'font.weight.bold': '700',
      'font.weight.extrabold': '800', 'font.weight.black': '900'
    };
    return weightMap[fontWeight] || "400";
  }
  
  return fontWeight.toString();
}

/**
 * Converts token line height to Elementor format
 */
function convertToElementorLineHeight(lineHeight) {
  if (!lineHeight) return { unit: "em", size: 1.5, sizes: [] };
  
  // Handle token references  
  if (lineHeight.startsWith('font.lineHeight.')) {
    const lineHeightMap = {
      'font.lineHeight.tight': 1.25, 'font.lineHeight.snug': 1.375,
      'font.lineHeight.normal': 1.5, 'font.lineHeight.relaxed': 1.625,
      'font.lineHeight.loose': 2
    };
    const value = lineHeightMap[lineHeight] || 1.5;
    return { unit: "em", size: value, sizes: [] };
  }
  
  const numValue = parseFloat(lineHeight);
  return { unit: "em", size: numValue || 1.5, sizes: [] };
}

/**
 * Converts token letter spacing to Elementor format
 */
function convertToElementorSpacing(letterSpacing) {
  if (!letterSpacing) return { unit: "px", size: 0, sizes: [] };
  
  // Handle token references
  if (letterSpacing.startsWith('font.letterSpacing.')) {
    const spacingMap = {
      'font.letterSpacing.tighter': -0.8, 'font.letterSpacing.tight': -0.4,
      'font.letterSpacing.normal': 0, 'font.letterSpacing.wide': 0.4,
      'font.letterSpacing.wider': 0.8, 'font.letterSpacing.widest': 1.6
    };
    const value = spacingMap[letterSpacing] || 0;
    return { unit: "px", size: value, sizes: [] };
  }
  
  // Parse em values to px (approximate)
  if (letterSpacing.includes('em')) {
    const emValue = parseFloat(letterSpacing);
    const pxValue = emValue * 16; // Approximate conversion
    return { unit: "px", size: pxValue, sizes: [] };
  }
  
  const numValue = parseFloat(letterSpacing);
  return { unit: "px", size: numValue || 0, sizes: [] };
}