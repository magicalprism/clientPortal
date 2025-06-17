// Research-Based Universal Content Parser
// Uses patterns from AIDA, PAS, landing page research, and web content analysis

export const parseContentQuantitatively = (content, htmlStructure = null) => {
  console.log('🔬 RESEARCH-BASED CONTENT PARSING - Universal Patterns');
  console.log('🔍 HTML Structure available:', !!htmlStructure);
  console.log('🔍 HTML Elements count:', htmlStructure?.elements?.length || 0);
  
  // PRIORITY: Use HTML structure if available
  if (htmlStructure && htmlStructure.elements && htmlStructure.elements.length > 0) {
    console.log('🎯 Using HTML semantic structure - preserving tags and hierarchy');
    return parseFromHTMLStructure(htmlStructure, content);
  }
  
  // FALLBACK: Plain text parsing with enhanced splitting
  console.log('📝 No HTML structure - using enhanced text parsing');
  
  // STEP 1: Clean and normalize content
  const cleanContent = normalizeContent(content);
  
  // STEP 2: Split into atomic lines with comprehensive metadata  
  const atomicLines = createAtomicLines(cleanContent);
  console.log(`📊 Created ${atomicLines.length} atomic lines`);
  
  // STEP 3: Classify each line using research-based patterns
  const classifiedLines = classifyLinesUniversally(atomicLines);
  console.log(`📊 Classified lines:`, getClassificationStats(classifiedLines));
  
  // STEP 4: Group into copywriting framework sections
  const sections = groupIntoFrameworkSections(classifiedLines);
  console.log(`📊 Created ${sections.length} framework-based sections`);
  
  // STEP 5: Convert to wireframe format
  const wireframeSections = convertToWireframeSections(sections);
  
  return {
    sections: wireframeSections,
    totalSections: wireframeSections.length,
    hasSemanticStructure: false,
    stats: {
      totalLines: atomicLines.length,
      bulletLines: classifiedLines.filter(l => l.type === 'bullet').length,
      headingLines: classifiedLines.filter(l => l.type === 'heading').length,
      paragraphLines: classifiedLines.filter(l => l.type === 'paragraph').length,
      frameworkPatterns: sections.map(s => s.frameworkPattern).join(', ')
    }
  };
};

// ENHANCED: Parse from HTML structure with better debugging
export const parseFromHTMLStructure = (htmlStructure, originalContent) => {
  console.log('🏗️ PARSING FROM HTML STRUCTURE');
  console.log('📋 HTML Structure:', htmlStructure);
  
  const elements = htmlStructure.elements || [];
  console.log(`📋 Processing ${elements.length} HTML elements`);
  
  // Debug: Log first few elements to see what we're working with
  elements.slice(0, 5).forEach((el, idx) => {
    console.log(`📋 Element ${idx}: type="${el.type}", tag="${el.tag}", content="${el.content?.substring(0, 50)}"`);
  });
  
  if (elements.length === 0) {
    console.log('❌ No HTML elements found, falling back to text parsing');
    return parseContentQuantitatively(originalContent, null);
  }
  
  // Group elements into logical sections
  const sections = groupHTMLElementsIntoSections(elements);
  console.log(`📊 Grouped into ${sections.length} semantic sections`);
  
  if (sections.length === 0) {
    console.log('❌ No sections created, falling back to text parsing');
    return parseContentQuantitatively(originalContent, null);
  }
  
  // Convert to wireframe format
  const wireframeSections = sections.map((section, index) => {
    const contentAnalysis = analyzeHTMLSectionContent(section);
    const sectionType = determineHTMLSectionType(section, index);
    const template = selectTemplateForHTMLSection(sectionType, contentAnalysis);
    
    console.log(`📋 Section ${index + 1}: ${sectionType} -> ${template.name} (${contentAnalysis.listItemCount} lists)`);
    
    return {
      id: `section-${index}`,
      type: sectionType,
      templateName: template.name,
      templateKey: template.layout.replace(/[_-]/g, '_'),
      elements: section.elements,
      wireframeLayout: {
        layout: template.layout,
        hasImage: template.hasImage,
        imagePos: template.imagePos || (sectionType === 'hero' ? 'left' : 'right')
      },
      template: template,
      index: index,
      hasSemanticStructure: true,
      contentAnalysis: contentAnalysis
    };
  });

  return {
    sections: wireframeSections,
    totalSections: wireframeSections.length,
    hasSemanticStructure: true,
    stats: {
      totalElements: elements.length,
      headingElements: elements.filter(e => e.type === 'heading').length,
      listElements: elements.filter(e => e.type === 'list_item' || e.tag === 'li').length,
      paragraphElements: elements.filter(e => e.type === 'paragraph').length,
      frameworkPatterns: 'HTML Structure Preserved'
    }
  };
};

