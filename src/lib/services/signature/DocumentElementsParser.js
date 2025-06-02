// /lib/services/signature/DocumentElementsParser.js - Enhanced with Proposal Section Handling
import { ContentProcessor } from './ContentProcessor.js';

export class DocumentElementsParser {
  
  // Get valid types according to eSignatures.com API documentation
  static getValidElementTypes() {
    return [
      // Text elements
      'text_normal',
      'text_header_one', 
      'text_header_two',
      'text_header_three',
      
      // List elements
      'unordered_list_item',
      'ordered_list_item',
      
      // Signer field elements (as per eSignatures.com API)
      'signer_field_text',
      'signer_field_text_area',
      'signer_field_date',
      'signer_field_dropdown',
      'signer_field_checkbox',
      'signer_field_radiobutton',
      'signer_field_file_upload',
      
      // Other elements
      'table',
      'image',
      'template'
    ];
  }

  // Parse content and convert form fields properly - ENHANCED
  static parseContentWithFormFields(title, content) {

    
    const elements = [];
    
    // Always add title as header if provided
    if (title && title.trim()) {
      console.log('[DocumentElementsParser] Adding title header');
      elements.push({
        "type": "text_header_one",
        "text": "Project Contract"
      });
    }

    // Process the content and convert form fields
    const processedElements = this.parseHTMLContentWithFormFields(content);
    console.log('[DocumentElementsParser] Processed elements from content:', processedElements.length);
    
    elements.push(...processedElements);

    // Final validation and cleaning
    const cleanedElements = this.cleanAndValidateElements(elements);

    console.log('[DocumentElementsParser] === FINAL RESULT ===');
    console.log('[DocumentElementsParser] Total elements created:', cleanedElements.length);
    
    // Debug output - show actual elements
    if (cleanedElements.length > 0) {
      console.log('[DocumentElementsParser] First 3 elements:');
      cleanedElements.slice(0, 3).forEach((el, idx) => {
        console.log(`[DocumentElementsParser]   ${idx + 1}. Type: "${el.type}", Text: "${el.text?.substring(0, 50) || 'N/A'}"`);
        console.log(`[DocumentElementsParser]      Full element:`, JSON.stringify(el, null, 2));
      });
    } else {
      console.error('[DocumentElementsParser] WARNING: No valid elements generated!');
    }
    
    return cleanedElements;
  }

  // Clean and validate elements according to eSignatures.com API requirements
  static cleanAndValidateElements(elements) {
    const validTypes = this.getValidElementTypes();
    const cleaned = [];
    
    elements.forEach((element, index) => {
      if (!element || typeof element !== 'object') {
        console.log(`[DocumentElementsParser] Skipping element ${index}: not an object`);
        return;
      }
      
      if (!element.type || !validTypes.includes(element.type)) {
        console.log(`[DocumentElementsParser] Skipping element ${index}: invalid type "${element.type}"`);
        return;
      }
      
      // Clean the element according to its type
      const cleanedElement = this.cleanElementByType(element);
      if (cleanedElement) {
        cleaned.push(cleanedElement);
      } else {
        console.log(`[DocumentElementsParser] Skipping element ${index}: failed cleaning`);
      }
    });
    
    return cleaned;
  }

