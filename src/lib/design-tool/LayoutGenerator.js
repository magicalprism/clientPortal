// lib/design-tool/LayoutGenerator.js
export class LayoutGenerator {
  constructor(classifiedCopy, extractedLayout, brandTokens) {
    this.classifiedCopy = classifiedCopy;
    this.extractedLayout = extractedLayout;
    this.brandTokens = brandTokens;
    this.layoutRules = this.initializeLayoutRules();
  }

  // Initialize layout matching rules
  initializeLayoutRules() {
    return {
      hero: {
        preferredLayouts: ['centered', 'image-left', 'image-right', 'image-background'],
        containerRules: { 
          'image-background': 'full-width',
          default: 'contained'
        },
        contentRules: {
          shortHeadline: 'centered',
          longContent: 'image-left',
          visualFocus: 'image-background'
        }
      },
      features: {
        preferredLayouts: ['3-col-grid', '2-col-grid', 'stacked', 'carousel'],
        containerRules: {
          default: 'contained'
        },
        contentRules: {
          fewFeatures: '2-col-grid',
          manyFeatures: '3-col-grid',
          detailedFeatures: 'stacked'
        }
      },
      testimonial: {
        preferredLayouts: ['centered', 'carousel', '2-col-grid'],
        containerRules: {
          default: 'contained'
        },
        contentRules: {
          singleQuote: 'centered',
          multipleQuotes: 'carousel',
          withPhotos: '2-col-grid'
        }
      },
      cta: {
        preferredLayouts: ['centered', 'split', 'banner'],
        containerRules: {
          'banner': 'full-width',
          default: 'contained'
        },
        contentRules: {
          simple: 'centered',
          detailed: 'split',
          urgent: 'banner'
        }
      }
    };
  }

  // Generate all layout variations
  generateVariations() {
    return [
      this.generateStripeStyle(),
      this.generateAppleStyle(),
      this.generateLinearStyle(),
      this.generateNotionStyle()
    ];
  }

  // Stripe-inspired layout
  generateStripeStyle() {
    const sections = this.mapContentToLayout('stripe');
    return {
      name: 'Stripe Style',
      sections: sections,
      characteristics: ['Professional', 'Conversion-focused', 'Clean'],
      colorScheme: 'corporate',
      css: this.generateCSS('stripe'),
      html: this.generateHTML('stripe', sections)
    };
  }

  // Apple-inspired layout
  generateAppleStyle() {
    const sections = this.mapContentToLayout('apple');
    return {
      name: 'Apple Style',
      sections: sections,
      characteristics: ['Minimal', 'Visual-first', 'Premium'],
      colorScheme: 'monochromatic',
      css: this.generateCSS('apple'),
      html: this.generateHTML('apple', sections)
    };
  }

  // Linear-inspired layout
  generateLinearStyle() {
    const sections = this.mapContentToLayout('linear');
    return {
      name: 'Linear Style',
      sections: sections,
      characteristics: ['Modern', 'Developer-focused', 'Functional'],
      colorScheme: 'technical',
      css: this.generateCSS('linear'),
      html: this.generateHTML('linear', sections)
    };
  }

  // Notion-inspired layout
  generateNotionStyle() {
    const sections = this.mapContentToLayout('notion');
    return {
      name: 'Notion Style',
      sections: sections,
      characteristics: ['Content-rich', 'Organized', 'Flexible'],
      colorScheme: 'neutral',
      css: this.generateCSS('notion'),
      html: this.generateHTML('notion', sections)
    };
  }

  // Intelligent content-to-layout mapping
  mapContentToLayout(styleVariant) {
    const sortedCopy = this.classifiedCopy.sort((a, b) => a.priority - b.priority);
    
    return sortedCopy.map((copyBlock, index) => {
      const bestLayout = this.findBestLayout(copyBlock, styleVariant, index);
      const appliedStyle = this.applyBrandStyling(copyBlock.type, styleVariant);
      
      return {
        ...copyBlock,
        layout: bestLayout.layout,
        container: bestLayout.container,
        style: appliedStyle,
        metadata: {
          confidence: bestLayout.confidence,
          reasoning: bestLayout.reasoning
        }
      };
    });
  }

