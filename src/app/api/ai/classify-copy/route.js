// app/api/ai/classify-copy/route.js (USING YOUR REAL SYSTEM)
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

    console.log('🎨 Using your real DesignAnalysisEngine...');

    // Initialize your real DesignAnalysisEngine
    const engine = new DesignAnalysisEngine(
      brandTokens || {},
      industryContext || 'saas',
      'general'
    );

    // Use your actual analysis method
    const fullAnalysis = await engine.analyzeAndRecommend(copyText);
    
    // Extract sections from your content analysis
    const sections = convertYourAnalysisToSections(fullAnalysis, copyText);
    
    return Response.json({
      success: true,
      analysis: {
        // Section breakdown for UI
        sections: sections,
        
        // Your actual analysis results
        intent: fullAnalysis.content_analysis?.intent,
        complexity: fullAnalysis.content_analysis?.complexity,
        recommended_layout: fullAnalysis.layout_strategy?.recommended_layout,
        
        // Quality metrics from your system
        quality_metrics: {
          overall_quality: fullAnalysis.quality_score?.overall_quality?.overall || 0.8,
          content_clarity: fullAnalysis.quality_score?.overall_quality?.breakdown?.typography || 0.8,
          structure_quality: fullAnalysis.quality_score?.overall_quality?.breakdown?.hierarchy || 0.8,
          readability: fullAnalysis.content_analysis?.density?.readability || 'moderate'
        },

        // Your design analysis
        design_analysis: {
          optimal_layout_type: fullAnalysis.layout_strategy?.recommended_layout,
          grid_system: fullAnalysis.layout_strategy?.grid_system,
          component_specs: fullAnalysis.component_specifications,
          visual_system: fullAnalysis.visual_design_system
        },

        // Full analysis for advanced usage
        full_analysis: fullAnalysis
      },
      engine_used: 'YourDesignAnalysisEngine',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Design analysis error:', error);
    
    return Response.json({
      success: false,
      error: 'Design analysis failed: ' + error.message
    }, { status: 500 });
  }
}

// Convert your analysis to UI-friendly sections
function convertYourAnalysisToSections(analysis, originalText) {
  const sections = [];
  
  // Use your optimal_chunks if available
  if (analysis.content_analysis?.optimal_chunks) {
    analysis.content_analysis.optimal_chunks.forEach((chunk, index) => {
      sections.push({
        type: mapChunkTypeToSectionType(chunk.type),
        content: chunk.content,
        priority: chunk.importance === 'primary' ? 1 : 
                 chunk.importance === 'secondary' ? 2 : 3,
        confidence: 'high',
        ai_classified: true,
        chunk_type: chunk.type,
        importance: chunk.importance
      });
    });
  } else {
    // Fallback: create hero section from content
    const sentences = originalText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      sections.push({
        type: 'hero',
        content: sentences[0].trim(),
        priority: 1,
        confidence: 'medium'
      });
    }
  }
  
  // Add CTA based on your intent analysis
  const intent = analysis.content_analysis?.intent || 'informational';
  const ctaText = generateCTAFromYourIntent(intent);
  sections.push({
    type: 'cta',
    content: ctaText,
    priority: sections.length + 1,
    confidence: 'high',
    intent_based: true
  });
  
  return sections.sort((a, b) => a.priority - b.priority);
}

// Map your chunk types to UI section types
function mapChunkTypeToSectionType(chunkType) {
  const mapping = {
    'headline': 'hero',
    'paragraph': 'content',
    'feature': 'features',
    'benefit': 'features',
    'testimonial': 'testimonial',
    'cta': 'cta'
  };
  
  return mapping[chunkType] || 'content';
}

// Generate CTA based on your intent analysis
function generateCTAFromYourIntent(intent) {
  const ctas = {
    'persuasive_selling': 'Get started today and transform your business',
    'educational_informing': 'Learn more about our comprehensive solution',
    'trust_building': 'Discover why thousands trust our proven approach',
    'informational': 'Explore what we can do for you'
  };
  
  return ctas[intent] || ctas['informational'];
}