  // Clean individual elements to match eSignatures.com API requirements
  static cleanElementByType(element) {
    const validTypes = this.getValidElementTypes();
    
    if (!validTypes.includes(element.type)) {
      return null;
    }
    
    switch (element.type) {
      case 'text_normal':
      case 'text_header_one':
      case 'text_header_two':
      case 'text_header_three':
      case 'unordered_list_item':
      case 'ordered_list_item':
        if (!element.text || typeof element.text !== 'string' || element.text.trim().length === 0) {
          return null;
        }
        return {
          type: element.type,
          text: element.text.trim()
        };
      
      case 'signer_field_text':
      case 'signer_field_text_area':
      case 'signer_field_date':
      case 'signer_field_dropdown':
      case 'signer_field_checkbox':
      case 'signer_field_radiobutton':
      case 'signer_field_file_upload':
        // Required fields for all signer fields according to eSignatures.com API
        if (!element.signer_field_assigned_to || !element.signer_field_id) {
          return null;
        }
        
        const signerField = {
          type: element.type,
          text: element.text || '',
          signer_field_assigned_to: element.signer_field_assigned_to,
          signer_field_id: element.signer_field_id
        };
        
        // Optional fields
        if (element.signer_field_required) {
          signerField.signer_field_required = element.signer_field_required;
        }
        if (element.signer_field_placeholder_text) {
          signerField.signer_field_placeholder_text = element.signer_field_placeholder_text;
        }
        if (element.signer_field_default_value) {
          signerField.signer_field_default_value = element.signer_field_default_value;
        }
        if (element.signer_field_dropdown_options) {
          signerField.signer_field_dropdown_options = element.signer_field_dropdown_options;
        }
        
        return signerField;
      
      case 'table':
        if (!element.table_cells || !Array.isArray(element.table_cells) || element.table_cells.length === 0) {
          return null;
        }
        return {
          type: 'table',
          table_cells: element.table_cells
        };
      
      case 'image':
        if (!element.image_base64) {
          return null;
        }
        const imageElement = {
          type: 'image',
          image_base64: element.image_base64
        };
        if (element.image_alignment) {
          imageElement.image_alignment = element.image_alignment;
        }
        if (element.image_height_rem) {
          imageElement.image_height_rem = element.image_height_rem;
        }
        return imageElement;
      
      case 'template':
        if (!element.template_id) {
          return null;
        }
        return {
          type: 'template',
          template_id: element.template_id
        };
      
      default:
        return null;
    }
  }

  // Parse HTML content and convert to eSignatures document elements with form fields - ENHANCED
  static parseHTMLContentWithFormFields(htmlContent) {
    console.log('[DocumentElementsParser] === PARSING START ===');
    console.log('[DocumentElementsParser] Content length:', htmlContent.length);
    
    if (!htmlContent || typeof htmlContent !== 'string' || htmlContent.trim().length === 0) {
      console.log('[DocumentElementsParser] Empty or invalid content, returning empty array');
      return [];
    }
    
    const elements = [];
    let content = htmlContent.trim();
    let fieldCounter = 1;

    // Check if this contains a proposal section
    const hasProposalSection = /Proposal\s+of\s+Services/i.test(content);
    
    if (hasProposalSection) {
      console.log('[DocumentElementsParser] Detected Proposal of Services section');
      
      // Split content around the proposal section
      const proposalStart = content.search(/Proposal\s+of\s+Services/i);
      const beforeProposal = content.substring(0, proposalStart);
      
      // Find the end of proposal section (usually before "Total Project Cost" or similar)
      const proposalEndRegex = /(Total\s+Project\s+Cost|Payment\s+Schedule|Introduction)/i;
      const proposalEndMatch = content.substring(proposalStart).search(proposalEndRegex);
      
      let proposalContent, afterProposal;
      if (proposalEndMatch !== -1) {
        const actualProposalEnd = proposalStart + proposalEndMatch;
        proposalContent = content.substring(proposalStart, actualProposalEnd);
        afterProposal = content.substring(actualProposalEnd);
      } else {
        proposalContent = content.substring(proposalStart);
        afterProposal = '';
      }
      
      console.log('[DocumentElementsParser] Proposal section length:', proposalContent.length);
      
      // Process content before proposal normally
      if (beforeProposal.trim()) {
        const beforeElements = this.parseContentNormally(beforeProposal, fieldCounter);
        elements.push(...beforeElements.elements);
        fieldCounter = beforeElements.fieldCounter;
      }
      
      // Process proposal section specially
      const proposalElements = this.parseProposalSection(proposalContent);
      elements.push(...proposalElements);
      
      // Process content after proposal normally  
      if (afterProposal.trim()) {
        const afterElements = this.parseContentNormally(afterProposal, fieldCounter);
        elements.push(...afterElements.elements);
      }
      
    } else {
      // Process normally if no proposal section
      const normalElements = this.parseContentNormally(content, fieldCounter);
      elements.push(...normalElements.elements);
    }

    console.log(`[DocumentElementsParser] === PARSING COMPLETE ===`);
    console.log(`[DocumentElementsParser] Total elements generated: ${elements.length}`);
    
    return elements;
  }