// FIXED: Better HTML element grouping with debugging
export const groupHTMLElementsIntoSections = (elements) => {
  console.log('🏗️ GROUPING HTML ELEMENTS INTO SECTIONS');
  console.log(`📋 Input elements:`, elements.map(e => `${e.type}:${e.tag} "${e.content?.substring(0, 30)}"`));
  
  const sections = [];
  let currentSection = null;
  
  elements.forEach((element, index) => {
    // Log each element being processed
    console.log(`📋 Processing element ${index}: ${element.type}:${element.tag} "${element.content?.substring(0, 50)}"`);
    
    // Don't skip list containers - they might contain important structure info
    if (element.type === 'list_container') {
      console.log(`📋 Found list container with ${element.itemCount} items`);
      // Add a marker for list structure but continue processing
    }
    
    const shouldStartNewSection = shouldStartNewHTMLSection(element, currentSection, index);
    
    if (shouldStartNewSection) {
      // Save current section
      if (currentSection && currentSection.elements.length > 0) {
        console.log(`💾 Saving section with ${currentSection.elements.length} elements`);
        sections.push(currentSection);
      }
      
      // Start new section
      const sectionType = determineHTMLSectionType([element], index);
      currentSection = {
        type: sectionType,
        elements: [element],
        startIndex: index
      };
      
      console.log(`🆕 New HTML section: ${sectionType} at element ${index}`);
    } else {
      // Add to current section
      if (currentSection) {
        currentSection.elements.push(element);
        console.log(`   ➕ Added ${element.type}:${element.tag} to ${currentSection.type}`);
      } else {
        // Failsafe - create section if none exists
        currentSection = {
          type: 'content',
          elements: [element],
          startIndex: index
        };
        console.log(`🆕 Created failsafe section at element ${index}`);
      }
    }
  });
  
  // Don't forget the last section
  if (currentSection && currentSection.elements.length > 0) {
    console.log(`💾 Saving final section with ${currentSection.elements.length} elements`);
    sections.push(currentSection);
  }
  
  console.log(`✅ Created ${sections.length} HTML sections total`);
  sections.forEach((section, idx) => {
    console.log(`   ${idx + 1}. ${section.type} (${section.elements.length} elements)`);
  });
  
  return sections;
};

