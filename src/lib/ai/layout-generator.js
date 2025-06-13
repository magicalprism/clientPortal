// lib/ai/layout-generator.js
export class IntelligentLayoutGenerator {
  constructor() {
    this.sectionTypeMapping = {
      hero: 'generateHeroSection',
      features: 'generateFeaturesSection', 
      testimonial: 'generateTestimonialSection',
      cta: 'generateCTASection',
      gallery: 'generateGallerySection'
    };
  }

  /**
   * Main function: Combine copy + layout + brand into preview
   */
  generateLayout(copyClassification, layoutAnalysis, brandTokens) {
    console.log('🎨 === INTELLIGENT LAYOUT GENERATION ===');
    console.log('🎨 Copy sections:', copyClassification?.sections?.length || 0);
    console.log('🎨 Layout patterns available:', !!layoutAnalysis);
    console.log('🎨 Brand tokens available:', !!brandTokens);

    const generatedSections = [];
    
    // Match copy sections with layout patterns
    if (copyClassification?.sections) {
      copyClassification.sections.forEach((copySection, index) => {
        console.log(`🎨 Processing section ${index + 1}: ${copySection.type}`);
        
        // Find matching layout pattern for this section type
        const layoutPattern = this.findMatchingLayoutPattern(copySection.type, layoutAnalysis);
        
        // Generate section with copy + layout + brand
        const generatedSection = this.generateSection(copySection, layoutPattern, brandTokens, index);
        
        if (generatedSection) {
          generatedSections.push(generatedSection);
        }
      });
    }

    console.log('🎨 Generated sections:', generatedSections.length);
    
    return {
      sections: generatedSections,
      globalStyles: this.generateGlobalStyles(layoutAnalysis, brandTokens),
      metadata: {
        copySource: 'user-input',
        layoutSource: layoutAnalysis?.source || 'analysis',
        brandSource: 'design-tokens',
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Find the best layout pattern for a section type
   */
  findMatchingLayoutPattern(sectionType, layoutAnalysis) {
    console.log(`🎯 Finding layout pattern for: ${sectionType}`);
    
    // Look for detected sections of the same type
    const matchingSections = layoutAnalysis?.sections?.filter(s => s.type === sectionType) || [];
    
    if (matchingSections.length > 0) {
      console.log(`🎯 Found ${matchingSections.length} matching layout sections`);
      // Use the first (most confident) match
      return matchingSections[0];
    }
    
    // Fallback to layout patterns based on section type
    const fallbackPatterns = {
      hero: {
        layout: layoutAnalysis?.grids?.[0]?.type === 'flexbox' ? 'split-content' : 'centered',
        container: layoutAnalysis?.containers?.[0]?.value || '1200px',
        spacing: layoutAnalysis?.spacing?.common?.[2]?.value || '48px'
      },
      features: {
        layout: layoutAnalysis?.grids?.find(g => g.columns === 3) ? '3-col-grid' : 
                layoutAnalysis?.grids?.find(g => g.columns === 2) ? '2-col-grid' : 'stacked',
        container: layoutAnalysis?.containers?.[0]?.value || '1200px',
        spacing: layoutAnalysis?.spacing?.common?.[1]?.value || '32px'
      },
      testimonial: {
        layout: 'centered',
        container: layoutAnalysis?.containers?.find(c => c.usage === 'text-content')?.value || '720px',
        spacing: layoutAnalysis?.spacing?.common?.[1]?.value || '32px'
      },
      cta: {
        layout: 'centered',
        container: layoutAnalysis?.containers?.[0]?.value || '1200px',
        spacing: layoutAnalysis?.spacing?.common?.[0]?.value || '24px'
      }
    };
    
    console.log(`🎯 Using fallback pattern for ${sectionType}:`, fallbackPatterns[sectionType]);
    return fallbackPatterns[sectionType];
  }

  /**
   * Generate a single section with copy + layout + brand
   */
  generateSection(copySection, layoutPattern, brandTokens, index) {
    const sectionGenerator = this.sectionTypeMapping[copySection.type];
    
    if (!sectionGenerator || !this[sectionGenerator]) {
      console.warn(`🎨 No generator found for section type: ${copySection.type}`);
      return this.generateDefaultSection(copySection, layoutPattern, brandTokens, index);
    }
    
    return this[sectionGenerator](copySection, layoutPattern, brandTokens, index);
  }

  /**
   * Generate Hero Section
   */
  generateHeroSection(copySection, layoutPattern, brandTokens, index) {
    const isImageRight = layoutPattern?.layout === 'image-right' || layoutPattern?.layout === 'split-content';
    
    return {
      id: `hero-${index}`,
      type: 'hero',
      layout: layoutPattern?.layout || 'centered',
      container: layoutPattern?.container || '1200px',
      content: {
        headline: copySection.content.headline || copySection.content.text?.split('\n')[0],
        subheadline: copySection.content.subheadline || copySection.content.text?.split('\n')[1],
        cta: copySection.content.cta || 'Get Started',
        image: isImageRight ? '/api/placeholder/600/400' : null
      },
      styling: {
        backgroundColor: brandTokens?.colors?.background || '#ffffff',
        textColor: brandTokens?.colors?.text || '#000000',
        headlineSize: brandTokens?.typography?.h1?.size || '48px',
        headlineWeight: brandTokens?.typography?.h1?.weight || '600',
        headlineFont: brandTokens?.typography?.primary?.family || 'Inter',
        subheadlineSize: brandTokens?.typography?.body?.size || '18px',
        ctaBackgroundColor: brandTokens?.colors?.primary || '#0070f3',
        ctaTextColor: brandTokens?.colors?.onPrimary || '#ffffff',
        padding: layoutPattern?.spacing || '64px 0',
        containerMaxWidth: layoutPattern?.container || '1200px'
      },
      structure: isImageRight ? 'grid' : 'flex-column',
      gridTemplate: isImageRight ? '1fr 1fr' : 'none'
    };
  }

  /**
   * Generate Features Section
   */
  generateFeaturesSection(copySection, layoutPattern, brandTokens, index) {
    const features = this.extractFeatures(copySection.content);
    const columns = layoutPattern?.columns || Math.min(features.length, 3);
    
    return {
      id: `features-${index}`,
      type: 'features',
      layout: `${columns}-col-grid`,
      container: layoutPattern?.container || '1200px',
      content: {
        title: copySection.content.title || 'Features',
        features: features
      },
      styling: {
        backgroundColor: brandTokens?.colors?.backgroundSecondary || '#f8fafc',
        textColor: brandTokens?.colors?.text || '#000000',
        titleSize: brandTokens?.typography?.h2?.size || '32px',
        titleWeight: brandTokens?.typography?.h2?.weight || '600',
        titleFont: brandTokens?.typography?.primary?.family || 'Inter',
        featureTitleSize: brandTokens?.typography?.h3?.size || '20px',
        featureTextSize: brandTokens?.typography?.body?.size || '16px',
        padding: layoutPattern?.spacing || '64px 0',
        containerMaxWidth: layoutPattern?.container || '1200px',
        gridGap: brandTokens?.spacing?.large || '32px'
      },
      structure: 'grid',
      gridTemplate: `repeat(${columns}, 1fr)`
    };
  }

  /**
   * Generate Testimonial Section
   */
  generateTestimonialSection(copySection, layoutPattern, brandTokens, index) {
    return {
      id: `testimonial-${index}`,
      type: 'testimonial', 
      layout: 'centered',
      container: layoutPattern?.container || '720px',
      content: {
        quote: copySection.content.text || copySection.content.quote,
        author: copySection.content.author || 'Customer',
        company: copySection.content.company || '',
        avatar: '/api/placeholder/64/64'
      },
      styling: {
        backgroundColor: brandTokens?.colors?.background || '#ffffff',
        textColor: brandTokens?.colors?.text || '#000000',
        quoteSize: brandTokens?.typography?.large?.size || '24px',
        quoteWeight: '400',
        quoteFont: brandTokens?.typography?.primary?.family || 'Inter',
        authorSize: brandTokens?.typography?.small?.size || '14px',
        authorWeight: '500',
        padding: layoutPattern?.spacing || '64px 0',
        containerMaxWidth: layoutPattern?.container || '720px',
        borderLeft: `4px solid ${brandTokens?.colors?.primary || '#0070f3'}`
      },
      structure: 'flex-column'
    };
  }

  /**
   * Generate CTA Section
   */
  generateCTASection(copySection, layoutPattern, brandTokens, index) {
    return {
      id: `cta-${index}`,
      type: 'cta',
      layout: 'centered',
      container: layoutPattern?.container || '1200px',
      content: {
        headline: copySection.content.headline || copySection.content.text?.split('\n')[0],
        description: copySection.content.description || copySection.content.text?.split('\n')[1],
        primaryCTA: copySection.content.primaryCTA || 'Get Started',
        secondaryCTA: copySection.content.secondaryCTA || 'Learn More'
      },
      styling: {
        backgroundColor: brandTokens?.colors?.primary || '#0070f3',
        textColor: brandTokens?.colors?.onPrimary || '#ffffff',
        headlineSize: brandTokens?.typography?.h2?.size || '36px',
        headlineWeight: brandTokens?.typography?.h2?.weight || '600',
        headlineFont: brandTokens?.typography?.primary?.family || 'Inter',
        descriptionSize: brandTokens?.typography?.body?.size || '18px',
        primaryCTABg: brandTokens?.colors?.background || '#ffffff',
        primaryCTAText: brandTokens?.colors?.primary || '#0070f3',
        secondaryCTABg: 'transparent',
        secondaryCTAText: brandTokens?.colors?.onPrimary || '#ffffff',
        padding: layoutPattern?.spacing || '64px 0',
        containerMaxWidth: layoutPattern?.container || '1200px'
      },
      structure: 'flex-column'
    };
  }

  /**
   * Generate Default Section (fallback)
   */
  generateDefaultSection(copySection, layoutPattern, brandTokens, index) {
    return {
      id: `section-${index}`,
      type: copySection.type || 'content',
      layout: 'default',
      container: layoutPattern?.container || '1200px',
      content: {
        text: copySection.content.text || '',
        title: copySection.content.title || ''
      },
      styling: {
        backgroundColor: brandTokens?.colors?.background || '#ffffff',
        textColor: brandTokens?.colors?.text || '#000000',
        fontSize: brandTokens?.typography?.body?.size || '16px',
        fontFamily: brandTokens?.typography?.primary?.family || 'Inter',
        padding: layoutPattern?.spacing || '32px 0',
        containerMaxWidth: layoutPattern?.container || '1200px'
      },
      structure: 'flex-column'
    };
  }

  /**
   * Extract individual features from features content
   */
  extractFeatures(content) {
    if (content.features && Array.isArray(content.features)) {
      return content.features;
    }
    
    // Try to parse features from text
    const text = content.text || '';
    const lines = text.split('\n').filter(line => line.trim());
    
    // Look for bullet points or numbered lists
    const features = lines.map((line, index) => {
      const cleanLine = line.replace(/^[-•*\d+.)\s]+/, '').trim();
      const parts = cleanLine.split(':');
      
      return {
        id: `feature-${index}`,
        title: parts[0]?.trim() || `Feature ${index + 1}`,
        description: parts[1]?.trim() || cleanLine,
        icon: this.getFeatureIcon(index) // Placeholder icon
      };
    });
    
    return features.slice(0, 6); // Limit to 6 features max
  }

  /**
   * Get appropriate icon for feature (placeholder)
   */
  getFeatureIcon(index) {
    const icons = ['⚡', '🎯', '🔒', '📊', '🚀', '💎'];
    return icons[index % icons.length];
  }

  /**
   * Generate global styles based on layout analysis and brand tokens
   */
  generateGlobalStyles(layoutAnalysis, brandTokens) {
    return {
      containerMaxWidths: {
        small: layoutAnalysis?.containers?.find(c => c.usage === 'text-content')?.value || '720px',
        medium: layoutAnalysis?.containers?.find(c => c.usage === 'primary-content')?.value || '1200px', 
        large: layoutAnalysis?.containers?.find(c => c.usage === 'hero-sections')?.value || '1440px'
      },
      typography: {
        primary: brandTokens?.typography?.primary?.family || 'Inter',
        scale: layoutAnalysis?.typography?.scale || {
          h1: '48px',
          h2: '36px', 
          h3: '24px',
          body: '16px',
          small: '14px'
        }
      },
      colors: {
        primary: brandTokens?.colors?.primary || '#0070f3',
        background: brandTokens?.colors?.background || '#ffffff',
        text: brandTokens?.colors?.text || '#000000',
        border: brandTokens?.colors?.border || '#e5e7eb'
      },
      spacing: {
        xs: layoutAnalysis?.spacing?.common?.[0]?.value || '8px',
        sm: layoutAnalysis?.spacing?.common?.[1]?.value || '16px', 
        md: layoutAnalysis?.spacing?.common?.[2]?.value || '24px',
        lg: layoutAnalysis?.spacing?.common?.[3]?.value || '32px',
        xl: layoutAnalysis?.spacing?.common?.[4]?.value || '48px'
      },
      borderRadius: layoutAnalysis?.designSystem?.borderRadius?.[2] || '8px',
      shadows: layoutAnalysis?.designSystem?.shadows || [
        { name: 'sm', value: '0 1px 3px rgba(0,0,0,0.12)' },
        { name: 'md', value: '0 4px 12px rgba(0,0,0,0.15)' }
      ]
    };
  }
}

// Usage helper
export function generateIntelligentLayout(copyClassification, layoutAnalysis, brandTokens) {
  const generator = new IntelligentLayoutGenerator();
  return generator.generateLayout(copyClassification, layoutAnalysis, brandTokens);
}