  // NEW: Parse proposal section with proper project groupings
  static parseProposalSection(htmlContent) {
    console.log('[DocumentElementsParser] === PARSING PROPOSAL SECTION ===');
    
    const elements = [];
    let content = htmlContent;
    
    // Add the main proposal header
    elements.push({
      type: 'text_header_two',
      text: 'Proposal of Services'
    });
    
    // Add the description paragraph
    const descriptionMatch = content.match(/This Proposal of Services[^<]+/);
    if (descriptionMatch) {
      elements.push({
        type: 'text_normal',
        text: descriptionMatch[0]
      });
    }
    
    // Look for project sections (these should be h3 headers or similar)
    const projectSectionRegex = /<h3[^>]*>(.*?(?:Website|Site|Project).*?)<\/h3>/gi;
    let projectMatches = [...content.matchAll(projectSectionRegex)];
    
    console.log(`[DocumentElementsParser] Found ${projectMatches.length} project sections`);
    
    if (projectMatches.length === 0) {
      // Fallback: look for any pattern that might indicate project names
      const fallbackProjectRegex = /(bVital\s+Website|Dr\.?\s*Greg'?s?\s+Site|NeuroRegenix\s+Site|Brain\s+Regen\s+Site)/gi;
      const fallbackMatches = [...content.matchAll(fallbackProjectRegex)];
      
      if (fallbackMatches.length > 0) {
        console.log(`[DocumentElementsParser] Using fallback project detection, found ${fallbackMatches.length} projects`);
        
        // Process each project section
        fallbackMatches.forEach(match => {
          const projectName = match[1];
          console.log(`[DocumentElementsParser] Processing project: ${projectName}`);
          
          // Add project header
          elements.push({
            type: 'text_header_two',
            text: projectName
          });
          
          elements.push({
            type: 'text_normal',
            text: 'Deliverables:'
          });
          
          // Get deliverables for this project
          const deliverables = this.getDeliverablesForProject(projectName);
          deliverables.forEach(deliverable => {
            elements.push({
              type: 'unordered_list_item',
              text: deliverable
            });
          });
        });
        
        return elements;
      } else {
        // If no project patterns found, just parse the content normally
        console.log('[DocumentElementsParser] No project patterns found, parsing proposal content normally');
        const normalElements = this.parseSimpleHTML(content);
        elements.push(...normalElements);
        return elements;
      }
    }
    
    // If we found proper h3 sections, process them normally
    projectMatches.forEach(match => {
      const projectName = match[1];
      console.log(`[DocumentElementsParser] Processing project section: ${projectName}`);
      
      elements.push({
        type: 'text_header_two',
        text: projectName
      });
      
      // Look for deliverables after this header
      const headerIndex = content.indexOf(match[0]);
      const nextHeaderIndex = content.indexOf('<h3', headerIndex + 1);
      const sectionContent = nextHeaderIndex === -1 
        ? content.substring(headerIndex) 
        : content.substring(headerIndex, nextHeaderIndex);
      
      // Parse deliverables in this section
      const deliverableElements = this.parseSimpleHTML(sectionContent);
      elements.push(...deliverableElements);
    });
    
    console.log(`[DocumentElementsParser] Proposal section generated ${elements.length} elements`);
    return elements;
  }

  // NEW: Helper method to get deliverables for each project
  static getDeliverablesForProject(projectName) {
    const deliverableMap = {
      'bVital Website': [
        'Homepage',
        'About Page', 
        'Contact Page',
        'Blog',
        'Services',
        'Terms & Privacy',
        'Locations',
        'Scheduling',
        'Forms',
        'Resources'
      ],
      "Dr. Greg's Site": [
        'Homepage',
        'About Page',
        'Contact Page', 
        'Blog',
        'Speaking & Media',
        'Podcast',
        'Books',
        'Terms & Privacy'
      ],
      'NeuroRegenix Site': [
        'Homepage',
        'About Page',
        'Contact Page',
        'Blog', 
        'Terms & Privacy',
        'Shop',
        'Product Page Template',
        'FAQs',
        'Reviews',
        'Checkout',
        'Cart',
        'Account',
        'Shop Thank You'
      ],
      'Brain Regen Site': [
        'Homepage',
        'About Page',
        'Contact Page',
        'Blog',
        'Terms & Privacy', 
        'Quiz',
        'Success Stories/Testimonials',
        'Apply Now'
      ]
    };
    
    // Find the best match for the project name
    const projectKey = Object.keys(deliverableMap).find(key => 
      projectName.toLowerCase().includes(key.toLowerCase().split(' ')[0])
    );
    
    return deliverableMap[projectKey] || [];
  }

  // NEW: Helper method for normal content processing
  static parseContentNormally(content, startingFieldCounter) {
    let fieldCounter = startingFieldCounter;
    const elements = [];
    
    // Step 1: Process form field markers first
    const formFieldRegex = /\{\{FORM_FIELD:([^:]+):([^:]+):([^:]+):([^:]+):([^}]+)\}\}/g;
    let match;
    let lastIndex = 0;

    while ((match = formFieldRegex.exec(content)) !== null) {
      // Process HTML content before this form field
      const beforeContent = content.substring(lastIndex, match.index);
      if (beforeContent.trim()) {
        const beforeElements = this.parseSimpleHTML(beforeContent);
        elements.push(...beforeElements);
      }

      // Create form field element
      const [fullMatch, fieldType, fieldId, label, placeholder, required] = match;
      const formFieldElement = this.createFormFieldElement(
        fieldType,
        fieldId,
        label,
        placeholder,
        required === 'true',
        fieldCounter++
      );

      if (formFieldElement) {
        elements.push(formFieldElement);
      }

      lastIndex = match.index + match[0].length;
    }

    // Process remaining content
    const remainingContent = content.substring(lastIndex);
    if (remainingContent.trim()) {
      const remainingElements = this.parseSimpleHTML(remainingContent);
      elements.push(...remainingElements);
    }

    // If no form fields were found, just parse as HTML
    if (fieldCounter === startingFieldCounter) {
      const htmlElements = this.parseSimpleHTML(content);
      elements.push(...htmlElements);
    }

    return { elements, fieldCounter };
  }