// FIXED: Much more conservative HTML section breaking
export const shouldStartNewHTMLSection = (element, currentSection, index) => {
  if (!currentSection) return true;
  
  // ONLY break on H1 headings (main sections)
  if (element.type === 'heading' && element.level === 1) {
    console.log(`   🔬 HTML Section break: H1 main heading`);
    return true;
  }
  
  // Break after many elements (increased threshold)
  if (currentSection.elements.length >= 15) {
    console.log(`   🔬 HTML Section break: Too many elements (${currentSection.elements.length})`);
    return true;
  }
  
  // ONLY break on MAJOR section keywords at the START of headings
  if (element.type === 'heading' && element.level === 2 && 
      /^(About|Services|Features|Benefits|Results|Experience|Contact|Looking to|The ABD|Proven Results|You've Outgrown)/i.test(element.content.trim())) {
    console.log(`   🔬 HTML Section break: Major section heading: "${element.content.substring(0, 50)}"`);
    return true;
  }
  
  // Break on very long content (word-based)
  const totalWords = currentSection.elements.reduce((sum, el) => 
    sum + (el.content?.split(' ').length || 0), 0);
  if (totalWords > 800) {
    console.log(`   🔬 HTML Section break: Word limit (${totalWords} words)`);
    return true;
  }
  
  return false;
};

// FIXED: Better HTML section content analysis with proper list detection
export const analyzeHTMLSectionContent = (section) => {
  const elements = section.elements || [];
  const headings = elements.filter(e => e.type === 'heading');
  const lists = elements.filter(e => e.type === 'list_item' || e.tag === 'li');
  const paragraphs = elements.filter(e => e.type === 'paragraph' || e.tag === 'p');
  
  // Also check for bullet patterns in text content
  const textWithBullets = elements.filter(e => 
    e.content && (
      /^[-•*]\s/.test(e.content) || 
      /^\d+\.\s/.test(e.content) ||
      e.content.includes('• ') ||
      e.content.includes('- ') ||
      e.content.includes('* ')
    )
  );
  
  const totalListItems = lists.length + textWithBullets.length;
  
  console.log(`📊 Section analysis: ${elements.length} elements, ${headings.length} headings, ${totalListItems} list items, ${paragraphs.length} paragraphs`);
  
  return {
    elementCount: elements.length,
    headingCount: headings.length,
    listItemCount: totalListItems,
    paragraphCount: paragraphs.length,
    hasHeadings: headings.length > 0,
    hasLists: totalListItems > 0,
    hasParagraphs: paragraphs.length > 0,
    totalWords: elements.reduce((sum, e) => sum + (e.content?.split(' ').length || 0), 0),
    shouldUseBulletList: totalListItems >= 3,
    shouldUseIconGrid: totalListItems >= 2 && totalListItems <= 6,
    forceImageTemplate: true
  };
};

// FIXED: More intelligent section type determination
export const determineHTMLSectionType = (sectionOrElements, index) => {
  const elements = Array.isArray(sectionOrElements) ? sectionOrElements : sectionOrElements.elements;
  
  if (!elements || elements.length === 0) return 'content';
  
  // First section is always hero
  if (index === 0) return 'hero';
  
  // Combine all content to analyze
  const allContent = elements.map(e => e.content || '').join(' ').toLowerCase();
  const firstElement = elements[0];
  const firstContent = (firstElement?.content || '').toLowerCase();
  
  // Check for specific section markers in the FIRST element
  if (/^(about|hi\.|after|as my work|background|bio)/i.test(firstContent)) {
    console.log(`📋 Detected ABOUT section from: "${firstContent.substring(0, 50)}"`);
    return 'about';
  }
  
  if (/^(proven results|these aren't just ideas|real-world results|drawing from experience)/i.test(firstContent)) {
    console.log(`📋 Detected TESTIMONIALS section from: "${firstContent.substring(0, 50)}"`);
    return 'testimonials';
  }
  
  if (/^(the cost|i've worked with people)/i.test(firstContent)) {
    console.log(`📋 Detected PROBLEM section from: "${firstContent.substring(0, 50)}"`);
    return 'problem';
  }
  
  if (/^(looking to|get my official|contact|partner with us)/i.test(firstContent)) {
    console.log(`📋 Detected CTA section from: "${firstContent.substring(0, 50)}"`);
    return 'cta';
  }
  
  if (/^(the abd ventures|most consultants|we blend)/i.test(firstContent)) {
    console.log(`📋 Detected FEATURES section from: "${firstContent.substring(0, 50)}"`);
    return 'features';
  }
  
  // Check for high concentration of list items (features)
  const listItems = elements.filter(e => 
    e.type === 'list_item' || 
    (e.content && (/^[-•*]\s/.test(e.content) || e.content.includes('• ')))
  ).length;
  
  if (listItems >= 3) {
    console.log(`📋 Detected FEATURES section from ${listItems} list items`);
    return 'features';
  }
  
  // Check content patterns for section type
  if (allContent.includes('results') || allContent.includes('proven') || 
      allContent.includes('success') || allContent.includes('clients')) {
    return 'testimonials';
  }
  
  if (allContent.includes('services') || allContent.includes('features') || 
      allContent.includes('we offer') || allContent.includes('capabilities')) {
    return 'features';
  }
  
  console.log(`📋 Defaulting to CONTENT section for: "${firstContent.substring(0, 50)}"`);
  return 'content';
};

// FIXED: Better template selection for HTML sections with debugging
export const selectTemplateForHTMLSection = (sectionType, contentAnalysis) => {
  console.log(`🎨 Selecting template for ${sectionType} section with ${contentAnalysis.listItemCount} lists`);
  
  const templates = {
    hero: {
      name: 'Hero - Image Split',
      layout: 'image_text_split',
      hasImage: true,
      imagePos: 'left',
      description: 'Hero section with image and text'
    },
    about: {
      name: 'About - Image Right',
      layout: 'image_text_split',
      hasImage: true,
      imagePos: 'right',
      description: 'About section with image on right'
    },
    features: contentAnalysis.shouldUseBulletList ? {
      name: 'Feature List',
      layout: 'bullet_list',
      hasImage: false,
      description: 'Structured list with bullets'
    } : contentAnalysis.shouldUseIconGrid ? {
      name: 'Features - Icon Grid',
      layout: 'icon_grid',
      hasImage: true,
      description: 'Grid layout with icons'
    } : {
      name: 'Features - Two Column',
      layout: 'two_column_list',
      hasImage: false,
      description: 'Two column feature list'
    },
    testimonials: {
      name: 'Social Proof',
      layout: 'social_proof',
      hasImage: true,
      description: 'Testimonials and social proof'
    },
    problem: {
      name: 'Problem - Centered',
      layout: 'centered_emphasis',
      hasImage: false,
      description: 'Problem statement with emphasis'
    },
    cta: {
      name: 'CTA - Centered',
      layout: 'centered_cta',
      hasImage: false,
      description: 'Centered call to action'
    },
    content: {
      name: 'Content Block',
      layout: 'text_block',
      hasImage: false,
      description: 'General content block'
    }
  };
  
  const selectedTemplate = templates[sectionType] || templates.content;
  console.log(`🎨 Selected template: ${selectedTemplate.name} (${selectedTemplate.layout})`);
  
  return selectedTemplate;
};

// STEP 1: Normalize content
export const normalizeContent = (content) => {
  return content
    .replace(/\r\n/g, '\n')  // Normalize line breaks
    .replace(/\r/g, '\n')    // Handle old Mac line breaks
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple line breaks
    .trim();
};

// STEP 2: Enhanced content splitting for better section generation
export const createAtomicLines = (content) => {
  // First try normal line splitting
  let lines = content.split('\n');
  
  // If we only get 1-2 lines but content is long, try intelligent splitting
  if (lines.length <= 2 && content.length > 200) {
    console.log('🔧 Content too long for single line, attempting intelligent split...');
    lines = intelligentContentSplit(content);
  }
  
  return lines.map((line, index) => {
    const trimmed = line.trim();
    
    return {
      index: index,
      originalText: line,
      text: trimmed,
      length: trimmed.length,
      isEmpty: trimmed.length === 0,
      wordCount: trimmed.split(/\s+/).filter(w => w.length > 0).length,
      hasEndPunctuation: /[.!?]$/.test(trimmed),
      startsWithCapital: /^[A-Z]/.test(trimmed),
      bulletPatterns: analyzeBulletPatterns(trimmed),
      headingIndicators: analyzeHeadingIndicators(trimmed, index),
      headingConfidence: calculateHeadingConfidence(trimmed, index),
      frameworkIndicators: analyzeFrameworkIndicators(trimmed),
      webPatterns: analyzeWebPatterns(trimmed)
    };
  }).filter(line => !line.isEmpty);
};

// FIXED: Intelligent content splitting that respects sentence boundaries
export const intelligentContentSplit = (content) => {
  const lines = [];
  
  // FIRST: Try to preserve existing structure if it exists
  if (content.includes('\n\n')) {
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 20);
    if (paragraphs.length > 1) {
      console.log(`📝 Found ${paragraphs.length} paragraph breaks`);
      return paragraphs;
    }
  }
  
  // SECOND: Look for section keywords at sentence boundaries
  const sectionKeywords = /(\. |^)(About|Services|Features|Benefits|How|Why|What|Get Started|Contact|Subscribe|Download|Looking to|The [A-Z])/g;
  let lastIndex = 0;
  let match;
  
  while ((match = sectionKeywords.exec(content)) !== null) {
    if (lastIndex < match.index) {
      const section = content.substring(lastIndex, match.index + 1).trim();
      if (section.length > 50) {
        lines.push(section);
      }
    }
    lastIndex = match.index + (match[1].length === 1 ? 1 : 0); // Keep the period but not the keyword
  }
  
  // Add remaining content
  if (lastIndex < content.length) {
    const remaining = content.substring(lastIndex).trim();
    if (remaining.length > 50) {
      lines.push(remaining);
    }
  }
  
  if (lines.length > 1) {
    console.log(`🎯 Found ${lines.length} section-based splits`);
    return lines;
  }
  
  // THIRD: Split on complete sentences for very long content
  if (content.length > 800) {
    const sentences = content.match(/[^\.!?]+[\.!?]+/g) || [];
    let currentChunk = '';
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      
      // Start new chunk if current is getting long AND we're at a logical break
      if (currentChunk.length > 300 && isLogicalBreakPoint(trimmed)) {
        if (currentChunk.trim()) lines.push(currentChunk.trim());
        currentChunk = trimmed;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + trimmed;
      }
    });
    
    if (currentChunk.trim()) lines.push(currentChunk.trim());
    
    if (lines.length > 1) {
      console.log(`📝 Split into ${lines.length} sentence-aware chunks`);
      return lines;
    }
  }
  
  // FALLBACK: Return original if we can't split intelligently
  return [content];
};

