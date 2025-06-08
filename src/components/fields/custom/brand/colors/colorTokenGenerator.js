// colorTokenGenerator.js
import { createClient } from '@/lib/supabase/browser';

// === Utility Functions ===
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16)
  ];
}

function rgbToHex(rgb) {
  return '#' + rgb.map(v => {
    const hex = Math.round(v).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function hexToHsl(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex([h, s, l]) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => Math.round(255 * (l - a * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1)));
  return rgbToHex([f(0), f(8), f(4)]);
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

// === Color Token Generation ===
export function generateBaseTokens(brandColors) {
  const {
    primary_color,
    secondary_color,
    neutral_color_100,
    neutral_color_900,
    success_color,
    error_color,
    warning_color,
    info_color,
    alt_color_1,
    alt_color_2,
    alt_color_3,
    alt_color_4
  } = brandColors;

  const tokenTypes = [
    { name: 'neutral', color: neutral_color_100, baseScale: 100 },
    { name: 'primary', color: primary_color, baseScale: 500 },
    { name: 'secondary', color: secondary_color, baseScale: 500 },
    { name: 'success', color: success_color, baseScale: 500 },
    { name: 'error', color: error_color, baseScale: 500 },
    { name: 'warning', color: warning_color, baseScale: 500 },
    { name: 'info', color: info_color, baseScale: 500 }
  ];

  // Add alternative colors if they exist
  const altColors = [
    { key: 'alt_color_1', name: 'alt1', color: alt_color_1 },
    { key: 'alt_color_2', name: 'alt2', color: alt_color_2 },
    { key: 'alt_color_3', name: 'alt3', color: alt_color_3 },
    { key: 'alt_color_4', name: 'alt4', color: alt_color_4 }
  ];

  // Add non-null alt colors to token types
  altColors.forEach(({ name, color }) => {
    if (color && color !== null) {
      tokenTypes.push({ name, color, baseScale: 500 });
    }
  });

  const scales = [100, 200, 300, 400, 500, 600, 700, 800, 900];
  const descriptions = {
    neutral: 'For text, backgrounds, borders, dividers, containers',
    primary: 'Brand-defining color (main CTA, highlights, active UI elements)',
    secondary: 'Supporting brand color (alternate CTAs, accents, hover states, badges)',
    success: 'Success green (status indicators, alerts, messages)',
    error: 'Error red (validation, failure messages)',
    warning: 'Warning yellow (cautionary alerts)',
    info: 'Informational blue (info banners, icons)',
    alt1: 'Alternative brand color 1',
    alt2: 'Alternative brand color 2',
    alt3: 'Alternative brand color 3',
    alt4: 'Alternative brand color 4'
  };

  const tokens = [];
  const baseTokenMap = {};

  for (const type of tokenTypes) {
    const baseHex = type.color;
    if (!baseHex) continue;

    const baseHSL = hexToHsl(baseHex);

    // Special handling for neutral colors
    if (type.name === 'neutral') {
      const lightHSL = hexToHsl(neutral_color_100);
      const darkHSL = hexToHsl(neutral_color_900);
      
      // Define specific lightness targets for each scale
      const lightnessTargets = {
        100: lightHSL[2],  // Use the actual lightness from neutral_color_100
        200: Math.max(lightHSL[2] - 5, 96),   // Slightly darker than 100
        300: Math.max(lightHSL[2] - 10, 75),  // Medium-light
        400: Math.max(lightHSL[2] - 20, 65),  // Medium
        500: Math.max(lightHSL[2] - 38, 55),  // Medium-dark
        600: Math.max(lightHSL[2] - 55, 40),  // Darker
        700: Math.max(lightHSL[2] - 80, 25),  // Much darker
        800: Math.max(lightHSL[2] - 90, 10),  // Very dark
        900: darkHSL[2]   // Use the actual lightness from neutral_color_900
      };
      
      for (let i = 0; i < scales.length; i++) {
        const scale = scales[i];
        const token = `${type.name}.${scale}`;
        const title = `${capitalize(type.name)} ${scale}`;
        const desc = descriptions[type.name] || '';
        
        let value;
        if (scale === 100) {
          value = neutral_color_100;
        } else if (scale === 900) {
          value = neutral_color_900;
        } else {
          // Use the predefined lightness target
          const targetLightness = lightnessTargets[scale];
          
          // Calculate interpolation ratio for saturation
          const scalePosition = (scale - 100) / (900 - 100);
          
          const newHSL = [
            lightHSL[0], // Keep same hue as the light anchor
            // Interpolate saturation between light and dark anchors
            Math.round(lightHSL[1] + (scalePosition * (darkHSL[1] - lightHSL[1]))),
            // Use the specific lightness target
            targetLightness
          ];
          
          // Ensure values are within valid ranges
          newHSL[1] = clamp(newHSL[1], 0, 100);
          newHSL[2] = clamp(newHSL[2], 0, 100);
          
          value = hslToHex(newHSL);
        }

        baseTokenMap[token] = value;
        tokens.push({
          title,
          token,
          description: desc,
          value,
          resolved: value,
          mode: 'base',
          group: type.name,
          type: 'base'
        });
      }
    } else {
      // For other colors, generate variations based on lightness and saturation
      for (let i = 0; i < scales.length; i++) {
        const scale = scales[i];
        const token = `${type.name}.${scale}`;
        const title = `${capitalize(type.name)} ${scale}`;
        const desc = descriptions[type.name] || '';
        
        let value;
        if (scale === type.baseScale) {
          value = baseHex;
        } else {
          const newHSL = [...baseHSL];
          const baseLightness = baseHSL[2]; // Actual lightness of the 500 color
          
          // Define target lightness values relative to base
          let targetLightness;
          
          if (i === 0) { // 100 scale - always very light
            targetLightness = 99.9; // Fixed value, very light (was trying to use 120 which is invalid)
            newHSL[1] = Math.max(baseHSL[1] * 0.3, 1); // Very low saturation for pastel effect
          } else if (i === 1) { // 200 scale - lighter than 500
            targetLightness = 95; // Fixed value, still very light
            newHSL[1] = Math.max(baseHSL[1] * 0.7, 15);
          } else if (i === 2) { // 300 scale - lighter than 500  
            targetLightness = Math.max(baseLightness + 10, 80); // Ensure it's at least 80
            newHSL[1] = Math.max(baseHSL[1] * 0.75, 25);
          } else if (i === 3) { // 400 scale - slightly lighter than 500
            targetLightness = Math.max(baseLightness + 8, baseLightness + 1);
            newHSL[1] = Math.max(baseHSL[1] * .95, 65);
          } else if (i === 5) { // 600 scale - darker than 500
            targetLightness = Math.min(baseLightness - 8, baseLightness - 1);
            newHSL[1] = Math.min(baseHSL[1] * 1.1, 80);
          } else if (i === 6) { // 700 scale - darker than 500
            targetLightness = Math.min(baseLightness - 18, baseLightness - 5);
            newHSL[1] = Math.min(baseHSL[1] * 1.2, 100);
          } else if (i === 7) { // 800 scale - darker than 500
            targetLightness = Math.min(baseLightness - 28, baseLightness - 10);
            newHSL[1] = Math.min(baseHSL[1] * 1.3, 100);
          } else { // 900 scale - darkest
            targetLightness = Math.min(baseLightness - 40, baseLightness - 15);
            newHSL[1] = Math.min(baseHSL[1] * 1.4, 100);
          }

          // Ensure lightness is within valid range and respects progression
          newHSL[2] = clamp(targetLightness, 5, 95);
          newHSL[1] = clamp(newHSL[1], 0, 100);
          
          value = hslToHex(newHSL);
        }

        baseTokenMap[token] = value;
        tokens.push({
          title,
          token,
          description: desc,
          value,
          resolved: value,
          mode: 'base',
          group: type.name,
          type: 'base'
        });
      }
    }
  }

  return { tokens, baseTokenMap };
}

export function generateAliasTokens(baseTokenMap) {
  const aliasDefinitions = [
    ['Primary Text', 'lightmode.color.text.primary', 'Main body text for Light Mode', 'neutral.800', 'lightmode'],
    ['Primary Text', 'darkmode.color.text.primary', 'Main body text for Dark Mode', 'neutral.100', 'darkmode'],
    ['Secondary Text', 'lightmode.color.text.secondary', 'Muted/subtext for Light Mode', 'neutral.600', 'lightmode'],
    ['Secondary Text', 'darkmode.color.text.secondary', 'Muted/subtext for Dark Mode', 'neutral.300', 'darkmode'],
    ['Background', 'lightmode.color.bg.default', 'Page background for Light Mode', 'neutral.100', 'lightmode'],
    ['Background', 'darkmode.color.bg.default', 'Page background for Dark Mode', 'neutral.900', 'darkmode'],
    ['Card & Container Background', 'lightmode.color.bg.surface', 'Card and container background for Light Mode', 'neutral.200', 'lightmode'],
    ['Card & Container Background', 'darkmode.color.bg.surface', 'Card and container background for Dark Mode', 'neutral.800', 'darkmode'],
    ['Primary Brand Accent', 'lightmode.color.brand.primary', 'Primary brand accent for Light Mode (buttons, icons, highlights, active tabs, headings)', 'primary.600', 'lightmode'],
    ['Primary Brand Accent', 'darkmode.color.brand.primary', 'Primary brand accent for Dark Mode (buttons, icons, highlights, active tabs, headings)', 'primary.300', 'darkmode'],
    ['Secondary Brand Accent', 'lightmode.color.brand.secondary', 'Secondary brand accent for Light Mode (alternate accent)', 'secondary.500', 'lightmode'],
    ['Secondary Brand Accent', 'darkmode.color.brand.secondary', 'Secondary brand accent for Dark Mode (alternate accent)', 'secondary.300', 'darkmode'],
    ['Primary Button Background', 'lightmode.color.button.primary.bg', 'Primary button background for Light Mode', 'primary.600', 'lightmode'],
    ['Primary Button Background', 'darkmode.color.button.primary.bg', 'Primary button background for Dark Mode', 'primary.300', 'darkmode'],
    ['Primary Button Text', 'lightmode.color.button.primary.text', 'Text on primary buttons for Light Mode', 'neutral.100', 'lightmode'],
    ['Primary Button Text', 'darkmode.color.button.primary.text', 'Text on primary buttons for Dark Mode', 'neutral.100', 'darkmode'],
    ['Primary Button Border', 'lightmode.color.button.primary.border', 'Border for primary or ghost buttons in Light Mode', 'primary.600', 'lightmode'],
    ['Primary Button Border', 'darkmode.color.button.primary.border', 'Border for primary or ghost buttons in Dark Mode', 'primary.300', 'darkmode'],
    ['Secondary Button BG', 'lightmode.color.button.secondary.bg', 'Background for secondary buttons in Light Mode', 'neutral.200', 'lightmode'],
    ['Secondary Button BG', 'darkmode.color.button.secondary.bg', 'Background for secondary buttons in Dark Mode', 'neutral.800', 'darkmode'],
    ['Secondary Button Border', 'lightmode.color.button.secondary.border', 'Border for secondary or ghost buttons in Light Mode', 'neutral.300', 'lightmode'],
    ['Secondary Button Border', 'darkmode.color.button.secondary.border', 'Border for secondary or ghost buttons in Dark Mode', 'neutral.600', 'darkmode'],
    ['Secondary Button Text', 'lightmode.color.button.secondary.text', 'Text on secondary buttons for Light Mode', 'neutral.900', 'lightmode'],
    ['Secondary Button Text', 'darkmode.color.button.secondary.text', 'Text on secondary buttons for Dark Mode', 'neutral.100', 'darkmode'],
    ['Neutral Button BG', 'lightmode.color.button.neutral.bg', 'Background for neutral/tertiary buttons in Light Mode', 'neutral.100', 'lightmode'],
    ['Neutral Button BG', 'darkmode.color.button.neutral.bg', 'Background for neutral/tertiary buttons in Dark Mode', 'neutral.900', 'darkmode'],
    ['Neutral Button Text', 'lightmode.color.button.neutral.text', 'Text on neutral buttons for Light Mode', 'neutral.900', 'lightmode'],
    ['Neutral Button Text', 'darkmode.color.button.neutral.text', 'Text on neutral buttons for Dark Mode', 'neutral.100', 'darkmode'],
    ['Neutral Button Border', 'lightmode.color.button.neutral.border', 'Border for neutral buttons in Light Mode', 'neutral.400', 'lightmode'],
    ['Neutral Button Border', 'darkmode.color.button.neutral.border', 'Border for neutral buttons in Dark Mode', 'neutral.700', 'darkmode'],
    ['Border Color', 'lightmode.color.border.base', 'Standard border color for Light Mode', 'neutral.300', 'lightmode'],
    ['Border Color', 'darkmode.color.border.base', 'Standard border color for Dark Mode', 'neutral.700', 'darkmode'],
    ['Primary Link Color', 'lightmode.color.primary.link', 'Primary link color for Light Mode on default background', 'primary.700', 'lightmode'],
    ['Primary Link Color', 'darkmode.color.primary.link', 'Primary link color for Dark Mode on default background', 'primary.400', 'darkmode'],
    ['Secondary Link Color', 'lightmode.color.secondary.link', 'Secondary link color for Light Mode on colored/image backgrounds', 'secondary.600', 'lightmode'],
    ['Secondary Link Color', 'darkmode.color.secondary.link', 'Secondary link color for Dark Mode on colored/image backgrounds', 'secondary.300', 'darkmode'],
    ['Success', 'lightmode.color.status.success', 'Success green for Light Mode', 'success.500', 'lightmode'],
    ['Success', 'darkmode.color.status.success', 'Success green for Dark Mode', 'success.500', 'darkmode'],
    ['Error', 'lightmode.color.status.error', 'Error red for Light Mode', 'error.500', 'lightmode'],
    ['Error', 'darkmode.color.status.error', 'Error red for Dark Mode', 'error.500', 'darkmode'],
    ['Info', 'lightmode.color.status.info', 'Informational blue for Light Mode', 'info.500', 'lightmode'],
    ['Info', 'darkmode.color.status.info', 'Informational blue for Dark Mode', 'info.500', 'darkmode'],
    ['Warning', 'lightmode.color.status.warning', 'Warning yellow for Light Mode', 'warning.500', 'lightmode'],
    ['Warning', 'darkmode.color.status.warning', 'Warning yellow for Dark Mode', 'warning.500', 'darkmode'],
    ['Disabled Text', 'lightmode.color.text.disabled', 'Disabled/placeholder text for Light Mode', 'neutral.400', 'lightmode'],
    ['Disabled Text', 'darkmode.color.text.disabled', 'Disabled/placeholder text for Dark Mode', 'neutral.500', 'darkmode'],
    ['Inverted Text', 'lightmode.color.text.inverted', 'For use on dark backgrounds in Light Mode', 'neutral.100', 'lightmode'],
    ['Inverted Text', 'darkmode.color.text.inverted', 'For use on light backgrounds in Dark Mode', 'neutral.900', 'darkmode'],
  ];

  const tokens = [];

  for (const [title, token, description, baseRef, mode] of aliasDefinitions) {
    const resolved = baseTokenMap[baseRef] || '';
    
    // Determine group from token structure
    let group = '';
    if (token.includes('.text.')) group = 'text';
    else if (token.includes('.bg.')) group = 'background';
    else if (token.includes('.button.')) group = 'button';
    else if (token.includes('.border.')) group = 'border';
    else if (token.includes('.status.')) group = 'status';
    else if (token.includes('.brand.')) group = 'brand';
    else if (token.includes('.link')) group = 'link';
    else group = 'semantic';

    tokens.push({
      title,
      token,
      description,
      value: baseRef,
      resolved,
      mode,
      group,
      type: 'alias'
    });
  }

  return tokens;
}

// === Database Operations ===
export async function deleteAllColorTokens(brandId) {
  const supabase = createClient();
  
  try {
    console.log('[deleteAllColorTokens] Deleting all tokens for brand:', brandId);
    
    const { error } = await supabase
      .from('color')
      .delete()
      .eq('brand_id', brandId);

    if (error) {
      console.error('[deleteAllColorTokens] Supabase error:', error);
      throw error;
    }

    console.log('[deleteAllColorTokens] All tokens deleted successfully');
    
  } catch (error) {
    console.error('[deleteAllColorTokens] Error:', error);
    throw error;
  }
}

export async function createColorTokensBatch(brandId, tokens, authorId = 25) {
  const supabase = createClient();
  
  try {
    console.log('[createColorTokensBatch] Creating', tokens.length, 'tokens for brand:', brandId);
    
    const tokensToInsert = tokens.map(token => ({
      ...token,
      brand_id: brandId,
      author_id: authorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('color')
      .insert(tokensToInsert)
      .select();

    if (error) {
      console.error('[createColorTokensBatch] Supabase error:', error);
      throw new Error(`Failed to create color tokens: ${error.message || 'Unknown error'}`);
    }

    console.log('[createColorTokensBatch] Successfully created', data?.length || 0, 'tokens');
    return data;
    
  } catch (error) {
    console.error('[createColorTokensBatch] Error:', error);
    throw error;
  }
}

export async function fetchBrandColors(brandId) {
  const supabase = createClient();
  
  try {
    console.log('[fetchBrandColors] Fetching brand colors for:', brandId);
    
    const { data, error } = await supabase
      .from('brand')
      .select(`
        primary_color,
        secondary_color,
        neutral_color_100,
        neutral_color_900,
        success_color,
        error_color,
        warning_color,
        info_color,
        alt_color_1,
        alt_color_2,
        alt_color_3,
        alt_color_4
      `)
      .eq('id', brandId)
      .single();

    if (error) {
      console.error('[fetchBrandColors] Supabase error:', error);
      throw error;
    }

    console.log('[fetchBrandColors] Brand colors:', data);
    return data;
    
  } catch (error) {
    console.error('[fetchBrandColors] Error:', error);
    throw error;
  }
}

// === Main Regeneration Function ===
export async function regenerateAllColorTokens(brandId, authorId = 25, brandColors = null) {
  try {
    console.log('[regenerateAllColorTokens] Starting regeneration for brand:', brandId);
    
    // 1. Fetch brand colors if not provided
    let colors = brandColors;
    if (!colors) {
      colors = await fetchBrandColors(brandId);
    }
    
    // 2. Generate base tokens
    const { tokens: baseTokens, baseTokenMap } = generateBaseTokens(colors);
    
    // 3. Generate alias tokens
    const aliasTokens = generateAliasTokens(baseTokenMap);
    
    // 4. Combine all tokens
    const allTokens = [...baseTokens, ...aliasTokens];
    
    // 5. Delete existing tokens
    await deleteAllColorTokens(brandId);
    
    // 6. Create new tokens
    const createdTokens = await createColorTokensBatch(brandId, allTokens, authorId);
    
    console.log('[regenerateAllColorTokens] Successfully regenerated', createdTokens?.length || 0, 'tokens');
    return createdTokens;
    
  } catch (error) {
    console.error('[regenerateAllColorTokens] Error:', error);
    throw error;
  }
}