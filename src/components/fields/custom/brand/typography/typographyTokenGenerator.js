// typographyTokenGenerator.js
import { createClient } from '@/lib/supabase/browser';

// === Font Management ===
async function getFontUrl(mediaId) {
  if (!mediaId) return null;
  
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('media')
      .select('url, title')
      .eq('id', mediaId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching font:', error);
    return null;
  }
}

async function buildFontStack(brandFonts) {
  const fontStacks = {};
  
  for (const [key, mediaId] of Object.entries(brandFonts)) {
    if (mediaId) {
      const fontData = await getFontUrl(mediaId);
      if (fontData) {
        // Extract font family name from title or create from URL
        const fontFamily = fontData.title || 'Custom Font';
        fontStacks[key] = `"${fontFamily}", system-ui, -apple-system, sans-serif`;
      }
    }
  }
  
  return fontStacks;
}

// === Typography Token Generation ===
export function generateTypographyBaseTokens() {
  const tokens = [];
  
  // Font size scale (based on modular scale)
  const fontSizes = [
    { scale: '2xs', size: '0.75rem', px: '12px' },
    { scale: 'xs', size: '0.875rem', px: '14px' },
    { scale: 'sm', size: '1rem', px: '16px' },
    { scale: 'md', size: '1.125rem', px: '18px' },
    { scale: 'lg', size: '1.25rem', px: '20px' },
    { scale: 'xl', size: '1.5rem', px: '24px' },
    { scale: '2xl', size: '1.875rem', px: '30px' },
    { scale: '3xl', size: '2.25rem', px: '36px' },
    { scale: '4xl', size: '3rem', px: '48px' },
    { scale: '5xl', size: '3.75rem', px: '60px' },
    { scale: '6xl', size: '4.5rem', px: '72px' }
  ];
  
  // Line height scale
  const lineHeights = [
    { scale: 'tight', value: '1.25' },
    { scale: 'snug', value: '1.375' },
    { scale: 'normal', value: '1.5' },
    { scale: 'relaxed', value: '1.625' },
    { scale: 'loose', value: '2' }
  ];
  
  // Font weight scale
  const fontWeights = [
    { scale: 'thin', value: '100' },
    { scale: 'light', value: '300' },
    { scale: 'normal', value: '400' },
    { scale: 'medium', value: '500' },
    { scale: 'semibold', value: '600' },
    { scale: 'bold', value: '700' },
    { scale: 'extrabold', value: '800' },
    { scale: 'black', value: '900' }
  ];
  
  // Letter spacing scale
  const letterSpacings = [
    { scale: 'tighter', value: '-0.05em' },
    { scale: 'tight', value: '-0.025em' },
    { scale: 'normal', value: '0em' },
    { scale: 'wide', value: '0.025em' },
    { scale: 'wider', value: '0.05em' },
    { scale: 'widest', value: '0.1em' }
  ];
  
  // Generate font size tokens
  fontSizes.forEach(({ scale, size, px }) => {
    tokens.push({
      title: `Font Size ${scale.toUpperCase()}`,
      token: `font.size.${scale}`,
      description: `Font size ${scale} (${size} / ${px})`,
      font_size: size,
      category: 'size',
      type: 'base',
      group_name: 'font-sizes'
    });
  });
  
  // Generate line height tokens
  lineHeights.forEach(({ scale, value }) => {
    tokens.push({
      title: `Line Height ${scale}`,
      token: `font.lineHeight.${scale}`,
      description: `Line height ${scale} (${value})`,
      line_height: value,
      category: 'lineHeight',
      type: 'base',
      group_name: 'line-heights'
    });
  });
  
  // Generate font weight tokens
  fontWeights.forEach(({ scale, value }) => {
    tokens.push({
      title: `Font Weight ${scale}`,
      token: `font.weight.${scale}`,
      description: `Font weight ${scale} (${value})`,
      font_weight: value,
      category: 'weight',
      type: 'base',
      group_name: 'font-weights'
    });
  });
  
  // Generate letter spacing tokens
  letterSpacings.forEach(({ scale, value }) => {
    tokens.push({
      title: `Letter Spacing ${scale}`,
      token: `font.letterSpacing.${scale}`,
      description: `Letter spacing ${scale} (${value})`,
      letter_spacing: value,
      category: 'letterSpacing',
      type: 'base',
      group_name: 'letter-spacings'
    });
  });
  
  return tokens;
}