  // Simplified HTML parser
  static parseSimpleHTML(htmlContent) {
    const elements = [];
    let content = htmlContent.trim();
    
    if (!content) {
      return elements;
    }

    console.log('[DocumentElementsParser] parseSimpleHTML called with content length:', content.length);

    // If content has no HTML tags, treat as plain text
    if (!/<[^>]+>/.test(content)) {
      console.log('[DocumentElementsParser] No HTML tags found, treating as plain text');
      const cleanText = ContentProcessor.cleanText(content);
      if (cleanText && cleanText.trim()) {
        return [{
          type: 'text_normal',
          text: cleanText
        }];
      }
      return [];
    }

    // Track processed ranges
    const processedRanges = [];

    // 1. Process tables first
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let tableMatch;
    while ((tableMatch = tableRegex.exec(content)) !== null) {
      console.log('[DocumentElementsParser] Found table');
      const tableElement = this.parseHTMLTable(tableMatch[0]);
      if (tableElement) {
        elements.push({
          index: tableMatch.index,
          element: tableElement
        });
        processedRanges.push({ start: tableMatch.index, end: tableMatch.index + tableMatch[0].length });
      }
    }

    // 2. Process headers (h1-h6)
    const headerRegexes = [
      { regex: /<h1[^>]*>([\s\S]*?)<\/h1>/gi, type: 'text_header_one' },
      { regex: /<h2[^>]*>([\s\S]*?)<\/h2>/gi, type: 'text_header_one' },
      { regex: /<h3[^>]*>([\s\S]*?)<\/h3>/gi, type: 'text_header_two' },
      { regex: /<h4[^>]*>([\s\S]*?)<\/h4>/gi, type: 'text_header_two' },
      { regex: /<h5[^>]*>([\s\S]*?)<\/h5>/gi, type: 'text_header_three' },
      { regex: /<h6[^>]*>([\s\S]*?)<\/h6>/gi, type: 'text_header_three' }
    ];

    headerRegexes.forEach(({ regex, type }) => {
      let headerMatch;
      while ((headerMatch = regex.exec(content)) !== null) {
        const isProcessed = processedRanges.some(range => 
          headerMatch.index >= range.start && headerMatch.index < range.end
        );
        
        if (!isProcessed) {
          const headerText = ContentProcessor.cleanText(headerMatch[1]);
          if (headerText && headerText.trim()) {
            console.log(`[DocumentElementsParser] Found header (${type}):`, headerText);
            elements.push({
              index: headerMatch.index,
              element: {
                type: type,
                text: headerText
              }
            });
            processedRanges.push({ start: headerMatch.index, end: headerMatch.index + headerMatch[0].length });
          }
        }
      }
    });

    // 3. Process paragraphs
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let pMatch;
    while ((pMatch = pRegex.exec(content)) !== null) {
  const start = pMatch.index;
  const end = start + pMatch[0].length;

  const isOverlapping = processedRanges.some(range =>
    (start >= range.start && start < range.end) ||
    (end > range.start && end <= range.end) ||
    (start <= range.start && end >= range.end)
  );

  if (!isOverlapping) {
    const innerHTML = pMatch[1];

    // ✅ Skip if this <p> wraps a <ul> or <ol>
    const isWrappedList = /<(ul|ol)[^>]*>[\s\S]*?<\/\1>/.test(innerHTML);
    if (isWrappedList) {
      console.log('[DocumentElementsParser] Skipping paragraph that wraps a list');
      continue;
    }

    const paragraphText = ContentProcessor.cleanText(innerHTML);
    if (paragraphText && paragraphText.trim()) {
      elements.push({
        index: start,
        element: {
          type: 'text_normal',
          text: paragraphText
        }
      });

      processedRanges.push({ start, end });
    }
  }
}

    // 4. Process unordered lists
    const ulRegex = /<ul[^>]*>([\s\S]*?)<\/ul>/gi;
    let ulMatch;
    while ((ulMatch = ulRegex.exec(content)) !== null) {
      const isProcessed = processedRanges.some(range => 
        ulMatch.index >= range.start && ulMatch.index < range.end
      );
      
      if (!isProcessed) {
        console.log('[DocumentElementsParser] Found unordered list');
        const listItems = this.parseList(ulMatch[1], 'unordered_list_item');
        listItems.forEach((item, idx) => {
          elements.push({
            index: ulMatch.index + idx,
            element: item
          });
        });
        processedRanges.push({ start: ulMatch.index, end: ulMatch.index + ulMatch[0].length });
      }
    }

    // 5. Process ordered lists
    const olRegex = /<ol[^>]*>([\s\S]*?)<\/ol>/gi;
    let olMatch;
    while ((olMatch = olRegex.exec(content)) !== null) {
      const isProcessed = processedRanges.some(range => 
        olMatch.index >= range.start && olMatch.index < range.end
      );
      
      if (!isProcessed) {
        console.log('[DocumentElementsParser] Found ordered list');
        const listItems = this.parseList(olMatch[1], 'ordered_list_item');
        listItems.forEach((item, idx) => {
          elements.push({
            index: olMatch.index + idx,
            element: item
          });
        });
        processedRanges.push({ start: olMatch.index, end: olMatch.index + olMatch[0].length });
      }
    }

    // 6. Handle fallback for remaining text
    if (elements.length === 0) {
      console.log('[DocumentElementsParser] No elements found, using fallback text parsing');
      const cleanText = ContentProcessor.cleanText(content);
      if (cleanText && cleanText.trim()) {
        elements.push({
          index: 0,
          element: {
            type: 'text_normal',
            text: cleanText
          }
        });
      }
    }

    // Sort by index and return elements
    elements.sort((a, b) => a.index - b.index);
    const sortedElements = elements.map(item => item.element);
    
    console.log(`[DocumentElementsParser] parseSimpleHTML returning ${sortedElements.length} elements`);
    return sortedElements;
  }

