// app/api/ai/generate-layout/route.js (USING YOUR DESIGN ANALYSIS SYSTEM)
import { DesignAnalysisEngine } from '@/lib/design-analysis/design-analysis-master.js';

export async function POST(request) {
  try {
    const { 
      copyClassification, 
      layoutAnalysis, 
      brandTokens, 
      brandId 
    } = await request.json();

    console.log('🎨 Generate layout called with your DesignAnalysisEngine');

    // Validate required inputs
    if (!copyClassification || !layoutAnalysis || (!brandTokens && !brandId)) {
      return Response.json({ 
        success: false,
        error: 'Missing required data: copyClassification, layoutAnalysis, and brandTokens/brandId are all required' 
      }, { status: 400 });
    }

    // Initialize your DesignAnalysisEngine
    const engine = new DesignAnalysisEngine(
      brandTokens || {},
      'saas', // default industry context
      'general' // default target audience
    );

    // Convert the inputs to content format for your engine
    const content = extractContentFromClassification(copyClassification);
    
    // Use your actual analysis engine
    const fullAnalysis = await engine.analyzeAndRecommend(content, layoutAnalysis);
    
    // Generate layout using your system
    const generatedLayout = await generateLayoutFromYourAnalysis(
      fullAnalysis,
      copyClassification,
      layoutAnalysis,
      brandTokens
    );

    return Response.json({
      success: true,
      data: generatedLayout
    });

  } catch (error) {
    console.error('🚨 Generate layout error:', error);
    return Response.json({
      success: false,
      error: 'Failed to generate layout: ' + error.message
    }, { status: 500 });
  }
}

// Extract content from classification for your engine
function extractContentFromClassification(copyClassification) {
  if (Array.isArray(copyClassification)) {
    return copyClassification.map(section => section.content).join(' ');
  } else if (copyClassification.sections) {
    return copyClassification.sections.map(section => section.content).join(' ');
  } else {
    return 'Default content for analysis';
  }
}

// Generate layout using your comprehensive analysis
async function generateLayoutFromYourAnalysis(analysis, copyClassification, layoutAnalysis, brandTokens) {
  console.log('🔧 Generating layout from your comprehensive analysis...');
  
  // Extract sections from your analysis
  const sections = generateSectionsFromYourAnalysis(analysis, copyClassification);
  
  // Apply your styling system
  const styledSections = applyStylingFromYourSpecs(sections, analysis.component_specifications, analysis.visual_design_system);
  
  return {
    sections: styledSections,
    generation: {
      layoutSource: layoutAnalysis?.source || 'your_analysis_engine',
      brandSource: brandTokens ? 'brand_tokens' : 'default',
      timestamp: new Date().toISOString(),
      quality_score: analysis.quality_score?.overall_quality?.overall || 0.85,
      analysis_applied: true,
      layout_strategy: analysis.layout_strategy?.recommended_layout,
      component_specs: !!analysis.component_specifications,
      visual_system: !!analysis.visual_design_system
    },
    metadata: {
      total_sections: styledSections.length,
      calculations_applied: analysis.analysis_metadata?.calculations_applied || [],
      brand_personality: analysis.enhanced_brand_personality?.personality || 'professional',
      confidence: analysis.enhanced_brand_personality?.confidence || 0.8
    }
  };
}

