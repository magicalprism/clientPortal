// /app/api/integrations/google-drive/google-docs.js
// Google Docs content reading handler - NO DEPENDENCIES VERSION
// Uses public document export instead of googleapis

/**
 * Handles Google Docs content reading requests
 * Uses public document export (no googleapis dependency needed)
 */
export async function handleGoogleDocsRead(payload) {
  try {
    console.log('[GOOGLE-DOCS] Processing request:', payload);

    const { documentId, url, contextType, contextId } = payload;
    
    // Extract document ID from URL if provided
    const docId = documentId || extractDocumentIdFromUrl(url);
    
    if (!docId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Valid Google Docs URL or document ID required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[GOOGLE-DOCS] Extracting document ID:', docId);

    // Fetch document content using public export
    const documentData = await fetchDocumentContentPublic(docId);
    
    // Parse content using enhanced design system
    const parsedContent = parseDocumentForDesignSystem(documentData);
    
    // Add context information if provided
    const response = {
      success: true,
      content: parsedContent,
      metadata: {
        documentId: docId,
        documentTitle: documentData.title,
        source: 'public_export',
        contextType: contextType || null,
        contextId: contextId || null,
        fetchedAt: new Date().toISOString(),
        method: 'public_export'
      }
    };

    console.log('[GOOGLE-DOCS] Successfully processed document:', documentData.title);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[GOOGLE-DOCS] Error processing request:', error);
    
    let errorMessage = 'Failed to read Google Docs content';
    let statusCode = 500;
    
    if (error.message.includes('403')) {
      errorMessage = 'Document is not publicly accessible. Please check sharing permissions.';
      statusCode = 403;
    } else if (error.message.includes('404')) {
      errorMessage = 'Document not found. Please check the URL.';
      statusCode = 404;
    }

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Fetches document content using public export method
 * No googleapis dependency needed - works with publicly shared docs
 */
async function fetchDocumentContentPublic(documentId) {
  try {
    console.log('[GOOGLE-DOCS] Fetching document via public export:', documentId);

    // Try multiple export formats to get the best structure
    const formats = [
      { format: 'txt', type: 'text/plain' },
      { format: 'html', type: 'text/html' }
    ];

    let documentData = null;
    let bestFormat = null;

    for (const formatDef of formats) {
      try {
        const exportUrl = `https://docs.google.com/document/d/${documentId}/export?format=${formatDef.format}`;
        
        const response = await fetch(exportUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ContentParser/1.0)',
            'Accept': formatDef.type
          }
        });

        if (response.ok) {
          const content = await response.text();
          
          if (content && content.length > 10) {
            documentData = {
              content: content,
              format: formatDef.format,
              title: extractTitleFromContent(content, formatDef.format)
            };
            bestFormat = formatDef.format;
            console.log(`[GOOGLE-DOCS] Successfully fetched document as ${formatDef.format}`);
            break;
          }
        }
      } catch (formatError) {
        console.warn(`[GOOGLE-DOCS] Failed to fetch as ${formatDef.format}:`, formatError.message);
        continue;
      }
    }

    if (!documentData) {
      throw new Error('Document is not publicly accessible or does not exist');
    }

    return documentData;

  } catch (error) {
    console.error('[GOOGLE-DOCS] Error fetching document:', error);
    
    if (error.message.includes('403')) {
      throw new Error('Document access denied - please share document publicly');
    } else if (error.message.includes('404')) {
      throw new Error('Document not found - check document ID and sharing settings');
    }
    
    throw error;
  }
}

/**
 * Parses document content for the design system
 * Handles both plain text and HTML formats
 */
function parseDocumentForDesignSystem(documentData) {
  const { content, format, title } = documentData;
  
  console.log(`[GOOGLE-DOCS] Parsing document structure from ${format} format...`);

  let sections = [];
  let plainText = '';
  let headings = [];
  let lists = [];
  let emphasis = { bold: [], italic: [] };

  if (format === 'html') {
    // Parse HTML for better structure detection
    const parsed = parseHTMLContent(content);
    sections = parsed.sections;
    plainText = parsed.plainText;
    headings = parsed.headings;
    lists = parsed.lists;
    emphasis = parsed.emphasis;
  } else {
    // Parse plain text
    const parsed = parsePlainTextContent(content);
    sections = parsed.sections;
    plainText = parsed.plainText;
    headings = parsed.headings;
    lists = parsed.lists;
    emphasis = parsed.emphasis;
  }

  console.log(`[GOOGLE-DOCS] Parsed ${sections.length} sections, ${headings.length} headings, ${lists.length} lists`);

  return {
    text: plainText,
    sections: sections,
    structured: {
      headings: headings,
      lists: lists,
      emphasis: emphasis,
      documentTitle: title || 'Untitled Document',
      totalSections: sections.length,
      wordCount: plainText.split(/\s+/).length,
      charCount: plainText.length,
      format: format
    }
  };
}