  // Find the best layout for a content block
  findBestLayout(copyBlock, styleVariant, position) {
    const contentAnalysis = this.analyzeContent(copyBlock);
    const layoutPreferences = this.getStyleLayoutPreferences(styleVariant);
    const extractedSuggestion = this.findMatchingExtractedLayout(copyBlock.type);
    
    // Score different layout options
    const layoutScores = this.scoreLayoutOptions(
      copyBlock.type, 
      contentAnalysis, 
      layoutPreferences, 
      extractedSuggestion,
      position
    );
    
    // Return the highest scoring layout
    const bestLayout = Object.entries(layoutScores)
      .sort(([,a], [,b]) => b.score - a.score)[0];
    
    return {
      layout: bestLayout[0],
      container: bestLayout[1].container,
      confidence: bestLayout[1].score,
      reasoning: bestLayout[1].reasoning
    };
  }

  // Analyze content characteristics
  analyzeContent(copyBlock) {
    const content = copyBlock.content || '';
    const wordCount = content.split(' ').length;
    const hasNumbers = /\d/.test(content);
    const hasQuotes = /[""]/.test(content);
    const sentiment = this.analyzeSentiment(content);
    
    return {
      length: wordCount > 50 ? 'long' : wordCount > 20 ? 'medium' : 'short',
      hasNumbers,
      hasQuotes,
      sentiment,
      complexity: this.assessComplexity(content)
    };
  }

  // Simple sentiment analysis
  analyzeSentiment(content) {
    const positive = ['amazing', 'great', 'excellent', 'love', 'best', 'wonderful'];
    const urgent = ['now', 'today', 'limited', 'hurry', 'quick', 'fast'];
    
    const lowerContent = content.toLowerCase();
    const positiveScore = positive.filter(word => lowerContent.includes(word)).length;
    const urgentScore = urgent.filter(word => lowerContent.includes(word)).length;
    
    if (urgentScore > 0) return 'urgent';
    if (positiveScore > 1) return 'positive';
    return 'neutral';
  }

  // Assess content complexity
  assessComplexity(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = content.split(' ').length / sentences.length;
    
    if (avgWordsPerSentence > 20) return 'complex';
    if (avgWordsPerSentence > 12) return 'moderate';
    return 'simple';
  }

  // Get style-specific layout preferences
  getStyleLayoutPreferences(styleVariant) {
    const preferences = {
      stripe: {
        hero: ['image-right', 'centered'],
        features: ['2-col-grid', '3-col-grid'],
        testimonial: ['centered', 'single-quote'],
        cta: ['centered', 'split']
      },
      apple: {
        hero: ['image-background', 'centered'],
        features: ['stacked', 'minimal-grid'],
        testimonial: ['carousel', 'minimal'],
        cta: ['minimal', 'full-width']
      },
      linear: {
        hero: ['centered', 'clean'],
        features: ['3-col-grid', 'icon-grid'],
        testimonial: ['carousel', 'developer-focused'],
        cta: ['button-focused', 'centered']
      },
      notion: {
        hero: ['content-focused', 'organized'],
        features: ['list-style', 'detailed'],
        testimonial: ['embedded', 'contextual'],
        cta: ['subtle', 'integrated']
      }
    };
    
    return preferences[styleVariant] || preferences.stripe;
  }