// Generate sections from your analysis
function generateSectionsFromYourAnalysis(analysis, copyClassification) {
  const sections = [];
  
  // Use your optimal chunks if available
  if (analysis.content_analysis?.optimal_chunks) {
    analysis.content_analysis.optimal_chunks.forEach((chunk, index) => {
      sections.push({
        id: `section_${index}`,
        type: mapChunkTypeToUISection(chunk.type),
        layout: determineLayoutFromChunk(chunk.type, analysis.layout_strategy),
        structure: determineStructureFromChunk(chunk.type),
        content: generateContentFromChunk(chunk, analysis),
        priority: chunk.importance === 'primary' ? 1 : chunk.importance === 'secondary' ? 2 : 3,
        confidence: chunk.confidence || 0.8,
        gridTemplate: getGridTemplateForType(chunk.type)
      });
    });
  } else {
    // Fallback: use copyClassification directly
    const classificationSections = Array.isArray(copyClassification) ? copyClassification : copyClassification.sections || [];
    
    classificationSections.forEach((section, index) => {
      sections.push({
        id: `section_${index}`,
        type: section.type || 'content',
        layout: 'standard',
        structure: 'flex-column',
        content: generateContentFromSection(section, analysis),
        priority: section.priority || index + 1,
        confidence: section.confidence || 0.7
      });
    });
  }
  
  // Ensure we have a CTA section using your intent analysis
  const hasCTA = sections.some(s => s.type === 'cta');
  if (!hasCTA) {
    const intent = analysis.content_analysis?.intent || 'informational';
    sections.push({
      id: 'section_cta',
      type: 'cta',
      layout: 'centered',
      structure: 'flex-column',
      content: generateCTAFromIntent(intent, analysis),
      priority: sections.length + 1,
      confidence: 0.9
    });
  }
  
  return sections.sort((a, b) => a.priority - b.priority);
}

// Apply styling from your specifications
function applyStylingFromYourSpecs(sections, componentSpecs, visualSystem) {
  return sections.map(section => ({
    ...section,
    styling: generateStylingFromYourSpecs(section.type, componentSpecs, visualSystem)
  }));
}

// Generate styling from your component specifications
function generateStylingFromYourSpecs(sectionType, componentSpecs, visualSystem) {
  const baseSpacing = componentSpecs?.spacing?.section_padding?.vertical || '48px 0';
  const baseColors = componentSpecs?.colors || {};
  const baseTypography = componentSpecs?.typography || {};
  
  const sectionStyles = {
    'hero': {
      backgroundColor: baseColors.primary || '#3B82F6',
      textColor: '#ffffff',
      padding: '80px 0',
      containerMaxWidth: '1200px',
      textAlign: 'center',
      headlineSize: baseTypography.sizes?.['3xl'] || '48px',
      headlineWeight: '700',
      headlineFont: baseTypography.font_family || 'Inter, sans-serif',
      subheadlineSize: baseTypography.sizes?.lg || '18px',
      ctaBackgroundColor: '#ffffff',
      ctaTextColor: baseColors.primary || '#3B82F6',
      ctaBorderRadius: componentSpecs?.buttons?.primary?.border_radius || '8px',
      ctaPadding: componentSpecs?.buttons?.primary?.padding || '12px 24px'
    },
    'features': {
      backgroundColor: '#ffffff',
      textColor: baseColors.semantic?.text || '#212529',
      padding: baseSpacing,
      containerMaxWidth: '1200px',
      titleSize: baseTypography.sizes?.['2xl'] || '32px',
      titleWeight: '600',
      gridGap: componentSpecs?.spacing?.scale?.[3] || '32px',
      featurePadding: componentSpecs?.spacing?.scale?.[3] || '24px',
      featureTitleSize: baseTypography.sizes?.xl || '20px',
      featureTextSize: baseTypography.sizes?.base || '16px',
      borderRadius: componentSpecs?.shadows?.border_radius || '8px'
    },
    'testimonial': {
      backgroundColor: '#f8f9fa',
      textColor: baseColors.semantic?.text || '#212529',
      padding: baseSpacing,
      containerMaxWidth: '700px',
      quoteSize: baseTypography.sizes?.xl || '24px',
      quoteWeight: '400',
      authorSize: baseTypography.sizes?.base || '16px',
      authorWeight: '600',
      borderRadius: componentSpecs?.shadows?.border_radius || '12px'
    },
    'cta': {
      backgroundColor: baseColors.secondary || '#10B981',
      textColor: '#ffffff',
      padding: '64px 0',
      containerMaxWidth: '800px',
      textAlign: 'center',
      headlineSize: baseTypography.sizes?.['2xl'] || '36px',
      headlineWeight: '600',
      primaryCTABg: '#ffffff',
      primaryCTAText: baseColors.secondary || '#10B981',
      secondaryCTAText: '#ffffff'
    }
  };
  
  return sectionStyles[sectionType] || {
    backgroundColor: '#ffffff',
    textColor: baseColors.semantic?.text || '#212529',
    padding: baseSpacing,
    containerMaxWidth: '1200px'
  };
}