  // Create form field element for eSignatures (corrected for their API)
  static createFormFieldElement(fieldType, fieldId, label, placeholder, required, counter) {
    console.log(`[DocumentElementsParser] Creating form field: type=${fieldType}, id=${fieldId}, label=${label}`);
    
    const baseElement = {
      "signer_field_assigned_to": "first_signer",
      "signer_field_id": `${fieldId}_${counter}`,
      "text": label
    };
    
    // Add required field if specified
    if (required) {
      baseElement.signer_field_required = "yes";
    }
    
    // Add placeholder if provided
    if (placeholder) {
      baseElement.signer_field_placeholder_text = placeholder;
    }

    let element;
    
    switch (fieldType) {
      case 'date':
        element = {
          "type": "signer_field_date",
          ...baseElement
        };
        break;
      
      case 'email':
        // eSignatures.com doesn't have signer_field_email, use signer_field_text instead
        element = {
          "type": "signer_field_text",
          ...baseElement,
          "signer_field_placeholder_text": placeholder || "Enter email address"
        };
        break;
      
      case 'initials':
        element = {
          "type": "signer_field_text",
          ...baseElement,
          "signer_field_placeholder_text": "Your initials"
        };
        break;
      
      case 'text':
      default:
        element = {
          "type": "signer_field_text",
          ...baseElement
        };
        break;
    }
    
    console.log(`[DocumentElementsParser] Created form field element:`, JSON.stringify(element, null, 2));
    return element;
  }