// Helper function to identify logical break points
export const isLogicalBreakPoint = (sentence) => {
  return /^(About|After|But|That|This|Here|Now|Today|Looking|The cost|The result|You|I)/i.test(sentence) ||
         sentence.includes('experience') ||
         sentence.includes('background') ||
         sentence.includes('results');
};

// Research-based bullet pattern detection
export const analyzeBulletPatterns = (text) => {
  return {
    bullet: /^[•\-\*]\s/.test(text),
    numbered: /^\d+\.\s/.test(text),
    hyphen: /^\-\s/.test(text),
    asterisk: /^\*\s/.test(text),
    arrow: /^[→➤►]\s/.test(text),
    check: /^[✓✔]\s/.test(text),
    confidence: calculateBulletConfidence(text)
  };
};

export const calculateBulletConfidence = (text) => {
  let score = 0;
  
  if (/^[•\-\*]\s/.test(text)) score += 0.9;
  if (/^\d+\.\s/.test(text)) score += 0.9;
  if (/^[→➤►✓✔]\s/.test(text)) score += 0.8;
  
  if (text.length > 20 && text.length < 200) score += 0.1;
  if (!text.includes('.') || text.endsWith('.')) score += 0.1;
  
  return Math.min(1, score);
};

// Research-based heading detection
export const analyzeHeadingIndicators = (text, index) => {
  return {
    lengthScore: calculateLengthScore(text),
    positionScore: calculatePositionScore(index),
    hasColon: text.endsWith(':'),
    isShort: text.length < 80,
    hasNoInternalPunctuation: !/[.!?]/.test(text.slice(0, -1)),
    semanticScore: calculateSemanticHeadingScore(text)
  };
};