  // Score layout options
  scoreLayoutOptions(sectionType, contentAnalysis, layoutPreferences, extractedSuggestion, position) {
    const rules = this.layoutRules[sectionType];
    if (!rules) return { 'centered': { score: 0.5, container: 'contained', reasoning: 'Default fallback' } };
    
    const scores = {};
    
    rules.preferredLayouts.forEach(layout => {
      let score = 0.3; // Base score
      let reasoning = [];
      
      // Preference bonus
      const prefIndex = layoutPreferences[sectionType]?.indexOf(layout);
      if (prefIndex !== -1) {
        score += 0.3 - (prefIndex * 0.1);
        reasoning.push('Style preference');
      }
      
      // Content analysis bonus
      if (this.layoutMatchesContent(layout, contentAnalysis, sectionType)) {
        score += 0.2;
        reasoning.push('Content match');
      }
      
      // Extracted layout bonus
      if (extractedSuggestion && extractedSuggestion.layout === layout) {
        score += 0.15;
        reasoning.push('Inspiration match');
      }
      
      // Position bonus (first section should be impactful)
      if (position === 0 && ['image-background', 'centered', 'image-right'].includes(layout)) {
        score += 0.1;
        reasoning.push('Hero position');
      }
      
      scores[layout] = {
        score,
        container: this.getContainerType(layout, rules),
        reasoning: reasoning.join(', ')
      };
    });
    
    return scores;
  }

  // Check if layout matches content characteristics
  layoutMatchesContent(layout, analysis, sectionType) {
    const matches = {
      hero: {
        'image-background': analysis.sentiment === 'positive',
        'centered': analysis.length === 'short',
        'image-left': analysis.length === 'long'
      },
      features: {
        '3-col-grid': analysis.hasNumbers,
        'stacked': analysis.complexity === 'complex',
        '2-col-grid': analysis.length === 'medium'
      },
      testimonial: {
        'carousel': analysis.hasQuotes,
        'centered': analysis.length === 'short'
      },
      cta: {
        'banner': analysis.sentiment === 'urgent',
        'centered': analysis.length === 'short'
      }
    };
    
    return matches[sectionType]?.[layout] || false;
  }

  // Get container type based on layout and rules
  getContainerType(layout, rules) {
    return rules.containerRules[layout] || rules.containerRules.default || 'contained';
  }

  // Find matching extracted layout
  findMatchingExtractedLayout(sectionType) {
    return this.extractedLayout.find(layout => layout.type === sectionType);
  }

  // Apply brand styling with style variant
  applyBrandStyling(sectionType, styleVariant) {
    const colors = this.brandTokens.colors || {};
    const typography = this.brandTokens.typography || {};
    const spacing = this.brandTokens.spacing || {};
    
    const styleVariations = {
      stripe: this.getStripeColors(colors),
      apple: this.getAppleColors(colors),
      linear: this.getLinearColors(colors),
      notion: this.getNotionColors(colors)
    };
    
    const variantColors = styleVariations[styleVariant];
    
    const sectionStyles = {
      hero: {
        backgroundColor: variantColors.primary,
        color: variantColors.primaryText,
        fontFamily: typography.heading?.value || 'Inter, sans-serif',
        padding: spacing.lg?.value || '4rem 2rem'
      },
      features: {
        backgroundColor: variantColors.background,
        color: variantColors.text,
        fontFamily: typography.body?.value || 'Inter, sans-serif',
        padding: spacing.md?.value || '3rem 1.5rem'
      },
      testimonial: {
        backgroundColor: variantColors.secondary,
        color: variantColors.secondaryText,
        fontFamily: typography.body?.value || 'Inter, sans-serif',
        padding: spacing.md?.value || '3rem 1.5rem'
      },
      cta: {
        backgroundColor: variantColors.accent,
        color: variantColors.accentText,
        fontFamily: typography.heading?.value || 'Inter, sans-serif',
        padding: spacing.lg?.value || '4rem 2rem'
      }
    };
    
    return sectionStyles[sectionType] || sectionStyles.features;
  }

  // Style-specific color schemes
  getStripeColors(colors) {
    return {
      primary: colors.primary?.value || '#635BFF',
      primaryText: '#ffffff',
      background: '#ffffff',
      text: colors.neutral?.value || '#425466',
      secondary: '#F6F9FC',
      secondaryText: colors.neutral?.value || '#425466',
      accent: colors.secondary?.value || '#00D924',
      accentText: '#ffffff'
    };
  }

