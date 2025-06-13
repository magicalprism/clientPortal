import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import DesignAnalysisEngine, { quickAnalysis } from '@/lib/design-analysis/index.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced content analysis with design intelligence
async function enhancedContentAnalysis(content, brandTokens = null, industryContext = 'saas') {
  try {
    // Initialize design analysis engine
    const analyzer = brandTokens 
      ? new DesignAnalysisEngine(brandTokens, industryContext, 'general')
      : null;
    
    // AI-powered content classification
    const aiClassification = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert content strategist analyzing marketing copy for design optimization. 

Analyze the content and return a JSON object with:
1. sections: Array of detected content sections with types
2. content_intent: Primary purpose (persuasive, educational, informational)
3. emotional_tone: Overall emotional approach
4. complexity_level: Content sophistication (simple, moderate, complex)
5. target_audience: Implied audience sophistication
6. key_messages: Main value propositions
7. content_flow: How information progresses
8. conversion_goals: Implied user actions

Content section types: hero, features, benefits, testimonials, about, cta, gallery, faq, pricing, contact

Return valid JSON only.`
        },
        {
          role: 'user',
          content: `Analyze this content:\n\n${content}`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });

    const aiResult = JSON.parse(aiClassification.choices[0].message.content);
    
    // Enhanced analysis with design intelligence
    let enhancedAnalysis = aiResult;
    
    if (analyzer) {
      const designAnalysis = await analyzer.analyzeContent(content);
      
      enhancedAnalysis = {
        ...aiResult,
        design_analysis: {
          content_complexity: designAnalysis.complexity,
          optimal_layout_type: designAnalysis.patterns.recommended_layout,
          content_density: designAnalysis.density,
          reading_flow: designAnalysis.reading_flow,
          information_hierarchy: designAnalysis.hierarchy,
          chunking_recommendations: designAnalysis.optimal_chunks
        },
        layout_recommendations: {
          primary_layout: quickAnalysis.getOptimalLayout(content),
          grid_system: designAnalysis.patterns.grid_preference,
          spacing_approach: designAnalysis.patterns.spacing_needs,
          component_complexity: designAnalysis.patterns.component_complexity
        }
      };
    }
    
    // Content quality scoring
    const qualityMetrics = analyzeContentQuality(content, enhancedAnalysis);
    enhancedAnalysis.quality_metrics = qualityMetrics;
    
    return enhancedAnalysis;
    
  } catch (error) {
    console.error('Enhanced analysis failed:', error);
    // Fallback to basic analysis
    return await basicContentAnalysis(content);
  }
}

// Content quality analysis
function analyzeContentQuality(content, analysis) {
  const words = content.split(/\s+/).length;
  const sentences = content.split(/[.!?]+/).length;
  const avgWordsPerSentence = words / sentences;
  
  // Readability scoring
  const readabilityScore = calculateReadabilityScore(words, sentences, content);
  
  // Content structure scoring
  const structureScore = calculateStructureScore(analysis.sections);
  
  // Professional tone scoring
  const toneScore = calculateToneScore(content, analysis.emotional_tone);
  
  return {
    readability: {
      score: readabilityScore,
      word_count: words,
      avg_sentence_length: avgWordsPerSentence,
      reading_time: Math.ceil(words / 200) // minutes
    },
    structure: {
      score: structureScore,
      section_count: analysis.sections.length,
      hierarchy_clarity: structureScore > 0.7,
      flow_quality: analysis.content_flow?.coherence || 'moderate'
    },
    professional_tone: {
      score: toneScore,
      appropriate_for_business: toneScore > 0.6,
      clarity_level: toneScore > 0.8 ? 'high' : toneScore > 0.5 ? 'medium' : 'low'
    },
    overall_quality: (readabilityScore + structureScore + toneScore) / 3
  };
}

function calculateReadabilityScore(words, sentences, content) {
  // Simplified readability calculation
  const avgWordsPerSentence = words / sentences;
  const complexWords = (content.match(/\b\w{7,}\b/g) || []).length;
  const complexityRatio = complexWords / words;
  
  // Optimal ranges: 15-20 words per sentence, <20% complex words
  const sentenceLengthScore = Math.max(0, 1 - Math.abs(17.5 - avgWordsPerSentence) / 17.5);
  const complexityScore = Math.max(0, 1 - Math.max(0, complexityRatio - 0.2) / 0.3);
  
  return (sentenceLengthScore + complexityScore) / 2;
}

function calculateStructureScore(sections) {
  if (!sections || sections.length === 0) return 0.3;
  
  // Check for logical section progression
  const hasHero = sections.some(s => s.type === 'hero');
  const hasCTA = sections.some(s => s.type === 'cta');
  const hasFeatures = sections.some(s => s.type === 'features' || s.type === 'benefits');
  
  let score = 0.5; // Base score
  
  if (hasHero) score += 0.2;
  if (hasCTA) score += 0.2;
  if (hasFeatures) score += 0.1;
  
  // Penalize if too many or too few sections
  if (sections.length < 2) score -= 0.2;
  if (sections.length > 8) score -= 0.1;
  
  return Math.min(1, Math.max(0, score));
}

function calculateToneScore(content, emotionalTone) {
  // Professional language indicators
  const professionalWords = ['solution', 'optimize', 'efficient', 'professional', 'expertise', 'quality'];
  const casualWords = ['awesome', 'cool', 'amazing', 'super', 'totally'];
  const urgentWords = ['now', 'today', 'limited', 'hurry', 'act fast'];
  
  const lowerContent = content.toLowerCase();
  
  const professionalCount = professionalWords.filter(word => lowerContent.includes(word)).length;
  const casualCount = casualWords.filter(word => lowerContent.includes(word)).length;
  const urgentCount = urgentWords.filter(word => lowerContent.includes(word)).length;
  
  // Score based on appropriate tone balance
  let score = 0.5;
  
  if (professionalCount > casualCount) score += 0.3;
  if (urgentCount <= 2) score += 0.2; // Not overly pushy
  
  return Math.min(1, score);
}

// Fallback basic analysis
async function basicContentAnalysis(content) {
  const sections = detectBasicSections(content);
  const intent = detectBasicIntent(content);
  
  return {
    sections,
    content_intent: intent,
    emotional_tone: 'neutral',
    complexity_level: content.length > 1000 ? 'complex' : content.length > 300 ? 'moderate' : 'simple',
    target_audience: 'general',
    key_messages: extractKeyMessages(content),
    quality_metrics: {
      overall_quality: 0.6,
      readability: { score: 0.6 },
      structure: { score: 0.5 },
      professional_tone: { score: 0.6 }
    }
  };
}

function detectBasicSections(content) {
  const sections = [];
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length > 0) {
    sections.push({
      type: 'hero',
      content: lines[0],
      word_count: lines[0].split(' ').length
    });
  }
  
  if (lines.length > 2) {
    sections.push({
      type: 'features',
      content: lines.slice(1, -1).join('\n'),
      word_count: lines.slice(1, -1).join(' ').split(' ').length
    });
  }
  
  if (lines.length > 1) {
    sections.push({
      type: 'cta',
      content: lines[lines.length - 1],
      word_count: lines[lines.length - 1].split(' ').length
    });
  }
  
  return sections;
}

function detectBasicIntent(content) {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('buy') || lowerContent.includes('purchase') || lowerContent.includes('get')) {
    return 'persuasive';
  }
  
  if (lowerContent.includes('learn') || lowerContent.includes('guide') || lowerContent.includes('how')) {
    return 'educational';
  }
  
  return 'informational';
}

function extractKeyMessages(content) {
  // Simple extraction of potential key messages
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  return sentences.slice(0, 3).map(s => s.trim());
}

// API Route Handler
export async function POST(request) {
  try {
    const { content, brandTokens, industryContext } = await request.json();
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }
    
    const analysis = await enhancedContentAnalysis(content, brandTokens, industryContext);
    
    return NextResponse.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Classify copy error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze content',
        details: error.message 
      },
      { status: 500 }
    );
  }
}