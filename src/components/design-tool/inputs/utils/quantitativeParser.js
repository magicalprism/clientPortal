// Research-Based Universal Content Parser
// Uses patterns from AIDA, PAS, landing page research, and web content analysis

export const parseContentQuantitatively = (content, htmlStructure = null) => {
  console.log('🔬 RESEARCH-BASED CONTENT PARSING - Universal Patterns');
  
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
    hasSemanticStructure: !!htmlStructure,
    stats: {
      totalLines: atomicLines.length,
      bulletLines: classifiedLines.filter(l => l.type === 'bullet').length,
      headingLines: classifiedLines.filter(l => l.type === 'heading').length,
      paragraphLines: classifiedLines.filter(l => l.type === 'paragraph').length,
      frameworkPatterns: sections.map(s => s.frameworkPattern).join(', ')
    }
  };
};

// STEP 1: Normalize content
export const normalizeContent = (content) => {
  return content
    .replace(/\r\n/g, '\n')  // Normalize line breaks
    .replace(/\r/g, '\n')    // Handle old Mac line breaks
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple line breaks
    .trim();
};

// STEP 2: Create atomic lines with comprehensive metadata
export const createAtomicLines = (content) => {
  const lines = content.split('\n');
  
  return lines.map((line, index) => {
    const trimmed = line.trim();
    
    return {
      index: index,
      originalText: line,
      text: trimmed,
      length: trimmed.length,
      isEmpty: trimmed.length === 0,
      // Quantitative metrics
      wordCount: trimmed.split(/\s+/).filter(w => w.length > 0).length,
      hasEndPunctuation: /[.!?]$/.test(trimmed),
      startsWithCapital: /^[A-Z]/.test(trimmed),
      // Research-based bullet detection
      bulletPatterns: analyzeBulletPatterns(trimmed),
      // Research-based heading indicators
      headingIndicators: analyzeHeadingIndicators(trimmed, index),
      // Calculate confidence separately to avoid circular dependency
      headingConfidence: calculateHeadingConfidence(trimmed, index),
      // Copywriting framework indicators
      frameworkIndicators: analyzeFrameworkIndicators(trimmed),
      // Web content patterns
      webPatterns: analyzeWebPatterns(trimmed)
    };
  }).filter(line => !line.isEmpty);
};

// Research-based bullet pattern detection
export const analyzeBulletPatterns = (text) => {
  return {
    bullet: /^[•\-\*]\s/.test(text),
    numbered: /^\d+\.\s/.test(text),
    hyphen: /^\-\s/.test(text),
    asterisk: /^\*\s/.test(text),
    // Research: Common web bullet variations
    arrow: /^[→➤►]\s/.test(text),
    check: /^[✓✔]\s/.test(text),
    // Confidence score based on multiple indicators
    confidence: calculateBulletConfidence(text)
  };
};

export const calculateBulletConfidence = (text) => {
  let score = 0;
  
  // Standard bullet patterns
  if (/^[•\-\*]\s/.test(text)) score += 0.9;
  if (/^\d+\.\s/.test(text)) score += 0.9;
  if (/^[→➤►✓✔]\s/.test(text)) score += 0.8;
  
  // Contextual indicators
  if (text.length > 20 && text.length < 200) score += 0.1; // Typical list item length
  if (!text.includes('.') || text.endsWith('.')) score += 0.1; // List items often don't have internal periods
  
  return Math.min(1, score);
};

