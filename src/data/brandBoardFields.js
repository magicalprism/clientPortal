export const getBrandColors = (brand) => [
    { label: 'Primary', value: brand.primary_color },
    { label: 'Secondary', value: brand.secondary_color },
    { label: 'Accent 1', value: brand.primary_accent_color },
    { label: 'Accent 2', value: brand.secondary_accent_color },
    { label: 'Border Primary', value: brand.border_primary_color },
    { label: 'Border Secondary', value: brand.border_secondary_color },
    { label: 'Background Primary', value: brand.background_primary_color },
    { label: 'Background Secondary', value: brand.background_secondary_color },
    { label: 'Alt 1', value: brand.alt_color_1 },
    { label: 'Alt 2', value: brand.alt_color_2 },
    { label: 'Alt 3', value: brand.alt_color_3 },
    { label: 'Alt 4', value: brand.alt_color_4 },
    { label: 'Alt 5', value: brand.alt_color_5 },
    { label: 'Alt 6', value: brand.alt_color_6 },
  ].filter(c => !!c.value);
  
  export const getBrandFonts = (brand) => [
    { label: 'Primary Font', url: brand.primary_font_details?.url },
    { label: 'Secondary Font', url: brand.secondary_font_details?.url },
    { label: 'Accent Font', url: brand.accent_font_details?.url },
    { label: 'Body Font', url: brand.body_font_details?.url },
    { label: 'Italic Primary', url: brand.italic_primary_font_details?.url },
    { label: 'Italic Secondary', url: brand.italic_secondary_font_details?.url },
    { label: 'Italic Body', url: brand.italic_body_font_details?.url },
    { label: 'Italic Accent', url: brand.italic_accent_font_details?.url },
  ].filter(f => !!f.url);
  
  export const getBrandLogos = (brand) => [
    { label: 'Primary Square Logo', url: brand.primary_square_logo_details?.url },
    { label: 'Secondary Square Logo', url: brand.secondary_square_logo_details?.url },
    { label: 'Primary Horizontal Logo', url: brand.primary_horizontal_logo_details?.url },
    { label: 'Secondary Horizontal Logo', url: brand.secondary_horizontal_logo_details?.url },
    { label: 'Favicon', url: brand.favicon_details?.url },
  ].filter(l => !!l.url);
  