export const calculateLengthScore = (text) => {
  if (text.length < 30) return 0.4;
  if (text.length < 50) return 0.3;
  if (text.length < 80) return 0.2;
  return 0;
};

export const calculatePositionScore = (index) => {
  if (index === 0) return 0.4;
  if (index < 3) return 0.2;
  if (index < 5) return 0.1;
  return 0;
};

export const calculateSemanticHeadingScore = (text) => {
  let score = 0;
  
  const headingPatterns = [
    /^(About|Services|Products|Features|Benefits|How|Why|What|Get|Start)/i,
    /^(Problem|Solution|Challenge|Issue|Trouble|Struggle)/i,
    /^(Attention|Interest|Desire|Action|Discover|Learn|Find)/i,
    /^(Hero|Welcome|Introduction|Overview|Summary)/i,
    /^(Testimonials|Reviews|Results|Success|Proven|Trusted)/i,
    /^(Contact|Subscribe|Download|Buy|Get|Start|Join|Sign)/i
  ];
  
  headingPatterns.forEach(pattern => {
    if (pattern.test(text)) score += 0.2;
  });
  
  if (text.endsWith(':')) score += 0.3;
  
  return Math.min(1, score);
};

export const calculateHeadingConfidence = (text, index) => {
  const lengthScore = calculateLengthScore(text);
  const positionScore = calculatePositionScore(index);
  const semanticScore = calculateSemanticHeadingScore(text);
  const hasColon = text.endsWith(':');
  const hasNoInternalPunctuation = !/[.!?]/.test(text.slice(0, -1));
  
  let confidence = 0;
  confidence += lengthScore;
  confidence += positionScore;
  confidence += semanticScore;
  
  // ENHANCED: Boost confidence for typical heading patterns
  if (text.length < 60 && /^[A-Z]/.test(text)) confidence += 0.2;
  if (hasColon) confidence += 0.3;
  if (hasNoInternalPunctuation) confidence += 0.2;
  
  // ENHANCED: Look for heading-like content
  if (/^(About|Services|Features|Benefits|Results|Experience|Background|Contact)/i.test(text)) {
    confidence += 0.4;
  }
  
  return Math.max(0, Math.min(1, confidence));
};

// Research-based copywriting framework detection
export const analyzeFrameworkIndicators = (text) => {
  const lower = text.toLowerCase();
  
  return {
    aida: {
      attention: testAttentionPatterns(lower),
      interest: testInterestPatterns(lower),
      desire: testDesirePatterns(lower),
      action: testActionPatterns(lower)
    },
    pas: {
      problem: testProblemPatterns(lower),
      agitation: testAgitationPatterns(lower),
      solution: testSolutionPatterns(lower)
    },
    landingPage: {
      hero: testHeroPatterns(lower),
      features: testFeaturePatterns(lower),
      socialProof: testSocialProofPatterns(lower),
      cta: testCTAPatterns(lower)
    }
  };
};

// AIDA Pattern Detection
export const testAttentionPatterns = (text) => {
  const patterns = [
    /discover|imagine|what if|did you know|stop|wait|look|attention|alert/,
    /breakthrough|revolutionary|amazing|incredible|shocking|surprising/,
    /secret|hidden|revealed|exposed|truth|fact/
  ];
  return patterns.some(p => p.test(text)) ? 0.8 : 0;
};

export const testInterestPatterns = (text) => {
  const patterns = [
    /learn|understand|find out|see how|explore|dive into/,
    /benefits|advantages|features|reasons|ways|methods/,
    /research|study|data|proof|evidence|results/
  ];
  return patterns.some(p => p.test(text)) ? 0.7 : 0;
};

export const testDesirePatterns = (text) => {
  const patterns = [
    /you need|you want|you deserve|you can|you will|you should/,
    /imagine|picture|visualize|dream|achieve|reach|get/,
    /transform|change|improve|upgrade|enhance|boost/
  ];
  return patterns.some(p => p.test(text)) ? 0.6 : 0;
};

export const testActionPatterns = (text) => {
  const patterns = [
    /click|download|subscribe|buy|purchase|order|get started/,
    /contact|call|email|visit|try|test|start|begin/,
    /now|today|immediately|instant|fast|quick/
  ];
  return patterns.some(p => p.test(text)) ? 0.9 : 0;
};

// PAS Pattern Detection
export const testProblemPatterns = (text) => {
  const patterns = [
    /problem|issue|challenge|struggle|difficulty|trouble/,
    /frustrated|annoyed|tired|sick|hate|dislike/,
    /waste|lose|missing|lacking|without|need/
  ];
  return patterns.some(p => p.test(text)) ? 0.8 : 0;
};

