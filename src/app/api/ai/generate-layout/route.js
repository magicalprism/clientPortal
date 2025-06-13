// app/api/ai/generate-layout/route.js
export async function POST(request) {
  try {
    const { classifiedCopy, extractedLayout, brandTokens } = await request.json();

    if (!classifiedCopy || !extractedLayout || !brandTokens) {
      return Response.json({
        success: false,
        error: 'Missing required data: classifiedCopy, extractedLayout, and brandTokens'
      }, { status: 400 });
    }

    let variations;
    
    // Use AI-enhanced generation if OpenAI is available
    if (process.env.OPENAI_API_KEY) {
      try {
        variations = await generateAIEnhancedLayouts(classifiedCopy, extractedLayout, brandTokens);
      } catch (aiError) {
        console.error('AI generation failed, falling back to rule-based:', aiError);
        variations = generateLayoutVariations(classifiedCopy, extractedLayout, brandTokens);
      }
    } else {
      console.log('OpenAI not configured, using rule-based generation');
      variations = generateLayoutVariations(classifiedCopy, extractedLayout, brandTokens);
    }
    
    // Add generation metadata
    const result = {
      variations,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalSections: classifiedCopy.length,
        layoutsExtracted: extractedLayout.length,
        brandTokensApplied: Object.keys(brandTokens).length,
        confidence: calculateOverallConfidence(variations),
        aiEnhanced: !!process.env.OPENAI_API_KEY
      }
    };
    
    return Response.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Layout generation error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// AI-enhanced layout generation
async function generateAIEnhancedLayouts(classifiedCopy, extractedLayout, brandTokens) {
  const prompt = `You are a UI/UX design expert. Based on the content analysis and layout patterns, suggest the best layout approaches for each style.

Content Sections:
${classifiedCopy.map(section => `- ${section.type}: "${section.content}"`).join('\n')}

Available Layout Patterns:
${extractedLayout.map(layout => `- ${layout.type}: ${layout.layout} (${layout.container})`).join('\n')}

Brand Characteristics:
- Colors: ${Object.keys(brandTokens.colors || {}).join(', ')}
- Typography: ${Object.keys(brandTokens.typography || {}).join(', ')}

Suggest layout recommendations for these 3 styles:
1. Stripe Style (professional, conversion-focused)
2. Apple Style (minimal, visual-first) 
3. Linear Style (modern, developer-focused)

For each section, recommend:
- Best layout type (centered, grid, carousel, etc.)
- Container type (contained, full-width)
- Style reasoning

Return JSON format:
{
  "stripe": [{"type": "hero", "layout": "centered", "container": "contained", "reasoning": "..."}],
  "apple": [...],
  "linear": [...]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500
    })
  });

  if (!response.ok) {
    throw new Error('AI layout generation failed');
  }

  const result = await response.json();
  const aiRecommendations = JSON.parse(result.choices[0].message.content);

  // Apply AI recommendations to generate variations
  return [
    generateStyledVariation('Stripe Style', aiRecommendations.stripe, classifiedCopy, brandTokens, 'stripe'),
    generateStyledVariation('Apple Style', aiRecommendations.apple, classifiedCopy, brandTokens, 'apple'),
    generateStyledVariation('Linear Style', aiRecommendations.linear, classifiedCopy, brandTokens, 'linear')
  ];
}

// Generate styled variation with AI recommendations
function generateStyledVariation(name, aiRecommendations, classifiedCopy, brandTokens, styleVariant) {
  const sections = classifiedCopy.map(copyBlock => {
    // Find AI recommendation for this section type
    const aiRec = aiRecommendations.find(rec => rec.type === copyBlock.type) || 
                  { layout: 'centered', container: 'contained', reasoning: 'Default layout' };
    
    return {
      ...copyBlock,
      layout: aiRec.layout,
      container: aiRec.container,
      style: applyBrandStyling(copyBlock.type, styleVariant, brandTokens),
      metadata: {
        confidence: 0.85,
        reasoning: aiRec.reasoning || 'AI-optimized layout choice'
      }
    };
  });

  return {
    name,
    sections,
    characteristics: getStyleCharacteristics(styleVariant)
  };
}

// Fallback rule-based generation
function generateLayoutVariations(classifiedCopy, extractedLayout, brandTokens) {
  return [
    generateStripeStyle(classifiedCopy, extractedLayout, brandTokens),
    generateAppleStyle(classifiedCopy, extractedLayout, brandTokens),
    generateLinearStyle(classifiedCopy, extractedLayout, brandTokens)
  ];
}

// Generate Stripe-style layout
function generateStripeStyle(classifiedCopy, extractedLayout, brandTokens) {
  const sections = mapContentToLayout(classifiedCopy, extractedLayout, 'stripe', brandTokens);
  
  return {
    name: 'Stripe Style',
    sections: sections,
    characteristics: ['Professional', 'Conversion-focused', 'Clean']
  };
}

// Generate Apple-style layout  
function generateAppleStyle(classifiedCopy, extractedLayout, brandTokens) {
  const sections = mapContentToLayout(classifiedCopy, extractedLayout, 'apple', brandTokens);
  
  return {
    name: 'Apple Style',
    sections: sections,
    characteristics: ['Minimal', 'Visual', 'Premium']
  };
}

// Generate Linear-style layout
function generateLinearStyle(classifiedCopy, extractedLayout, brandTokens) {
  const sections = mapContentToLayout(classifiedCopy, extractedLayout, 'linear', brandTokens);
  
  return {
    name: 'Linear Style',
    sections: sections,
    characteristics: ['Modern', 'Developer-focused', 'Functional']
  };
}

// Map content to layout with style variations
function mapContentToLayout(classifiedCopy, extractedLayout, styleVariant, brandTokens) {
  const sortedCopy = classifiedCopy.sort((a, b) => a.priority - b.priority);
  
  return sortedCopy.map(copyBlock => {
    // Find matching layout block
    const layoutBlock = extractedLayout.find(layout => layout.type === copyBlock.type) 
                       || extractedLayout[0] 
                       || { layout: 'centered', container: 'contained' };
    
    // Apply style-specific modifications
    const styledLayout = applyStyleVariant(layoutBlock, styleVariant);
    
    return {
      ...copyBlock,
      layout: styledLayout.layout,
      container: styledLayout.container,
      style: applyBrandStyling(copyBlock.type, styleVariant, brandTokens),
      metadata: {
        confidence: 0.75,
        reasoning: 'Rule-based layout selection'
      }
    };
  });
}

// Apply style variant modifications
function applyStyleVariant(layoutBlock, styleVariant) {
  const styles = {
    stripe: {
      hero: { layout: 'centered', container: 'contained' },
      features: { layout: '2-col-grid', container: 'contained' },
      testimonial: { layout: 'centered', container: 'contained' },
      cta: { layout: 'centered', container: 'contained' }
    },
    apple: {
      hero: { layout: 'image-background', container: 'full-width' },
      features: { layout: 'stacked', container: 'contained' },
      testimonial: { layout: 'centered', container: 'contained' },
      cta: { layout: 'centered', container: 'full-width' }
    },
    linear: {
      hero: { layout: 'centered', container: 'contained' },
      features: { layout: '3-col-grid', container: 'contained' },
      testimonial: { layout: 'carousel', container: 'contained' },
      cta: { layout: 'centered', container: 'contained' }
    }
  };
  
  const styleOverride = styles[styleVariant]?.[layoutBlock.type];
  return styleOverride ? { ...layoutBlock, ...styleOverride } : layoutBlock;
}

// Apply brand styling
function applyBrandStyling(sectionType, styleVariant, brandTokens) {
  const colors = brandTokens.colors || {};
  const typography = brandTokens.typography || {};
  
  // Get primary color from brand tokens
  const primaryColor = colors.primary?.primary?.value || 
                       colors.brand?.primary?.value || 
                       Object.values(colors)[0]?.primary?.value || 
                       '#3B82F6';
  
  const secondaryColor = colors.secondary?.secondary?.value || 
                        colors.brand?.secondary?.value ||
                        '#10B981';
  
  const bodyFont = typography.body?.body?.value || 
                   typography.text?.body?.value ||
                   'Inter, sans-serif';
  
  const headingFont = typography.heading?.heading?.value || 
                      typography.display?.heading?.value ||
                      bodyFont;

  const baseStyle = {
    fontFamily: bodyFont,
    color: '#333333'
  };
  
  // Section-specific styling
  switch (sectionType) {
    case 'hero':
      return {
        ...baseStyle,
        backgroundColor: primaryColor,
        color: '#ffffff',
        fontFamily: headingFont
      };
    case 'features':
      return {
        ...baseStyle,
        backgroundColor: '#ffffff',
        color: '#333333'
      };
    case 'testimonial':
      return {
        ...baseStyle,
        backgroundColor: '#F8F9FA',
        color: '#333333'
      };
    case 'cta':
      return {
        ...baseStyle,
        backgroundColor: secondaryColor,
        color: '#ffffff',
        fontFamily: headingFont
      };
    default:
      return baseStyle;
  }
}

// Get style characteristics
function getStyleCharacteristics(styleVariant) {
  const characteristics = {
    stripe: ['Professional', 'Conversion-focused', 'Clean'],
    apple: ['Minimal', 'Visual', 'Premium'],
    linear: ['Modern', 'Developer-focused', 'Functional']
  };
  
  return characteristics[styleVariant] || ['Custom'];
}

// Calculate overall confidence score
function calculateOverallConfidence(variations) {
  let totalConfidence = 0;
  let sectionCount = 0;
  
  variations.forEach(variation => {
    variation.sections?.forEach(section => {
      if (section.metadata?.confidence) {
        totalConfidence += section.metadata.confidence;
        sectionCount++;
      }
    });
  });
  
  return sectionCount > 0 ? Math.round((totalConfidence / sectionCount) * 100) : 85;
}