  getAppleColors(colors) {
    return {
      primary: '#000000',
      primaryText: '#ffffff',
      background: '#ffffff',
      text: '#1d1d1f',
      secondary: '#f5f5f7',
      secondaryText: '#1d1d1f',
      accent: colors.primary?.value || '#007AFF',
      accentText: '#ffffff'
    };
  }

  getLinearColors(colors) {
    return {
      primary: colors.primary?.value || '#5E6AD2',
      primaryText: '#ffffff',
      background: '#ffffff',
      text: '#2D3748',
      secondary: '#F7FAFC',
      secondaryText: '#2D3748',
      accent: colors.secondary?.value || '#9F7AEA',
      accentText: '#ffffff'
    };
  }

  getNotionColors(colors) {
    return {
      primary: '#ffffff',
      primaryText: '#37352F',
      background: '#ffffff',
      text: '#37352F',
      secondary: '#F7F6F3',
      secondaryText: '#37352F',
      accent: colors.primary?.value || '#2383E2',
      accentText: '#ffffff'
    };
  }

  // Generate CSS for the layout
  generateCSS(styleVariant) {
    const colors = this.getStyleColors(styleVariant);
    const typography = this.brandTokens.typography || {};
    
    return `
/* ${styleVariant.charAt(0).toUpperCase() + styleVariant.slice(1)} Style CSS */
:root {
  --primary-color: ${colors.primary};
  --primary-text: ${colors.primaryText};
  --background-color: ${colors.background};
  --text-color: ${colors.text};
  --secondary-bg: ${colors.secondary};
  --secondary-text: ${colors.secondaryText};
  --accent-color: ${colors.accent};
  --accent-text: ${colors.accentText};
  --font-heading: ${typography.heading?.value || 'Inter, sans-serif'};
  --font-body: ${typography.body?.value || 'Inter, sans-serif'};
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-body);
  line-height: 1.6;
  color: var(--text-color);
}

.section {
  position: relative;
  overflow: hidden;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.container-full {
  width: 100%;
  padding: 0;
}

/* Layout Utilities */
.layout-centered { text-align: center; }
.layout-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; }
.layout-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
.layout-stacked { display: flex; flex-direction: column; gap: 2rem; }
.layout-carousel { display: flex; overflow-x: auto; gap: 1.5rem; scroll-snap-type: x mandatory; }

@media (max-width: 768px) {
  .layout-grid-2, .layout-grid-3 {
    grid-template-columns: 1fr;
  }
}
    `.trim();
  }

