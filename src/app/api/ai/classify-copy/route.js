// app/api/ai/classify-copy/route.js
export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return Response.json({ error: 'Text content is required' }, { status: 400 });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, using mock classification');
      const mockClassification = generateMockClassification(text);
      return Response.json({
        choices: [{
          message: {
            content: JSON.stringify(mockClassification)
          }
        }]
      });
    }

    // Use real OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{
          role: 'system',
          content: `You are a website content analyzer. Classify the provided website copy into logical sections for layout generation.

Return a JSON array with objects containing:
- type: One of 'hero', 'features', 'testimonial', 'cta', 'about', 'gallery', 'content'  
- content: The relevant text content for that section (keep original text, max 200 chars)
- priority: Number 1-10 indicating display order

Guidelines:
- 'hero' = main headline/value proposition, usually first
- 'features' = product features, benefits, capabilities  
- 'testimonial' = customer quotes, reviews, social proof
- 'cta' = call-to-action, sign up, contact, get started
- 'about' = company info, mission, story
- 'gallery' = images, portfolio, showcases
- 'content' = general information that doesn't fit other categories

Analyze the content and intelligently break it into these sections. Be smart about extracting the right content for each section type.

Return only valid JSON, no other text.`
        }, {
          role: 'user',
          content: text
        }],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const result = await openaiResponse.json();
    
    // Validate the response
    let classification;
    try {
      const content = result.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }
      
      classification = JSON.parse(content);
      
      // Ensure it's an array
      if (!Array.isArray(classification)) {
        throw new Error('OpenAI returned non-array response');
      }
      
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      // Fallback to mock
      classification = generateMockClassification(text);
    }

    return Response.json({
      choices: [{
        message: {
          content: JSON.stringify(classification)
        }
      }]
    });

  } catch (error) {
    console.error('Copy classification error:', error);
    
    // Return mock classification as fallback
    const mockClassification = generateMockClassification(text);
    return Response.json({
      choices: [{
        message: {
          content: JSON.stringify(mockClassification)
        }
      }]
    });
  }
}

// Generate mock classification for development/fallback
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