// Research-based heading detection (from PDF analysis papers)
export const analyzeHeadingIndicators = (text, index) => {
  return {
    // Length-based indicators (research shows headings are typically <80 chars)
    lengthScore: calculateLengthScore(text),
    // Position-based scoring (early elements more likely to be headings)
    positionScore: calculatePositionScore(index),
    // Typography indicators
    hasColon: text.endsWith(':'),
    isShort: text.length < 80,
    hasNoInternalPunctuation: !/[.!?]/.test(text.slice(0, -1)),
    // Semantic indicators
    semanticScore: calculateSemanticHeadingScore(text)
    // Note: confidence calculated separately to avoid circular dependency
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
  
  // Research-based heading patterns from web content analysis
  const headingPatterns = [
    // Generic section starters
    /^(About|Services|Products|Features|Benefits|How|Why|What|Get|Start)/i,
    // Problem-solution patterns (PAS framework)
    /^(Problem|Solution|Challenge|Issue|Trouble|Struggle)/i,
    // AIDA patterns
    /^(Attention|Interest|Desire|Action|Discover|Learn|Find)/i,
    // Landing page patterns
    /^(Hero|Welcome|Introduction|Overview|Summary)/i,
    // Social proof patterns
    /^(Testimonials|Reviews|Results|Success|Proven|Trusted)/i,
    // CTA patterns
    /^(Contact|Subscribe|Download|Buy|Get|Start|Join|Sign)/i
  ];
  
  headingPatterns.forEach(pattern => {
    if (pattern.test(text)) score += 0.2;
  });
  
  // Colon indicates list/section heading
  if (text.endsWith(':')) score += 0.3;
  
  return Math.min(1, score);
};

export const calculateHeadingConfidence = (text, index) => {
  // Calculate indicators directly to avoid circular dependency
  const lengthScore = calculateLengthScore(text);
  const positionScore = calculatePositionScore(index);
  const semanticScore = calculateSemanticHeadingScore(text);
  const hasColon = text.endsWith(':');
  const hasNoInternalPunctuation = !/[.!?]/.test(text.slice(0, -1));
  
  let confidence = 0;
  confidence += lengthScore;
  confidence += positionScore;
  confidence += semanticScore;
  
  if (hasColon) confidence += 0.3;
  if (hasNoInternalPunctuation) confidence += 0.2;
  
  return Math.max(0, Math.min(1, confidence));
};

// Research-based copywriting framework detection
export const analyzeFrameworkIndicators = (text) => {
  const lower = text.toLowerCase();
  
  return {
    // AIDA Framework indicators
    aida: {
      attention: testAttentionPatterns(lower),
      interest: testInterestPatterns(lower),
      desire: testDesirePatterns(lower),
      action: testActionPatterns(lower)
    },
    // PAS Framework indicators  
    pas: {
      problem: testProblemPatterns(lower),
      agitation: testAgitationPatterns(lower),
      solution: testSolutionPatterns(lower)
    },
    // Landing page patterns
    landingPage: {
      hero: testHeroPatterns(lower),
      features: testFeaturePatterns(lower),
      socialProof: testSocialProofPatterns(lower),
      cta: testCTAPatterns(lower)
    }
  };
};

// AIDA Pattern Detection (from research)
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

// Landing Page Pattern Detection (from research)
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
    // F-pattern indicators (research shows most important content on left)
    isLeftAligned: true, // Assume left-aligned text
    // Above-the-fold indicators
    likelyAboveFold: text.length < 100 && /^(welcome|hero|main|primary)/.test(text.toLowerCase()),
    // Scannable content indicators
    isScannableLenght: text.length > 20 && text.length < 150,
    // CTA indicators
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
  const { text, bulletPatterns, headingIndicators, headingConfidence, frameworkIndicators } = line;
  
  // 1. BULLET POINTS (highest confidence from research)
  if (bulletPatterns.confidence > 0.7) {
    return {
      type: 'bullet',
      confidence: bulletPatterns.confidence,
      subtype: bulletPatterns.numbered ? 'numbered' : 'bulleted',
      frameworkMatch: 'features'
    };
  }
  
  // 2. HEADINGS (based on research indicators)
  if (headingConfidence > 0.6) {
    let level = 2; // default
    if (index === 0 || headingConfidence > 0.8) level = 1;
    if (headingIndicators.isShort && headingIndicators.hasColon) level = 3;
    
    return {
      type: 'heading',
      confidence: headingConfidence,
      subtype: `h${level}`,
      frameworkMatch: detectFrameworkFromIndicators(frameworkIndicators)
    };
  }
  
  // 3. PARAGRAPHS (everything else)
  return {
    type: 'paragraph',
    confidence: 0.8,
    subtype: 'body',
    frameworkMatch: detectFrameworkFromIndicators(frameworkIndicators)
  };
};

