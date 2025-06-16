// HTML Parser Utilities
// Handles parsing Google Docs HTML and other rich text content into semantic structures

export const parseHTMLToSemanticStructure = (html) => {
  console.log('🔍 SMART GOOGLE DOCS HTML PARSING - COMBINES RELATED ELEMENTS');
  console.log('📄 HTML input length:', html.length);
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  const structure = {
    plainText: '',
    elements: []
  };

  // STEP 1: Get all text content first
  const allText = tempDiv.textContent || tempDiv.innerText || '';
  structure.plainText = allText;
  
  console.log('📄 Extracted text length:', allText.length);

  // STEP 2: Find ALL elements that contain substantial text content
  const allElements = Array.from(tempDiv.querySelectorAll('*'));
  console.log('📄 Total HTML elements found:', allElements.length);
  
  // Filter to elements that have meaningful text
  const textElements = allElements.filter(el => {
    const text = el.textContent?.trim() || '';
    const directText = getDirectTextContent(el);
    
    return (
      text.length > 10 && // Has substantial text
      directText.length > 5 && // Has direct text (not just from children)
      !hasSignificantChildren(el) // Not just a container
    );
  });
  
  console.log('📄 Elements with meaningful text:', textElements.length);
  
  // STEP 3: SMART GROUPING - Combine related elements into logical blocks
  const logicalBlocks = groupRelatedElements(textElements);
  console.log('📄 Grouped into logical blocks:', logicalBlocks.length);
  
  // STEP 4: Convert logical blocks to semantic elements
  let elementIndex = 0;
  
  logicalBlocks.forEach((block, idx) => {
    console.log(`📄 Processing block ${idx}: "${block.combinedText.substring(0, 60)}..."`);
    
    const analysis = analyzeLogicalBlock(block, idx);
    
    if (analysis.isValid) {
      // ENHANCED: Handle blocks with extracted bullets (multiple sub-elements)
      if (block.hasExtractedBullets && block.elements.length > 1) {
        console.log(`   🎯 Processing extracted bullet block with ${block.elements.length} sub-elements`);
        
        // Add each extracted element separately
        block.elements.forEach((extractedElement, subIdx) => {
          structure.elements.push({
            type: extractedElement.type,
            tag: extractedElement.tag,
            content: extractedElement.content,
            level: extractedElement.level || (extractedElement.type === 'heading' ? 2 : null),
            index: elementIndex++,
            fromBulletExtraction: true
          });
          
          console.log(`   ✅ Added extracted ${extractedElement.tag} (${extractedElement.type}): "${extractedElement.content.substring(0, 40)}..."`);
        });
      } else {
        // Regular single element
        structure.elements.push({
          type: analysis.type,
          tag: analysis.tag,
          content: block.combinedText,
          level: analysis.level,
          index: elementIndex++
        });
        
        console.log(`   ✅ Added ${analysis.tag} (${analysis.type}): "${block.combinedText.substring(0, 40)}..."`);
      }
    }
  });
  
  // STEP 5: If we still don't have enough elements, supplement with text parsing
  if (structure.elements.length < 3) {
    console.log('⚠️ HTML parsing yielded few elements, supplementing with text parsing...');
    const textBasedElements = parseTextIntoElements(allText);
    
    textBasedElements.forEach(textElement => {
      const isDuplicate = structure.elements.some(existing => 
        existing.content.toLowerCase().includes(textElement.content.toLowerCase().substring(0, 30))
      );
      
      if (!isDuplicate) {
        structure.elements.push({
          ...textElement,
          index: elementIndex++
        });
      }
    });
  }
  
  console.log('📊 FINAL PARSED STRUCTURE:', {
    totalElements: structure.elements.length,
    headings: structure.elements.filter(e => e.type === 'heading').length,
    paragraphs: structure.elements.filter(e => e.type === 'paragraph').length,
    lists: structure.elements.filter(e => e.type === 'list_item').length,
    plainTextLength: structure.plainText.length
  });
  
  // Show first 10 elements
  structure.elements.slice(0, 10).forEach((elem, idx) => {
    console.log(`   ${idx + 1}. ${elem.tag} (${elem.type}): "${elem.content.substring(0, 60)}..."`);
  });
  
  return structure;
};