/**
 * Parse HTML content for structure
 */
function parseHTMLContent(htmlContent) {
  const sections = [];
  const headings = [];
  const lists = [];
  const emphasis = { bold: [], italic: [] };
  
  // Remove HTML and extract text
  let plainText = htmlContent
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract headings from HTML
  const headingMatches = htmlContent.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi) || [];
  headingMatches.forEach((match, index) => {
    const level = match.match(/<h([1-6])/)[1];
    const text = match.replace(/<[^>]+>/g, '').trim();
    if (text) {
      headings.push({
        level: `H${level}`,
        text: text,
        index: index
      });
    }
  });

  // Extract lists from HTML
  const listMatches = htmlContent.match(/<(?:ul|ol)[^>]*>([\s\S]*?)<\/(?:ul|ol)>/gi) || [];
  listMatches.forEach((listMatch, index) => {
    const items = listMatch.match(/<li[^>]*>(.*?)<\/li>/gi) || [];
    if (items.length > 0) {
      lists.push({
        type: listMatch.startsWith('<ul') ? 'bulleted' : 'numbered',
        items: items.map(item => item.replace(/<[^>]+>/g, '').trim()),
        index: index
      });
    }
  });

  // Extract bold/italic text
  const boldMatches = htmlContent.match(/<(?:b|strong)[^>]*>(.*?)<\/(?:b|strong)>/gi) || [];
  boldMatches.forEach(match => {
    const text = match.replace(/<[^>]+>/g, '').trim();
    if (text) emphasis.bold.push(text);
  });

  const italicMatches = htmlContent.match(/<(?:i|em)[^>]*>(.*?)<\/(?:i|em)>/gi) || [];
  italicMatches.forEach(match => {
    const text = match.replace(/<[^>]+>/g, '').trim();
    if (text) emphasis.italic.push(text);
  });

  // Split into sections based on headings and content
  const lines = plainText.split('\n').filter(line => line.trim().length > 0);
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine.length < 5) return;
    
    const sectionType = determineSectionType(trimmedLine, index, headings, lists);
    
    sections.push({
      type: sectionType.type,
      content: trimmedLine,
      wordCount: trimmedLine.split(/\s+/).length,
      charCount: trimmedLine.length,
      reasoning: sectionType.reasoning,
      priority: sections.length + 1,
      originalIndex: index,
      fromHTML: true
    });
  });

  return {
    sections,
    plainText,
    headings,
    lists,
    emphasis
  };
}

/**
 * Parse plain text content for structure
 */
function parsePlainTextContent(textContent) {
  const sections = [];
  const headings = [];
  const lists = [];
  const emphasis = { bold: [], italic: [] };
  
  const lines = textContent.split('\n').filter(line => line.trim().length > 0);
  const plainText = lines.join(' ');

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine.length < 5) return;
    
    // Detect headings
    if (isLikelyHeading(trimmedLine, index, lines)) {
      const level = determineHeadingLevel(trimmedLine, index);
      headings.push({
        level: level,
        text: trimmedLine.replace(/[*#]/g, '').trim(),
        index: index
      });
    }
    
    // Detect lists
    if (isListItem(trimmedLine)) {
      lists.push({
        text: trimmedLine,
        type: getListType(trimmedLine),
        index: index
      });
    }
    
    // Detect emphasis
    const boldMatches = trimmedLine.match(/\*\*([^*]+)\*\*/g);
    if (boldMatches) {
      boldMatches.forEach(match => {
        emphasis.bold.push(match.replace(/\*\*/g, ''));
      });
    }
    
    const italicMatches = trimmedLine.match(/\*([^*]+)\*/g);
    if (italicMatches) {
      italicMatches.forEach(match => {
        emphasis.italic.push(match.replace(/\*/g, ''));
      });
    }
    
    // Create section
    const sectionType = determineSectionType(trimmedLine, index, headings, lists);
    
    sections.push({
      type: sectionType.type,
      content: trimmedLine,
      wordCount: trimmedLine.split(/\s+/).length,
      charCount: trimmedLine.length,
      reasoning: sectionType.reasoning,
      priority: sections.length + 1,
      originalIndex: index,
      fromHTML: false
    });
  });

  return {
    sections,
    plainText,
    headings,
    lists,
    emphasis
  };
}

