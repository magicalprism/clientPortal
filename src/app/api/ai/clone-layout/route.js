import { DesignAnalysisEngine, quickAnalysis } from '@/lib/design-analysis'
// app/api/ai/clone-layout/route.js
export async function POST(request) {
  try {
    const { url, classifiedCopy, brandTokens } = await request.json();

    if (!url || !classifiedCopy || !brandTokens) {
      return Response.json({
        success: false,
        error: 'Missing required data: url, classifiedCopy, and brandTokens'
      }, { status: 400 });
    }

    // Enhanced URL analysis with AI
    const layoutStructure = await analyzeURLLayout(url);
    
    // Map user's content to the extracted layout
    const clonedLayout = await mapContentToURLLayout(classifiedCopy, layoutStructure, brandTokens);
    
    return Response.json({
      success: true,
      data: {
        originalUrl: url,
        layoutStructure,
        clonedLayout,
        metadata: {
          generatedAt: new Date().toISOString(),
          sectionsDetected: layoutStructure.length,
          contentMapped: clonedLayout.sections.length,
          brandApplied: Object.keys(brandTokens).length > 0
        }
      }
    });

  } catch (error) {
    console.error('Layout cloning error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Enhanced URL layout analysis
async function analyzeURLLayout(url) {
  try {
    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Enhanced parsing to extract detailed layout structure
    const layoutStructure = parseLayoutStructure(html, url);
    
    // Use AI to enhance layout understanding if available
    if (process.env.OPENAI_API_KEY) {
      return await enhanceLayoutWithAI(layoutStructure, url);
    }
    
    return layoutStructure;
    
  } catch (error) {
    console.error('URL analysis failed:', error);
    // Return mock layout based on URL pattern
    return generateMockLayoutStructure(url);
  }
}

// Parse HTML to extract layout structure
function parseLayoutStructure(html, url) {
  const sections = [];
  
  // Remove scripts and styles for cleaner parsing
  const cleanHTML = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                       .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Extract key layout elements
  const layoutElements = [
    // Header/Hero section
    {
      pattern: /<header[^>]*>([\s\S]*?)<\/header>/gi,
      type: 'hero',
      priority: 1
    },
    // Main navigation
    {
      pattern: /<nav[^>]*>([\s\S]*?)<\/nav>/gi,
      type: 'navigation',
      priority: 0
    },
    // Hero sections
    {
      pattern: /<section[^>]*class="[^"]*hero[^"]*"[^>]*>([\s\S]*?)<\/section>/gi,
      type: 'hero',
      priority: 1
    },
    // Feature sections
    {
      pattern: /<section[^>]*class="[^"]*feature[^"]*"[^>]*>([\s\S]*?)<\/section>/gi,
      type: 'features',
      priority: 2
    },
    // About sections
    {
      pattern: /<section[^>]*class="[^"]*about[^"]*"[^>]*>([\s\S]*?)<\/section>/gi,
      type: 'about',
      priority: 3
    },
    // Testimonial sections
    {
      pattern: /<section[^>]*class="[^"]*testimonial[^"]*"[^>]*>([\s\S]*?)<\/section>/gi,
      type: 'testimonial',
      priority: 4
    },
    // CTA sections
    {
      pattern: /<section[^>]*class="[^"]*cta[^"]*"[^>]*>([\s\S]*?)<\/section>/gi,
      type: 'cta',
      priority: 5
    },
    // Generic sections
    {
      pattern: /<section[^>]*>([\s\S]*?)<\/section>/gi,
      type: 'content',
      priority: 6
    }
  ];

  // Extract sections
  layoutElements.forEach(element => {
    let match;
    while ((match = element.pattern.exec(cleanHTML)) !== null) {
      const content = match[1];
      const layoutInfo = analyzeElementLayout(content);
      
      sections.push({
        type: element.type,
        priority: element.priority,
        layout: layoutInfo.layout,
        container: layoutInfo.container,
        backgroundColor: layoutInfo.backgroundColor,
        textColor: layoutInfo.textColor,
        hasImage: layoutInfo.hasImage,
        columnCount: layoutInfo.columnCount,
        textAlign: layoutInfo.textAlign,
        spacing: layoutInfo.spacing
      });
    }
  });

  // Remove duplicates and sort by priority
  const uniqueSections = sections
    .filter((section, index, arr) => 
      arr.findIndex(s => s.type === section.type) === index
    )
    .sort((a, b) => a.priority - b.priority);

  return uniqueSections.length > 0 ? uniqueSections : generateMockLayoutStructure(url);
}

// Analyze individual element layout
function analyzeElementLayout(content) {
  const layout = {
    layout: 'centered',
    container: 'contained',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    hasImage: false,
    columnCount: 1,
    textAlign: 'left',
    spacing: 'medium'
  };

  // Detect layout patterns
  if (content.includes('grid') || content.match(/class="[^"]*col-\d/)) {
    if (content.match(/col-4|grid-cols-3|three-col/)) {
      layout.layout = '3-col-grid';
      layout.columnCount = 3;
    } else if (content.match(/col-6|grid-cols-2|two-col/)) {
      layout.layout = '2-col-grid';
      layout.columnCount = 2;
    }
  }

  // Detect images
  if (content.includes('<img') || content.includes('background-image')) {
    layout.hasImage = true;
    if (content.indexOf('<img') < content.length / 2) {
      layout.layout = 'image-left';
    } else {
      layout.layout = 'image-right';
    }
  }

  // Detect carousel/slider
  if (content.includes('carousel') || content.includes('slider') || content.includes('swiper')) {
    layout.layout = 'carousel';
  }

  // Detect text alignment
  if (content.includes('text-center') || content.includes('center')) {
    layout.textAlign = 'center';
    layout.layout = 'centered';
  }

  // Detect container type
  if (content.includes('container-fluid') || content.includes('full-width')) {
    layout.container = 'full-width';
  }

  // Extract background colors (basic)
  const bgColorMatch = content.match(/background-color:\s*([^;]+)/);
  if (bgColorMatch) {
    layout.backgroundColor = bgColorMatch[1].trim();
  }

  // Extract text colors (basic)
  const textColorMatch = content.match(/color:\s*([^;]+)/);
  if (textColorMatch) {
    layout.textColor = textColorMatch[1].trim();
  }

  return layout;
}

// Enhance layout with AI understanding
async function enhanceLayoutWithAI(layoutStructure, url) {
  try {
    const prompt = `Analyze this website layout structure and provide enhanced layout recommendations:

URL: ${url}
Detected Sections:
${layoutStructure.map(section => `- ${section.type}: ${section.layout} (${section.columnCount} columns)`).join('\n')}

For each section, suggest:
1. Best layout type for the content
2. Visual hierarchy recommendations  
3. Spacing and container suggestions
4. Any missing sections that should be added

Return JSON format with enhanced layout recommendations.`;

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
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error('AI enhancement failed');
    }

    const result = await response.json();
    const aiEnhancements = JSON.parse(result.choices[0].message.content);
    
    // Apply AI enhancements to layout structure
    return applyAIEnhancements(layoutStructure, aiEnhancements);
    
  } catch (error) {
    console.error('AI layout enhancement failed:', error);
    return layoutStructure; // Return original if AI fails
  }
}

// Apply AI enhancements to layout
function applyAIEnhancements(layoutStructure, aiEnhancements) {
  // This would apply AI suggestions to improve the layout structure
  // For now, return the original structure
  return layoutStructure;
}

// Map user content to extracted layout
async function mapContentToURLLayout(classifiedCopy, layoutStructure, brandTokens) {
  const mappedSections = [];
  
  // Sort content by priority
  const sortedContent = classifiedCopy.sort((a, b) => a.priority - b.priority);
  
  // Map each content section to layout structure
  sortedContent.forEach(contentSection => {
    // Find matching layout section
    const matchingLayout = layoutStructure.find(layout => layout.type === contentSection.type) ||
                          layoutStructure.find(layout => layout.type === 'content') ||
                          layoutStructure[0];
    
    if (matchingLayout) {
      const styledSection = {
        ...contentSection,
        layout: matchingLayout.layout,
        container: matchingLayout.container,
        columnCount: matchingLayout.columnCount,
        textAlign: matchingLayout.textAlign,
        hasImage: matchingLayout.hasImage,
        style: applyBrandColors(matchingLayout, brandTokens, contentSection.type)
      };
      
      mappedSections.push(styledSection);
    }
  });

  return {
    name: 'URL Layout Clone',
    sections: mappedSections,
    characteristics: ['URL-inspired', 'Brand-styled', 'Content-mapped']
  };
}

// Apply brand colors to layout
function applyBrandColors(layoutStructure, brandTokens, sectionType) {
  const colors = brandTokens.colors || {};
  const typography = brandTokens.typography || {};
  
  // Get primary brand colors
  const primaryColor = colors.primary?.primary?.value || 
                       Object.values(colors)[0]?.primary?.value || 
                       '#3B82F6';
  
  const secondaryColor = colors.secondary?.secondary?.value || 
                        '#10B981';
  
  const bodyFont = typography.body?.body?.value || 
                   'Inter, sans-serif';
  
  const headingFont = typography.heading?.heading?.value || 
                      bodyFont;

  // Section-specific color application
  const sectionColors = {
    hero: {
      backgroundColor: primaryColor,
      color: '#ffffff',
      fontFamily: headingFont
    },
    features: {
      backgroundColor: '#ffffff',
      color: '#333333',
      fontFamily: bodyFont
    },
    testimonial: {
      backgroundColor: '#f8f9fa',
      color: '#333333',
      fontFamily: bodyFont
    },
    cta: {
      backgroundColor: secondaryColor,
      color: '#ffffff',
      fontFamily: headingFont
    },
    content: {
      backgroundColor: layoutStructure.backgroundColor || '#ffffff',
      color: '#333333',
      fontFamily: bodyFont
    }
  };

  return sectionColors[sectionType] || sectionColors.content;
}

// Generate mock layout structure for fallback
function generateMockLayoutStructure(url) {
  if (url.includes('stripe')) {
    return [
      { type: 'hero', layout: 'centered', container: 'contained', priority: 1, columnCount: 1, textAlign: 'center' },
      { type: 'features', layout: '3-col-grid', container: 'contained', priority: 2, columnCount: 3, textAlign: 'left' },
      { type: 'testimonial', layout: 'centered', container: 'contained', priority: 3, columnCount: 1, textAlign: 'center' },
      { type: 'cta', layout: 'centered', container: 'contained', priority: 4, columnCount: 1, textAlign: 'center' }
    ];
  }
  
  if (url.includes('apple')) {
    return [
      { type: 'hero', layout: 'image-background', container: 'full-width', priority: 1, columnCount: 1, textAlign: 'center' },
      { type: 'features', layout: 'stacked', container: 'contained', priority: 2, columnCount: 1, textAlign: 'left' },
      { type: 'cta', layout: 'centered', container: 'full-width', priority: 3, columnCount: 1, textAlign: 'center' }
    ];
  }
  
  // Default structure
  return [
    { type: 'hero', layout: 'centered', container: 'contained', priority: 1, columnCount: 1, textAlign: 'center' },
    { type: 'features', layout: '2-col-grid', container: 'contained', priority: 2, columnCount: 2, textAlign: 'left' },
    { type: 'testimonial', layout: 'carousel', container: 'contained', priority: 3, columnCount: 1, textAlign: 'center' },
    { type: 'cta', layout: 'centered', container: 'contained', priority: 4, columnCount: 1, textAlign: 'center' }
  ];
}