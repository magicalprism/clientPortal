// app/api/ai/extract-layout/route.js
export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url || !isValidUrl(url)) {
      return Response.json({ 
        success: false, 
        error: 'Valid URL is required' 
      }, { status: 400 });
    }

    // For now, use mock layout generation
    const layoutStructure = generateMockLayout(url);
    
    return Response.json({
      success: true,
      data: layoutStructure
    });

    /* 
    // Uncomment this when you want to try real URL fetching
    try {
      const layoutStructure = await extractLayoutStructure(url);
      return Response.json({
        success: true,
        data: layoutStructure
      });
    } catch (error) {
      console.error('Failed to fetch URL:', error);
      // Fallback to mock
      const mockLayout = generateMockLayout(url);
      return Response.json({
        success: true,
        data: mockLayout
      });
    }
    */

  } catch (error) {
    console.error('Layout extraction error:', error);
    
    // Return mock layout as fallback
    const mockLayout = generateMockLayout('');
    return Response.json({
      success: true,
      data: mockLayout
    });
  }
}

// Generate mock layout based on URL
function generateMockLayout(url) {
  const layouts = [];
  
  if (url.includes('stripe')) {
    layouts.push(
      { type: 'hero', layout: 'image-right', container: 'contained', description: 'Hero with product demo on right' },
      { type: 'features', layout: '2-col-grid', container: 'contained', description: 'Two-column feature comparison' },
      { type: 'testimonial', layout: 'centered', container: 'contained', description: 'Single customer testimonial' },
      { type: 'cta', layout: 'centered', container: 'contained', description: 'Centered sign-up CTA' }
    );
  } else if (url.includes('apple')) {
    layouts.push(
      { type: 'hero', layout: 'image-background', container: 'full-width', description: 'Full-screen product hero' },
      { type: 'features', layout: 'stacked', container: 'contained', description: 'Stacked feature showcases' },
      { type: 'gallery', layout: 'masonry', container: 'contained', description: 'Product image gallery' }
    );
  } else if (url.includes('linear')) {
    layouts.push(
      { type: 'hero', layout: 'centered', container: 'contained', description: 'Clean centered hero' },
      { type: 'features', layout: '3-col-grid', container: 'contained', description: 'Three-column feature grid' },
      { type: 'testimonial', layout: 'carousel', container: 'contained', description: 'Customer testimonial carousel' },
      { type: 'cta', layout: 'centered', container: 'full-width', description: 'Full-width CTA section' }
    );
  } else {
    // Default layout structure
    layouts.push(
      { type: 'hero', layout: 'centered', container: 'contained', description: 'Main hero section with headline' },
      { type: 'features', layout: '3-col-grid', container: 'contained', description: 'Feature grid with icons' },
      { type: 'testimonial', layout: 'carousel', container: 'contained', description: 'Customer testimonials' },
      { type: 'cta', layout: 'centered', container: 'contained', description: 'Call-to-action section' }
    );
  }
  
  return layouts;
}

// URL validation helper
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Simple layout extraction using fetch (for future use)
async function extractLayoutStructure(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    return parseHTMLStructure(html, url);

  } catch (error) {
    console.error('Failed to fetch URL:', error);
    throw error;
  }
}

// Parse HTML structure to extract layout patterns (for future use)
function parseHTMLStructure(html, url) {
  // Basic implementation - just return mock for now
  return generateMockLayout(url);
}