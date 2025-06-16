// Content Analysis Utilities
// Handles text splitting, section type detection, and content analysis

export const createEnhancedTextSections = (content) => {
  console.log('📝 Creating enhanced text sections with BULLET POINT AWARENESS');
  
  // STEP 1: Try multiple splitting approaches
  let contentParts = [];
  
  // Method 1: Split by double line breaks
  const paragraphSplit = content.split(/\n\s*\n/).filter(p => p.trim().length > 20);
  console.log(`📝 Method 1 (paragraphs): ${paragraphSplit.length} parts`);
  
  // Method 2: Smart single line split - group related short lines together  
  const smartSplit = smartSingleLineSplit(content);
  console.log(`📝 Method 2 (smart split): ${smartSplit.length} parts`);
  
  // Method 3: Force split by key phrases
  const forceSplit = forceSplitByKeyPhrases(content);
  console.log(`📝 Method 3 (force split): ${forceSplit.length} parts`);
  
  // NEW Method 4: Bullet-aware splitting
  const bulletSplit = bulletAwareSplit(content);
  console.log(`📝 Method 4 (bullet-aware): ${bulletSplit.length} parts`);
  
  // Use the method that gives us the most logical sections, preferring bullet-aware
  if (bulletSplit.length >= 4 && bulletSplit.length > forceSplit.length) {
    contentParts = bulletSplit;
    console.log(`📝 Using bullet-aware split (${bulletSplit.length} parts)`);
  } else if (forceSplit.length >= 4) {
    contentParts = forceSplit;
    console.log(`📝 Using force split (${forceSplit.length} parts)`);
  } else if (smartSplit.length > paragraphSplit.length) {
    contentParts = smartSplit;
    console.log(`📝 Using smart split (${smartSplit.length} parts)`);
  } else {
    contentParts = paragraphSplit;
    console.log(`📝 Using paragraph split (${paragraphSplit.length} parts)`);
  }
  
  // STEP 2: If we still have giant chunks, split them further
  contentParts = contentParts.flatMap(part => {
    if (part.length > 500) {
      console.log(`🔪 Splitting large chunk: ${part.substring(0, 50)}...`);
      return splitLargeChunk(part);
    }
    return [part];
  });
  
  console.log(`📊 Final: ${contentParts.length} content parts to process`);
  
  // STEP 3: Convert to sections with ENHANCED bullet detection
  return contentParts.map((part, idx) => {
    const lines = part.split('\n').filter(l => l.trim().length > 5);
    const elements = [];
    
    // ENHANCED: Detect if this part contains bullet points
    const bulletLines = lines.filter(line => /^[•\-\*]\s/.test(line.trim()) || /^\d+\.\s/.test(line.trim()));
    const hasBullets = bulletLines.length > 0;
    
    console.log(`📝 Processing part ${idx + 1}: ${hasBullets ? bulletLines.length + ' bullets detected' : 'no bullets'}`);
    
    if (hasBullets) {
      // Process as bullet list section
      let currentHeading = null;
      
      lines.forEach((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        const isBullet = /^[•\-\*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed);
        
        if (isBullet) {
          // Extract bullet content
          const bulletContent = trimmed.replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '');
          elements.push({
            type: 'list_item',
            tag: 'li',
            content: bulletContent,
            index: elements.length
          });
          console.log(`   ✅ Added bullet: "${bulletContent.substring(0, 40)}..."`);
        } else {
          // This might be a heading or paragraph before the bullets
          let elementType = 'paragraph';
          let tag = 'p';
          
          if (lineIdx === 0 || (trimmed.length < 100 && !currentHeading)) {
            elementType = 'heading';
            tag = detectHeadingLevel(trimmed);
            currentHeading = trimmed;
          }
          
          elements.push({
            type: elementType,
            tag: tag,
            content: trimmed,
            index: elements.length,
            level: tag.match(/^h([1-6])$/) ? parseInt(tag[1]) : null
          });
          console.log(`   ✅ Added ${elementType}: "${trimmed.substring(0, 40)}..."`);
        }
      });
    } else {
      // Process as regular content (existing logic)
      lines.forEach((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        let elementType = 'paragraph';
        let tag = 'p';
        
        // Detect headings
        if (lineIdx === 0 && (trimmed.length < 100 || isHeadingLike(trimmed))) {
          elementType = 'heading';
          tag = detectHeadingLevel(trimmed);
        }
        
        elements.push({
          type: elementType,
          tag: tag,
          content: trimmed,
          index: lineIdx,
          level: tag.match(/^h([1-6])$/) ? parseInt(tag[1]) : null
        });
      });
    }
    
    const sectionType = getEnhancedSectionType(part, idx);
    console.log(`📝 Section ${idx + 1}: ${sectionType} (${elements.length} elements, ${bulletLines.length} bullets)`);
    
    return {
      type: sectionType,
      elements: elements,
      hasBullets: hasBullets,
      bulletCount: bulletLines.length
    };
  }).filter(section => section.elements.length > 0);
};

