// lib/ai/screenshot-analyzer.js
import { OpenAI } from 'openai';
import puppeteer from 'puppeteer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class ScreenshotAnalyzer {
  constructor() {
    this.browser = null;
  }

  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Capture website screenshot with multiple viewports
  async captureWebsiteScreenshots(url) {
    await this.init();
    
    const page = await this.browser.newPage();
    
    try {
      // Set user agent to avoid bot detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Navigate to the page
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for any animations or lazy loading
      await page.waitForTimeout(2000);

      const screenshots = {};

      // Desktop screenshot
      await page.setViewport({ width: 1440, height: 900 });
      screenshots.desktop = await page.screenshot({
        encoding: 'base64',
        fullPage: false, // Just above-the-fold for layout analysis
        quality: 80
      });

      // Tablet screenshot  
      await page.setViewport({ width: 768, height: 1024 });
      screenshots.tablet = await page.screenshot({
        encoding: 'base64',
        fullPage: false,
        quality: 80
      });

      // Mobile screenshot
      await page.setViewport({ width: 375, height: 667 });
      screenshots.mobile = await page.screenshot({
        encoding: 'base64',
        fullPage: false,
        quality: 80
      });

      return screenshots;

    } finally {
      await page.close();
    }
  }

  // Analyze layout patterns using GPT-4 Vision
  async analyzeLayoutWithVision(screenshots, url, htmlAnalysis = {}) {
    try {
      const prompt = `Analyze this website's visual layout and design patterns. I'll provide screenshots from desktop, tablet, and mobile views.

Website: ${url}
HTML Analysis Context: ${JSON.stringify(htmlAnalysis, null, 2)}

Please analyze:

1. **Layout Structure**:
   - Container widths and alignment
   - Grid systems and column layouts
   - Section spacing and margins
   - Visual hierarchy and typography scale

2. **Design Patterns**:
   - Hero section style (centered, split, background image, etc.)
   - Feature presentation (grid, cards, list, etc.)
   - Navigation style and placement
   - Call-to-action positioning and styling

3. **Spacing & Rhythm**:
   - Vertical spacing between sections
   - Inner content padding
   - Element spacing consistency
   - Responsive behavior patterns

4. **Visual Style**:
   - Color scheme and contrast
   - Typography choices and hierarchy
   - Border radius and shadow usage
   - Overall aesthetic (minimal, bold, corporate, etc.)

5. **Responsive Behavior**:
   - How layouts adapt across screen sizes
   - Mobile-specific design changes
   - Content reorganization patterns

Return detailed JSON with specific measurements and recommendations for recreating similar layouts.`;

      const messages = [
        {
          role: "system",
          content: "You are an expert web designer and developer. Analyze website screenshots to extract detailed layout patterns, spacing, and design systems that can be used to recreate similar designs. Provide specific, actionable insights with measurements when possible."
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${screenshots.desktop}`,
                detail: "high"
              }
            }
          ]
        }
      ];

      // Add tablet and mobile screenshots if available
      if (screenshots.tablet) {
        messages[1].content.push({
          type: "image_url",
          image_url: {
            url: `data:image/png;base64,${screenshots.tablet}`,
            detail: "high"
          }
        });
      }

      if (screenshots.mobile) {
        messages[1].content.push({
          type: "image_url",
          image_url: {
            url: `data:image/png;base64,${screenshots.mobile}`,
            detail: "high"
          }
        });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages,
        max_tokens: 2000,
        temperature: 0.3
      });

      const analysis = JSON.parse(completion.choices[0].message.content);
      
      return {
        visual: analysis,
        screenshots: {
          desktop: screenshots.desktop.substring(0, 100) + '...', // Keep reference but truncate for storage
          tablet: screenshots.tablet ? screenshots.tablet.substring(0, 100) + '...' : null,
          mobile: screenshots.mobile ? screenshots.mobile.substring(0, 100) + '...' : null
        },
        confidence: 0.9, // High confidence for visual analysis
        source: 'gpt4_vision'
      };

    } catch (error) {
      console.error('Vision analysis failed:', error);
      throw error;
    }
  }

  // Combine all analysis methods
  async analyzeWebsiteComplete(url, htmlAnalysis = {}) {
    try {
      // Capture screenshots
      const screenshots = await this.captureWebsiteScreenshots(url);
      
      // Analyze with GPT-4 Vision
      const visualAnalysis = await this.analyzeLayoutWithVision(screenshots, url, htmlAnalysis);
      
      return {
        url,
        timestamp: new Date().toISOString(),
        analysis: {
          html: htmlAnalysis,
          visual: visualAnalysis,
          combined: this.combineAnalysis(htmlAnalysis, visualAnalysis)
        }
      };

    } catch (error) {
      console.error('Complete analysis failed:', error);
      throw error;
    }
  }

  // Combine HTML and visual analysis for comprehensive insights
  combineAnalysis(htmlAnalysis, visualAnalysis) {
    return {
      layoutConfidence: Math.max(
        htmlAnalysis.confidence || 0.5,
        visualAnalysis.confidence || 0.5
      ),
      recommendedApproach: {
        containerStyle: visualAnalysis.visual?.layoutStructure?.containerAlignment || 'contained',
        gridSystem: htmlAnalysis.gridSystems?.[0]?.type || visualAnalysis.visual?.layoutStructure?.gridType || '3-col-grid',
        spacingScale: visualAnalysis.visual?.spacingRhythm?.verticalSpacing || 'standard',
        designStyle: visualAnalysis.visual?.visualStyle?.aesthetic || 'modern'
      },
      extractedTokens: {
        colors: visualAnalysis.visual?.visualStyle?.colorScheme || htmlAnalysis.designTokens?.colors,
        spacing: visualAnalysis.visual?.spacingRhythm || htmlAnalysis.designTokens?.spacing,
        typography: visualAnalysis.visual?.layoutStructure?.typographyScale || htmlAnalysis.designTokens?.typography
      },
      adaptivePatterns: visualAnalysis.visual?.responsiveBehavior || {
        mobile: 'stack-vertical',
        tablet: 'adjust-columns',
        desktop: 'full-layout'
      }
    };
  }
}

// Usage helper for the API route
export async function analyzeWebsiteWithScreenshots(url, htmlAnalysis = {}) {
  const analyzer = new ScreenshotAnalyzer();
  
  try {
    const result = await analyzer.analyzeWebsiteComplete(url, htmlAnalysis);
    return result;
  } finally {
    await analyzer.close();
  }
}