/**
 * Determine section type based on content and context
 */
function determineSectionType(content, index, headings, lists) {
  const wordCount = content.split(/\s+/).length;
  
  // Check if this line is a heading
  const isHeading = headings.some(h => h.text === content.replace(/[*#]/g, '').trim());
  if (isHeading) {
    const heading = headings.find(h => h.text === content.replace(/[*#]/g, '').trim());
    if (heading.level === 'H1') {
      return { type: 'hero_headline', reasoning: 'H1 heading detected' };
    } else if (heading.level === 'H2') {
      return { type: 'section_heading', reasoning: 'H2 section heading detected' };
    } else if (heading.level === 'H3') {
      return { type: 'hero_subheadline', reasoning: 'H3 subheading detected' };
    }
  }

  // Check if this line is part of a list
  const isList = lists.some(l => l.text === content || content.includes(l.text));
  if (isList) {
    return { type: 'feature_list', reasoning: 'Part of detected list structure' };
  }

  // Content pattern analysis
  const patterns = [
    {
      test: /^About\s+[A-Za-z\s]+$/,
      type: 'hero_headline',
      reasoning: 'About statement - main headline'
    },
    {
      test: /Turn\s+.+\s+into\s+.+|Transform\s+.+\s+into\s+/i,
      type: 'hero_subheadline',
      reasoning: 'Transformation statement - value proposition'
    },
    {
      test: /You're not\s+|You're making\s+|You don't\s+/i,
      type: 'problem_statement',
      reasoning: 'Addresses reader challenges directly'
    },
    {
      test: /Hi\.\s*I'm\s+/i,
      type: 'personal_introduction',
      reasoning: 'Personal introduction'
    }
  ];

  for (const pattern of patterns) {
    if (content.match(pattern.test)) {
      return { type: pattern.type, reasoning: pattern.reasoning };
    }
  }

  // Position and length-based inference
  if (index === 0 && wordCount <= 10) {
    return { type: 'hero_headline', reasoning: 'First section, short - main headline' };
  }

  if (index === 1 && wordCount <= 25) {
    return { type: 'hero_subheadline', reasoning: 'Second section, moderate length - subheading' };
  }

  if (wordCount <= 30) {
    return { type: 'feature_highlight', reasoning: 'Short content block - feature or highlight' };
  }

  return { type: 'paragraph_content', reasoning: 'Standard paragraph content' };
}

/**
 * Helper functions
 */
function extractDocumentIdFromUrl(url) {
  if (!url) return null;
  const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function extractTitleFromContent(content, format) {
  if (format === 'html') {
    const titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch) {
      return titleMatch[1].replace(' - Google Docs', '').trim();
    }
  }
  
  // Try to extract title from first line
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0].trim().replace(/[*#]/g, '').trim();
    if (firstLine.length > 0 && firstLine.length < 100) {
      return firstLine;
    }
  }
  
  return 'Untitled Document';
}

function isLikelyHeading(line, index, allLines) {
  if (line.length < 80 && !isListItem(line)) return true;
  if (line.match(/^#+\s+/) || line.match(/^\*\*[^*]+\*\*$/)) return true;
  if (index === 0) return true;
  return false;
}

function isListItem(line) {
  return /^\s*[-•*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line);
}

function getListType(line) {
  if (/^\s*\d+\.\s+/.test(line)) return 'numbered';
  if (/^\s*[-•*]\s+/.test(line)) return 'bulleted';
  return 'unknown';
}

function determineHeadingLevel(line, index) {
  if (line.startsWith('###')) return 'H3';
  if (line.startsWith('##')) return 'H2';
  if (line.startsWith('#')) return 'H1';
  if (index === 0) return 'H1';
  if (line.length < 50) return 'H2';
  return 'H3';
}