export const groupRelatedElements = (elements) => {
  const blocks = [];
  let currentBlock = null;
  
  console.log(`📄 Starting with ${elements.length} elements, grouping with BULLET DETECTION...`);
  
  elements.forEach((element, idx) => {
    const text = element.textContent?.trim() || '';
    const analysis = analyzeElement(element, text, idx);
    
    console.log(`   Element ${idx}: ${analysis.type} "${text.substring(0, 40)}..."`);
    
    // ENHANCED: Better bullet point detection before grouping
    const hasBulletPoints = detectBulletPointsInText(text);
    const isDefinitiveBreak = isDefinitiveSectionBreak(text, idx, elements);
    
    // More intelligent grouping - preserve bullet structure
    const shouldStartNewBlock = 
      !currentBlock ||
      isDefinitiveBreak ||
      // IMPORTANT: Break on bullet point sections to preserve list structure
      (hasBulletPoints && currentBlock.combinedText.length > 100) ||
      // Break if current block is very long
      (currentBlock.combinedText.length > 800) ||
      // Break on heading elements
      (analysis.type === 'heading' && currentBlock.elements.length > 0);
    
    if (shouldStartNewBlock) {
      // Save previous block if it has substantial content
      if (currentBlock && currentBlock.combinedText.trim().length > 50) {
        // ENHANCED: Process block for bullet points before saving
        const processedBlock = extractBulletPointsFromBlock(currentBlock);
        blocks.push(processedBlock);
        console.log(`   💾 Saved block: "${processedBlock.combinedText.substring(0, 60)}..."`);
      }
      
      // Start new block
      currentBlock = {
        type: analysis.type,
        elements: [element],
        combinedText: text,
        startIndex: idx,
        hasExplicitHeadline: analysis.type === 'heading',
        hasBulletPoints: hasBulletPoints
      };
      console.log(`   🆕 Started new block at ${idx}${hasBulletPoints ? ' (contains bullets)' : ''}`);
    } else {
      // Add to current block - but be more careful with bullet content
      if (currentBlock) {
        currentBlock.elements.push(element);
        
        // ENHANCED: Better text combination that preserves bullet structure
        const currentText = currentBlock.combinedText;
        let separator = ' ';
        
        // If this text has bullets, use line breaks to preserve them
        if (hasBulletPoints || text.startsWith('•') || text.startsWith('-')) {
          separator = '\n';
          currentBlock.hasBulletPoints = true;
        } else {
          const needsSpace = !currentText.match(/[.!?]\s*$/) && !text.match(/^[A-Z]/);
          separator = needsSpace ? ' ' : ' ';
        }
        
        currentBlock.combinedText += separator + text;
        console.log(`   ➕ Added to current block (now ${currentBlock.combinedText.length} chars)${hasBulletPoints ? ' [bullets detected]' : ''}`);
      }
    }
  });
  
  // Don't forget the last block
  if (currentBlock && currentBlock.combinedText.trim().length > 50) {
    const processedBlock = extractBulletPointsFromBlock(currentBlock);
    blocks.push(processedBlock);
  }
  
  console.log(`📄 Created ${blocks.length} substantial blocks from ${elements.length} elements`);
  
  // Log the blocks to verify bullet preservation
  blocks.forEach((block, idx) => {
    const bulletCount = (block.combinedText.match(/^•/gm) || []).length;
    console.log(`   Block ${idx + 1} (${block.combinedText.length} chars, ${bulletCount} bullets): "${block.combinedText.substring(0, 80)}..."`);
  });
  
  return blocks;
};