export function generateFontFamilyTokens(fontStacks) {
  const tokens = [];
  
  const fontMappings = [
    { key: 'primary_font', name: 'Primary', description: 'Primary brand font for headings and important UI' },
    { key: 'secondary_font', name: 'Secondary', description: 'Secondary font for subheadings and accents' },
    { key: 'body_font', name: 'Body', description: 'Body font for general text and UI' },
    { key: 'accent_font', name: 'Accent', description: 'Accent font for special elements and emphasis' }
  ];
  
  fontMappings.forEach(({ key, name, description }) => {
    if (fontStacks[key]) {
      // Regular font
      tokens.push({
        title: `${name} Font`,
        token: `font.family.${key.replace('_font', '')}`,
        description,
        font_family: fontStacks[key],
        font_style: 'normal',
        category: 'family',
        type: 'base',
        group_name: 'font-families'
      });
      
      // Italic variant if available
      const italicKey = `italic_${key}`;
      if (fontStacks[italicKey]) {
        tokens.push({
          title: `${name} Font Italic`,
          token: `font.family.${key.replace('_font', '')}.italic`,
          description: `${description} (italic variant)`,
          font_family: fontStacks[italicKey],
          font_style: 'italic',
          category: 'family',
          type: 'base',
          group_name: 'font-families'
        });
      }
    }
  });
  
  return tokens;
}

