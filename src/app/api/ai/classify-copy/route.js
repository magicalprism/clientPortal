// app/api/ai/classify-copy/route.js (REPLACE EXISTING - QUICK VERSION)
import { DesignAnalysisEngine, quickAnalysis } from '@/lib/design-analysis'

export async function POST(request) {
  try {
    const { text, brandTokens } = await request.json();

    if (!text || text.trim().length === 0) {
      return Response.json({ error: 'Text content is required' }, { status: 400 });
    }

    console.log('🎨 Using DesignAnalysisEngine instead of OpenAI...')

    // TRY: Use sophisticated analysis
    try {
      const engine = new DesignAnalysisEngine(brandTokens || { primary: '#007bff' })
      const analysis = await engine.analyzeContent(text)
      
      // Convert to your existing format quickly
      const sections = convertAnalysisToSections(analysis, text)
      
      return Response.json({
        choices: [{
          message: {
            content: JSON.stringify(sections)
          }
        }],
        // Extra data for debugging
        engine_used: 'DesignAnalysisEngine',
        analysis_summary: {
          intent: analysis.intent,
          complexity: analysis.complexity?.complexity_level,
          recommended_layout: analysis.patterns?.recommended_layout
        }
      });
      
    } catch (engineError) {
      console.error('DesignAnalysisEngine failed:', engineError)
      console.log('🔄 Falling back to enhanced mock...')
      
      // FALLBACK: Enhanced mock (better than basic mock)
      const sections = generateEnhancedMockClassification(text)
      return Response.json({
        choices: [{
          message: {
            content: JSON.stringify(sections)
          }
        }],
        engine_used: 'enhanced_mock',
        fallback_reason: engineError.message
      });
    }

  } catch (error) {
    console.error('Classification error:', error);
    
    // FINAL FALLBACK: Your original mock
    const mockClassification = generateMockClassification(text);
    return Response.json({
      choices: [{
        message: {
          content: JSON.stringify(mockClassification)
        }
      }],
      engine_used: 'basic_mock'
    });
  }
}

// Quick conversion from analysis to sections
function convertAnalysisToSections(analysis, text) {
  const sections = []
  
  // Use analysis chunks if available
  if (analysis.optimal_chunks && analysis.optimal_chunks.length > 0) {
    analysis.optimal_chunks.forEach((chunk, index) => {
      if (chunk.importance === 'primary' || index === 0) {
        sections.push({
          type: 'hero',
          content: chunk.content.substring(0, 200),
          priority: 1,
          confidence: 'high'
        })
      } else {
        sections.push({
          type: 'features',
          content: chunk.content.substring(0, 200),
          priority: index + 1,
          confidence: 'high'
        })
      }
    })
  } else {
    // Fallback to first sentence
    const firstSentence = text.split(/[.!?]+/)[0]?.trim()
    if (firstSentence) {
      sections.push({
        type: 'hero',
        content: firstSentence.substring(0, 200),
        priority: 1,
        confidence: 'medium'
      })
    }
  }
  
  // Smart CTA based on intent
  const ctaText = analysis.intent === 'persuasive_selling' 
    ? 'Get started today and transform your business'
    : analysis.intent === 'trust_building'
    ? 'Learn more about our secure solution'
    : 'Discover what we can do for you'
    
  sections.push({
    type: 'cta',
    content: ctaText,
    priority: sections.length + 1,
    confidence: 'high',
    intent_based: true
  })
  
  return sections
}

// Better mock than original (uses content analysis)
function generateEnhancedMockClassification(text) {
  const sections = [];
  const lowerText = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;
  
  // Smarter hero detection
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 0) {
    sections.push({
      type: 'hero',
      content: sentences[0].trim().substring(0, 200),
      priority: 1,
      confidence: 'medium'
    });
  }
  
  // Intent-based section detection
  let intent = 'informational'
  if (lowerText.includes('buy') || lowerText.includes('purchase') || lowerText.includes('get started')) {
    intent = 'persuasive_selling'
  } else if (lowerText.includes('secure') || lowerText.includes('trusted') || lowerText.includes('proven')) {
    intent = 'trust_building'
  } else if (lowerText.includes('learn') || lowerText.includes('guide') || lowerText.includes('how to')) {
    intent = 'educational'
  }
  
  // Add features if content is substantial
  if (wordCount > 50) {
    sections.push({
      type: 'features',
      content: 'Key features and benefits of our solution',
      priority: 2,
      confidence: 'medium',
      word_count_driven: true
    });
  }
  
  // Add testimonials if social proof detected
  if (lowerText.includes('customer') || lowerText.includes('review') || lowerText.includes('"') || lowerText.includes('testimonial')) {
    sections.push({
      type: 'testimonial',
      content: 'Customer testimonials and success stories',
      priority: 3,
      confidence: 'high'
    });
  }
  
  // Intent-based CTA
  const ctaMap = {
    'persuasive_selling': 'Get started today and see results',
    'trust_building': 'Learn more about our proven solution',
    'educational': 'Explore our comprehensive resources',
    'informational': 'Discover more about what we offer'
  }
  
  sections.push({
    type: 'cta',
    content: ctaMap[intent],
    priority: sections.length + 1,
    confidence: 'high',
    intent: intent
  });
  
  return sections;
}

// Keep your original mock as final fallback
function generateMockClassification(text) {
  const sections = [];
  const lowerText = text.toLowerCase();
  
  // Extract hero content (first sentence or paragraph)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 0) {
    sections.push({
      type: 'hero',
      content: sentences[0].trim().substring(0, 200),
      priority: 1
    });
  }
  
  // Detect features
  if (lowerText.includes('feature') || lowerText.includes('benefit') || lowerText.includes('offer') || text.length > 200) {
    sections.push({
      type: 'features',
      content: 'Key features and benefits of our solution',
      priority: 2
    });
  }
  
  // Detect testimonials
  if (lowerText.includes('testimonial') || lowerText.includes('review') || lowerText.includes('"') || lowerText.includes('customer')) {
    sections.push({
      type: 'testimonial',
      content: 'Customer testimonials and success stories',
      priority: 3
    });
  }
  
  // Always add CTA
  sections.push({
    type: 'cta',
    content: 'Get started today and transform your business',
    priority: 4
  });
  
  return sections;
}