export const smartSingleLineSplit = (content) => {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 5);
  const parts = [];
  let currentPart = '';
  
  lines.forEach((line, index) => {
    // Check if this line should start a new part
    const shouldStartNew = (
      // Long lines always start new parts
      line.length > 200 ||
      // Lines that look like headers
      (line.length < 80 && !line.includes('.') && index > 0) ||
      // Key transition phrases
      /^(You're not|You don't|Hi\.|After|Proven|Drawing|You've Outgrown)/i.test(line) ||
      // Lines with bullet points
      /^[-•*]\s/.test(line)
    );
    
    if (shouldStartNew && currentPart.trim()) {
      parts.push(currentPart.trim());
      currentPart = line;
    } else {
      currentPart += (currentPart ? '\n' : '') + line;
    }
  });
  
  if (currentPart.trim()) {
    parts.push(currentPart.trim());
  }
  
  return parts;
};

// NEW: Bullet-aware content splitting
export const bulletAwareSplit = (content) => {
  console.log('🎯 BULLET-AWARE SPLITTING');
  
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 5);
  const parts = [];
  let currentPart = '';
  let inBulletSection = false;
  
  lines.forEach((line, index) => {
    const isBullet = /^[•\-\*]\s/.test(line) || /^\d+\.\s/.test(line);
    const isHeading = line.length < 100 && !line.includes('.') && !isBullet;
    const isTransition = /^(You're not|You don't|Hi\.|After|Proven|Drawing|You've Outgrown)/i.test(line);
    
    // Decide if we should start a new part
    const shouldStartNew = (
      // Major transitions always start new parts
      isTransition ||
      // Headings start new parts (unless we're in a bullet section)
      (isHeading && !inBulletSection && currentPart.trim()) ||
      // Starting bullets after non-bullet content
      (isBullet && !inBulletSection && currentPart.trim()) ||
      // Long content after bullets
      (line.length > 150 && inBulletSection) ||
      // Current part is getting very long
      (currentPart.length > 800)
    );
    
    if (shouldStartNew && currentPart.trim()) {
      parts.push(currentPart.trim());
      currentPart = line;
      inBulletSection = isBullet;
      console.log(`   🔄 New part started: "${line.substring(0, 30)}..." (bullet section: ${inBulletSection})`);
    } else {
      currentPart += (currentPart ? '\n' : '') + line;
      if (isBullet) inBulletSection = true;
    }
  });
  
  if (currentPart.trim()) {
    parts.push(currentPart.trim());
  }
  
  // Log bullet statistics
  parts.forEach((part, idx) => {
    const bulletCount = (part.match(/^[•\-\*]/gm) || []).length;
    console.log(`   Part ${idx + 1}: ${bulletCount} bullets, ${part.length} chars`);
  });
  
  return parts;
};

