// /lib/services/signature/ContentProcessor.js
export class ContentProcessor {
  
  // Clean markdown formatting - NEW METHOD
  static cleanMarkdownFormatting(content) {
    console.log('[ContentProcessor] Cleaning markdown formatting...');
    console.log('[ContentProcessor] Asterisks before cleaning:', (content.match(/\*/g) || []).length);
    
    let cleaned = content;
    
    // 1. Convert **text** to plain text (remove asterisks entirely for headers)
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
    
    // 2. Convert *text* to plain text (be careful with single asterisks)
    cleaned = cleaned.replace(/\*([^*\n<>]{1,100})\*/g, '$1');
    
    // 3. Remove asterisks from inside HTML headers specifically
    cleaned = cleaned.replace(/<h([1-6][^>]*)>\*+([^<]*?)\*+<\/h[1-6]>/g, '<h$1>$2</h$1>');
    
    // 4. Remove any remaining standalone asterisks
    cleaned = cleaned.replace(/(?:^|\s)\*+(?:\s|$)/g, ' ');
    
    // 5. Fix [object Object] issues - convert objects to strings properly
    cleaned = cleaned.replace(/\[object Object\]/g, 'WordPress');
    
    // 6. Clean up multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    console.log('[ContentProcessor] Asterisks after cleaning:', (cleaned.match(/\*/g) || []).length);
    
    return cleaned;
  }

  // Replace form field template variables with eSignature form field markers - ENHANCED
  static replaceFormFieldTemplates(content) {
    console.log('[ContentProcessor] === FORM FIELD REPLACEMENT START ===');
    console.log('[ContentProcessor] Input content length:', content.length);
    
    // Simple, direct replacements
    const replacements = [
      { find: /\{\{\s*today\s*\}\}/gi, replace: '{{FORM_FIELD:date:today:Today\'s Date:MM/DD/YYYY:true}}' },
      { find: /\{\{\s*client_name\s*\}\}/gi, replace: '{{FORM_FIELD:text:client_name:Full Name (First and Last):Enter your full name:true}}' },
      { find: /\{\{\s*client_business\s*\}\}/gi, replace: '{{FORM_FIELD:text:client_business:Business or Company Name:Enter business/company name:false}}' },
      { find: /\{\{\s*company_address\s*\}\}/gi, replace: '{{FORM_FIELD:text:company_address:Company or Personal Address:Enter your address:true}}' },
      { find: /\{\{\s*company_email\s*\}\}/gi, replace: '{{FORM_FIELD:email:company_email:Email Address:Enter your email address:true}}' },
      { find: /\{\{\s*initials\s*\}\}/gi, replace: '{{FORM_FIELD:initials:initials:Please initial here:Your initials:true}}' },
      { find: /\{\{\s*intials\s*\}\}/gi, replace: '{{FORM_FIELD:initials:intials:Please initial here:Your initials:true}}' } // Handle typo
    ];

    replacements.forEach(({ find, replace }) => {
      const matches = content.match(find);
      if (matches) {
        console.log(`[ContentProcessor] Found ${matches.length} matches for pattern:`, find.source);
        console.log(`[ContentProcessor] Matches:`, matches);
        content = content.replace(find, replace);
        console.log(`[ContentProcessor] Replaced with:`, replace);
      }
    });

    // SPECIAL CASE: Handle standalone "Business or Company Name" text that should become a form field
    // This fixes the missing client_business form field
    if (content.includes('Business or Company Name') && !content.includes('{{FORM_FIELD:text:client_business')) {
      console.log('[ContentProcessor] Adding missing business name form field');
      content = content.replace(
        /Business or Company Name(?!\s*{{FORM_FIELD)/g, 
        '{{FORM_FIELD:text:client_business:Business or Company Name:Enter business/company name:false}}'
      );
    }

    const formFieldCount = (content.match(/\{\{FORM_FIELD:/g) || []).length;
    console.log(`[ContentProcessor] Total FORM_FIELD markers created: ${formFieldCount}`);
    
    if (formFieldCount > 0) {
      console.log('[ContentProcessor] Sample markers:', content.match(/\{\{FORM_FIELD:[^}]+\}\}/g)?.slice(0, 3));
    }
    
    console.log('[ContentProcessor] === FORM FIELD REPLACEMENT END ===');
    return content;
  }

  // Process contract content for signature platform - ENHANCED
  static processContentForSignature(contractRecord, signers = []) {
    console.log('[ContentProcessor] Processing content for signature...');
    
    // Use the stored content from the database (already fully compiled)
    let content = contractRecord.content || '';
    console.log('[ContentProcessor] Using stored content, length:', content.length);
    console.log('[ContentProcessor] Content preview (first 200 chars):', content.substring(0, 200));
    
    if (!content) {
      throw new Error('No contract content found. Please regenerate the contract content.');
    }
    
    // *** STEP 1: Clean markdown formatting FIRST ***
    content = this.cleanMarkdownFormatting(content);
    
    // Debug: Check for template variables before replacement
    const templateVars = ['{{today}}', '{{client_name}}', '{{client_business}}', '{{company_address}}', '{{company_email}}', '{{initials}}', '{{intials}}'];
    templateVars.forEach(varName => {
      if (content.includes(varName)) {
        console.log(`[ContentProcessor] Found template variable: ${varName}`);
      }
    });
    
    // Replace form field template variables with eSignature form field markers
    content = this.replaceFormFieldTemplates(content);
    
    // Debug: Check for form field markers after replacement
    console.log('[ContentProcessor] After form field replacement, content includes markers:', content.includes('{{FORM_FIELD:'));
    
    // Replace any remaining simple template variables
    Object.keys(contractRecord).forEach(fieldName => {
      const value = contractRecord[fieldName];
      if (value !== null && value !== undefined) {
        const regex = new RegExp(`{{${fieldName}}}`, 'g');
        const beforeReplace = content.includes(`{{${fieldName}}}`);
        content = content.replace(regex, String(value));
        if (beforeReplace) {
          console.log(`[ContentProcessor] Replaced template variable: {{${fieldName}}} with: ${String(value).substring(0, 50)}`);
        }
      }
    });
    
    console.log('[ContentProcessor] Content processed successfully');
    console.log('[ContentProcessor] Final content length:', content.length);
    console.log('[ContentProcessor] Content includes form fields?', content.includes('{{FORM_FIELD:'));
    
    return content;
  }

  // Format date helper
  static formatDate(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  }

  // Clean text - remove HTML tags and decode entities - FIXED TO REMOVE ASTERISKS
  static cleanText(html) {
    if (!html || typeof html !== 'string') {
      return '';
    }
    
    return html
      .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to newlines
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '$1') // Remove strong tags but keep content (NO ASTERISKS)
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '$1') // Remove bold tags but keep content (NO ASTERISKS)
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '$1') // Remove italic tags but keep content (NO ASTERISKS)
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '$1') // Remove italic tags but keep content (NO ASTERISKS)
      .replace(/<[^>]*>/g, '') // Remove other HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .replace(/\*+/g, '') // Remove any remaining asterisks
      .replace(/\[object Object\]/g, 'WordPress') // Fix object toString issues
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/^\s*[-—•]\s*/, '') // Remove leading bullet points
      .trim();
  }
}