export const detectFrameworkFromIndicators = (indicators) => {
  // Check AIDA patterns
  const aidaScore = Object.values(indicators.aida).reduce((sum, val) => sum + val, 0);
  
  // Check PAS patterns
  const pasScore = Object.values(indicators.pas).reduce((sum, val) => sum + val, 0);
  
  // Check landing page patterns
  const landingScore = Object.values(indicators.landingPage).reduce((sum, val) => sum + val, 0);
  
  if (aidaScore > pasScore && aidaScore > landingScore) return 'aida';
  if (pasScore > landingScore) return 'pas';
  if (landingScore > 0.5) return 'landing_page';
  
  return 'generic';
};

export const calculateUniversalSectionBreakScore = (line, index, allLines) => {
  let score = 0;
  
  // Research-based section break indicators
  if (line.headingConfidence > 0.7) score += 0.6;
  if (index === 0) score += 0.3;
  if (line.frameworkIndicators.aida.attention > 0.5) score += 0.4;
  if (line.frameworkIndicators.pas.problem > 0.5) score += 0.4;
  if (line.frameworkIndicators.landingPage.hero > 0.5) score += 0.4;
  
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
      // Save current section
      if (currentSection && currentSection.lines.length > 0) {
        sections.push(finalizeUniversalSection(currentSection));
      }
      
      // Start new section
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
      // Add to current section
      if (currentSection) {
        currentSection.lines.push(line);
        if (line.type === 'bullet') currentSection.bulletCount++;
        if (line.type === 'heading') currentSection.headingCount++;
        currentSection.totalWords += line.wordCount;
      }
    }
  });
  
  // Don't forget the last section
  if (currentSection && currentSection.lines.length > 0) {
    sections.push(finalizeUniversalSection(currentSection));
  }
  
  return sections;
};

export const shouldStartNewSectionUniversal = (line, currentSection, index) => {
  if (!currentSection) return true;
  
  // Research-based section break rules
  
  // 1. High section break score
  if (line.sectionBreakScore > 0.5) {
    console.log(`   🔬 Section break: High score (${line.sectionBreakScore})`);
    return true;
  }
  
  // 2. Word count threshold (research shows 300-500 words per section optimal)
  if (currentSection.totalWords > 350) {
    console.log(`   🔬 Section break: Word limit (${currentSection.totalWords} words)`);
    return true;
  }
  
  // 3. Framework pattern change
  if (line.frameworkMatch !== currentSection.dominantFramework && 
      line.confidence > 0.7 && currentSection.lines.length > 1) {
    console.log(`   🔬 Section break: Framework change (${currentSection.dominantFramework} → ${line.frameworkMatch})`);
    return true;
  }
  
  // 4. Too many elements (usability research)
  if (currentSection.lines.length > 6) {
    console.log(`   🔬 Section break: Too many elements (${currentSection.lines.length})`);
    return true;
  }
  
  return false;
};

export const finalizeUniversalSection = (section) => {
  // Convert lines to elements
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
  
  // Determine section type from framework patterns
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
  
  // Framework-based section type determination
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
    // Research-based template selection
    let templateLayout = 'text_block';
    let templateName = 'Text Block';
    
    // Framework-informed template selection
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
    
    // Count framework matches
    if (line.frameworkMatch) {
      stats.frameworkMatches[line.frameworkMatch] = (stats.frameworkMatches[line.frameworkMatch] || 0) + 1;
    }
  });
  
  return stats;
};