export function generateSemanticTypographyTokens(fontStacks) {
  const tokens = [];
  
  // Determine button font (accent if readable, otherwise primary)
  const buttonFont = fontStacks.accent_font || fontStacks.primary_font || fontStacks.body_font;
  const primaryFont = fontStacks.primary_font || fontStacks.body_font;
  const bodyFont = fontStacks.body_font || fontStacks.primary_font;
  
  const semanticStyles = [
    // Display styles (hero, large headings)
    {
      title: 'Display Large',
      token: 'typography.display.large',
      description: 'Large display text for heroes and major headings',
      font_family: primaryFont,
      font_size: 'font.size.5xl',
      line_height: 'font.lineHeight.tight',
      font_weight: 'font.weight.bold',
      letter_spacing: 'font.letterSpacing.tight',
      category: 'display',
      group_name: 'display'
    },
    {
      title: 'Display Medium',
      token: 'typography.display.medium',
      description: 'Medium display text for section headers',
      font_family: primaryFont,
      font_size: 'font.size.4xl',
      line_height: 'font.lineHeight.tight',
      font_weight: 'font.weight.bold',
      letter_spacing: 'font.letterSpacing.tight',
      category: 'display',
      group_name: 'display'
    },
    {
      title: 'Display Small',
      token: 'typography.display.small',
      description: 'Small display text for subsection headers',
      font_family: primaryFont,
      font_size: 'font.size.3xl',
      line_height: 'font.lineHeight.snug',
      font_weight: 'font.weight.semibold',
      letter_spacing: 'font.letterSpacing.normal',
      category: 'display',
      group_name: 'display'
    },
    
    // Heading styles
    {
      title: 'Heading 1',
      token: 'typography.heading.h1',
      description: 'Primary heading style',
      font_family: primaryFont,
      font_size: 'font.size.2xl',
      line_height: 'font.lineHeight.snug',
      font_weight: 'font.weight.bold',
      letter_spacing: 'font.letterSpacing.normal',
      category: 'heading',
      group_name: 'headings'
    },
    {
      title: 'Heading 2',
      token: 'typography.heading.h2',
      description: 'Secondary heading style',
      font_family: fontStacks.secondary_font || primaryFont,
      font_size: 'font.size.xl',
      line_height: 'font.lineHeight.snug',
      font_weight: 'font.weight.semibold',
      letter_spacing: 'font.letterSpacing.normal',
      category: 'heading',
      group_name: 'headings'
    },
    {
      title: 'Heading 3',
      token: 'typography.heading.h3',
      description: 'Tertiary heading style',
      font_family: fontStacks.secondary_font || primaryFont,
      font_size: 'font.size.lg',
      line_height: 'font.lineHeight.normal',
      font_weight: 'font.weight.semibold',
      letter_spacing: 'font.letterSpacing.normal',
      category: 'heading',
      group_name: 'headings'
    },
    {
      title: 'Heading 4',
      token: 'typography.heading.h4',
      description: 'Quaternary heading style',
      font_family: bodyFont,
      font_size: 'font.size.md',
      line_height: 'font.lineHeight.normal',
      font_weight: 'font.weight.semibold',
      letter_spacing: 'font.letterSpacing.normal',
      category: 'heading',
      group_name: 'headings'
    },
    
    // Body text styles
    {
      title: 'Body Large',
      token: 'typography.body.large',
      description: 'Large body text for important content',
      font_family: bodyFont,
      font_size: 'font.size.lg',
      line_height: 'font.lineHeight.relaxed',
      font_weight: 'font.weight.normal',
      letter_spacing: 'font.letterSpacing.normal',
      category: 'body',
      group_name: 'body'
    },
    {
      title: 'Body Medium',
      token: 'typography.body.medium',
      description: 'Standard body text',
      font_family: bodyFont,
      font_size: 'font.size.sm',
      line_height: 'font.lineHeight.normal',
      font_weight: 'font.weight.normal',
      letter_spacing: 'font.letterSpacing.normal',
      category: 'body',
      group_name: 'body'
    },
    {
      title: 'Body Small',
      token: 'typography.body.small',
      description: 'Small body text for captions and fine print',
      font_family: bodyFont,
      font_size: 'font.size.xs',
      line_height: 'font.lineHeight.normal',
      font_weight: 'font.weight.normal',
      letter_spacing: 'font.letterSpacing.normal',
      category: 'body',
      group_name: 'body'
    },
    
    // UI element styles
    {
      title: 'Button Large',
      token: 'typography.button.large',
      description: 'Large button text style',
      font_family: buttonFont,
      font_size: 'font.size.md',
      line_height: 'font.lineHeight.tight',
      font_weight: 'font.weight.semibold',
      letter_spacing: 'font.letterSpacing.wide',
      text_transform: 'none',
      category: 'ui',
      group_name: 'buttons'
    },
    {
      title: 'Button Medium',
      token: 'typography.button.medium',
      description: 'Standard button text style',
      font_family: buttonFont,
      font_size: 'font.size.sm',
      line_height: 'font.lineHeight.tight',
      font_weight: 'font.weight.medium',
      letter_spacing: 'font.letterSpacing.wide',
      text_transform: 'none',
      category: 'ui',
      group_name: 'buttons'
    },
    {
      title: 'Button Small',
      token: 'typography.button.small',
      description: 'Small button text style',
      font_family: buttonFont,
      font_size: 'font.size.xs',
      line_height: 'font.lineHeight.tight',
      font_weight: 'font.weight.medium',
      letter_spacing: 'font.letterSpacing.wider',
      text_transform: 'uppercase',
      category: 'ui',
      group_name: 'buttons'
    },
    
    // Label and input styles
    {
      title: 'Label',
      token: 'typography.label',
      description: 'Form label text style',
      font_family: bodyFont,
      font_size: 'font.size.sm',
      line_height: 'font.lineHeight.normal',
      font_weight: 'font.weight.medium',
      letter_spacing: 'font.letterSpacing.normal',
      category: 'ui',
      group_name: 'forms'
    },
    {
      title: 'Input',
      token: 'typography.input',
      description: 'Form input text style',
      font_family: bodyFont,
      font_size: 'font.size.sm',
      line_height: 'font.lineHeight.normal',
      font_weight: 'font.weight.normal',
      letter_spacing: 'font.letterSpacing.normal',
      category: 'ui',
      group_name: 'forms'
    },
    {
      title: 'Caption',
      token: 'typography.caption',
      description: 'Caption and helper text style',
      font_family: bodyFont,
      font_size: 'font.size.xs',
      line_height: 'font.lineHeight.normal',
      font_weight: 'font.weight.normal',
      letter_spacing: 'font.letterSpacing.normal',
      category: 'ui',
      group_name: 'captions'
    }
  ];
  
  return semanticStyles.map(style => ({
    ...style,
    type: 'alias'
  }));
}