  // Generate HTML for the layout
  generateHTML(styleVariant, sections) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${styleVariant.charAt(0).toUpperCase() + styleVariant.slice(1)} Style Layout</title>
</head>
<body>
    ${sections.map(section => this.generateSectionHTML(section)).join('\n    ')}
</body>
</html>`;
  }

  // Generate HTML for individual sections
  generateSectionHTML(section) {
    const containerClass = section.container === 'full-width' ? 'container-full' : 'container';
    const layoutClass = this.getLayoutClass(section.layout);
    
    return `
<section class="section" style="background-color: ${section.style.backgroundColor}; color: ${section.style.color}; padding: ${section.style.padding};">
    <div class="${containerClass}">
        <div class="${layoutClass}">
            ${this.generateSectionContent(section)}
        </div>
    </div>
</section>`;
  }

  // Get CSS class for layout
  getLayoutClass(layout) {
    const layoutMap = {
      'centered': 'layout-centered',
      '2-col-grid': 'layout-grid-2',
      '3-col-grid': 'layout-grid-3',
      'stacked': 'layout-stacked',
      'carousel': 'layout-carousel'
    };
    
    return layoutMap[layout] || 'layout-centered';
  }

  // Generate content based on section type
  generateSectionContent(section) {
    switch (section.type) {
      case 'hero':
        return `
            <h1 style="font-family: var(--font-heading); font-size: 3rem; font-weight: 700; margin-bottom: 1rem;">
                ${this.extractHeadline(section.content)}
            </h1>
            <p style="font-size: 1.25rem; margin-bottom: 2rem; opacity: 0.9;">
                ${this.extractSubheading(section.content)}
            </p>
            <a href="#" style="display: inline-block; background-color: var(--accent-color); color: var(--accent-text); padding: 1rem 2rem; text-decoration: none; border-radius: 0.5rem; font-weight: 600;">
                Get Started
            </a>`;
      
      case 'features':
        return this.generateFeaturesContent();
      
      case 'testimonial':
        return this.generateTestimonialContent(section);
      
      case 'cta':
        return this.generateCTAContent(section);
      
      default:
        return `<div>${section.content || 'Content goes here'}</div>`;
    }
  }

  // Extract headline from content
  extractHeadline(content) {
    if (!content) return 'Transform Your Business';
    const sentences = content.split(/[.!?]+/);
    return sentences[0]?.trim() || 'Transform Your Business';
  }

  // Extract subheading from content
  extractSubheading(content) {
    if (!content) return 'Discover powerful solutions that help you achieve your goals.';
    const sentences = content.split(/[.!?]+/);
    return sentences.slice(1, 3).join('. ').trim() || 'Discover powerful solutions that help you achieve your goals.';
  }

  // Generate features content
  generateFeaturesContent() {
    return `
        <div>
            <h3 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 1rem;">⚡ Fast Performance</h3>
            <p>Lightning-fast loading times and smooth interactions</p>
        </div>
        <div>
            <h3 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 1rem;">🔒 Secure & Reliable</h3>
            <p>Enterprise-grade security with 99.9% uptime guarantee</p>
        </div>
        <div>
            <h3 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 1rem;">🎨 Beautiful Design</h3>
            <p>Stunning interfaces that users love to interact with</p>
        </div>`;
  }

  // Generate testimonial content
  generateTestimonialContent(section) {
    const quote = section.content || "This product has completely transformed how we work. The results speak for themselves.";
    return `
        <blockquote style="font-size: 1.25rem; font-style: italic; margin-bottom: 2rem;">
            "${quote}"
        </blockquote>
        <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="width: 3rem; height: 3rem; background-color: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                SJ
            </div>
            <div>
                <div style="font-weight: 600;">Sarah Johnson</div>
                <div style="opacity: 0.8;">CEO, TechCorp</div>
            </div>
        </div>`;
  }

  // Generate CTA content
  generateCTAContent(section) {
    return `
        <h2 style="font-family: var(--font-heading); font-size: 2.5rem; margin-bottom: 1rem;">
            Ready to Get Started?
        </h2>
        <p style="font-size: 1.25rem; margin-bottom: 2rem; opacity: 0.9;">
            ${section.content?.substring(0, 100) || 'Join thousands of satisfied customers today'}
        </p>
        <div style="display: flex; gap: 1rem; justify-content: center;">
            <a href="#" style="background-color: var(--accent-color); color: var(--accent-text); padding: 1rem 2rem; text-decoration: none; border-radius: 0.5rem; font-weight: 600;">
                Start Free Trial
            </a>
            <a href="#" style="border: 2px solid var(--accent-color); color: var(--accent-color); padding: 1rem 2rem; text-decoration: none; border-radius: 0.5rem; font-weight: 600;">
                Learn More
            </a>
        </div>`;
  }

  // Get style colors helper
  getStyleColors(styleVariant) {
    const colors = this.brandTokens.colors || {};
    
    switch (styleVariant) {
      case 'stripe':
        return this.getStripeColors(colors);
      case 'apple':
        return this.getAppleColors(colors);
      case 'linear':
        return this.getLinearColors(colors);
      case 'notion':
        return this.getNotionColors(colors);
      default:
        return this.getStripeColors(colors);
    }
  }
}