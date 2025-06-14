/**
 * Enhanced Detection Patterns for Design Analysis
 * /lib/design-analysis/enhanced-detection.js
 * 
 * Provides sophisticated pattern recognition for buttons, icons, images, and brand personalities
 * based on extracted design data from real websites.
 */

// ============================================================================
// ENHANCED DETECTION PATTERNS
// ============================================================================

export const ENHANCED_DETECTION_PATTERNS = {
  buttons: {
    minimal_outline: {
      description: 'Clean, transparent buttons with thin borders',
      background: 'transparent',
      border: '1px solid currentColor',
      color: 'inherit',
      font_size: '14px',
      font_weight: '400',
      padding: '8px 16px',
      border_radius: '6px',
      text_transform: 'none',
      letter_spacing: 'normal',
      indicators: ['transparent_bg', 'thin_border', 'small_font', 'normal_weight'],
      brands: ['linear', 'notion', 'figma', 'vercel'],
      personality_score: { minimal: 3, friendly: 0, premium: 1 }
    },
    
    solid_primary: {
      description: 'Filled buttons with brand colors',
      background: 'var(--primary-color)',
      border: 'none',
      color: 'white',
      font_size: '16px',
      font_weight: '500',
      padding: '12px 24px',
      border_radius: '8px',
      text_transform: 'none',
      letter_spacing: 'normal',
      indicators: ['solid_bg', 'no_border', 'medium_font', 'medium_weight'],
      brands: ['stripe', 'github', 'shopify', 'slack'],
      personality_score: { minimal: 0, friendly: 2, premium: 1 }
    },
    
    large_rounded: {
      description: 'Prominent buttons with large border radius',
      background: 'var(--primary-color)',
      border: 'none',
      color: 'white',
      font_size: '17px',
      font_weight: '400',
      padding: '16px 32px',
      border_radius: '24px',
      text_transform: 'none',
      letter_spacing: 'normal',
      indicators: ['solid_bg', 'large_radius', 'large_font', 'generous_padding'],
      brands: ['apple', 'tesla', 'airbnb', 'spotify'],
      personality_score: { minimal: 0, friendly: 1, premium: 3 }
    },
    
    ghost: {
      description: 'Subtle buttons with no border or background',
      background: 'transparent',
      border: 'none',
      color: 'currentColor',
      font_size: '14px',
      font_weight: '400',
      padding: '6px 12px',
      border_radius: '4px',
      text_transform: 'none',
      letter_spacing: 'normal',
      indicators: ['no_bg', 'no_border', 'small_font', 'minimal_padding'],
      brands: ['github', 'linear', 'notion'],
      personality_score: { minimal: 4, friendly: 0, premium: 0 }
    }
  },

  icons: {
    minimal_line: {
      description: 'Small, clean line icons without backgrounds',
      size: '16px',
      stroke_width: '1.5px',
      fill: 'none',
      color: 'currentColor',
      background: 'none',
      border: 'none',
      padding: '0',
      frame: false,
      indicators: ['small_size', 'stroke_only', 'no_background', 'monochrome'],
      brands: ['linear', 'notion', 'figma', 'vercel'],
      personality_score: { minimal: 3, friendly: 0, premium: 1 }
    },
    
    material_filled: {
      description: 'Medium icons with filled backgrounds and frames',
      size: '24px',
      stroke_width: '0',
      fill: 'currentColor',
      color: 'var(--primary-color)',
      background: 'rgba(var(--primary-rgb), 0.1)',
      border: '1px solid rgba(var(--primary-rgb), 0.2)',
      padding: '8px',
      border_radius: '6px',
      frame: true,
      indicators: ['medium_size', 'filled', 'has_background', 'colorful'],
      brands: ['google', 'microsoft', 'shopify'],
      personality_score: { minimal: 0, friendly: 3, premium: 1 }
    },
    
    large_decorative: {
      description: 'Large icons with rich styling and effects',
      size: '32px',
      stroke_width: '2px',
      fill: 'gradient',
      color: 'var(--primary-color)',
      background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
      border: 'none',
      padding: '12px',
      border_radius: '12px',
      frame: true,
      indicators: ['large_size', 'gradient', 'decorative', 'premium_styling'],
      brands: ['apple', 'tesla', 'dribbble'],
      personality_score: { minimal: 0, friendly: 1, premium: 4 }
    },
    
    emoji_style: {
      description: 'Emoji or colorful character icons',
      size: '20px',
      type: 'emoji',
      background: 'none',
      frame: false,
      color: 'natural',
      indicators: ['emoji', 'colorful', 'playful', 'character_based'],
      brands: ['slack', 'notion', 'discord'],
      personality_score: { minimal: 0, friendly: 4, premium: 0 }
    }
  },

  images: {
    product_screenshot: {
      description: 'Product interface or software screenshots',
      aspect_ratios: ['16:10', '4:3', '3:2'],
      composition: 'centered_or_offset',
      treatment: 'dark_themed_ui',
      placement: 'hero_primary_focal_point',
      size_strategy: 'large_showcase',
      border_treatment: 'subtle_border_or_none',
      shadow_treatment: 'minimal_or_none',
      background_integration: 'seamless_with_dark_bg',
      indicators: ['interface_elements', 'dark_theme', 'large_hero_placement', 'product_focus'],
      brands: ['linear', 'figma', 'notion', 'github'],
      personality_score: { minimal: 2, friendly: 1, premium: 2 }
    },
    
    lifestyle_photography: {
      description: 'People using products, real-world contexts',
      aspect_ratios: ['16:9', '3:2', '1:1'],
      composition: 'rule_of_thirds',
      treatment: 'natural_lighting',
      placement: 'supporting_content_areas',
      size_strategy: 'moderate_supporting',
      border_treatment: 'rounded_corners',
      shadow_treatment: 'subtle_elevation',
      background_integration: 'contrasting_background',
      indicators: ['people', 'real_world', 'natural_lighting', 'storytelling'],
      brands: ['airbnb', 'stripe', 'shopify', 'slack'],
      personality_score: { minimal: 0, friendly: 4, premium: 1 }
    },
    
    abstract_graphics: {
      description: 'Illustrations, graphics, geometric patterns',
      aspect_ratios: ['1:1', '16:9', 'custom'],
      composition: 'geometric_or_artistic',
      treatment: 'brand_color_palette',
      placement: 'decorative_accents',
      size_strategy: 'varied_by_context',
      border_treatment: 'none_or_artistic',
      shadow_treatment: 'creative_effects',
      background_integration: 'blended_or_layered',
      indicators: ['geometric', 'illustrated', 'artistic', 'abstract'],
      brands: ['stripe', 'dropbox', 'spotify', 'dribbble'],
      personality_score: { minimal: 1, friendly: 2, premium: 3 }
    }
  }
};