// Helper functions
function mapChunkTypeToUISection(chunkType) {
  const mapping = {
    'headline': 'hero',
    'paragraph': 'content',
    'feature': 'features',
    'testimonial': 'testimonial',
    'cta': 'cta'
  };
  return mapping[chunkType] || 'content';
}

function determineLayoutFromChunk(chunkType, layoutStrategy) {
  const recommended = layoutStrategy?.recommended_layout;
  
  if (chunkType === 'headline' || chunkType === 'cta') return 'centered';
  if (chunkType === 'feature') return '3-col-grid';
  if (chunkType === 'testimonial') return 'centered';
  
  return 'standard';
}

function determineStructureFromChunk(chunkType) {
  const structureMap = {
    'headline': 'flex-column',
    'feature': 'grid',
    'testimonial': 'flex-column',
    'cta': 'flex-column',
    'paragraph': 'flex-column'
  };
  return structureMap[chunkType] || 'flex-column';
}

function generateContentFromChunk(chunk, analysis) {
  const type = mapChunkTypeToUISection(chunk.type);
  
  switch (type) {
    case 'hero':
      return {
        headline: chunk.content,
        subheadline: 'Discover powerful solutions that help you achieve your goals.',
        cta: 'Get Started'
      };
    case 'features':
      return {
        title: 'Powerful Features',
        features: [
          { id: 1, icon: '⚡', title: 'Fast Performance', description: 'Lightning-fast loading times and smooth interactions' },
          { id: 2, icon: '🔒', title: 'Secure & Reliable', description: 'Enterprise-grade security with 99.9% uptime' },
          { id: 3, icon: '🎨', title: 'Beautiful Design', description: 'Stunning interfaces that users love' }
        ]
      };
    case 'testimonial':
      return {
        quote: chunk.content || 'This product has completely transformed our business.',
        author: 'Happy Customer',
        company: 'Success Inc.'
      };
    case 'cta':
      return {
        headline: 'Ready to get started?',
        description: chunk.content,
        primaryCTA: 'Get Started',
        secondaryCTA: 'Learn More'
      };
    default:
      return {
        title: chunk.type || 'Content',
        text: chunk.content
      };
  }
}

function generateContentFromSection(section, analysis) {
  return {
    title: section.type || 'Content Section',
    text: section.content || 'Content goes here'
  };
}

function generateCTAFromIntent(intent, analysis) {
  const intentMap = {
    'persuasive_selling': {
      headline: 'Ready to transform your business?',
      description: 'Join thousands of satisfied customers who have already seen results.',
      primaryCTA: 'Start Free Trial',
      secondaryCTA: 'Schedule Demo'
    },
    'trust_building': {
      headline: 'Trusted by industry leaders',
      description: 'See why companies worldwide choose our proven solution.',
      primaryCTA: 'Learn More',
      secondaryCTA: 'View Case Studies'
    },
    'educational_informing': {
      headline: 'Ready to learn more?',
      description: 'Explore our comprehensive resources and expert guides.',
      primaryCTA: 'Browse Resources',
      secondaryCTA: 'Contact Expert'
    }
  };
  
  return intentMap[intent] || intentMap['educational_informing'];
}

function getGridTemplateForType(chunkType) {
  const templates = {
    'feature': 'repeat(auto-fit, minmax(300px, 1fr))',
    'testimonial': '1fr'
  };
  return templates[chunkType] || null;
}