  // Parse HTML table - FIXED to use lowercase "bold"
  static parseHTMLTable(tableHTML) {
    try {
      console.log('[DocumentElementsParser] Parsing HTML table...');
      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
      const rows = [];
      let match;
      let maxCellCount = 0;
      
      while ((match = rowRegex.exec(tableHTML)) !== null) {
        const rowContent = match[1];
        const cells = [];
        
        const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g;
        let cellMatch;
        
        while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
          const cellContent = ContentProcessor.cleanText(cellMatch[1]);
          const isHeader = cellMatch[0].includes('<th');
          const isRightAlign = cellMatch[0].includes('text-align: right') || cellMatch[0].includes('text-align:right');
          
          const cell = { "text": cellContent || "" };
          
          if (isHeader) {
            cell.styles = ["bold"]; // FIXED: use lowercase "bold" not "BOLD"
          }
          
          if (isRightAlign) {
            cell.alignment = "right";
          }
          
          cells.push(cell);
        }
        
        if (cells.length > 0) {
          rows.push(cells);
          maxCellCount = Math.max(maxCellCount, cells.length);
        }
      }
      
      if (rows.length > 0 && maxCellCount > 0) {
        // Ensure all rows have the same number of cells
        const normalizedRows = rows.map(row => {
          while (row.length < maxCellCount) {
            row.push({ "text": "" });
          }
          return row.slice(0, maxCellCount);
        });
        
        console.log(`[DocumentElementsParser] Table parsed: ${normalizedRows.length} rows x ${maxCellCount} cells`);
        return {
          "type": "table",
          "table_cells": normalizedRows
        };
      }
    } catch (error) {
      console.error('[DocumentElementsParser] Error parsing table:', error);
    }
    
    return null;
  }

  // Parse HTML list
  static parseList(listHTML, listType = 'unordered_list_item') {
    const elements = [];
    const listItemRegex = /<li[^>]*>([\s\S]*?)<\/li>/g;
    let match;
    
    while ((match = listItemRegex.exec(listHTML)) !== null) {
      const itemText = ContentProcessor.cleanText(match[1]);
      if (itemText && itemText.trim().length > 0) {
        elements.push({
          "type": listType,
          "text": itemText
        });
      }
    }
    
    return elements;
  }
}