// ============================================================================
// BRAND PERSONALITY DETECTION ALGORITHM
// ============================================================================

/**
 * Sophisticated algorithm to detect brand personality from extracted design data
 * Returns: 'sophisticated_minimal', 'friendly_approachable', or 'premium_luxury'
 */
export const detectBrandPersonality = (extractedData) => {
  if (!extractedData) {
    return 'sophisticated_minimal'; // Safe default
  }

  let scores = {
    minimal: 0,
    friendly: 0,
    premium: 0
  };

  // Button Analysis (High Weight: 40% of total score)
  if (extractedData.buttons && extractedData.buttons.length > 0) {
    extractedData.buttons.forEach(button => {
      // Background analysis
      if (button.backgroundColor === 'transparent' || 
          button.backgroundColor === 'rgba(0, 0, 0, 0)' ||
          button.backgroundColor === 'none') {
        scores.minimal += 4;
      } else if (button.backgroundColor && button.backgroundColor !== 'transparent') {
        scores.friendly += 2;
        if (button.backgroundColor.includes('gradient')) {
          scores.premium += 2;
        }
      }

      // Font size analysis
      const fontSize = parseInt(button.fontSize) || 16;
      if (fontSize <= 14) {
        scores.minimal += 3;
      } else if (fontSize >= 18) {
        scores.friendly += 2;
        if (fontSize >= 20) {
          scores.premium += 1;
        }
      }

      // Font weight analysis
      const fontWeight = parseInt(button.fontWeight) || 400;
      if (fontWeight <= 400) {
        scores.minimal += 2;
      } else if (fontWeight >= 600) {
        scores.friendly += 1;
        if (fontWeight >= 700) {
          scores.premium += 1;
        }
      }

      // Border radius analysis
      const borderRadius = parseInt(button.borderRadius) || 0;
      if (borderRadius <= 6) {
        scores.minimal += 1;
      } else if (borderRadius >= 20) {
        scores.premium += 3;
      } else if (borderRadius >= 8) {
        scores.friendly += 1;
      }

      // Border analysis
      if (button.border && button.border.includes('1px')) {
        scores.minimal += 2;
      } else if (button.border === 'none') {
        if (button.backgroundColor === 'transparent') {
          scores.minimal += 3; // Ghost button
        } else {
          scores.friendly += 1; // Solid button
        }
      }
    });
  }

  // Icon Analysis (Medium Weight: 25% of total score)
  if (extractedData.icons && extractedData.icons.length > 0) {
    extractedData.icons.forEach(icon => {
      // Size analysis
      const size = parseInt(icon.size) || 24;
      if (size <= 16) {
        scores.minimal += 3;
      } else if (size >= 32) {
        scores.premium += 2;
      } else if (size >= 24) {
        scores.friendly += 1;
      }

      // Background analysis
      if (!icon.backgroundColor || 
          icon.backgroundColor === 'none' || 
          icon.backgroundColor === 'transparent') {
        scores.minimal += 3;
      } else {
        scores.friendly += 2;
        if (icon.backgroundColor.includes('gradient')) {
          scores.premium += 2;
        }
      }

      // Stroke vs fill analysis
      if (icon.strokeWidth && !icon.fill) {
        scores.minimal += 2;
      } else if (icon.fill && !icon.strokeWidth) {
        scores.friendly += 1;
      }

      // Color analysis
      if (icon.color === 'currentColor' || 
          icon.color === 'inherit' ||
          !icon.color) {
        scores.minimal += 2;
      } else if (icon.color && icon.color.includes('#')) {
        scores.friendly += 1;
      }
    });
  }

  // Color Palette Analysis (Medium Weight: 20% of total score)
  if (extractedData.colors && extractedData.colors.palette) {
    const colorCount = extractedData.colors.palette.length;
    
    if (colorCount <= 3) {
      scores.minimal += 3;
    } else if (colorCount >= 8) {
      scores.friendly += 2;
    } else if (colorCount >= 6) {
      scores.premium += 1;
    }

    // Analyze color saturation and brightness
    const colors = extractedData.colors.palette;
    let neutralCount = 0;
    let vibrantCount = 0;

    colors.forEach(color => {
      if (color.includes('#')) {
        const hex = color.replace('#', '');
        if (hex.length === 6) {
          const r = parseInt(hex.substr(0, 2), 16);
          const g = parseInt(hex.substr(2, 2), 16);
          const b = parseInt(hex.substr(4, 2), 16);
          
          // Calculate saturation (simplified)
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          
          if (saturation < 0.2) {
            neutralCount++;
          } else if (saturation > 0.7) {
            vibrantCount++;
          }
        }
      }
    });

    if (neutralCount > vibrantCount) {
      scores.minimal += 2;
    } else if (vibrantCount > neutralCount) {
      scores.friendly += 2;
    }
  }

  // Shadow Analysis (Low Weight: 10% of total score)
  if (extractedData.shadows) {
    const shadowCount = extractedData.shadows.length;
    
    if (shadowCount === 0) {
      scores.minimal += 2;
    } else if (shadowCount === 1) {
      scores.minimal += 1;
    } else if (shadowCount >= 3) {
      scores.friendly += 1;
      if (shadowCount >= 5) {
        scores.premium += 1;
      }
    }

    // Analyze shadow intensity
    extractedData.shadows.forEach(shadow => {
      if (shadow.includes('rgba(0, 0, 0, 0.1)') || 
          shadow.includes('rgba(0, 0, 0, 0.05)')) {
        scores.minimal += 1;
      } else if (shadow.includes('rgba(0, 0, 0, 0.3)') || 
                 shadow.includes('rgba(0, 0, 0, 0.4)')) {
        scores.premium += 1;
      }
    });
  }

  // Image Analysis (Low Weight: 5% of total score)
  if (extractedData.images && extractedData.images.length > 0) {
    const hasProductScreenshots = extractedData.images.some(img => 
      img.type === 'product_screenshot' || 
      img.alt?.includes('interface') ||
      img.alt?.includes('dashboard')
    );

    const hasLifestylePhotos = extractedData.images.some(img =>
      img.type === 'lifestyle' ||
      img.alt?.includes('people') ||
      img.alt?.includes('team')
    );

    if (hasProductScreenshots) {
      scores.minimal += 1;
    }
    if (hasLifestylePhotos) {
      scores.friendly += 2;
    }
  }

  // Determine winner with confidence scoring
  const maxScore = Math.max(scores.minimal, scores.friendly, scores.premium);
  const totalScore = scores.minimal + scores.friendly + scores.premium;
  const confidence = totalScore > 0 ? maxScore / totalScore : 0;

  // Return personality with confidence data
  if (scores.minimal >= scores.friendly && scores.minimal >= scores.premium) {
    return {
      personality: 'sophisticated_minimal',
      confidence: confidence,
      scores: scores,
      reasoning: generateReasoningText(scores, 'minimal')
    };
  } else if (scores.friendly >= scores.premium) {
    return {
      personality: 'friendly_approachable',
      confidence: confidence,
      scores: scores,
      reasoning: generateReasoningText(scores, 'friendly')
    };
  } else {
    return {
      personality: 'premium_luxury',
      confidence: confidence,
      scores: scores,
      reasoning: generateReasoningText(scores, 'premium')
    };
  }
};