export const forceSplitByKeyPhrases = (content) => {
  const splitPatterns = [
    /(?=You're not leading)/i,
    /(?=You don't need)/i,
    /(?=Hi\. I'm)/i,
    /(?=After \d+ decades?)/i,
    /(?=Proven Results)/i,
    /(?=Drawing from experience)/i,
    /(?=You've Outgrown)/i
  ];
  
  let parts = [content];
  
  splitPatterns.forEach(pattern => {
    const newParts = [];
    parts.forEach(part => {
      const splits = part.split(pattern).filter(p => p.trim().length > 10);
      newParts.push(...splits);
    });
    if (newParts.length > parts.length) {
      parts = newParts;
    }
  });
  
  console.log(`🔪 Force split created ${parts.length} parts`);
  return parts;
};

export const splitLargeChunk = (chunk) => {
  const parts = [];
  
  // Try splitting by sentences first
  const sentences = chunk.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  if (sentences.length > 1) {
    // Group 2-3 sentences together
    for (let i = 0; i < sentences.length; i += 2) {
      const group = sentences.slice(i, i + 2).join('. ').trim();
      if (group) parts.push(group);
    }
  } else {
    // Split by line breaks as fallback
    const lines = chunk.split('\n').filter(l => l.trim().length > 10);
    parts.push(...lines);
  }
  
  return parts.length > 0 ? parts : [chunk];
};

export const forceContentSplit = (content) => {
  console.log('🔨 FORCE SPLITTING CONTENT');
  
  // Split by strong content indicators
  const splitPatterns = [
    /(?=You're not leading)/i,
    /(?=You don't need)/i,
    /(?=Hi\. I'm)/i,
    /(?=After \d+ decades?)/i,
    /(?=Proven Results)/i,
    /(?=Drawing from experience)/i,
    /(?=You've Outgrown)/i
  ];
  
  let contentParts = [content];
  
  // Apply each split pattern
  splitPatterns.forEach((pattern, idx) => {
    const newParts = [];
    contentParts.forEach(part => {
      const splits = part.split(pattern).filter(p => p.trim().length > 20);
      if (splits.length > 1) {
        // Re-add the split marker to subsequent parts (except the first)
        splits.forEach((split, splitIdx) => {
          if (splitIdx > 0) {
            // Extract the marker from the pattern and add it back
            const markers = [
              "You're not leading",
              "You don't need", 
              "Hi. I'm",
              "After three decades",
              "Proven Results",
              "Drawing from experience", 
              "You've Outgrown"
            ];
            split = markers[idx] + ' ' + split;
          }
          newParts.push(split);
        });
      } else {
        newParts.push(part);
      }
    });
    if (newParts.length > contentParts.length) {
      contentParts = newParts;
      console.log(`   Split ${idx + 1} created ${newParts.length} parts`);
    }
  });
  
  console.log(`🔨 Force split created ${contentParts.length} parts`);
  
  // Convert content parts to sections
  return contentParts.map((part, idx) => {
    const lines = part.split('\n').filter(l => l.trim().length > 5);
    const elements = [];
    
    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      // Create pseudo-elements
      let elementType = 'paragraph';
      let tag = 'p';
      
      // First line of each part might be a heading
      if (lineIdx === 0 && trimmed.length < 100) {
        elementType = 'heading';
        tag = 'h2';
      } else if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        elementType = 'list_item';
        tag = 'li';
      }
      
      elements.push({
        type: elementType,
        tag: tag,
        content: trimmed.replace(/^[•-]\s*/, ''),
        index: lineIdx
      });
    });
    
    // Determine section type from content
    const sectionType = getSectionTypeFromContent(part, idx);
    
    return {
      type: sectionType,
      elements: elements
    };
  }).filter(section => section.elements.length > 0);
};

// Section type detection functions
export const determineSectionFromSemanticElement = (element, index, totalElements) => {
  const content = element.content.toLowerCase();
  
  // Hero: First few elements, especially if they contain intro language
  if (index < 3) {
    if (content.includes('about') || content.includes('turn conflict') || 
        element.type === 'heading' && element.level <= 2) {
      return 'hero';
    }
  }
  
  // Problem: Contains problem language
  if (content.includes("you're not") || content.includes("you don't") || 
      content.includes("complex maze") || content.includes("same tensions")) {
    return 'problem';
  }
  
  // Solution: Contains solution language  
  if (content.includes("you need") || content.includes("you don't need")) {
    return 'solution';
  }
  
  // About: Personal introduction
  if (content.includes("hi.") || content.includes("i'm ") || 
      content.includes("after") && content.includes("decades")) {
    return 'about';
  }
  
  // Features: Results, lists, achievements
  if (content.includes("proven results") || content.includes("drawing from") ||
      element.type === 'list_container' || element.type === 'list_item') {
    return 'features';
  }
  
  // CTA: Call to action language
  if (content.includes("outgrown") || content.includes("transform") || 
      content.includes("ready to rewire")) {
    return 'cta';
  }
  
  return 'content';
};

export const shouldStartNewSection = (element, currentSection, elementIndex) => {
  if (!currentSection) return true;
  
  // Always start new section on major headers (h1, h2)
  if (element.type === 'heading' && element.level <= 2) {
    console.log(`   🔄 New section: Major heading (${element.tag})`);
    return true;
  }
  
  // Start new section if current section gets too long (more than 4 elements for tighter sections)
  if (currentSection.elements.length >= 4) {
    console.log(`   🔄 New section: Too many elements (${currentSection.elements.length})`);
    return true;
  }
  
  // Start new section on specific content transitions
  const content = element.content.toLowerCase();
  
  // Strong transition indicators that should ALWAYS start new sections
  const strongTransitions = [
    "you're not leading",
    "you don't need", 
    "hi. i'm",
    "proven results",
    "drawing from experience",
    "you've outgrown"
  ];
  
  if (strongTransitions.some(transition => content.includes(transition))) {
    console.log(`   🔄 New section: Strong transition detected`);
    return true;
  }
  
  // Also check for paragraph breaks that indicate section changes
  if (element.type === 'paragraph' && element.content.length > 100) {
    // Check if this paragraph has very different content from the current section
    const currentContent = currentSection.elements.map(e => e.content.toLowerCase()).join(' ');
    
    // Different topic indicators
    if ((content.includes('after') && content.includes('decades')) ||
        (content.includes('complex') && content.includes('systems')) ||
        (content.includes('never set out'))) {
      console.log(`   🔄 New section: Topic change detected`);
      return true;
    }
  }
  
  return false; // Continue current section
};

export const shouldForceNewSectionBasedOnContent = (element, currentSection, elementIndex) => {
  if (!currentSection) return false;
  
  const content = element.content.toLowerCase();
  
  // Strong section break indicators
  const sectionBreakers = [
    "you're not leading",
    "you don't need",
    "hi. i'm",
    "proven results",
    "drawing from experience",
    "you've outgrown"
  ];
  
  // Check if this element contains strong section break language
  const hasBreaker = sectionBreakers.some(breaker => content.includes(breaker));
  
  if (hasBreaker) {
    console.log(`   🔥 FORCE NEW SECTION: Found section breaker "${content.substring(0, 50)}..."`);
    return true;
  }
  
  // Force new section if we have a major heading after some content
  if (element.type === 'heading' && element.level <= 2 && currentSection.elements.length > 0) {
    console.log(`   🔥 FORCE NEW SECTION: Major heading after content`);
    return true;
  }
  
  return false;
};

export const mergeTinySections = (sections) => {
  const merged = [];
  
  for (let i = 0; i < sections.length; i++) {
    const current = sections[i];
    const next = sections[i + 1];
    
    // If current section is tiny (1 element) and next section is same type, merge them
    if (current.elements.length === 1 && next && next.type === current.type) {
      console.log(`🔗 Merging tiny ${current.type} section with next ${next.type} section`);
      current.elements.push(...next.elements);
      i++; // Skip the next section since we merged it
    }
    
    merged.push(current);
  }
  
  return merged;
};

// Helper functions for better element detection
export const isHeadingLike = (text) => {
  return (
    text.length < 80 || 
    !text.includes('.') || 
    /^(About|Proven|Drawing|You've|Hi\.|Turn)/i.test(text)
  );
};

export const detectHeadingLevel = (text) => {
  if (text.includes('About') || text.length < 30) return 'h1';
  if (text.includes('Proven') || text.includes('Drawing')) return 'h2';
  return 'h3';
};

export const getEnhancedSectionType = (content, index) => {
  const lower = content.toLowerCase();
  
  console.log(`🔍 Enhanced section analysis: "${content.substring(0, 40)}..."`);
  
  // Very specific content matching
  if (lower.includes('about amy') || (index === 0 && lower.includes('turn conflict'))) {
    console.log(`   → HERO`);
    return 'hero';
  }
  if (lower.includes("you're not leading") || lower.includes("complex maze") || lower.includes("you've tried") || lower.includes("limited budgets")) {
    console.log(`   → PROBLEM`);
    return 'problem';
  }
  if (lower.includes("you don't need") || lower.includes("surface-level fix")) {
    console.log(`   → SOLUTION`);
    return 'solution';
  }
  if (lower.includes("hi. i'm") || lower.includes("after three decades") || lower.includes("never set out")) {
    console.log(`   → ABOUT`);
    return 'about';
  }
  if (lower.includes("proven results") || content.includes('•') || lower.includes("drawing from")) {
    console.log(`   → FEATURES`);
    return 'features';
  }
  if (lower.includes("you've outgrown") || lower.includes("time to transform")) {
    console.log(`   → CTA`);
    return 'cta';
  }
  
  // Fallback based on position and content
  if (index === 0) {
    console.log(`   → HERO (position fallback)`);
    return 'hero';
  }
  
  console.log(`   → CONTENT (default)`);
  return 'content';
};

export const getSectionTypeFromContent = (content, index) => {
  const lower = content.toLowerCase();
  
  // Very specific content matching
  if (lower.includes('about amy') || (index === 0 && lower.includes('turn conflict'))) {
    return 'hero';
  }
  if (lower.includes("you're not leading") || lower.includes("complex maze")) {
    return 'problem';
  }
  if (lower.includes("you don't need") || lower.includes("surface-level fix")) {
    return 'solution';
  }
  if (lower.includes("hi. i'm") || lower.includes("after three decades")) {
    return 'about';
  }
  if (lower.includes("proven results") || content.includes('•')) {
    return 'features';
  }
  if (lower.includes("you've outgrown") || lower.includes("time to transform")) {
    return 'cta';
  }
  
  // Fallback based on position
  if (index === 0) return 'hero';
  return 'content';
};