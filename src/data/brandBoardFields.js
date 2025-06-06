// /src/data/brandBoardFields.js

/**
 * Extract color data from brand object
 */
export const getBrandColors = (brand = {}) => [
  { label: 'Primary', value: brand.primary_color },
  { label: 'Secondary', value: brand.secondary_color },
  { label: 'Accent 1', value: brand.primary_accent_color },
  { label: 'Accent 2', value: brand.secondary_accent_color },
  { label: 'Border 1', value: brand.border_primary_color },
  { label: 'Border 2', value: brand.border_secondary_color },
  { label: 'Background 1', value: brand.background_primary_color },
  { label: 'Background 2', value: brand.background_secondary_color },
  { label: 'Alt 1', value: brand.alt_color_1 },
  { label: 'Alt 2', value: brand.alt_color_2 },
  { label: 'Alt 3', value: brand.alt_color_3 },
  { label: 'Alt 4', value: brand.alt_color_4 },
  { label: 'Alt 5', value: brand.alt_color_5 },
  { label: 'Alt 6', value: brand.alt_color_6 },
].filter(c => !!c.value);

/**
 * Extract font data from brand object
 */
export const getBrandFonts = (brand = {}) => {
  // First check if we have the details objects (preferred method)
  if (brand.primary_font_details || brand.secondary_font_details) {
    return [
      {
        label: 'Primary Font',
        url: brand.primary_font_details?.url,
        name: brand.primary_font_details?.alt_text,
        alt_text: brand.primary_font_details?.alt_text
      },
      {
        label: 'Secondary Font',
        url: brand.secondary_font_details?.url,
        name: brand.secondary_font_details?.alt_text,
        alt_text: brand.secondary_font_details?.alt_text
      },
      {
        label: 'Accent Font',
        url: brand.accent_font_details?.url,
        name: brand.accent_font_details?.alt_text,
        alt_text: brand.accent_font_details?.alt_text
      },
      {
        label: 'Body Font',
        url: brand.body_font_details?.url,
        name: brand.body_font_details?.alt_text,
        alt_text: brand.body_font_details?.alt_text
      },
      {
        label: 'Italic Primary',
        url: brand.italic_primary_font_details?.url,
        name: brand.italic_primary_font_details?.alt_text,
        alt_text: brand.italic_primary_font_details?.alt_text
      },
      {
        label: 'Italic Secondary',
        url: brand.italic_secondary_font_details?.url,
        name: brand.italic_secondary_font_details?.alt_text,
        alt_text: brand.italic_secondary_font_details?.alt_text
      },
      {
        label: 'Italic Body',
        url: brand.italic_body_font_details?.url,
        name: brand.italic_body_font_details?.alt_text,
        alt_text: brand.italic_body_font_details?.alt_text
      },
      {
        label: 'Italic Accent',
        url: brand.italic_accent_font_details?.url,
        name: brand.italic_accent_font_details?.alt_text,
        alt_text: brand.italic_accent_font_details?.alt_text
      },
    ].filter(f => !!f.url);
  }

  // Fallback: Log a helpful message for debugging
  console.warn('Brand font details not loaded. Font IDs found:', {
    primary_font: brand.primary_font,
    secondary_font: brand.secondary_font,
    accent_font: brand.accent_font,
    body_font: brand.body_font
  });
  
  console.warn('To fix this, update your brand query to include media relations like:');
  console.warn(`
    // For Supabase:
    .select(\`
      *,
      primary_font_details:primary_font(*),
      secondary_font_details:secondary_font(*),
      accent_font_details:accent_font(*),
      body_font_details:body_font(*),
      italic_primary_font_details:italic_primary_font(*),
      italic_secondary_font_details:italic_secondary_font(*),
      italic_body_font_details:italic_body_font(*),
      italic_accent_font_details:italic_accent_font(*)
    \`)
  `);

  return [];
};

/**
 * Extract logo data from brand object
 */
export const getBrandLogos = (brand = {}) => {
  // First check if we have the details objects (preferred method)
  if (brand.primary_square_logo_details || brand.secondary_square_logo_details || 
      brand.primary_horizontal_logo_details || brand.secondary_horizontal_logo_details || 
      brand.favicon_details) {
    return [
      {
        label: 'Primary Square Logo',
        url: brand.primary_square_logo_details?.url,
        alt_text: brand.primary_square_logo_details?.alt_text
      },
      {
        label: 'Secondary Square Logo',
        url: brand.secondary_square_logo_details?.url,
        alt_text: brand.secondary_square_logo_details?.alt_text
      },
      {
        label: 'Primary Horizontal Logo',
        url: brand.primary_horizontal_logo_details?.url,
        alt_text: brand.primary_horizontal_logo_details?.alt_text
      },
      {
        label: 'Secondary Horizontal Logo',
        url: brand.secondary_horizontal_logo_details?.url,
        alt_text: brand.secondary_horizontal_logo_details?.alt_text
      },
      {
        label: 'Favicon',
        url: brand.favicon_details?.url,
        alt_text: brand.favicon_details?.alt_text
      },
    ].filter(l => !!l.url);
  }

  // Fallback: Log a helpful message for debugging
  console.warn('Brand logo details not loaded. Logo IDs found:', {
    primary_square_logo: brand.primary_square_logo,
    secondary_square_logo: brand.secondary_square_logo,
    primary_horizontal_logo: brand.primary_horizontal_logo,
    secondary_horizontal_logo: brand.secondary_horizontal_logo,
    favicon: brand.favicon
  });
  
  console.warn('To fix this, update your brand query to include media relations like:');
  console.warn(`
    // For Supabase:
    .select(\`
      *,
      primary_square_logo_details:primary_square_logo(*),
      secondary_square_logo_details:secondary_square_logo(*),
      primary_horizontal_logo_details:primary_horizontal_logo(*),
      secondary_horizontal_logo_details:secondary_horizontal_logo(*),
      favicon_details:favicon(*)
    \`)
  `);

  return [];
};

/**
 * Get brand status options for filtering
 */
export const getBrandStatusOptions = () => [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'project', label: 'Project Only' },
  { value: 'archived', label: 'Archived' }
];

/**
 * Helper to determine if brand has sufficient data for preview
 */
export const hasSufficientBrandData = (brand) => {
  if (!brand) return false;

  const hasColors = brand.primary_color || brand.secondary_color;
  const hasFonts = getBrandFonts(brand).length > 0;
  const hasLogos = getBrandLogos(brand).length > 0;

  return hasColors || hasFonts || hasLogos;
};