// NEW: Detect bullet points in text content
export const detectBulletPointsInText = (text) => {
  // Check for various bullet patterns
  const bulletPatterns = [
    /^•\s+/m,           // Bullet symbol at start of line
    /^\-\s+/m,          // Dash at start of line  
    /^\*\s+/m,          // Asterisk at start of line
    /^\d+\.\s+/m,       // Numbered list
    /\n•\s+/g,          // Bullet symbol after line break
    /\n\-\s+/g,         // Dash after line break
    /\n\*\s+/g,         // Asterisk after line break
    /\n\d+\.\s+/g       // Numbered after line break
  ];
  
  const hasBullets = bulletPatterns.some(pattern => pattern.test(text));
  
  if (hasBullets) {
    const bulletCount = (text.match(/\n•|\n\-|\n\*|\n\d+\./g) || []).length;
    console.log(`   🎯 BULLETS DETECTED: ${bulletCount} bullet points in "${text.substring(0, 50)}..."`);
  }
  
  return hasBullets;
};

// NEW: Extract bullet points from a block and convert to separate elements
export const extractBulletPointsFromBlock = (block) => {
  const text = block.combinedText;
  
  // Check if this block contains bullet points
  if (!block.hasBulletPoints && !detectBulletPointsInText(text)) {
    return block; // No bullets, return as-is
  }
  
  console.log(`🔫 EXTRACTING BULLETS from block: "${text.substring(0, 60)}..."`);
  
  // Split text by bullet patterns while preserving the bullets
  const bulletRegex = /(?=^•\s|^\-\s|^\*\s|^\d+\.\s|\n•\s|\n\-\s|\n\*\s|\n\d+\.\s)/gm;
  const parts = text.split(bulletRegex).filter(part => part.trim().length > 5);
  
  console.log(`   Split into ${parts.length} parts`);
  
  const extractedElements = [];
  let hasExtractedBullets = false;
  
  parts.forEach((part, idx) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    
    // Check if this part is a bullet point
    const isBulletPoint = /^(•|\-|\*|\d+\.)\s/.test(trimmed);
    
    if (isBulletPoint) {
      // Extract the bullet content (remove the bullet symbol)
      const bulletContent = trimmed.replace(/^(•|\-|\*|\d+\.)\s*/, '').trim();
      
      if (bulletContent.length > 10) {
        extractedElements.push({
          type: 'list_item',
          tag: 'li',
          content: bulletContent,
          index: extractedElements.length,
          extracted: true
        });
        hasExtractedBullets = true;
        console.log(`   ✅ Extracted bullet: "${bulletContent.substring(0, 50)}..."`);
      }
    } else {
      // This is regular content (might be a heading or paragraph)
      let elementType = 'paragraph';
      let tag = 'p';
      
      // If it's the first part and relatively short, might be a heading
      if (idx === 0 && (trimmed.length < 100 || isHeadingLike(trimmed))) {
        elementType = 'heading';
        tag = detectHeadingLevel(trimmed);
      }
      
      extractedElements.push({
        type: elementType,
        tag: tag,
        content: trimmed,
        index: extractedElements.length,
        extracted: true
      });
      console.log(`   ✅ Extracted ${elementType}: "${trimmed.substring(0, 50)}..."`);
    }
  });
  
  // If we successfully extracted bullets, return new structure
  if (hasExtractedBullets && extractedElements.length > 1) {
    console.log(`   🎯 Successfully extracted ${extractedElements.filter(e => e.type === 'list_item').length} bullets`);
    
    return {
      ...block,
      elements: extractedElements,
      combinedText: text,
      hasExtractedBullets: true,
      bulletCount: extractedElements.filter(e => e.type === 'list_item').length
    };
  }
  
  // Fallback to original block
  return block;
};

