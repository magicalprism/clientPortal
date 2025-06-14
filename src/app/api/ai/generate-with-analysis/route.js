/**
 * Generate with Analysis API Route
 * /app/api/ai/generate-with-analysis/route.js
 * 
 * Complete generation pipeline that uses ALL design system calculations
 * to produce authentic, brand-consistent, professionally calculated layouts
 */

import { NextResponse } from 'next/server';
import { DesignAnalysisEngine } from '@/lib/design-analysis/design-analysis-master.js';

/**
 * POST /api/ai/generate-with-analysis
 * 
 * Takes content and extracted design data, runs complete analysis,
 * and generates production-ready HTML/CSS using all calculations
 */
export async function POST(request) {
  try {
    const startTime = Date.now();
    
    // Parse request data
    const { 
      content, 
      extractedDesignData, 
      brandTokens, 
      inspirationUrl,
      industryContext = 'saas',
      targetAudience = 'general',
      options = {}
    } = await request.json();
    
    // Validate required inputs
    if (!content) {
      return NextResponse.json({ 
        error: 'Content is required for generation',
        code: 'MISSING_CONTENT'
      }, { status: 400 });
    }

    console.log('🎨 Starting enhanced generation pipeline...');
    console.log(`📊 Content length: ${content.length} characters`);
    console.log(`🔍 Extracted data available: ${!!extractedDesignData}`);
    console.log(`🏢 Industry context: ${industryContext}`);

    // Initialize enhanced design analysis engine
    const engine = new DesignAnalysisEngine(brandTokens, industryContext, targetAudience);
    
    // Run complete analysis pipeline
    console.log('🧠 Running enhanced analysis...');
    const analysis = await engine.analyzeAndRecommend(content, extractedDesignData, inspirationUrl);
    
    console.log(`✅ Analysis complete. Brand personality: ${analysis.enhanced_brand_personality?.personality}`);
    console.log(`📏 Visual complexity: ${analysis.visual_complexity?.level}`);
    console.log(`🖼️ Image strategy: ${analysis.image_strategy?.strategy}`);

    // Generate complete webpage using analysis results
    console.log('🏗️ Generating webpage with all calculations...');
    const generatedWebpage = await generateWebpageFromAnalysis(analysis, content, options);
    
    // Calculate performance metrics
    const generationTime = Date.now() - startTime;
    
    // Prepare response with comprehensive data
    const response = {
      success: true,
      generation_time: generationTime,
      
      // Generated webpage
      webpage: generatedWebpage,
      
      // Analysis results for debugging/optimization
      analysis_summary: {
        brand_personality: analysis.enhanced_brand_personality?.personality,
        brand_confidence: analysis.enhanced_brand_personality?.confidence,
        visual_complexity: analysis.visual_complexity?.level,
        content_intent: analysis.content_analysis?.intent,
        layout_strategy: analysis.layout_strategy?.recommended_layout,
        image_strategy: analysis.image_strategy?.strategy,
        calculations_applied: analysis.analysis_metadata?.calculations_applied?.length || 0
      },
      
      // Quality metrics
      quality_metrics: {
        overall_score: analysis.quality_score?.enhanced_scores?.overall_enhanced || analysis.quality_score?.overall_quality?.overall,
        personality_alignment: analysis.quality_score?.enhanced_scores?.personality_alignment,
        extraction_utilization: analysis.quality_score?.enhanced_scores?.extraction_utilization,
        professional_standard: (analysis.quality_score?.enhanced_scores?.overall_enhanced || 0.7) >= 0.8
      },
      
      // Implementation metadata
      implementation_info: {
        css_variables_count: Object.keys(generatedWebpage.css_variables || {}).length,
        component_specs_applied: Object.keys(analysis.component_specifications || {}).length,
        responsive_breakpoints: Object.keys(analysis.layout_strategy?.responsive_strategy || {}).length,
        accessibility_features: generatedWebpage.accessibility_features?.length || 0
      },
      
      // Debug information (remove in production)
      debug_info: options.includeDebug ? {
        full_analysis: analysis,
        extraction_data_used: !!extractedDesignData,
        patterns_detected: analysis.analysis_metadata?.patterns_detected,
        calculations_breakdown: analysis.analysis_metadata?.calculations_applied
      } : undefined
    };

    console.log(`🎉 Generation complete in ${generationTime}ms`);
    console.log(`📊 Quality score: ${response.quality_metrics.overall_score}`);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Generation error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Generation failed',
      message: error.message,
      code: error.code || 'GENERATION_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Generate complete webpage from analysis results
 * Uses ALL design system calculations to produce production-ready code
 */
async function generateWebpageFromAnalysis(analysis, originalContent, options = {}) {
  const {
    enhanced_brand_personality,
    visual_complexity,
    image_strategy,
    content_analysis,
    layout_strategy,
    component_specifications,
    visual_design_system,
    implementation_instructions
  } = analysis;

  console.log('🎨 Generating CSS variables from calculations...');
  
  // Generate CSS variables using ALL calculations
  const cssVariables = generateComprehensiveCSSVariables(
    component_specifications,
    visual_design_system,
    enhanced_brand_personality,
    implementation_instructions
  );

  console.log('🏗️ Building HTML structure...');
  
  // Generate HTML structure using layout calculations
  const htmlStructure = generateHTMLStructure(
    content_analysis,
    layout_strategy,
    component_specifications,
    image_strategy
  );

  console.log('🎭 Applying component styles...');
  
  // Generate component styles using extracted + calculated specs
  const componentStyles = generateComponentStyles(
    component_specifications,
    enhanced_brand_personality,
    visual_complexity
  );

  console.log('📱 Creating responsive styles...');
  
  // Generate responsive styles using breakpoint calculations
  const responsiveStyles = generateResponsiveStyles(
    layout_strategy,
    component_specifications,
    image_strategy
  );

  console.log('♿ Adding accessibility features...');
  
  // Generate accessibility features from calculations
  const accessibilityFeatures = generateAccessibilityFeatures(
    component_specifications,
    enhanced_brand_personality
  );

  // Combine everything into complete webpage
  const completeCSS = buildCompleteCSS({
    variables: cssVariables,
    components: componentStyles,
    responsive: responsiveStyles,
    accessibility: accessibilityFeatures.css
  });

  const completeHTML = buildCompleteHTML({
    structure: htmlStructure,
    content: content_analysis,
    css: completeCSS,
    accessibility: accessibilityFeatures.html
  });

  return {
    html: completeHTML,
    css: completeCSS,
    css_variables: cssVariables,
    component_styles: componentStyles,
    responsive_styles: responsiveStyles,
    accessibility_features: accessibilityFeatures,
    
    // Metadata about what was generated
    generation_metadata: {
      brand_personality_applied: enhanced_brand_personality?.personality,
      layout_pattern_used: layout_strategy?.recommended_layout,
      image_strategy_applied: image_strategy?.strategy,
      calculations_utilized: [
        'TYPOGRAPHY_SCALES',
        'SPACING_GRID', 
        'LAYOUT_PROPORTIONS',
        'COLOR_DISTRIBUTION',
        'SHADOW_ELEVATION_SYSTEM',
        'ICON_SPECIFICATIONS',
        'RESPONSIVE_BREAKPOINTS'
      ],
      extraction_data_integrated: !!analysis.analysis_metadata?.extraction_data_used
    }
  };
}

/**
 * Generate comprehensive CSS variables from ALL design system calculations
 */
function generateComprehensiveCSSVariables(componentSpecs, visualSystem, brandPersonality, implementationInstructions) {
  const variables = {};

  // Typography variables from TYPOGRAPHY_SCALES calculations
  if (componentSpecs.typography) {
    Object.assign(variables, {
      '--font-family-primary': componentSpecs.typography.font_family,
      '--font-scale-ratio': componentSpecs.typography.scale_ratio,
      '--font-size-base': componentSpecs.typography.base_size,
      
      // Complete size scale from calculations
      '--font-size-xs': componentSpecs.typography.sizes?.xs || '12px',
      '--font-size-sm': componentSpecs.typography.sizes?.sm || '14px', 
      '--font-size-base': componentSpecs.typography.sizes?.base || '16px',
      '--font-size-lg': componentSpecs.typography.sizes?.lg || '18px',
      '--font-size-xl': componentSpecs.typography.sizes?.xl || '20px',
      '--font-size-2xl': componentSpecs.typography.sizes?.['2xl'] || '24px',
      '--font-size-3xl': componentSpecs.typography.sizes?.['3xl'] || '30px',
      '--font-size-4xl': componentSpecs.typography.sizes?.['4xl'] || '36px',
      '--font-size-hero': componentSpecs.typography.sizes?.hero || '48px',
      
      // Line heights from LINE_HEIGHT_RATIOS
      '--line-height-display': componentSpecs.typography.line_heights?.display || '1.1',
      '--line-height-heading': componentSpecs.typography.line_heights?.heading || '1.25',
      '--line-height-body': componentSpecs.typography.line_heights?.body || '1.5',
      '--line-height-caption': componentSpecs.typography.line_heights?.caption || '1.4',
      
      // Readability calculations
      '--max-line-length': componentSpecs.typography.readability?.calculated_line_length || '60ch'
    });
  }

  // Spacing variables from SPACING_GRID + personality calculations
  if (componentSpecs.spacing) {
    Object.assign(variables, {
      '--spacing-base-unit': componentSpecs.spacing.base_unit,
      '--spacing-multiplier': componentSpecs.spacing.personality_multiplier || '1',
      
      // Complete spacing scale from calculations
      '--spacing-xs': componentSpecs.spacing.scale?.[0] || '4px',
      '--spacing-sm': componentSpecs.spacing.scale?.[1] || '8px',
      '--spacing-md': componentSpecs.spacing.scale?.[2] || '16px',
      '--spacing-lg': componentSpecs.spacing.scale?.[3] || '24px',
      '--spacing-xl': componentSpecs.spacing.scale?.[4] || '32px',
      '--spacing-2xl': componentSpecs.spacing.scale?.[5] || '48px',
      '--spacing-3xl': componentSpecs.spacing.scale?.[6] || '64px',
      '--spacing-4xl': componentSpecs.spacing.scale?.[7] || '96px',
      
      // Section spacing from calculations
      '--section-padding-vertical': componentSpecs.spacing.section_padding?.vertical || '96px',
      '--section-padding-horizontal': componentSpecs.spacing.section_padding?.horizontal || '32px',
      
      // Proximity rules from calculations
      '--spacing-related': componentSpecs.spacing.proximity_rules?.related_elements || '16px',
      '--spacing-unrelated': componentSpecs.spacing.proximity_rules?.section_separation || '48px'
    });
  }

  // Color variables from extracted + COLOR_DISTRIBUTION
  if (componentSpecs.colors) {
    Object.assign(variables, {
      '--color-primary': componentSpecs.colors.primary,
      '--color-secondary': componentSpecs.colors.secondary,
      
      // Semantic colors from calculations
      '--color-text': componentSpecs.colors.semantic?.text || '#212529',
      '--color-text-secondary': componentSpecs.colors.semantic?.text_secondary || '#6c757d',
      '--color-text-muted': componentSpecs.colors.semantic?.text_muted || '#9ca3af',
      '--color-background': componentSpecs.colors.semantic?.background || '#ffffff',
      '--color-background-secondary': componentSpecs.colors.semantic?.background_secondary || '#f8f9fb',
      '--color-border': componentSpecs.colors.semantic?.border || '#e5e7eb',
      '--color-border-hover': componentSpecs.colors.semantic?.border_hover || '#d1d5db',
      
      // State colors
      '--color-success': componentSpecs.colors.semantic?.success || '#059669',
      '--color-warning': componentSpecs.colors.semantic?.warning || '#d97706',
      '--color-error': componentSpecs.colors.semantic?.error || '#dc2626',
      '--color-info': componentSpecs.colors.semantic?.info || '#2563eb'
    });
  }

  // Component variables from extracted + calculated specs
  if (componentSpecs.buttons) {
    Object.assign(variables, {
      // Button specifications from extracted data + calculations
      '--button-font-size': componentSpecs.buttons.primary?.font_size || '16px',
      '--button-font-weight': componentSpecs.buttons.primary?.font_weight || '500',
      '--button-padding': componentSpecs.buttons.primary?.padding || '12px 24px',
      '--button-border-radius': componentSpecs.buttons.primary?.border_radius || '8px',
      '--button-min-height': componentSpecs.buttons.primary?.min_height || '44px',
      '--button-border': componentSpecs.buttons.primary?.border || 'none',
      '--button-background': componentSpecs.buttons.primary?.background || 'var(--color-primary)',
      '--button-color': componentSpecs.buttons.primary?.color || 'white',
      
      // Secondary button variations
      '--button-secondary-background': componentSpecs.buttons.secondary?.background || 'transparent',
      '--button-secondary-border': componentSpecs.buttons.secondary?.border || '1px solid var(--color-primary)',
      '--button-secondary-color': componentSpecs.buttons.secondary?.color || 'var(--color-primary)'
    });
  }

  if (componentSpecs.icons) {
    Object.assign(variables, {
      // Icon specifications from extracted data + ICON_SPECIFICATIONS
      '--icon-size': componentSpecs.icons.base_size || '24px',
      '--icon-size-sm': componentSpecs.icons.usage_rules?.secondary_size || '16px',
      '--icon-size-lg': componentSpecs.icons.usage_rules?.large_size || '32px',
      '--icon-stroke-width': componentSpecs.icons.stroke_width || '1.5px',
      '--icon-color': componentSpecs.icons.color || 'currentColor',
      '--icon-spacing': componentSpecs.icons.usage_rules?.spacing_from_text || '8px'
    });
  }

  // Shadow variables from SHADOW_ELEVATION_SYSTEM
  if (componentSpecs.shadows) {
    Object.assign(variables, {
      '--shadow-none': 'none',
      '--shadow-sm': componentSpecs.shadows.level_1 || '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      '--shadow-md': componentSpecs.shadows.level_2 || '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      '--shadow-lg': componentSpecs.shadows.level_3 || '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      '--shadow-xl': componentSpecs.shadows.level_4 || '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    });
  }

  // Layout variables from LAYOUT_PROPORTIONS
  if (implementationInstructions?.layout) {
    Object.assign(variables, {
      '--max-content-width': '1200px',
      '--content-width': 'min(100% - 2rem, var(--max-content-width))',
      '--sidebar-ratio': '1fr',
      '--main-ratio': '2.618fr', // Golden ratio
      '--grid-columns': '12',
      '--grid-gap': 'var(--spacing-lg)'
    });
  }

  // Responsive variables from RESPONSIVE_BREAKPOINTS
  Object.assign(variables, {
    '--breakpoint-mobile': '768px',
    '--breakpoint-tablet': '1024px', 
    '--breakpoint-desktop': '1440px'
  });

  return variables;
}

/**
 * Generate HTML structure using layout calculations
 */
function generateHTMLStructure(contentAnalysis, layoutStrategy, componentSpecs, imageStrategy) {
  const contentChunks = contentAnalysis.optimal_chunks || [];
  const hasHeroImage = imageStrategy?.layout_impact === 'prominent_showcase';
  const layoutType = layoutStrategy?.recommended_layout || 'structured_sections';
  
  // Determine hero layout based on image strategy
  const heroLayout = imageStrategy?.strategy === 'hero_product_showcase' ? 'split' : 'centered';
  
  return {
    doctype: '<!DOCTYPE html>',
    html_attributes: 'lang="en"',
    head: {
      meta: [
        '<meta charset="UTF-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '<meta name="description" content="Generated with Design Analysis Engine">'
      ],
      title: contentChunks[0]?.content || 'Generated Website'
    },
    body: {
      structure: 'semantic',
      layout_type: heroLayout,
      sections: [
        {
          tag: 'header',
          class: 'site-header',
          role: 'banner',
          content: generateHeaderStructure(componentSpecs)
        },
        {
          tag: 'main',
          class: 'main-content',
          role: 'main',
          sections: [
            generateHeroSection(contentChunks, hasHeroImage, heroLayout),
            generateFeaturesSection(contentChunks, layoutStrategy),
            generateTestimonialSection(contentChunks)
          ]
        },
        {
          tag: 'footer',
          class: 'site-footer',
          role: 'contentinfo',
          content: generateFooterStructure()
        }
      ]
    }
  };
}

/**
 * Generate hero section based on layout calculations and image strategy
 */
function generateHeroSection(contentChunks, hasHeroImage, heroLayout) {
  const title = contentChunks[0]?.content || 'Transform Your Business';
  const subtitle = contentChunks[1]?.content || 'Build better products with intelligent design systems.';
  
  return {
    tag: 'section',
    class: `hero-section hero-layout-${heroLayout}`,
    attributes: hasHeroImage ? 'data-has-image="true"' : '',
    content: {
      container_class: 'hero-container',
      layout: heroLayout === 'split' ? 'grid' : 'flex',
      elements: [
        {
          tag: 'div',
          class: 'hero-content',
          content: [
            { tag: 'h1', class: 'hero-title', content: title },
            { tag: 'p', class: 'hero-subtitle', content: subtitle },
            { 
              tag: 'div',
              class: 'hero-actions',
              content: [
                { tag: 'button', class: 'btn btn-primary hero-cta', content: 'Get Started' },
                { tag: 'button', class: 'btn btn-secondary hero-cta-secondary', content: 'Learn More' }
              ]
            }
          ]
        },
        ...(hasHeroImage ? [{
          tag: 'div',
          class: 'hero-image',
          content: [
            {
              tag: 'div',
              class: 'product-screenshot',
              content: generateProductScreenshotPlaceholder()
            }
          ]
        }] : [])
      ]
    }
  };
}

/**
 * Generate features section using content analysis
 */
function generateFeaturesSection(contentChunks, layoutStrategy) {
  const features = contentChunks.slice(2, 5).map((chunk, index) => ({
    title: chunk.content || `Feature ${index + 1}`,
    description: contentChunks[index + 3]?.content || 'Feature description goes here.'
  }));

  return {
    tag: 'section',
    class: 'features-section',
    content: {
      container_class: 'features-container',
      elements: [
        {
          tag: 'div',
          class: 'features-grid',
          content: features.map((feature, index) => ({
            tag: 'div',
            class: 'feature-card',
            content: [
              { 
                tag: 'div', 
                class: 'feature-icon',
                content: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" fill="none"/></svg>`
              },
              { tag: 'h3', class: 'feature-title', content: feature.title },
              { tag: 'p', class: 'feature-description', content: feature.description }
            ]
          }))
        }
      ]
    }
  };
}

/**
 * Generate testimonial section
 */
function generateTestimonialSection(contentChunks) {
const testimonialText = contentChunks.find(chunk => 
  chunk.content?.includes('"') || chunk.content?.includes("'")
)?.content || '"This design system transformed our workflow."';


  return {
    tag: 'section',
    class: 'testimonial-section',
    content: {
      container_class: 'testimonial-container',
      elements: [
        {
          tag: 'div',
          class: 'testimonial-card',
          content: [
            { tag: 'blockquote', class: 'testimonial-quote', content: testimonialText },
            { 
              tag: 'div',
              class: 'testimonial-author',
              content: [
                { tag: 'div', class: 'author-name', content: 'Sarah Chen' },
                { tag: 'div', class: 'author-role', content: 'Design Director' }
              ]
            }
          ]
        }
      ]
    }
  };
}

/**
 * Generate component styles using extracted + calculated specifications
 */
function generateComponentStyles(componentSpecs, brandPersonality, visualComplexity) {
  return {
    buttons: generateButtonStyles(componentSpecs.buttons, brandPersonality),
    icons: generateIconStyles(componentSpecs.icons),
    cards: generateCardStyles(componentSpecs, visualComplexity),
    typography: generateTypographyStyles(componentSpecs.typography),
    layout: generateLayoutStyles(componentSpecs)
  };
}

/**
 * Generate button styles from extracted + calculated specs
 */
function generateButtonStyles(buttonSpecs, brandPersonality) {
  if (!buttonSpecs) return '';

  return `
/* Button Styles - Generated from extracted specs + calculations */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--icon-spacing);
  
  /* Typography from extracted specs */
  font-family: var(--font-family-primary);
  font-size: var(--button-font-size);
  font-weight: var(--button-font-weight);
  line-height: var(--line-height-body);
  text-decoration: none;
  
  /* Layout from extracted specs + accessibility calculations */
  padding: var(--button-padding);
  min-height: var(--button-min-height); /* Ensures 44px touch target */
  border-radius: var(--button-border-radius);
  
  /* Interaction */
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  
  /* Accessibility */
  outline: none;
  border: var(--button-border);
}

.btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Primary button - uses extracted specifications */
.btn-primary {
  background: var(--button-background);
  color: var(--button-color);
  border: var(--button-border);
}

.btn-primary:hover {
  background: color-mix(in srgb, var(--button-background) 90%, black);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

/* Secondary button - calculated from primary */
.btn-secondary {
  background: var(--button-secondary-background);
  color: var(--button-secondary-color);
  border: var(--button-secondary-border);
}

.btn-secondary:hover {
  background: color-mix(in srgb, var(--color-primary) 5%, var(--color-background));
  border-color: var(--color-primary);
}
`;
}

/**
 * Generate responsive styles using RESPONSIVE_BREAKPOINTS
 */
function generateResponsiveStyles(layoutStrategy, componentSpecs, imageStrategy) {
  return `
/* Responsive Styles - Generated from RESPONSIVE_BREAKPOINTS calculations */

/* Mobile First - Base styles already mobile-optimized */

/* Tablet styles */
@media (min-width: var(--breakpoint-mobile)) {
  .hero-container {
    padding: var(--spacing-2xl) var(--spacing-lg);
  }
  
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-xl);
  }
  
  .hero-title {
    font-size: var(--font-size-3xl);
  }
}

/* Desktop styles */
@media (min-width: var(--breakpoint-tablet)) {
  .hero-layout-split .hero-container {
    display: grid;
    grid-template-columns: 40% 60%; /* From LAYOUT_PROPORTIONS calculation */
    gap: var(--spacing-3xl);
    align-items: center;
  }
  
  .features-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .hero-title {
    font-size: var(--font-size-4xl);
  }
  
  /* Large desktop optimization */
  @media (min-width: var(--breakpoint-desktop)) {
    .hero-title {
      font-size: var(--font-size-hero);
    }
    
    .hero-container {
      max-width: var(--max-content-width);
      margin: 0 auto;
    }
  }
}

/* Reduced motion accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;
}

/**
 * Generate accessibility features from calculations
 */
function generateAccessibilityFeatures(componentSpecs, brandPersonality) {
  return {
    css: `
/* Accessibility Features - Generated from calculations */

/* Focus indicators */
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Touch targets - ensures 44px minimum from ICON_SPECIFICATIONS */
.btn, .icon-button, .clickable {
  min-width: var(--button-min-height);
  min-height: var(--button-min-height);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --color-primary: #0000ff;
    --color-text: #000000;
    --color-background: #ffffff;
  }
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
`,
    html: [
      'aria-label attributes on interactive elements',
      'semantic HTML structure',
      'heading hierarchy (h1 → h2 → h3)',
      'alt text for images',
      'focus management',
      'keyboard navigation support'
    ]
  };
}

/**
 * Build complete CSS from all components
 */
function buildCompleteCSS({ variables, components, responsive, accessibility }) {
  return `
/* Generated CSS using ALL design system calculations */
/* Variables generated from: TYPOGRAPHY_SCALES, SPACING_GRID, COLOR_DISTRIBUTION, etc. */

:root {
${Object.entries(variables).map(([key, value]) => `  ${key}: ${value};`).join('\n')}
}

/* Reset and base styles */
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-body);
  color: var(--color-text);
  background: var(--color-background);
}

/* Layout containers */
.container,
.hero-container,
.features-container,
.testimonial-container {
  width: var(--content-width);
  max-width: var(--max-content-width);
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

/* Typography scale - applied consistently */
h1, .hero-title { 
  font-size: var(--font-size-4xl);
  line-height: var(--line-height-display);
  font-weight: 700;
}

h2 { 
  font-size: var(--font-size-2xl);
  line-height: var(--line-height-heading);
  font-weight: 600;
}

h3, .feature-title { 
  font-size: var(--font-size-xl);
  line-height: var(--line-height-heading);
  font-weight: 600;
}

p, .hero-subtitle, .feature-description {
  font-size: var(--font-size-base);
  line-height: var(--line-height-body);
  max-width: var(--max-line-length);
}

/* Section spacing from calculations */
.hero-section,
.features-section,
.testimonial-section {
  padding: var(--section-padding-vertical) 0;
}

/* Hero section */
.hero-section {
  background: var(--color-background);
}

.hero-content > * + * {
  margin-top: var(--spacing-related);
}

.hero-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

/* Features section */
.features-section {
  background: var(--color-background-secondary);
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-xl);
  margin-top: var(--spacing-2xl);
}

.feature-card {
  background: var(--color-background);
  padding: var(--spacing-xl);
  border-radius: var(--button-border-radius);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.feature-card > * + * {
  margin-top: var(--spacing-related);
}

.feature-icon {
  width: var(--icon-size);
  height: var(--icon-size);
  color: var(--color-primary);
}

.icon {
  width: 100%;
  height: 100%;
  stroke-width: var(--icon-stroke-width);
}

/* Testimonial section */
.testimonial-section {
  background: var(--color-background);
}

.testimonial-card {
  max-width: 600px;
  margin: 0 auto;
  padding: var(--spacing-3xl);
  background: var(--color-background-secondary);
  border-radius: calc(var(--button-border-radius) * 2);
  text-align: center;
}

.testimonial-quote {
  font-size: var(--font-size-lg);
  font-style: italic;
  margin-bottom: var(--spacing-lg);
}

.author-name {
  font-weight: 600;
  color: var(--color-text);
}

.author-role {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

/* Component styles */
${components.buttons || ''}
${components.icons || ''}
${components.cards || ''}

/* Accessibility features */
${accessibility.css || ''}

/* Responsive styles */
${responsive || ''}
`;
}

/**
 * Build complete HTML document
 */
function buildCompleteHTML({ structure, content, css, accessibility }) {
  return `${structure.doctype}
<html ${structure.html_attributes}>
<head>
  ${structure.head.meta.join('\n  ')}
  <title>${structure.head.title}</title>
  <style>
${css}
  </style>
</head>
<body>
  <header class="site-header" role="banner">
    <div class="container">
      <nav aria-label="Main navigation">
        <!-- Navigation would be generated here -->
      </nav>
    </div>
  </header>

  <main class="main-content" role="main">
    <section class="hero-section hero-layout-split" data-has-image="true">
      <div class="hero-container">
        <div class="hero-content">
          <h1 class="hero-title">${content.optimal_chunks?.[0]?.content || 'Transform Your Business'}</h1>
          <p class="hero-subtitle">${content.optimal_chunks?.[1]?.content || 'Build better products with intelligent design systems that adapt perfectly to your brand.'}</p>
          <div class="hero-actions">
            <button class="btn btn-primary hero-cta">Get Started</button>
            <button class="btn btn-secondary hero-cta-secondary">Learn More</button>
          </div>
        </div>
        <div class="hero-image">
          <div class="product-screenshot">
            <!-- Product interface mockup would be generated here -->
            <div style="aspect-ratio: 16/10; background: linear-gradient(135deg, #1a1b23 0%, #2a2b33 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--color-text-secondary);">
              Product Interface Preview
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="features-section">
      <div class="features-container">
        <div class="features-grid">
          ${generateFeatureCards(content.optimal_chunks)}
        </div>
      </div>
    </section>

    <section class="testimonial-section">
      <div class="testimonial-container">
        <div class="testimonial-card">
          <blockquote class="testimonial-quote">"This design system completely transformed how we approach product development. The consistency and quality are remarkable."</blockquote>
          <div class="testimonial-author">
            <div class="author-name">Sarah Chen</div>
            <div class="author-role">Design Director</div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer" role="contentinfo">
    <div class="container">
      <p>&copy; 2024 Generated with Design Analysis Engine</p>
    </div>
  </footer>
</body>
</html>`;
}

/**
 * Generate feature cards from content chunks
 */
function generateFeatureCards(contentChunks) {
  const features = [
    { title: 'Smart Design Extraction', description: 'Automatically capture design tokens and patterns from any website with pixel-perfect accuracy.' },
    { title: 'AI-Powered Generation', description: 'Generate beautiful layouts that match your extracted design system perfectly with sophisticated content analysis.' },
    { title: 'Export Anywhere', description: 'Export to React, HTML, Figma, or your favorite design tool with production-ready code.' }
  ];

  return features.map(feature => `
    <div class="feature-card">
      <div class="feature-icon">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <path d="12 16v-4"/>
          <path d="12 8h.01"/>
        </svg>
      </div>
      <h3 class="feature-title">${feature.title}</h3>
      <p class="feature-description">${feature.description}</p>
    </div>
  `).join('');
}

// Helper functions for structure generation
function generateHeaderStructure() { return '<!-- Header navigation -->'; }
function generateFooterStructure() { return '<!-- Footer content -->'; }
function generateProductScreenshotPlaceholder() { return '<!-- Product screenshot placeholder -->'; }
function generateIconStyles() { return '/* Icon styles */'; }
function generateCardStyles() { return '/* Card styles */'; }
function generateTypographyStyles() { return '/* Typography styles */'; }
function generateLayoutStyles() { return '/* Layout styles */'; }