// === Database Operations ===
export async function deleteAllTypographyTokens(brandId) {
  const supabase = createClient();
  
  try {
    console.log('[deleteAllTypographyTokens] Deleting all tokens for brand:', brandId);
    
    const { error } = await supabase
      .from('typography')
      .delete()
      .eq('brand_id', brandId);

    if (error) {
      console.error('[deleteAllTypographyTokens] Supabase error:', error);
      throw error;
    }

    console.log('[deleteAllTypographyTokens] All tokens deleted successfully');
    
  } catch (error) {
    console.error('[deleteAllTypographyTokens] Error:', error);
    throw error;
  }
}

export async function createTypographyTokensBatch(brandId, tokens, authorId = 25) {
  const supabase = createClient();
  
  try {
    console.log('[createTypographyTokensBatch] Creating', tokens.length, 'tokens for brand:', brandId);
    
    const tokensToInsert = tokens.map(token => ({
      ...token,
      brand_id: brandId,
      author_id: authorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('typography')
      .insert(tokensToInsert)
      .select();

    if (error) {
      console.error('[createTypographyTokensBatch] Supabase error:', error);
      throw new Error(`Failed to create typography tokens: ${error.message || 'Unknown error'}`);
    }

    console.log('[createTypographyTokensBatch] Successfully created', data?.length || 0, 'tokens');
    return data;
    
  } catch (error) {
    console.error('[createTypographyTokensBatch] Error:', error);
    throw error;
  }
}

export async function fetchBrandFonts(brandId) {
  const supabase = createClient();
  
  try {
    console.log('[fetchBrandFonts] Fetching brand fonts for:', brandId);
    
    const { data, error } = await supabase
      .from('brand')
      .select(`
        primary_font,
        secondary_font,
        body_font,
        accent_font,
        italic_primary_font,
        italic_secondary_font,
        italic_body_font,
        italic_accent_font
      `)
      .eq('id', brandId)
      .single();

    if (error) {
      console.error('[fetchBrandFonts] Supabase error:', error);
      throw error;
    }

    console.log('[fetchBrandFonts] Brand fonts:', data);
    return data;
    
  } catch (error) {
    console.error('[fetchBrandFonts] Error:', error);
    throw error;
  }
}

// === Main Regeneration Function ===
export async function regenerateAllTypographyTokens(brandId, authorId = 25, brandFonts = null) {
  try {
    console.log('[regenerateAllTypographyTokens] Starting regeneration for brand:', brandId);
    
    // 1. Fetch brand fonts if not provided
    let fonts = brandFonts;
    if (!fonts) {
      fonts = await fetchBrandFonts(brandId);
    }
    
    // 2. Build font stacks from media references
    const fontStacks = await buildFontStack(fonts);
    
    // 3. Generate base typography tokens
    const baseTokens = generateTypographyBaseTokens();
    
    // 4. Generate font family tokens
    const familyTokens = generateFontFamilyTokens(fontStacks);
    
    // 5. Generate semantic typography tokens
    const semanticTokens = generateSemanticTypographyTokens(fontStacks);
    
    // 6. Combine all tokens
    const allTokens = [...baseTokens, ...familyTokens, ...semanticTokens];
    
    // 7. Delete existing tokens
    await deleteAllTypographyTokens(brandId);
    
    // 8. Create new tokens
    const createdTokens = await createTypographyTokensBatch(brandId, allTokens, authorId);
    
    console.log('[regenerateAllTypographyTokens] Successfully regenerated', createdTokens?.length || 0, 'tokens');
    return createdTokens;
    
  } catch (error) {
    console.error('[regenerateAllTypographyTokens] Error:', error);
    throw error;
  }
}