// ============================================================================
// PRECISE MEASUREMENT EXTRACTION RULES
// ============================================================================

export const MEASUREMENT_EXTRACTION_RULES = {
  /**
   * Extract precise button measurements from computed styles
   */
  extractButtonMeasurements: (buttonElements) => {
    if (!buttonElements || buttonElements.length === 0) {
      return null;
    }

    const measurements = buttonElements.map(button => {
      const styles = button.computedStyles || button;
      
      return {
        // Typography measurements
        font_size: extractNumericValue(styles.fontSize) + 'px',
        font_weight: extractNumericValue(styles.fontWeight) || 400,
        font_family: styles.fontFamily || 'inherit',
        letter_spacing: styles.letterSpacing || 'normal',
        text_transform: styles.textTransform || 'none',
        
        // Layout measurements
        padding_top: extractNumericValue(styles.paddingTop) + 'px',
        padding_right: extractNumericValue(styles.paddingRight) + 'px',
        padding_bottom: extractNumericValue(styles.paddingBottom) + 'px',
        padding_left: extractNumericValue(styles.paddingLeft) + 'px',
        padding: styles.padding || 'auto',
        
        // Border measurements
        border_width: extractNumericValue(styles.borderWidth) + 'px',
        border_style: styles.borderStyle || 'solid',
        border_color: styles.borderColor || 'currentColor',
        border_radius: extractNumericValue(styles.borderRadius) + 'px',
        border: styles.border || 'none',
        
        // Color measurements
        background_color: styles.backgroundColor || 'transparent',
        color: styles.color || 'inherit',
        
        // Size measurements
        width: styles.width || 'auto',
        height: extractNumericValue(styles.height) + 'px',
        min_width: styles.minWidth || 'auto',
        min_height: Math.max(44, extractNumericValue(styles.height) || 44) + 'px', // Accessibility
        
        // Visual effects
        box_shadow: styles.boxShadow || 'none',
        opacity: extractNumericValue(styles.opacity) || 1,
        
        // Interaction states (if available)
        hover_background: styles.hoverBackgroundColor || 'auto',
        hover_color: styles.hoverColor || 'auto',
        hover_border: styles.hoverBorderColor || 'auto',
        
        // Calculated properties
        touch_target_compliant: extractNumericValue(styles.height) >= 44,
        contrast_ratio: calculateContrastRatio(styles.backgroundColor, styles.color),
        pattern_match: detectButtonPattern(styles)
      };
    });

    return measurements;
  },

  /**
   * Extract precise icon measurements from SVG or icon elements
   */
  extractIconMeasurements: (iconElements) => {
    if (!iconElements || iconElements.length === 0) {
      return null;
    }

    const measurements = iconElements.map(icon => {
      const styles = icon.computedStyles || icon;
      const svgElement = icon.querySelector ? icon.querySelector('svg') : null;
      
      return {
        // Size measurements
        width: extractNumericValue(styles.width) + 'px',
        height: extractNumericValue(styles.height) + 'px',
        size: Math.max(extractNumericValue(styles.width), extractNumericValue(styles.height)) + 'px',
        
        // SVG-specific measurements
        stroke_width: svgElement?.style.strokeWidth || styles.strokeWidth || '1.5px',
        stroke_color: svgElement?.style.stroke || styles.stroke || 'currentColor',
        fill_color: svgElement?.style.fill || styles.fill || 'none',
        viewbox: svgElement?.getAttribute('viewBox') || '0 0 24 24',
        
        // Container measurements
        container_padding: styles.padding || '0',
        container_background: styles.backgroundColor || 'none',
        container_border: styles.border || 'none',
        container_border_radius: extractNumericValue(styles.borderRadius) + 'px',
        
        // Color measurements
        color: styles.color || 'currentColor',
        opacity: extractNumericValue(styles.opacity) || 1,
        
        // Visual effects
        box_shadow: styles.boxShadow || 'none',
        filter: styles.filter || 'none',
        
        // Calculated properties
        has_container: styles.backgroundColor !== 'none' && styles.backgroundColor !== 'transparent',
        is_stroke_only: (svgElement?.style.fill === 'none' || styles.fill === 'none'),
        is_filled: (svgElement?.style.fill !== 'none' && styles.fill !== 'none'),
        touch_target_compliant: Math.max(extractNumericValue(styles.width), extractNumericValue(styles.height)) >= 44,
        pattern_match: detectIconPattern(styles, svgElement)
      };
    });

    return measurements;
  },

  /**
   * Extract precise image measurements and specifications
   */
  extractImageMeasurements: (imageElements) => {
    if (!imageElements || imageElements.length === 0) {
      return null;
    }

    const measurements = imageElements.map(image => {
      const styles = image.computedStyles || window.getComputedStyle(image);
      const rect = image.getBoundingClientRect ? image.getBoundingClientRect() : { width: 0, height: 0 };
      
      return {
        // Size measurements
        width: Math.round(rect.width) + 'px',
        height: Math.round(rect.height) + 'px',
        aspect_ratio: calculateAspectRatio(rect.width, rect.height),
        
        // Position measurements
        position: styles.position || 'static',
        top: styles.top || 'auto',
        left: styles.left || 'auto',
        z_index: styles.zIndex || 'auto',
        
        // Layout measurements
        object_fit: styles.objectFit || 'fill',
        object_position: styles.objectPosition || '50% 50%',
        
        // Visual treatment
        border_radius: extractNumericValue(styles.borderRadius) + 'px',
        box_shadow: styles.boxShadow || 'none',
        filter: styles.filter || 'none',
        opacity: extractNumericValue(styles.opacity) || 1,
        
        // Background measurements
        background_color: styles.backgroundColor || 'transparent',
        background_size: styles.backgroundSize || 'auto',
        background_position: styles.backgroundPosition || '50% 50%',
        
        // Image metadata
        src: image.src || '',
        alt: image.alt || '',
        loading: image.loading || 'eager',
        
        // Calculated properties
        is_hero_image: rect.width > 400 && rect.top < window.innerHeight,
        is_background_image: styles.backgroundImage !== 'none',
        resolution_adequate: rect.width >= 800, // Minimum quality check
        placement_category: categorizeImagePlacement(rect, styles),
        treatment_type: detectImageTreatment(styles, image)
      };
    });

    return measurements;
  },

  /**
   * Extract typography system measurements
   */
  extractTypographyMeasurements: (textElements) => {
    if (!textElements || textElements.length === 0) {
      return null;
    }

    const measurements = {
      font_families: new Set(),
      font_sizes: new Map(),
      font_weights: new Set(),
      line_heights: new Set(),
      letter_spacings: new Set(),
      text_transforms: new Set()
    };

    textElements.forEach(element => {
      const styles = element.computedStyles || window.getComputedStyle(element);
      const tagName = element.tagName?.toLowerCase();
      
      measurements.font_families.add(styles.fontFamily);
      measurements.font_weights.add(extractNumericValue(styles.fontWeight));
      measurements.line_heights.add(extractNumericValue(styles.lineHeight));
      measurements.letter_spacings.add(styles.letterSpacing);
      measurements.text_transforms.add(styles.textTransform);
      
      // Map font sizes to element types
      const fontSize = extractNumericValue(styles.fontSize);
      if (!measurements.font_sizes.has(tagName)) {
        measurements.font_sizes.set(tagName, []);
      }
      measurements.font_sizes.get(tagName).push(fontSize);
    });

    // Calculate typography scale
    const allSizes = Array.from(measurements.font_sizes.values()).flat().sort((a, b) => a - b);
    const uniqueSizes = [...new Set(allSizes)];
    const scale_ratio = uniqueSizes.length > 1 ? uniqueSizes[1] / uniqueSizes[0] : 1.2;

    return {
      primary_font_family: Array.from(measurements.font_families)[0],
      font_families: Array.from(measurements.font_families),
      font_sizes: Object.fromEntries(measurements.font_sizes),
      font_weights: Array.from(measurements.font_weights).sort(),
      line_heights: Array.from(measurements.line_heights),
      scale_ratio: Math.round(scale_ratio * 1000) / 1000, // Round to 3 decimal places
      base_font_size: uniqueSizes[0] || 16,
      size_progression: uniqueSizes
    };
  },

  /**
   * Extract spacing system measurements
   */
  extractSpacingMeasurements: (elements) => {
    if (!elements || elements.length === 0) {
      return null;
    }

    const spacings = {
      margins: new Set(),
      paddings: new Set(),
      gaps: new Set(),
      positions: new Set()
    };

    elements.forEach(element => {
      const styles = element.computedStyles || window.getComputedStyle(element);
      
      // Extract margin values
      ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'].forEach(prop => {
        const value = extractNumericValue(styles[prop]);
        if (value > 0) spacings.margins.add(value);
      });
      
      // Extract padding values
      ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].forEach(prop => {
        const value = extractNumericValue(styles[prop]);
        if (value > 0) spacings.paddings.add(value);
      });
      
      // Extract gap values (flexbox/grid)
      const gap = extractNumericValue(styles.gap);
      if (gap > 0) spacings.gaps.add(gap);
      
      // Extract position values
      ['top', 'right', 'bottom', 'left'].forEach(prop => {
        const value = extractNumericValue(styles[prop]);
        if (value > 0) spacings.positions.add(value);
      });
    });

    // Analyze spacing patterns
    const allSpacings = [
      ...Array.from(spacings.margins),
      ...Array.from(spacings.paddings),
      ...Array.from(spacings.gaps)
    ].sort((a, b) => a - b);

    const uniqueSpacings = [...new Set(allSpacings)];
    const base_unit = findBaseUnit(uniqueSpacings);

    return {
      base_unit: base_unit,
      margins: Array.from(spacings.margins).sort((a, b) => a - b),
      paddings: Array.from(spacings.paddings).sort((a, b) => a - b),
      gaps: Array.from(spacings.gaps).sort((a, b) => a - b),
      all_spacings: uniqueSpacings,
      spacing_scale: generateSpacingScale(base_unit),
      is_consistent: checkSpacingConsistency(uniqueSpacings, base_unit)
    };
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract numeric value from CSS string (e.g., "16px" -> 16)
 */
