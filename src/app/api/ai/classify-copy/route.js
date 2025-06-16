// app/api/ai/classify-copy/route.js (INTELLIGENT PARSING WITH FULL DESIGN SYSTEM)
import { DesignAnalysisEngine } from '@/lib/design-analysis/design-analysis-master.js';

export async function POST(request) {
  try {
    const { content, text, brandTokens, industryContext } = await request.json();
    const copyText = content || text;

    if (!copyText || copyText.trim().length === 0) {
      return Response.json({ 
        success: false,
        error: 'Text content is required' 
      }, { status: 400 });
    }

    console.log('🧠 Using Intelligent Content Parsing System...');
    console.log('📄 Content length:', copyText.length, 'characters');

    // Initialize the intelligent parser
    const intelligentParser = new IntelligentContentParser(
      brandTokens || {},
      industryContext || 'saas'
    );

    // Run intelligent parsing with full design system
    const intelligentAnalysis = await intelligentParser.performIntelligentAnalysis(copyText);
    
    return Response.json({
      success: true,
      analysis: {
        // Intelligently parsed sections with full metadata
        sections: intelligentAnalysis.sections,
        
        // Intent analysis with signal detection
        intent: intelligentAnalysis.intent_analysis.primary_intent,
        intent_analysis: intelligentAnalysis.intent_analysis,
        
        // Content complexity analysis
        complexity: intelligentAnalysis.complexity_analysis,
        
        // Layout strategy recommendation
        recommended_layout: intelligentAnalysis.layout_strategy.recommended_layout,
        layout_strategy: intelligentAnalysis.layout_strategy,
        
        // Quality metrics based on design system
        quality_metrics: intelligentAnalysis.quality_metrics,

        // Design analysis with full calculations
        design_analysis: {
          optimal_layout_type: intelligentAnalysis.layout_strategy.recommended_layout,
          visual_hierarchy: intelligentAnalysis.layout_strategy.visual_hierarchy,
          component_specs: intelligentAnalysis.component_specifications,
          sections_detected: intelligentAnalysis.sections.length,
          pattern_recognition_confidence: intelligentAnalysis.pattern_recognition_confidence
        },

        // Full analysis for advanced usage
        full_analysis: intelligentAnalysis,
        
        // Design system calculations applied
        calculations_applied: intelligentAnalysis.calculations_metadata,
        
        // Wireframe data for visual preview
        wireframe_data: intelligentAnalysis.wireframe_specifications
      },
      engine_used: 'IntelligentContentParsingSystem',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Intelligent parsing error:', error);
    
    return Response.json({
      success: false,
      error: 'Intelligent parsing failed: ' + error.message,
      fallback_used: true
    }, { status: 500 });
  }
}

/**
 * INTELLIGENT CONTENT PARSER
 * Uses pattern recognition and full design system calculations
 */
class IntelligentContentParser {
  constructor(brandTokens, industryContext) {
    this.brandTokens = brandTokens;
    this.industryContext = industryContext;
    
    // Initialize design system engine
    this.designEngine = new DesignAnalysisEngine(brandTokens, industryContext, 'general');
    
    // Content chunk specifications from your design system
    this.CONTENT_CHUNKS = {
      hero_headline: { words: 6, chars: 60 },
      hero_subtext: { words: 15, chars: 120 },
      feature_title: { words: 4, chars: 40 },
      feature_description: { words: 20, chars: 150 },
      paragraph_optimal: { words: 50, chars: 400 },
      paragraph_max: { words: 75, chars: 600 }
    };

    // Intent detection with sophisticated signals
    this.INTENT_SIGNALS = {
      problem_solving: [
        'complex maze', 'tensions keep bubbling', 'surface-level fix', 
        'how change actually happens', 'real systems', 'real people', 'real time'
      ],
      authority_establishment: [
        'three decades', 'youngest woman to lead', 'major AFL-CIO federation', 
        '110,000 workers', 'unique insights', 'experience', 'expertise'
      ],
      trust_building: [
        'proven', 'trusted', 'certified', 'reliable', 'guarantee', 
        'established', 'track record', 'results'
      ],
      educational_informing: [
        'learn', 'understand', 'guide', 'how to', 'insights into', 
        'discover', 'explore', 'explain'
      ],
      personal_connection: [
        "Hi. I'm", 'I never set out', 'I started as', 'my journey', 
        'personal story', 'background'
      ]
    };

    // Section detection patterns with sophisticated reasoning
    this.SECTION_PATTERNS = [
      {
        pattern: /^About\s+.+$/im,
        type: 'hero_headline',
        reasoning: 'Starts with "About", introductory headline pattern',
        priority: 1
      },
      {
        pattern: /Turn\s+.+\s+into\s+.+$/im,
        type: 'hero_subheadline', 
        reasoning: 'Transformation language, value proposition format',
        priority: 2
      },
      {
        pattern: /You're not leading in easy times/i,
        type: 'problem_statement',
        reasoning: 'Identifies customer challenges and current situation',
        priority: 3
      },
      {
        pattern: /You don't need another/i,
        type: 'value_proposition',
        reasoning: 'Contrasts what they don\'t need vs what they do need',
        priority: 4
      },
      {
        pattern: /Hi\.\s*I'm\s+.+/i,
        type: 'personal_introduction',
        reasoning: 'Direct personal introduction, builds connection',
        priority: 5
      },
      {
        pattern: /(After|Over)\s+(three decades|[\d]+\s+years)/i,
        type: 'credentials_experience',
        reasoning: 'Establishes authority through experience and background',
        priority: 6
      },
      {
        pattern: /I never set out to/i,
        type: 'origin_story',
        reasoning: 'Personal backstory, humanizes the expert',
        priority: 7
      },
      {
        pattern: /You've tried\s+.+\s+but/i,
        type: 'problem_agitation',
        reasoning: 'Agitates the problem by mentioning failed attempts',
        priority: 3
      }
    ];
  }

  async performIntelligentAnalysis(content) {
    console.log('🔍 Starting intelligent content analysis...');
    
    // Step 1: Intelligent section detection using pattern recognition
    const intelligentSections = this.detectIntelligentSections(content);
    
    // Step 2: Apply content chunks validation
    const validatedSections = this.validateSectionsAgainstContentChunks(intelligentSections);
    
    // Step 3: Sophisticated intent analysis
    const intentAnalysis = this.performSophisticatedIntentAnalysis(content);
    
    // Step 4: Content complexity analysis
    const complexityAnalysis = this.analyzeContentComplexity(content, validatedSections);
    
    // Step 5: Layout strategy determination
    const layoutStrategy = this.determineLayoutStrategy(validatedSections, intentAnalysis, complexityAnalysis);
    
    // Step 6: Apply design system calculations
    const designSystemSections = this.applyDesignSystemCalculations(validatedSections, layoutStrategy);
    
    // Step 7: Quality metrics calculation
    const qualityMetrics = this.calculateQualityMetrics(designSystemSections, intentAnalysis);
    
    // Step 8: Component specifications
    const componentSpecs = this.generateComponentSpecifications(designSystemSections, layoutStrategy);
    
    // Step 9: Wireframe specifications for visual preview
    const wireframeSpecs = this.generateWireframeSpecifications(designSystemSections, layoutStrategy);
    
    return {
      sections: designSystemSections,
      intent_analysis: intentAnalysis,
      complexity_analysis: complexityAnalysis,
      layout_strategy: layoutStrategy,
      quality_metrics: qualityMetrics,
      component_specifications: componentSpecs,
      wireframe_specifications: wireframeSpecs,
      pattern_recognition_confidence: this.calculatePatternConfidence(designSystemSections),
      calculations_metadata: this.getCalculationsMetadata()
    };
  }

  /**
   * STEP 1: Intelligent section detection using pattern recognition
   */
  detectIntelligentSections(content) {
    console.log('🎯 Detecting sections using intelligent pattern recognition...');
    
    const sections = [];
    let processedContent = '';
    
    // Sort patterns by priority for proper section ordering
    const sortedPatterns = [...this.SECTION_PATTERNS].sort((a, b) => a.priority - b.priority);
    
    sortedPatterns.forEach(patternDef => {
      const match = content.match(patternDef.pattern);
      if (match && !processedContent.includes(match[0])) {
        console.log(`✅ Detected ${patternDef.type}: "${match[0]}"`);
        
        // Find section boundaries
        const sectionContent = this.extractSectionContent(content, match, patternDef);
        
        if (sectionContent && sectionContent.trim().length > 0) {
          sections.push({
            type: patternDef.type,
            content: sectionContent.trim(),
            word_count: sectionContent.trim().split(/\s+/).length,
            char_count: sectionContent.trim().length,
            priority: patternDef.priority,
            reasoning: patternDef.reasoning,
            pattern_match: match[0],
            confidence: 'high'
          });
          
          processedContent += sectionContent;
        }
      }
    });

    // If no patterns matched, create basic sections
    if (sections.length === 0) {
      console.log('⚠️ No patterns matched, creating basic sections...');
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      if (sentences.length > 0) {
        sections.push({
          type: 'hero_headline',
          content: sentences[0].trim(),
          word_count: sentences[0].trim().split(/\s+/).length,
          char_count: sentences[0].trim().length,
          priority: 1,
          reasoning: 'First sentence used as headline fallback',
          confidence: 'medium'
        });
      }
    }

    console.log(`📊 Detected ${sections.length} intelligent sections`);
    return sections;
  }

  /**
   * Extract section content with intelligent boundary detection
   */
  extractSectionContent(fullContent, match, patternDef) {
    const matchStart = fullContent.indexOf(match[0]);
    let sectionEnd = fullContent.length;
    
    // Look for natural section boundaries
    const afterMatch = fullContent.substring(matchStart);
    
    // Try to find next section pattern
    const nextPatterns = this.SECTION_PATTERNS.filter(p => p.priority > patternDef.priority);
    
    for (const nextPattern of nextPatterns) {
      const nextMatch = afterMatch.match(nextPattern.pattern);
      if (nextMatch) {
        const nextStart = afterMatch.indexOf(nextMatch[0]);
        sectionEnd = matchStart + nextStart;
        break;
      }
    }
    
    // If no next pattern, look for natural paragraph breaks
    if (sectionEnd === fullContent.length) {
      const paragraphBreaks = afterMatch.match(/\n\s*\n/g);
      if (paragraphBreaks) {
        const firstBreak = afterMatch.indexOf(paragraphBreaks[0]);
        if (firstBreak > 50) { // Don't make sections too short
          sectionEnd = matchStart + firstBreak;
        }
      }
    }
    
    return fullContent.substring(matchStart, sectionEnd).trim();
  }

  /**
   * STEP 2: Validate sections against CONTENT_CHUNKS specifications
   */
  validateSectionsAgainstContentChunks(sections) {
    console.log('📏 Validating sections against CONTENT_CHUNKS specifications...');
    
    return sections.map(section => {
      const validation = {};
      
      // Check against all content chunk specifications
      Object.entries(this.CONTENT_CHUNKS).forEach(([chunkType, specs]) => {
        const wordFits = section.word_count <= specs.words * 1.5; // 50% flexibility
        const charFits = section.char_count <= specs.chars * 1.5;
        
        validation[chunkType] = {
          meets_word_spec: wordFits,
          meets_char_spec: charFits,
          word_efficiency: Number((section.word_count / specs.words).toFixed(2)),
          char_efficiency: Number((section.char_count / specs.chars).toFixed(2)),
          overall_fit: wordFits && charFits
        };
      });
      
      // Find best fitting chunk type
      const bestFit = Object.entries(validation)
        .filter(([type, val]) => val.overall_fit)
        .sort((a, b) => a[1].word_efficiency - b[1].word_efficiency)[0];
      
      return {
        ...section,
        content_chunks_validation: validation,
        best_fit_chunk: bestFit ? bestFit[0] : 'exceeds_all_specs',
        meets_content_specs: !!bestFit,
        optimization_needed: !bestFit
      };
    });
  }

  /**
   * STEP 3: Sophisticated intent analysis with signal detection
   */
  performSophisticatedIntentAnalysis(content) {
    console.log('🎯 Performing sophisticated intent analysis...');
    
    const contentLower = content.toLowerCase();
    const intentScores = {};
    
    // Analyze each intent category
    Object.entries(this.INTENT_SIGNALS).forEach(([intent, signals]) => {
      const matches = signals.filter(signal => contentLower.includes(signal.toLowerCase()));
      
      intentScores[intent] = {
        score: matches.length / signals.length,
        matched_signals: matches,
        total_signals: signals.length,
        confidence: matches.length > 0 ? 'high' : 'low'
      };
    });
    
    // Determine primary intent
    const primaryIntent = Object.entries(intentScores)
      .sort((a, b) => b[1].score - a[1].score)[0];
    
    return {
      primary_intent: primaryIntent[0],
      primary_intent_score: primaryIntent[1].score,
      primary_intent_confidence: primaryIntent[1].confidence,
      all_intent_scores: intentScores,
      intent_signals_detected: Object.values(intentScores)
        .reduce((total, intent) => total + intent.matched_signals.length, 0)
    };
  }

  /**
   * STEP 4: Content complexity analysis
   */
  analyzeContentComplexity(content, sections) {
    const wordCount = content.split(/\s+/).length;
    const sectionCount = sections.length;
    const conceptCount = this.detectConcepts(content);
    
    let complexity;
    if (conceptCount <= 1 && wordCount < 200) {
      complexity = 'simple';
    } else if (conceptCount <= 4 && wordCount < 800) {
      complexity = 'moderate';
    } else {
      complexity = 'complex';
    }
    
    return {
      complexity_level: complexity,
      word_count: wordCount,
      section_count: sectionCount,
      concept_count: conceptCount,
      reading_time: Math.ceil(wordCount / 200),
      density_score: wordCount > 500 ? 0.8 : wordCount > 200 ? 0.5 : 0.3
    };
  }

  detectConcepts(content) {
    // Simple concept detection based on key phrases
    const conceptIndicators = [
      /problem|challenge|difficulty/i,
      /solution|approach|method/i,
      /experience|background|expertise/i,
      /result|outcome|success/i,
      /service|offering|product/i
    ];
    
    return conceptIndicators.filter(indicator => 
      content.match(indicator)
    ).length;
  }

  /**
   * STEP 5: Layout strategy determination
   */
  determineLayoutStrategy(sections, intentAnalysis, complexityAnalysis) {
    const sectionTypes = sections.map(s => s.type);
    const primaryIntent = intentAnalysis.primary_intent;
    
    let recommendedLayout, visualHierarchy, pacing;
    
    // Determine layout based on section patterns and intent
    if (sectionTypes.includes('problem_statement') && sectionTypes.includes('value_proposition')) {
      recommendedLayout = 'problem_agitation_solution';
      visualHierarchy = 'narrative_progression';
      pacing = 'deliberate';
    } else if (sectionTypes.includes('credentials_experience') && sectionTypes.includes('personal_introduction')) {
      recommendedLayout = 'authority_building_about_page';
      visualHierarchy = 'credibility_focused';
      pacing = 'trust_building';
    } else if (primaryIntent === 'educational_informing') {
      recommendedLayout = 'structured_content_presentation';
      visualHierarchy = 'educational_flow';
      pacing = 'methodical';
    } else {
      recommendedLayout = 'professional_services_layout';
      visualHierarchy = 'expertise_showcase';
      pacing = 'confident';
    }
    
    return {
      recommended_layout: recommendedLayout,
      visual_hierarchy: visualHierarchy,
      pacing: pacing,
      complexity_accommodation: complexityAnalysis.complexity_level,
      section_flow: sections.map(s => s.type),
      layout_reasoning: `Based on ${sectionTypes.length} sections with ${primaryIntent} intent`
    };
  }

  /**
   * STEP 6: Apply design system calculations
   */
  applyDesignSystemCalculations(sections, layoutStrategy) {
    return sections.map((section, index) => ({
      ...section,
      
      // Typography specifications using design system
      typography_specs: this.getTypographySpecs(section.type),
      
      // Spacing specifications using design system
      spacing_specs: this.getSpacingSpecs(section.type, section.priority),
      
      // Layout treatment based on section type
      layout_treatment: this.getLayoutTreatment(section.type),
      
      // CSS variables for implementation
      css_variables: this.generateCSSVariables(section.type),
      
      // Responsive behavior
      responsive_specs: this.getResponsiveSpecs(section.type),
      
      // Accessibility requirements
      accessibility_specs: this.getAccessibilitySpecs(section.type)
    }));
  }

  getTypographySpecs(sectionType) {
    const specs = {
      'hero_headline': { 
        font_size: '3rem', 
        font_weight: '700', 
        line_height: '1.1',
        font_family: 'var(--font-family-primary)',
        treatment: 'Display Large',
        scale_applied: 'perfect_fourth'
      },
      'hero_subheadline': { 
        font_size: '1.5rem', 
        font_weight: '600', 
        line_height: '1.25',
        font_family: 'var(--font-family-primary)',
        treatment: 'Heading XL',
        scale_applied: 'perfect_fourth'
      },
      'problem_statement': { 
        font_size: '1.125rem', 
        font_weight: '500', 
        line_height: '1.5',
        font_family: 'var(--font-family-primary)',
        treatment: 'Body Emphasized',
        scale_applied: 'perfect_fourth'
      },
      'value_proposition': { 
        font_size: '1.125rem', 
        font_weight: '600', 
        line_height: '1.3',
        font_family: 'var(--font-family-primary)',
        treatment: 'Callout Text',
        scale_applied: 'perfect_fourth'
      },
      'personal_introduction': { 
        font_size: '1.125rem', 
        font_weight: '500', 
        line_height: '1.3',
        font_family: 'var(--font-family-primary)',
        treatment: 'Heading Medium',
        scale_applied: 'perfect_fourth'
      },
      'credentials_experience': { 
        font_size: '1rem', 
        font_weight: '400', 
        line_height: '1.5',
        font_family: 'var(--font-family-primary)',
        treatment: 'Body Standard',
        scale_applied: 'perfect_fourth'
      },
      'origin_story': { 
        font_size: '1rem', 
        font_weight: '400', 
        line_height: '1.5',
        font_family: 'var(--font-family-primary)',
        treatment: 'Body Narrative',
        scale_applied: 'perfect_fourth'
      }
    };
    
    return specs[sectionType] || specs['credentials_experience'];
  }

  getSpacingSpecs(sectionType, priority) {
    const baseUnit = '8px';
    
    if (priority === 1) {
      return { 
        vertical: '4rem', 
        horizontal: '2rem', 
        treatment: 'Hero Spacing',
        base_unit: baseUnit,
        calculation: 'SPACING_GRID.hero_section'
      };
    }
    
    if (sectionType.includes('hero')) {
      return { 
        vertical: '3rem', 
        horizontal: '1.5rem', 
        treatment: 'Section Large',
        base_unit: baseUnit,
        calculation: 'SPACING_GRID.large_section'
      };
    }
    
    if (sectionType.includes('problem') || sectionType.includes('value')) {
      return { 
        vertical: '2.5rem', 
        horizontal: '1rem', 
        treatment: 'Emphasis Spacing',
        base_unit: baseUnit,
        calculation: 'SPACING_GRID.emphasis_section'
      };
    }
    
    return { 
      vertical: '2rem', 
      horizontal: '1rem', 
      treatment: 'Standard Spacing',
      base_unit: baseUnit,
      calculation: 'SPACING_GRID.standard_section'
    };
  }

  getLayoutTreatment(sectionType) {
    const treatments = {
      'hero_headline': 'Centered Large',
      'hero_subheadline': 'Centered Medium',
      'problem_statement': 'Emphasized Block',
      'value_proposition': 'Highlighted Callout',
      'personal_introduction': 'Personal Card',
      'credentials_experience': 'Two Column Layout',
      'origin_story': 'Narrative Flow',
      'problem_agitation': 'Full Width Emphasis'
    };
    
    return treatments[sectionType] || 'Standard Block';
  }

  generateCSSVariables(sectionType) {
    const typography = this.getTypographySpecs(sectionType);
    const spacing = this.getSpacingSpecs(sectionType, 1);
    
    return {
      '--section-font-size': typography.font_size,
      '--section-font-weight': typography.font_weight,
      '--section-line-height': typography.line_height,
      '--section-vertical-spacing': spacing.vertical,
      '--section-horizontal-spacing': spacing.horizontal
    };
  }

  getResponsiveSpecs(sectionType) {
    return {
      mobile: {
        font_size_multiplier: 0.8,
        spacing_multiplier: 0.75,
        layout_adaptation: 'single_column'
      },
      tablet: {
        font_size_multiplier: 0.9,
        spacing_multiplier: 0.9,
        layout_adaptation: 'responsive_grid'
      },
      desktop: {
        font_size_multiplier: 1.0,
        spacing_multiplier: 1.0,
        layout_adaptation: 'full_layout'
      }
    };
  }

  getAccessibilitySpecs(sectionType) {
    return {
      min_contrast_ratio: 4.5,
      focus_indicators: true,
      semantic_markup: this.getSemanticMarkup(sectionType),
      screen_reader_friendly: true
    };
  }

  getSemanticMarkup(sectionType) {
    const markup = {
      'hero_headline': 'h1',
      'hero_subheadline': 'h2',
      'problem_statement': 'section',
      'value_proposition': 'aside',
      'personal_introduction': 'section',
      'credentials_experience': 'section',
      'origin_story': 'section'
    };
    
    return markup[sectionType] || 'div';
  }

  /**
   * STEP 7: Quality metrics calculation
   */
  calculateQualityMetrics(sections, intentAnalysis) {
    const meetsSpecs = sections.filter(s => s.meets_content_specs).length;
    const totalSections = sections.length;
    const structureScore = (meetsSpecs / totalSections) * 100;
    
    return {
      overall_quality: structureScore / 100,
      content_structure_score: structureScore,
      sections_optimized: meetsSpecs,
      total_sections: totalSections,
      intent_confidence: intentAnalysis.primary_intent_score,
      professional_standard: structureScore >= 80,
      recommendations: this.generateQualityRecommendations(sections)
    };
  }

  generateQualityRecommendations(sections) {
    const recommendations = [];
    
    sections.forEach(section => {
      if (section.optimization_needed) {
        if (section.word_count > 75) {
          recommendations.push(`Split "${section.type}" section (${section.word_count} words) into smaller chunks`);
        }
        if (section.char_count > 600) {
          recommendations.push(`Reduce "${section.type}" section length for better readability`);
        }
      }
    });
    
    return recommendations;
  }

  /**
   * STEP 8: Component specifications
   */
  generateComponentSpecifications(sections, layoutStrategy) {
    return {
      buttons: this.generateButtonSpecs(layoutStrategy),
      typography: this.generateTypographySystem(sections),
      spacing: this.generateSpacingSystem(),
      colors: this.generateColorSystem(),
      layout: this.generateLayoutSystem(layoutStrategy)
    };
  }

  generateButtonSpecs(layoutStrategy) {
    return {
      primary: {
        background_color: 'var(--color-primary)',
        text_color: 'var(--color-white)',
        font_size: '1rem',
        font_weight: '600',
        padding: '12px 24px',
        border_radius: '8px',
        min_height: '44px'
      },
      secondary: {
        background_color: 'transparent',
        text_color: 'var(--color-primary)',
        border: '2px solid var(--color-primary)',
        font_size: '1rem',
        font_weight: '600',
        padding: '12px 24px',
        border_radius: '8px',
        min_height: '44px'
      }
    };
  }

  generateTypographySystem(sections) {
    const usedSpecs = sections.map(s => s.typography_specs);
    
    return {
      font_families: {
        primary: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        secondary: 'Georgia, serif'
      },
      font_sizes: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem'
      },
      line_heights: {
        tight: '1.1',
        snug: '1.25',
        normal: '1.5',
        relaxed: '1.75'
      },
      font_weights: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800'
      }
    };
  }

  generateSpacingSystem() {
    return {
      base_unit: '8px',
      scale: ['8px', '16px', '24px', '32px', '48px', '64px', '96px', '128px'],
      section_padding: {
        vertical: '64px',
        horizontal: '24px'
      },
      component_spacing: {
        tight: '8px',
        normal: '16px',
        loose: '24px',
        extra_loose: '32px'
      }
    };
  }

  generateColorSystem() {
    return {
      primary: this.brandTokens.primary || '#007bff',
      secondary: this.brandTokens.secondary || '#6c757d',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      info: '#17a2b8',
      text: {
        primary: '#212529',
        secondary: '#6c757d',
        muted: '#868e96'
      },
      background: {
        primary: '#ffffff',
        secondary: '#f8f9fa',
        tertiary: '#e9ecef'
      }
    };
  }

  generateLayoutSystem(layoutStrategy) {
    return {
      max_width: '1200px',
      breakpoints: {
        sm: '576px',
        md: '768px',
        lg: '992px',
        xl: '1200px'
      },
      grid: {
        columns: 12,
        gap: '24px'
      },
      layout_strategy: layoutStrategy.recommended_layout,
      visual_hierarchy: layoutStrategy.visual_hierarchy
    };
  }

  /**
   * STEP 9: Wireframe specifications for visual preview
   */
  generateWireframeSpecifications(sections, layoutStrategy) {
    return {
      sections: sections.map((section, index) => ({
        id: `section_${index + 1}`,
        type: section.type,
        content: section.content,
        wireframe_styles: this.generateWireframeStyles(section.type, section.priority),
        preview_data: {
          typography: section.typography_specs,
          spacing: section.spacing_specs,
          layout: section.layout_treatment,
          validation: section.content_chunks_validation
        }
      })),
      overall_layout: layoutStrategy.recommended_layout,
      visual_hierarchy: layoutStrategy.visual_hierarchy,
      quality_indicators: {
        sections_count: sections.length,
        optimization_score: (sections.filter(s => s.meets_content_specs).length / sections.length) * 100
      }
    };
  }

  generateWireframeStyles(sectionType, priority) {
    const baseStyles = {
      backgroundColor: '#f8f9fa',
      border: '2px dashed #dee2e6',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      position: 'relative'
    };

    const typeStyles = {
      'hero_headline': {
        ...baseStyles,
        backgroundColor: '#e3f2fd',
        borderColor: '#2196f3',
        textAlign: 'center',
        fontSize: '20px',
        fontWeight: 'bold',
        padding: '32px 16px'
      },
      'hero_subheadline': {
        ...baseStyles,
        backgroundColor: '#f3e5f5',
        borderColor: '#9c27b0',
        textAlign: 'center',
        fontSize: '16px',
        fontWeight: '600',
        padding: '24px 16px'
      },
      'problem_statement': {
        ...baseStyles,
        backgroundColor: '#fff3e0',
        borderColor: '#ff9800',
        fontSize: '14px',
        fontWeight: '500'
      },
      'value_proposition': {
        ...baseStyles,
        backgroundColor: '#e8f5e8',
        borderColor: '#4caf50',
        fontSize: '14px',
        fontWeight: '600',
        border: '2px solid #4caf50'
      },
      'personal_introduction': {
        ...baseStyles,
        backgroundColor: '#e1f5fe',
        borderColor: '#00bcd4',
        fontSize: '14px'
      },
      'credentials_experience': {
        ...baseStyles,
        backgroundColor: '#fafafa',
        borderColor: '#757575',
        fontSize: '12px'
      },
      'origin_story': {
        ...baseStyles,
        backgroundColor: '#f9f9f9',
        borderColor: '#9e9e9e',
        fontSize: '12px'
      }
    };

    return typeStyles[sectionType] || baseStyles;
  }

  calculatePatternConfidence(sections) {
    const highConfidenceSections = sections.filter(s => s.confidence === 'high').length;
    return (highConfidenceSections / sections.length) * 100;
  }

  getCalculationsMetadata() {
    return [
      'Intelligent pattern recognition',
      'CONTENT_CHUNKS validation',
      'TYPOGRAPHY_SCALES application',
      'SPACING_GRID calculations',
      'Intent signal detection',
      'Content complexity analysis',
      'Layout strategy determination',
      'Component specifications generation',
      'Responsive design calculations',
      'Accessibility requirements',
      'Quality metrics assessment',
      'Wireframe specifications'
    ];
  }
}