// Helper: Detect if text looks like a heading
const isHeadingLike = (text) => {
  return (
    text.length < 80 || 
    !text.includes('.') || 
    /^(About|Proven|Drawing|You've|Hi\.|Turn|Organizational|Strategic|Leadership|Policy|National)/i.test(text)
  );
};

// Helper: Detect appropriate heading level
const detectHeadingLevel = (text) => {
  if (text.includes('About') || text.length < 30) return 'h1';
  if (text.includes('Proven') || text.includes('Drawing') || text.includes('Organizational')) return 'h2';
  return 'h3';
};

export const isDefinitiveSectionBreak = (text, index, allElements) => {
  const content = text.toLowerCase();
  
  // Very specific section starters that definitely begin new sections
  const definitiveBoundaries = [
    'about amy b dean',
    'you\'re not leading in easy times',
    'you don\'t need another surface-level fix',
    'hi. i\'m amy b dean',
    'proven results across complex',
    'the abd ventures advantage',
    'you\'ve outgrown surface-level fixes',
    'organizational transformation:',
    'strategic partnerships & cross sector',
    'leadership development & systems change',
    'organizational leadership & institution building',
    'policy innovation & campaign leadership',
    'national recognition:'
  ];
  
  // Check if this text starts a major section
  const isDefinitiveBoundary = definitiveBoundaries.some(boundary => 
    content.includes(boundary) || content.startsWith(boundary.split(' ')[0])
  );
  
  console.log(`   🔍 Checking "${content.substring(0, 40)}..." - Definitive boundary: ${isDefinitiveBoundary}`);
  
  return isDefinitiveBoundary;
};

export const extractHeadlineFromBlock = (block) => {
  const text = block.combinedText;
  
  // If block already has an explicit headline, use it
  if (block.hasExplicitHeadline) {
    return block;
  }
  
  // Try to extract a headline from the first sentence or phrase
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  if (sentences.length > 0) {
    let headline = sentences[0].trim();
    
    // If the first sentence is very long, try to extract a shorter headline
    if (headline.length > 120) {
      // Look for a shorter phrase at the beginning
      const phrases = headline.split(/[,:;—–-]/);
      if (phrases.length > 1 && phrases[0].length < 80) {
        headline = phrases[0].trim();
      } else {
        // Truncate intelligently
        headline = headline.substring(0, 80) + '...';
      }
    }
    
    // Create a synthetic heading element
    const headingElement = {
      type: 'heading',
      tag: 'h2',
      content: headline,
      level: 2,
      index: -1,
      synthetic: true
    };
    
    // Remove the headline text from the main content
    const remainingText = text.replace(sentences[0], '').replace(/^[.!?]+\s*/, '').trim();
    
    if (remainingText.length > 20) {
      // Create paragraph element for remaining text
      const paragraphElement = {
        type: 'paragraph',
        tag: 'p',
        content: remainingText,
        index: -1,
        synthetic: true
      };
      
      return {
        ...block,
        elements: [headingElement, paragraphElement],
        combinedText: text,
        hasExtractedHeadline: true
      };
    } else {
      // Just use the headline
      return {
        ...block,
        elements: [headingElement],
        combinedText: headline,
        hasExtractedHeadline: true
      };
    }
  }
  
  return block;
};

export const analyzeLogicalBlock = (block, index) => {
  const text = block.combinedText;
  const firstElement = block.elements[0];
  
  // Handle extracted bullets - these blocks have multiple sub-elements
  if (block.hasExtractedBullets && block.elements.length > 1) {
    console.log(`   🎯 Analyzing extracted bullet block with ${block.bulletCount} bullets`);
    return {
      isValid: true,
      type: 'features', // Bullet lists are typically features/benefits
      tag: 'section',
      level: null,
      hasMultipleElements: true
    };
  }
  
  // Handle synthetic elements (extracted headlines)
  if (block.hasExtractedHeadline || block.elements.some(e => e.synthetic)) {
    return {
      isValid: true,
      type: 'paragraph',
      tag: 'p',
      level: null
    };
  }
  
  const tagName = firstElement.tagName?.toLowerCase() || 'p';
  const style = firstElement.getAttribute?.('style') || '';
  
  // Check for heading indicators
  const isHeadingLike = 
    tagName.match(/^h[1-6]$/) ||
    style.includes('font-weight:700') ||
    style.includes('font-weight:bold') ||
    text.length < 200 ||
    index < 3 ||
    text.match(/^(About|Proven|Drawing|You've|Hi\.|Turn|Results|The ABD|Organizational|Strategic|Leadership|Policy|National)/i);
  
  // Check for list items - look for bullet patterns in text
  const isListItem = 
    tagName === 'li' ||
    text.match(/^[•\-\*]\s/) ||
    text.match(/^\d+\.\s/) ||
    // Look for list patterns in the combined text
    (text.includes('•') && text.split('•').length > 2);
  
  if (isListItem) {
    return {
      isValid: true,
      type: 'list_item',
      tag: 'li',
      level: null
    };
  }
  
  if (isHeadingLike) {
    // Determine heading level
    let level = 2; // default
    if (tagName.match(/^h([1-6])$/)) {
      level = parseInt(tagName[1]);
    } else if (index === 0 || text.includes('About Amy')) {
      level = 1;
    } else if (text.includes('Proven') || text.includes('Results') || text.includes('ABD') || 
               text.includes('Organizational') || text.includes('Strategic')) {
      level = 2;
    }
    
    return {
      isValid: true,
      type: 'heading',
      tag: `h${level}`,
      level: level
    };
  }
  
  // Default to paragraph
  return {
    isValid: text.length > 20,
    type: 'paragraph',
    tag: 'p',
    level: null
  };
};

// Helper: Get text that belongs directly to this element (not children)
export const getDirectTextContent = (element) => {
  let text = '';
  for (let node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent;
    }
  }
  return text.trim();
};

// Helper: Check if element has significant child elements
export const hasSignificantChildren = (element) => {
  const children = Array.from(element.children);
  return children.some(child => {
    const childText = child.textContent?.trim() || '';
    return childText.length > 20; // Child has substantial text
  });
};

// Helper: Analyze element to determine its semantic type
export const analyzeElement = (element, text, index) => {
  const tagName = element.tagName.toLowerCase();
  const style = element.getAttribute('style') || '';
  const className = element.getAttribute('class') || '';
  
  // Check for heading indicators
  const isHeadingLike = 
    tagName.match(/^h[1-6]$/) ||
    style.includes('font-weight:700') ||
    style.includes('font-weight:bold') ||
    style.includes('font-weight: 700') ||
    style.includes('font-weight: bold') ||
    text.length < 100 ||
    index < 5 ||
    text.match(/^(About|Proven|Drawing|You've|Hi\.|Turn|Results)/i);
  
  // Check for list items
  const isListItem = 
    tagName === 'li' ||
    text.match(/^[•\-\*]\s/) ||
    text.match(/^\d+\.\s/);
  
  if (isListItem) {
    return {
      isValid: true,
      type: 'list_item',
      tag: 'li',
      level: null
    };
  }
  
  if (isHeadingLike) {
    // Determine heading level
    let level = 2; // default
    if (tagName.match(/^h([1-6])$/)) {
      level = parseInt(tagName[1]);
    } else if (index === 0 || text.includes('About')) {
      level = 1;
    } else if (text.includes('Proven') || text.includes('Results')) {
      level = 2;
    }
    
    return {
      isValid: true,
      type: 'heading',
      tag: `h${level}`,
      level: level
    };
  }
  
  // Default to paragraph
  return {
    isValid: text.length > 10,
    type: 'paragraph',
    tag: 'p',
    level: null
  };
};

// Helper: Parse plain text into semantic elements as fallback
export const parseTextIntoElements = (text) => {
  const elements = [];
  
  // Split by double line breaks first
  const sections = text.split(/\n\s*\n/).filter(section => section.trim().length > 10);
  
  sections.forEach((section, sectionIdx) => {
    const lines = section.split('\n').filter(line => line.trim().length > 5);
    
    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      let type = 'paragraph';
      let tag = 'p';
      let level = null;
      
      // Detect headings
      if (lineIdx === 0 && (trimmed.length < 100 || sectionIdx < 3)) {
        type = 'heading';
        tag = sectionIdx === 0 ? 'h1' : 'h2';
        level = sectionIdx === 0 ? 1 : 2;
      }
      // Detect list items
      else if (trimmed.match(/^[•\-\*]\s/) || trimmed.match(/^\d+\.\s/)) {
        type = 'list_item';
        tag = 'li';
      }
      
      elements.push({
        type: type,
        tag: tag,
        content: trimmed.replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, ''),
        level: level
      });
    });
  });
  
  console.log(`📄 Text-based parsing created ${elements.length} elements`);
  return elements;
};