export const testAgitationPatterns = (text) => {
  const patterns = [
    /worse|terrible|awful|horrible|nightmare|disaster/,
    /cost|expensive|waste|lose money|drain|burden/,
    /fail|failure|wrong|mistake|regret|suffer/
  ];
  return patterns.some(p => p.test(text)) ? 0.7 : 0;
};

export const testSolutionPatterns = (text) => {
  const patterns = [
    /solution|answer|fix|solve|resolve|address/,
    /introducing|presenting|new|better|improved|perfect/,
    /easy|simple|quick|fast|efficient|effective/
  ];
  return patterns.some(p => p.test(text)) ? 0.8 : 0;
};

// Landing Page Pattern Detection
export const testHeroPatterns = (text) => {
  const patterns = [
    /welcome|hello|meet|introducing|this is/,
    /leading|#1|best|top|premium|professional/,
    /transform|revolutionize|change|improve|boost/
  ];
  return patterns.some(p => p.test(text)) ? 0.8 : 0;
};

export const testFeaturePatterns = (text) => {
  const patterns = [
    /features|capabilities|includes|offers|provides/,
    /powerful|advanced|sophisticated|comprehensive/,
    /built|designed|created|developed|engineered/
  ];
  return patterns.some(p => p.test(text)) ? 0.7 : 0;
};

export const testSocialProofPatterns = (text) => {
  const patterns = [
    /testimonial|review|customer|client|user/,
    /trust|proven|tested|verified|certified/,
    /\d+[k]? (customers|users|clients|companies)/
  ];
  return patterns.some(p => p.test(text)) ? 0.9 : 0;
};

export const testCTAPatterns = (text) => {
  const patterns = [
    /get started|sign up|download|contact|learn more/,
    /free trial|demo|consultation|quote|estimate/,
    /don't wait|act now|limited time|hurry|today only/
  ];
  return patterns.some(p => p.test(text)) ? 0.9 : 0;
};

// Web content pattern analysis
export const analyzeWebPatterns = (text) => {
  return {
    isLeftAligned: true,
    likelyAboveFold: text.length < 100 && /^(welcome|hero|main|primary)/.test(text.toLowerCase()),
    isScannableLenght: text.length > 20 && text.length < 150,
    containsCTA: /click|download|subscribe|buy|contact|get|start|try/.test(text.toLowerCase())
  };
};

// STEP 3: Universal line classification
export const classifyLinesUniversally = (atomicLines) => {
  return atomicLines.map((line, index) => {
    const classification = classifyLineUniversally(line, index, atomicLines);
    
    return {
      ...line,
      type: classification.type,
      confidence: classification.confidence,
      subtype: classification.subtype,
      frameworkMatch: classification.frameworkMatch,
      sectionBreakScore: calculateUniversalSectionBreakScore(line, index, atomicLines)
    };
  });
};

export const classifyLineUniversally = (line, index, allLines) => {
  const { text, bulletPatterns, headingConfidence, frameworkIndicators } = line;
  
  // 1. ENHANCED BULLET POINTS - Look for more patterns
  if (bulletPatterns.confidence > 0.7 || isListItem(text)) {
    return {
      type: 'bullet',
      confidence: Math.max(bulletPatterns.confidence, 0.8),
      subtype: bulletPatterns.numbered ? 'numbered' : 'bulleted',
      frameworkMatch: 'features'
    };
  }
  
  // 2. ENHANCED HEADINGS - More lenient detection
  if (headingConfidence > 0.5 || isHeadingLike(text)) { // Reduced from 0.6
    let level = 2;
    if (index === 0 || headingConfidence > 0.8) level = 1;
    if (text.length < 40 && text.endsWith(':')) level = 3;
    
    return {
      type: 'heading',
      confidence: Math.max(headingConfidence, 0.7),
      subtype: `h${level}`,
      frameworkMatch: detectFrameworkFromIndicators(frameworkIndicators)
    };
  }
  
  // 3. PARAGRAPHS - Everything else
  return {
    type: 'paragraph',
    confidence: 0.8,
    subtype: 'body',
    frameworkMatch: detectFrameworkFromIndicators(frameworkIndicators)
  };
};

// Helper functions for better detection
export const isListItem = (text) => {
  return /^[-•*]\s/.test(text) || 
         /^\d+\.\s/.test(text) ||
         /^[→➤►✓✔]\s/.test(text) ||
         (text.length < 150 && text.includes('—') && !text.includes('. '));
};

export const isHeadingLike = (text) => {
  return (text.length < 80 && 
          (/^[A-Z]/.test(text) && 
           !text.includes('. ') && 
           (text.endsWith(':') || 
            /^(About|Services|Features|Benefits|Results|Experience|Background|Contact|The [A-Z])/i.test(text))));
};