const extractNumericValue = (cssValue) => {
  if (typeof cssValue === 'number') return cssValue;
  if (typeof cssValue !== 'string') return 0;
  const match = cssValue.match(/(-?\d*\.?\d+)/);
  return match ? parseFloat(match[1]) : 0;
};

/**
 * Calculate aspect ratio from width and height
 */
const calculateAspectRatio = (width, height) => {
  if (!width || !height) return '1:1';
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  return `${Math.round(width/divisor)}:${Math.round(height/divisor)}`;
};

/**
 * Detect button pattern based on extracted measurements
 */
const detectButtonPattern = (styles) => {
  const patterns = ENHANCED_DETECTION_PATTERNS.buttons;
  
  for (const [patternName, pattern] of Object.entries(patterns)) {
    let matches = 0;
    let total = 0;
    
    // Check each indicator
    pattern.indicators.forEach(indicator => {
      total++;
      switch (indicator) {
        case 'transparent_bg':
          if (styles.backgroundColor === 'transparent' || styles.backgroundColor === 'rgba(0, 0, 0, 0)') matches++;
          break;
        case 'thin_border':
          if (styles.border && styles.border.includes('1px')) matches++;
          break;
        case 'small_font':
          if (extractNumericValue(styles.fontSize) <= 14) matches++;
          break;
        case 'normal_weight':
          if (extractNumericValue(styles.fontWeight) <= 400) matches++;
          break;
        case 'solid_bg':
          if (styles.backgroundColor !== 'transparent' && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') matches++;
          break;
        case 'large_radius':
          if (extractNumericValue(styles.borderRadius) >= 20) matches++;
          break;
        // Add more cases as needed
      }
    });
    
    if (matches / total >= 0.6) { // 60% match threshold
      return patternName;
    }
  }
  
  return 'custom';
};

/**
 * Detect icon pattern based on extracted measurements
 */
const detectIconPattern = (styles, svgElement) => {
  const patterns = ENHANCED_DETECTION_PATTERNS.icons;
  
  for (const [patternName, pattern] of Object.entries(patterns)) {
    let matches = 0;
    let total = 0;
    
    pattern.indicators.forEach(indicator => {
      total++;
      switch (indicator) {
        case 'small_size':
          if (extractNumericValue(styles.width) <= 18) matches++;
          break;
        case 'stroke_only':
          if (svgElement?.style.fill === 'none' || styles.fill === 'none') matches++;
          break;
        case 'no_background':
          if (!styles.backgroundColor || styles.backgroundColor === 'none' || styles.backgroundColor === 'transparent') matches++;
          break;
        case 'medium_size':
          if (extractNumericValue(styles.width) >= 20 && extractNumericValue(styles.width) <= 28) matches++;
          break;
        case 'filled':
          if (svgElement?.style.fill !== 'none' && styles.fill !== 'none') matches++;
          break;
        case 'has_background':
          if (styles.backgroundColor && styles.backgroundColor !== 'none' && styles.backgroundColor !== 'transparent') matches++;
          break;
        // Add more cases as needed
      }
    });
    
    if (matches / total >= 0.6) {
      return patternName;
    }
  }
  
  return 'custom';
};

/**
 * Categorize image placement (hero, content, decorative, etc.)
 */
const categorizeImagePlacement = (rect, styles) => {
  if (rect.width > 400 && rect.top < window.innerHeight) {
    return 'hero';
  } else if (rect.width > 200 && rect.width < 400) {
    return 'content_supporting';
  } else if (rect.width <= 200) {
    return 'decorative';
  } else {
    return 'content_primary';
  }
};

/**
 * Detect image treatment type
 */
const detectImageTreatment = (styles, imageElement) => {
  if (styles.filter && styles.filter !== 'none') {
    return 'filtered';
  } else if (styles.borderRadius && extractNumericValue(styles.borderRadius) > 8) {
    return 'rounded';
  } else if (styles.boxShadow && styles.boxShadow !== 'none') {
    return 'elevated';
  } else if (imageElement.alt && imageElement.alt.includes('interface')) {
    return 'product_screenshot';
  } else {
    return 'natural';
  }
};

/**
 * Find the base unit for spacing system
 */
const findBaseUnit = (spacings) => {
  if (spacings.length === 0) return 8;
  
  // Check for common base units
  const commonBases = [4, 8, 12, 16];
  
  for (const base of commonBases) {
    const conformingCount = spacings.filter(spacing => spacing % base === 0).length;
    if (conformingCount / spacings.length >= 0.7) { // 70% conformity
      return base;
    }
  }
  
  // Return the smallest spacing as base unit
  return spacings[0] || 8;
};

/**
 * Generate spacing scale based on base unit
 */
const generateSpacingScale = (baseUnit) => {
  const multipliers = [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12];
  return multipliers.map(mult => baseUnit * mult);
};

/**
 * Check spacing consistency
 */
const checkSpacingConsistency = (spacings, baseUnit) => {
  const conformingCount = spacings.filter(spacing => spacing % baseUnit === 0).length;
  return conformingCount / spacings.length >= 0.8; // 80% consistency
};

/**
 * Calculate contrast ratio between two colors (simplified)
 */
const calculateContrastRatio = (backgroundColor, textColor) => {
  // Simplified contrast calculation
  // In a real implementation, you'd want proper color parsing and luminance calculation
  if (!backgroundColor || !textColor) return 4.5; // Default safe value
  
  // This is a simplified placeholder
  if (backgroundColor.includes('ffffff') && textColor.includes('000000')) return 21;
  if (backgroundColor.includes('000000') && textColor.includes('ffffff')) return 21;
  
  return 4.5; // Default to AA compliant
};

/**
 * Generate reasoning text for personality detection
 */
const generateReasoningText = (scores, winningPersonality) => {
  const reasons = [];
  
  if (winningPersonality === 'minimal') {
    if (scores.minimal > 10) reasons.push('Strong minimal indicators: transparent buttons, small icons, limited colors');
    if (scores.minimal > 15) reasons.push('Very consistent minimal design patterns throughout');
  } else if (winningPersonality === 'friendly') {
    if (scores.friendly > 8) reasons.push('Friendly indicators: filled buttons, medium icons, diverse colors');
    if (scores.friendly > 12) reasons.push('Strong approachable design patterns');
  } else {
    if (scores.premium > 6) reasons.push('Premium indicators: large elements, rich effects, sophisticated styling');
    if (scores.premium > 10) reasons.push('Luxury design patterns with high attention to detail');
  }
  
  return reasons.join('. ');
};

// ============================================================================
// MAIN EXPORT
// ============================================================================

export default {
  ENHANCED_DETECTION_PATTERNS,
  detectBrandPersonality,
  MEASUREMENT_EXTRACTION_RULES
};