export const detectFrameworkFromIndicators = (indicators) => {
  const aidaScore = Object.values(indicators.aida).reduce((sum, val) => sum + val, 0);
  const pasScore = Object.values(indicators.pas).reduce((sum, val) => sum + val, 0);
  const landingScore = Object.values(indicators.landingPage).reduce((sum, val) => sum + val, 0);
  
  if (aidaScore > pasScore && aidaScore > landingScore) return 'aida';
  if (pasScore > landingScore) return 'pas';
  if (landingScore > 0.5) return 'landing_page';
  
  return 'generic';
};

// FIXED: More conservative section break scoring
export const calculateUniversalSectionBreakScore = (line, index, allLines) => {
  let score = 0;
  
  // Only high-confidence headings get significant scores
  if (line.headingConfidence > 0.8) score += 0.5; // Higher threshold
  if (index === 0) score += 0.4;
  
  // Only strong framework signals
  if (line.frameworkIndicators.aida.attention > 0.6) score += 0.3;
  if (line.frameworkIndicators.pas.problem > 0.6) score += 0.3;
  if (line.frameworkIndicators.landingPage.hero > 0.6) score += 0.3;
  
  // Strong section starters only
  if (/^(About|Services|Features|Benefits|Looking to|The [A-Z])/i.test(line.text)) {
    score += 0.4;
  }
  
  // Significantly longer content
  if (allLines.length > 1) {
    const avgLength = allLines.reduce((sum, l) => sum + l.length, 0) / allLines.length;
    if (line.length > avgLength * 2) score += 0.2; // Doubled threshold
  }
  
  return Math.max(0, Math.min(1, score));
};

// STEP 4: Group into framework-based sections
export const groupIntoFrameworkSections = (classifiedLines) => {
  const sections = [];
  let currentSection = null;
  
  console.log('🔬 RESEARCH-BASED SECTION GROUPING');
  
  classifiedLines.forEach((line, index) => {
    const shouldStartNewSection = shouldStartNewSectionUniversal(line, currentSection, index);
    
    if (shouldStartNewSection) {
      if (currentSection && currentSection.lines.length > 0) {
        sections.push(finalizeUniversalSection(currentSection));
      }
      
      currentSection = {
        startIndex: index,
        lines: [line],
        frameworkPattern: line.frameworkMatch || 'generic',
        bulletCount: line.type === 'bullet' ? 1 : 0,
        headingCount: line.type === 'heading' ? 1 : 0,
        totalWords: line.wordCount,
        dominantFramework: line.frameworkMatch
      };
      
      console.log(`📊 New section: ${currentSection.frameworkPattern} at line ${index}`);
    } else {
      if (currentSection) {
        currentSection.lines.push(line);
        if (line.type === 'bullet') currentSection.bulletCount++;
        if (line.type === 'heading') currentSection.headingCount++;
        currentSection.totalWords += line.wordCount;
      }
    }
  });
  
  if (currentSection && currentSection.lines.length > 0) {
    sections.push(finalizeUniversalSection(currentSection));
  }
  
  return sections;
};

// FIXED: Conservative section breaks to prevent over-splitting
export const shouldStartNewSectionUniversal = (line, currentSection, index) => {
  if (!currentSection) return true;
  
  // 1. Only break on STRONG section indicators
  if (line.sectionBreakScore > 0.7) { // Increased threshold
    console.log(`   🔬 Section break: Strong score (${line.sectionBreakScore})`);
    return true;
  }
  
  // 2. INCREASED word count to prevent tiny sections
  if (currentSection.totalWords > 500) { // Increased from 150
    console.log(`   🔬 Section break: Word limit (${currentSection.totalWords} words)`);
    return true;
  }
  
  // 3. Only break on very clear framework changes
  if (line.frameworkMatch !== currentSection.dominantFramework && 
      line.confidence > 0.8 && currentSection.lines.length > 3) { // Higher thresholds
    console.log(`   🔬 Section break: Strong framework change (${currentSection.dominantFramework} → ${line.frameworkMatch})`);
    return true;
  }
  
  // 4. INCREASED element limit to prevent over-splitting
  if (currentSection.lines.length > 8) { // Increased from 3
    console.log(`   🔬 Section break: Element limit (${currentSection.lines.length})`);
    return true;
  }
  
  // 5. Only break on very strong semantic indicators
  if (line.text.length > 100 && currentSection.lines.length > 2 && (
    line.frameworkIndicators.aida.attention > 0.7 || // Higher thresholds
    line.frameworkIndicators.pas.problem > 0.7 ||
    line.frameworkIndicators.landingPage.hero > 0.7
  )) {
    console.log(`   🔬 Section break: Strong semantic indicator`);
    return true;
  }
  
  return false;
};

export const finalizeUniversalSection = (section) => {
  const elements = section.lines.map((line, idx) => ({
    type: line.type,
    tag: line.type === 'heading' ? line.subtype : (line.type === 'bullet' ? 'li' : 'p'),
    content: line.type === 'bullet' ? 
      line.text.replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '') : 
      line.text,
    level: line.type === 'heading' ? parseInt(line.subtype.replace('h', '')) : null,
    index: idx,
    confidence: line.confidence,
    frameworkMatch: line.frameworkMatch
  }));
  
  const sectionType = determineSectionTypeFromFramework(section);
  
  return {
    type: sectionType,
    elements: elements,
    hasBullets: section.bulletCount > 0,
    bulletCount: section.bulletCount,
    headingCount: section.headingCount,
    totalWords: section.totalWords,
    startIndex: section.startIndex,
    frameworkPattern: section.frameworkPattern,
    dominantFramework: section.dominantFramework
  };
};

export const determineSectionTypeFromFramework = (section) => {
  const framework = section.dominantFramework;
  const hasHighBullets = section.bulletCount >= 3;
  const firstLine = section.lines[0];
  
  if (section.startIndex === 0) return 'hero';
  
  if (framework === 'aida') {
    if (firstLine.frameworkIndicators?.aida?.attention > 0.5) return 'hero';
    if (firstLine.frameworkIndicators?.aida?.interest > 0.5) return 'features';
    if (firstLine.frameworkIndicators?.aida?.desire > 0.5) return 'benefits';
    if (firstLine.frameworkIndicators?.aida?.action > 0.5) return 'cta';
  }
  
  if (framework === 'pas') {
    if (firstLine.frameworkIndicators?.pas?.problem > 0.5) return 'problem';
    if (firstLine.frameworkIndicators?.pas?.agitation > 0.5) return 'problem';
    if (firstLine.frameworkIndicators?.pas?.solution > 0.5) return 'solution';
  }
  
  if (framework === 'landing_page') {
    if (firstLine.frameworkIndicators?.landingPage?.hero > 0.5) return 'hero';
    if (firstLine.frameworkIndicators?.landingPage?.features > 0.5) return 'features';
    if (firstLine.frameworkIndicators?.landingPage?.socialProof > 0.5) return 'testimonials';
    if (firstLine.frameworkIndicators?.landingPage?.cta > 0.5) return 'cta';
  }
  
  if (hasHighBullets) return 'features';
  
  return 'content';
};

export const convertToWireframeSections = (sections) => {
  return sections.map((section, index) => {
    let templateLayout = 'text_block';
    let templateName = 'Text Block';
    
    if (section.type === 'hero') {
      templateLayout = 'image_text_split';
      templateName = 'Hero - Image Split';
    } else if (section.type === 'problem') {
      templateLayout = 'centered_emphasis';
      templateName = 'Problem - Centered';
    } else if (section.type === 'solution') {
      templateLayout = 'callout_box';
      templateName = 'Solution - Callout';
    } else if (section.bulletCount >= 3) {
      templateLayout = 'bullet_list';
      templateName = 'Feature List';
    } else if (section.type === 'features' && section.bulletCount >= 1) {
      templateLayout = 'icon_grid';
      templateName = 'Features - Grid';
    } else if (section.type === 'cta') {
      templateLayout = 'centered_cta';
      templateName = 'CTA - Centered';
    } else if (section.type === 'testimonials') {
      templateLayout = 'social_proof';
      templateName = 'Social Proof';
    }
    
    return {
      id: `section-${index}`,
      type: section.type,
      templateName: templateName,
      templateKey: templateLayout.replace(/[_-]/g, '_'),
      elements: section.elements,
      wireframeLayout: {
        layout: templateLayout,
        hasImage: ['image_text_split', 'icon_grid', 'social_proof'].includes(templateLayout),
        imagePos: section.type === 'hero' ? 'left' : 'right'
      },
      template: {
        name: templateName,
        layout: templateLayout,
        description: `Research-based selection using ${section.frameworkPattern} framework patterns`
      },
      index: index,
      hasSemanticStructure: false,
      contentAnalysis: {
        bulletCount: section.bulletCount,
        headingCount: section.headingCount,
        totalWords: section.totalWords,
        frameworkPattern: section.frameworkPattern,
        dominantFramework: section.dominantFramework
      }
    };
  });
};

export const getClassificationStats = (classifiedLines) => {
  const stats = {
    total: classifiedLines.length,
    bullets: 0,
    headings: 0,
    paragraphs: 0,
    highConfidence: 0,
    frameworkMatches: {}
  };
  
  classifiedLines.forEach(line => {
    if (line.type === 'bullet') stats.bullets++;
    else if (line.type === 'heading') stats.headings++;
    else if (line.type === 'paragraph') stats.paragraphs++;
    
    if (line.confidence > 0.7) stats.highConfidence++;
    
    if (line.frameworkMatch) {
      stats.frameworkMatches[line.frameworkMatch] = (stats.frameworkMatches[line.frameworkMatch] || 0) + 1;
    }
  });
  
  return stats;
};