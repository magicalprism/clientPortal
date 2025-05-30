// /lib/services/eSignatureService.js - Complete enhanced version with all methods
import { fetchContractRelatedData } from '@/lib/utils/fetchContractRelatedData';
import { createClient } from '@/lib/supabase/server';

export class ESignatureService {
  constructor(platform = 'esignatures', supabaseClient = null) {
    this.platform = platform;
    this.supabaseClient = supabaseClient;
  }

  // Helper method to get Supabase client
  async getSupabase() {
    if (this.supabaseClient) {
      return this.supabaseClient;
    }
    return await createClient();
  }

  async sendContract(contractRecord, config, signers = []) {
    try {
      console.log('[ESignatureService] Starting sendContract process');
      console.log('[ESignatureService] Contract ID:', contractRecord.id);
      console.log('[ESignatureService] Platform:', this.platform);
      console.log('[ESignatureService] Signers count:', signers.length);
      
      const supabase = await this.getSupabase();
      
      // Use your existing fetchContractRelatedData function
      console.log('[ESignatureService] Fetching contract related data...');
      const relatedData = await fetchContractRelatedData(contractRecord, config);
      console.log('[ESignatureService] Related data keys:', Object.keys(relatedData));
      
      // Get contract parts
      console.log('[ESignatureService] Fetching contract parts...');
      const { data: contractPartsData } = await supabase
        .from('contract_contractpart')
        .select(`
          order_index,
          contractpart (
            id,
            title,
            content
          )
        `)
        .eq('contract_id', contractRecord.id)
        .order('order_index');

      const contractParts = contractPartsData?.map(cp => ({
        ...cp.contractpart,
        order_index: cp.order_index
      })) || [];
      
      console.log('[ESignatureService] Contract parts count:', contractParts.length);

      // Prepare template variables
      console.log('[ESignatureService] Preparing template variables...');
      const templateVariables = this.prepareTemplateVariables(contractRecord, contractParts, relatedData);
      console.log('[ESignatureService] Template variables keys:', Object.keys(templateVariables));
      console.log('[ESignatureService] Content length:', templateVariables.content?.length || 0);
      
      // Send to the configured platform
      console.log('[ESignatureService] Sending to platform:', this.platform);
      const platformResult = await this.sendToPlatform({
        title: contractRecord.title,
        contractId: contractRecord.id,
        signers: signers,
        templateVariables: templateVariables,
        webhookUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/esignature-webhook`
      });

      console.log('[ESignatureService] Platform result:', {
        success: platformResult.success,
        documentId: platformResult.documentId,
        error: platformResult.error
      });

      if (platformResult.success) {
        // Update contract with signature info
        console.log('[ESignatureService] Updating contract with signature info...');
        await supabase
          .from('contract')
          .update({
            signature_document_id: platformResult.documentId,
            signature_platform: this.platform,
            signature_status: 'sent',
            signature_sent_at: new Date().toISOString(),
            signature_metadata: platformResult.metadata || {},
            updated_at: new Date().toISOString()
          })
          .eq('id', contractRecord.id);

        console.log('[ESignatureService] Contract updated successfully');
        return {
          success: true,
          documentId: platformResult.documentId,
          signUrl: platformResult.signUrl,
          platform: this.platform,
          message: 'Contract sent for signature successfully'
        };
      } else {
        throw new Error(platformResult.error || 'Failed to send to signature platform');
      }

    } catch (error) {
      console.error('[ESignatureService] Error in sendContract:', error);
      console.error('[ESignatureService] Error stack:', error.stack);
      throw error;
    }
  }

  async getStatus(contractId) {
    try {
      const supabase = await this.getSupabase();
      
      const { data: contract, error } = await supabase
        .from('contract')
        .select('signature_document_id, signature_platform, signature_status, signature_signed_at, signature_sent_at, signature_metadata')
        .eq('id', contractId)
        .single();

      if (error || !contract) {
        throw new Error('Contract not found');
      }

      // Optionally check with the platform for real-time status
      let currentStatus = contract.signature_status;
      if (contract.signature_document_id && contract.signature_platform && currentStatus === 'sent') {
        const platformStatus = await this.checkPlatformStatus(
          contract.signature_document_id, 
          contract.signature_platform
        );
        
        if (platformStatus && platformStatus !== currentStatus) {
          // Update our database
          const updateData = {
            signature_status: platformStatus,
            updated_at: new Date().toISOString()
          };
          
          if (platformStatus === 'signed') {
            updateData.signature_signed_at = new Date().toISOString();
            updateData.status = 'signed';
          }

          await supabase
            .from('contract')
            .update(updateData)
            .eq('id', contractId);
          
          currentStatus = platformStatus;
        }
      }

      return {
        contractId,
        documentId: contract.signature_document_id,
        platform: contract.signature_platform,
        status: currentStatus,
        sentAt: contract.signature_sent_at,
        signedAt: contract.signature_signed_at,
        metadata: contract.signature_metadata
      };

    } catch (error) {
      console.error('Status check error:', error);
      throw error;
    }
  }

  // Prepare template variables for your existing eSignatures template
  prepareTemplateVariables(contractRecord, contractParts, relatedData) {
    console.log('[ESignatureService] prepareTemplateVariables called');
    const variables = {};
    
    // Basic contract fields
    Object.keys(contractRecord).forEach(fieldName => {
      const value = contractRecord[fieldName];
      if (value !== null && value !== undefined) {
        variables[fieldName] = String(value);
      }
    });

    // Process the main contract content
    let mainContent = contractRecord.content || '';
    console.log('[ESignatureService] Processing content, initial length:', mainContent.length);
    
    // Process template variables in the content
    mainContent = this.processEachBlocks(mainContent, relatedData);
    mainContent = this.processPaymentsTemplate(mainContent, relatedData);
    
    // Replace basic contract variables
    Object.keys(contractRecord).forEach(fieldName => {
      const value = contractRecord[fieldName];
      if (value !== null && value !== undefined) {
        const regex = new RegExp(`{{${fieldName}}}`, 'g');
        mainContent = mainContent.replace(regex, String(value));
      }
    });

    // Set the content variable for your template
    variables['content'] = mainContent;

    console.log('[ESignatureService] Template variables prepared');
    console.log('[ESignatureService] Final content length:', mainContent.length);
    return variables;
  }

  // Process {{#each array}} blocks
  processEachBlocks(content, relatedData) {
    console.log('[ESignatureService] Processing each blocks');
    
    // Handle selectedMilestones
    if (relatedData.selectedMilestones && Array.isArray(relatedData.selectedMilestones)) {
      console.log('[ESignatureService] Processing', relatedData.selectedMilestones.length, 'milestones');
      const milestonesRegex = /{{#each selectedMilestones}}([\s\S]*?){{\/each}}/g;
      content = content.replace(milestonesRegex, (match, template) => {
        return relatedData.selectedMilestones
          .map(milestone => {
            let itemContent = template;
            itemContent = itemContent.replace(/{{title}}/g, milestone.title || '');
            itemContent = itemContent.replace(/{{description}}/g, milestone.description || '');
            return itemContent;
          })
          .join('');
      });
    }
    
    // Handle products
    if (relatedData.products && Array.isArray(relatedData.products)) {
      console.log('[ESignatureService] Processing', relatedData.products.length, 'products');
      const productsRegex = /{{#each products}}([\s\S]*?){{\/each}}/g;
      content = content.replace(productsRegex, (match, template) => {
        return relatedData.products
          .map(product => {
            let itemContent = template;
            itemContent = itemContent.replace(/{{title}}/g, product.title || product.name || '');
            itemContent = itemContent.replace(/{{description}}/g, product.description || '');
            
            if (product.deliverables && Array.isArray(product.deliverables)) {
              const deliverablesList = product.deliverables
                .map(deliverable => `- ${deliverable.title || deliverable.name || deliverable}`)
                .join('\n');
              itemContent = itemContent.replace(/{{deliverables}}/g, deliverablesList);
            } else {
              itemContent = itemContent.replace(/{{deliverables}}/g, '');
            }
            
            return itemContent;
          })
          .join('\n\n');
      });
    }
    
    return content;
  }

  processPaymentsTemplate(content, relatedData) {
    console.log('[ESignatureService] Processing payments template');
    
    if (relatedData.payments && Array.isArray(relatedData.payments)) {
      const paymentsRegex = /{{payments}}/g;
      
      content = content.replace(paymentsRegex, () => {
        if (relatedData.payments.length === 0) {
          return 'No payment schedule defined.';
        }

        const total = relatedData.payments.reduce((sum, payment) => 
          sum + (parseFloat(payment.amount) || 0), 0
        );

        const formatCurrency = (amount) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(amount || 0);
        };

        const formatDate = (dateString) => {
          if (!dateString) return '';
          return new Date(dateString).toLocaleDateString();
        };

        let paymentText = 'Payment Schedule:\n';
        relatedData.payments.forEach(payment => {
          const dueDate = payment.due_date ? formatDate(payment.due_date) : '';
          const altDueDate = payment.alt_due_date || '';
          const dueDateDisplay = dueDate || altDueDate || 'TBD';
          
          paymentText += `- ${payment.title}: ${formatCurrency(payment.amount)} - Due: ${dueDateDisplay}\n`;
        });
        
        paymentText += `\nTotal Project Cost: ${formatCurrency(total)}`;
        
        return paymentText;
      });
    }
    
    return content;
  }

  async sendToPlatform({ title, contractId, signers, templateVariables, webhookUrl }) {
    console.log('[ESignatureService] sendToPlatform called for platform:', this.platform);
    
    switch (this.platform) {
      case 'esignatures':
        return this.sendToESignatures({ title, contractId, signers, templateVariables, webhookUrl });
      case 'docusign':
        return this.sendToDocuSign({ title, contractId, signers, templateVariables, webhookUrl });
      case 'hellosign':
        return this.sendToHelloSign({ title, contractId, signers, templateVariables, webhookUrl });
      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
    }
  }

  // Updated eSignatures.com API call with enhanced debugging
  async sendToESignatures({ title, contractId, signers, templateVariables, webhookUrl }) {
    try {
      console.log('[eSignatures] =================================');
      console.log('[eSignatures] Starting eSignatures API call');
      console.log('[eSignatures] Contract ID:', contractId);
      console.log('[eSignatures] Title:', title);
      console.log('[eSignatures] Signers:', signers.map(s => ({ name: s.name, email: s.email })));
      console.log('[eSignatures] Webhook URL:', webhookUrl);
      console.log('[eSignatures] API Key present:', !!process.env.ESIGNATURES_API_KEY);
      console.log('[eSignatures] API Key length:', process.env.ESIGNATURES_API_KEY?.length || 0);
      
      const content = templateVariables.content || '';
      console.log('[eSignatures] Content length:', content.length);
      console.log('[eSignatures] Content preview (first 200 chars):', content.substring(0, 200));
      
      // Create document elements by parsing HTML content and handling initials
      console.log('[eSignatures] Creating document elements...');
      const documentElements = this.parseContentWithInitials(title, content);
      
      console.log('[eSignatures] Document elements created:', documentElements.length);
      console.log('[eSignatures] Element types:', documentElements.map(el => el.type));

      // Validate document elements structure
      const validationErrors = this.validateDocumentElements(documentElements);
      if (validationErrors.length > 0) {
        console.error('[eSignatures] Document elements validation errors:', validationErrors);
        throw new Error(`Invalid document elements: ${validationErrors.join(', ')}`);
      }

      // Create temporary template
      const templatePayload = {
        title: "Contract Template", // Same title for all since we delete them
        labels: ["Temporary"],
        document_elements: documentElements
      };

      console.log('[eSignatures] Template payload structure:', {
        title: templatePayload.title,
        labels: templatePayload.labels,
        documentElementsCount: templatePayload.document_elements.length,
        firstElementType: templatePayload.document_elements[0]?.type,
        lastElementType: templatePayload.document_elements[templatePayload.document_elements.length - 1]?.type
      });

      // Try both URL parameter and Authorization header approaches
      const templateUrl = `https://esignatures.com/api/templates?token=${process.env.ESIGNATURES_API_KEY}`;
      console.log('[eSignatures] Template URL:', templateUrl.replace(process.env.ESIGNATURES_API_KEY, '[API_KEY]'));

      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Try Authorization header as alternative
        'Authorization': `Bearer ${process.env.ESIGNATURES_API_KEY}`
      };

      console.log('[eSignatures] Request headers:', {
        'Content-Type': headers['Content-Type'],
        'Accept': headers['Accept'],
        'Authorization': 'Bearer [API_KEY]'
      });

      console.log('[eSignatures] Making template creation request...');
      const templateResponse = await fetch(templateUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(templatePayload)
      });

      console.log('[eSignatures] Template response status:', templateResponse.status);
      console.log('[eSignatures] Template response headers:', Object.fromEntries(templateResponse.headers.entries()));

      if (!templateResponse.ok) {
        const errorText = await templateResponse.text();
        console.error('[eSignatures] Template creation failed');
        console.error('[eSignatures] Status:', templateResponse.status);
        console.error('[eSignatures] Status Text:', templateResponse.statusText);
        console.error('[eSignatures] Error Response:', errorText);
        
        // Try to parse as JSON for more details
        try {
          const errorJson = JSON.parse(errorText);
          console.error('[eSignatures] Parsed error:', errorJson);
        } catch (e) {
          console.error('[eSignatures] Error response is not JSON');
        }
        
        throw new Error(`Template creation failed (${templateResponse.status}): ${errorText}`);
      }

      const templateData = await templateResponse.json();
      console.log('[eSignatures] Template creation response:', {
        success: !!templateData.data,
        dataLength: templateData.data?.length || 0,
        templateId: templateData.data?.[0]?.template_id,
        fullResponse: templateData
      });

      // Check if template was created successfully
      if (!templateData.data || !templateData.data[0] || !templateData.data[0].template_id) {
        console.error('[eSignatures] Invalid template response structure:', templateData);
        throw new Error('Template creation response missing template_id');
      }

      const tempTemplateId = templateData.data[0].template_id;
      console.log('[eSignatures] Temporary template created successfully:', tempTemplateId);

      try {
        // Create contract using temporary template
        const contractPayload = {
          template_id: tempTemplateId,
          signers: signers.map((signer, index) => ({
            name: signer.name,
            email: signer.email,
            order: index + 1
          })),
          webhook_url: webhookUrl,
          metadata: {
            contractId: contractId,
            source: 'dynamic_template'
          }
        };

        console.log('[eSignatures] Contract payload:', {
          templateId: contractPayload.template_id,
          signersCount: contractPayload.signers.length,
          signers: contractPayload.signers,
          webhookUrl: contractPayload.webhook_url,
          metadata: contractPayload.metadata
        });

        const contractUrl = `https://esignatures.com/api/contracts?token=${process.env.ESIGNATURES_API_KEY}`;
        console.log('[eSignatures] Contract URL:', contractUrl.replace(process.env.ESIGNATURES_API_KEY, '[API_KEY]'));

        const contractHeaders = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.ESIGNATURES_API_KEY}`
        };

        console.log('[eSignatures] Making contract creation request...');
        const contractResponse = await fetch(contractUrl, {
          method: 'POST',
          headers: contractHeaders,
          body: JSON.stringify(contractPayload)
        });

        console.log('[eSignatures] Contract response status:', contractResponse.status);
        console.log('[eSignatures] Contract response headers:', Object.fromEntries(contractResponse.headers.entries()));

        if (!contractResponse.ok) {
          const errorText = await contractResponse.text();
          console.error('[eSignatures] Contract creation failed');
          console.error('[eSignatures] Status:', contractResponse.status);
          console.error('[eSignatures] Status Text:', contractResponse.statusText);
          console.error('[eSignatures] Error Response:', errorText);
          
          // Try to parse as JSON for more details
          try {
            const errorJson = JSON.parse(errorText);
            console.error('[eSignatures] Parsed contract error:', errorJson);
          } catch (e) {
            console.error('[eSignatures] Contract error response is not JSON');
          }
          
          throw new Error(`Contract creation failed (${contractResponse.status}): ${errorText}`);
        }
        
        const contractData = await contractResponse.json();
        console.log('[eSignatures] Contract creation response:', {
          success: true,
          contractId: contractData.contract_id || contractData.id,
          signUrl: contractData.signing_url || contractData.sign_url,
          fullResponse: contractData
        });

        // Delete temporary template
        console.log('[eSignatures] Cleaning up temporary template...');
        await this.deleteTemplate(tempTemplateId);
        
        return {
          success: true,
          documentId: contractData.contract_id || contractData.id,
          signUrl: contractData.signing_url || contractData.sign_url,
          metadata: { platformData: contractData }
        };

      } catch (contractError) {
        console.error('[eSignatures] Contract creation error, cleaning up template...');
        // If contract creation fails, still try to delete the template
        await this.deleteTemplate(tempTemplateId);
        throw contractError;
      }

    } catch (error) {
      console.error('[eSignatures] Overall error:', error);
      console.error('[eSignatures] Error stack:', error.stack);
      return { success: false, error: error.message };
    }
  }

  // Add validation for document elements
  validateDocumentElements(elements) {
    const errors = [];
    
    if (!Array.isArray(elements) || elements.length === 0) {
      errors.push('Document elements must be a non-empty array');
      return errors;
    }

    elements.forEach((element, index) => {
      if (!element.type) {
        errors.push(`Element ${index} missing type`);
      }
      
      // Check required fields for different element types
      switch (element.type) {
        case 'text_normal':
        case 'text_header_one':
        case 'text_header_two':
        case 'unordered_list_item':
          if (!element.text || typeof element.text !== 'string') {
            errors.push(`Element ${index} (${element.type}) missing or invalid text`);
          }
          break;
          
        case 'signer_field_text':
          if (!element.signer_field_assigned_to) {
            errors.push(`Element ${index} (${element.type}) missing signer_field_assigned_to`);
          }
          break;
          
        case 'table':
          if (!element.table_cells || !Array.isArray(element.table_cells)) {
            errors.push(`Element ${index} (${element.type}) missing or invalid table_cells`);
          }
          break;
      }
    });

    return errors;
  }

  // Delete temporary template with enhanced logging
  async deleteTemplate(templateId) {
    try {
      console.log('[eSignatures] Attempting to delete template:', templateId);
      const deleteUrl = `https://esignatures.com/api/templates/${templateId}?token=${process.env.ESIGNATURES_API_KEY}`;
      
      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE'
      });
      
      console.log('[eSignatures] Delete template response status:', deleteResponse.status);
      
      if (deleteResponse.ok) {
        console.log('[eSignatures] Template deleted successfully:', templateId);
      } else {
        const errorText = await deleteResponse.text();
        console.error('[eSignatures] Failed to delete template:', templateId, errorText);
      }
    } catch (error) {
      console.error('[eSignatures] Delete template error:', templateId, error);
      // Don't throw - template cleanup failure shouldn't break the main flow
    }
  }

  // Parse HTML content and create document elements with initial fields
  parseContentWithInitials(title, content) {
    console.log('[eSignatures] parseContentWithInitials called');
    const elements = [];
    
    // Add title
    elements.push({
      "type": "text_header_one",
      "text": title
    });

    // Split content by {{initials}} placeholders
    const contentChunks = content.split('{{initials}}');
    let initialCounter = 1;

    console.log('[eSignatures] Content chunks:', contentChunks.length);

    for (let i = 0; i < contentChunks.length; i++) {
      const chunk = contentChunks[i].trim();
      
      if (chunk) {
        // Parse this content chunk and add elements
        console.log('[eSignatures] Parsing chunk', i + 1, 'length:', chunk.length);
        const chunkElements = this.parseHTMLContent(chunk);
        elements.push(...chunkElements);
        console.log('[eSignatures] Added', chunkElements.length, 'elements from chunk');
      }

      // Add initial field after each chunk (except the last)
      if (i < contentChunks.length - 1) {
        elements.push(
          {
            "type": "text_normal",
            "text": "Please initial below to acknowledge you have read and understood the above section:",
            "text_styles": [
              {
                "offset": 0,
                "length": 76,
                "style": "bold"
              }
            ]
          },
          {
            "type": "signer_field_text",
            "text": `Required Initial #${initialCounter}`,
            "signer_field_assigned_to": "first_signer",
            "signer_field_required": "yes",
            "signer_field_id": `initial_${initialCounter}`,
            "signer_field_placeholder_text": "Your initials"
          },
          {
            "type": "text_normal",
            "text": " "
          }
        );
        initialCounter++;
        console.log('[eSignatures] Added initial field', initialCounter - 1);
      }
    }

    console.log('[eSignatures] Total elements created:', elements.length);
    return elements;
  }

  // Parse HTML content and convert to eSignatures document elements
  parseHTMLContent(htmlContent) {
    console.log('[eSignatures] parseHTMLContent called, content length:', htmlContent.length);
    const elements = [];
    
    // Remove outer div wrappers and extract the main content
    let content = htmlContent;
    
    // Extract content from contract-section divs
    const sectionRegex = /<div class="contract-section"[^>]*>([\s\S]*?)<\/div>\s*(?=<div class="contract-section"|$)/g;
    let match;
    let sectionsFound = 0;
    
    while ((match = sectionRegex.exec(content)) !== null) {
      sectionsFound++;
      const sectionContent = match[1];
      console.log('[eSignatures] Processing section', sectionsFound);
      
      // Extract section title (h3)
      const titleMatch = sectionContent.match(/<h3[^>]*>(.*?)<\/h3>/);
      if (titleMatch) {
        elements.push({
          "type": "text_header_two",
          "text": this.stripHTML(titleMatch[1])
        });
        console.log('[eSignatures] Added section title:', this.stripHTML(titleMatch[1]));
      }
      
      // Extract section content div
      const contentMatch = sectionContent.match(/<div class="section-content"[^>]*>([\s\S]*?)<\/div>/);
      if (contentMatch) {
        const sectionBody = contentMatch[1];
        
        // Check for tables first
        const tableMatch = sectionBody.match(/<table[^>]*>([\s\S]*?)<\/table>/);
        if (tableMatch) {
          const tableElement = this.parseHTMLTable(tableMatch[0]);
          if (tableElement) {
            elements.push(tableElement);
            console.log('[eSignatures] Added table element');
          }
        } else {
          // Parse other content (paragraphs, lists, etc.)
          const contentElements = this.parseTextContent(sectionBody);
          elements.push(...contentElements);
          console.log('[eSignatures] Added', contentElements.length, 'content elements');
        }
      }
    }
    
    // If no sections found, try to parse the content directly
    if (sectionsFound === 0) {
      console.log('[eSignatures] No sections found, parsing content directly');
      const contentElements = this.parseTextContent(content);
      elements.push(...contentElements);
    }
    
    console.log('[eSignatures] parseHTMLContent returning', elements.length, 'elements');
    return elements;
  }

  // Parse HTML table and convert to eSignatures table format
  parseHTMLTable(tableHTML) {
    try {
      console.log('[eSignatures] Parsing HTML table');
      // Extract table rows
      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
      const rows = [];
      let match;
      
      while ((match = rowRegex.exec(tableHTML)) !== null) {
        const rowContent = match[1];
        const cells = [];
        
        // Extract cells (th or td)
        const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g;
        let cellMatch;
        
        while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
          const cellContent = this.stripHTML(cellMatch[1]);
          
          // Check if this is a header row (has th tags)
          const isHeader = rowContent.includes('<th');
          const isRightAlign = cellMatch[0].includes('text-align: right') || cellMatch[0].includes('text-align:right');
          
          const cell = {
            "text": cellContent
          };
          
          if (isHeader) {
            cell.styles = ["bold"];
          }
          
          if (isRightAlign) {
            cell.alignment = "right";
          }
          
          cells.push(cell);
        }
        
        if (cells.length > 0) {
          rows.push(cells);
        }
      }
      
      if (rows.length > 0) {
        console.log('[eSignatures] Table parsed with', rows.length, 'rows');
        return {
          "type": "table",
          "table_cells": rows
        };
      }
    } catch (error) {
      console.error('[eSignatures] Error parsing table:', error);
    }
    
    return null;
  }

  // Parse text content (paragraphs, lists, etc.)
  parseTextContent(htmlContent) {
    console.log('[eSignatures] parseTextContent called');
    const elements = [];
    
    // Split by major HTML elements and process each
    let content = htmlContent.trim();
    
    // Handle paragraphs
    const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
    let lastIndex = 0;
    let match;
    let paragraphsFound = 0;
    
    while ((match = paragraphRegex.exec(content)) !== null) {
      paragraphsFound++;
      // Add any content before this paragraph
      const beforeContent = content.substring(lastIndex, match.index).trim();
      if (beforeContent) {
        elements.push({
          "type": "text_normal",
          "text": this.stripHTML(beforeContent)
        });
      }
      
      // Add the paragraph
      const paragraphText = this.stripHTML(match[1]);
      if (paragraphText) {
        elements.push({
          "type": "text_normal",
          "text": paragraphText
        });
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining content
    const remainingContent = content.substring(lastIndex).trim();
    if (remainingContent) {
      // Handle lists
      const listRegex = /<ul[^>]*>([\s\S]*?)<\/ul>/g;
      const listMatch = listRegex.exec(remainingContent);
      
      if (listMatch) {
        const listItems = this.parseList(listMatch[1]);
        elements.push(...listItems);
      } else {
        const cleanText = this.stripHTML(remainingContent);
        if (cleanText) {
          elements.push({
            "type": "text_normal",
            "text": cleanText
          });
        }
      }
    }
    
    console.log('[eSignatures] parseTextContent found', paragraphsFound, 'paragraphs, returning', elements.length, 'elements');
    return elements;
  }

  // Parse HTML list and convert to eSignatures list items
  parseList(listHTML) {
    console.log('[eSignatures] parseList called');
    const elements = [];
    const listItemRegex = /<li[^>]*>([\s\S]*?)<\/li>/g;
    let match;
    
    while ((match = listItemRegex.exec(listHTML)) !== null) {
      const itemText = this.stripHTML(match[1]);
      if (itemText) {
        elements.push({
          "type": "unordered_list_item",
          "text": itemText
        });
      }
    }
    
    console.log('[eSignatures] parseList returning', elements.length, 'list items');
    return elements;
  }

  // Strip HTML tags and decode entities
  stripHTML(html) {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  async checkPlatformStatus(documentId, platform) {
    switch (platform) {
      case 'esignatures':
        return this.checkESignaturesStatus(documentId);
      case 'docusign':
        return this.checkDocuSignStatus(documentId);
      case 'hellosign':
        return this.checkHelloSignStatus(documentId);
      default:
        return null;
    }
  }

  async checkESignaturesStatus(documentId) {
    try {
      const response = await fetch(`https://esignatures.com/api/contracts/${documentId}?token=${process.env.ESIGNATURES_API_KEY}`);
      
      if (!response.ok) return null;
      
      const data = await response.json();
      const statusMap = {
        'pending': 'sent',
        'completed': 'signed',
        'cancelled': 'declined',
        'expired': 'expired'
      };
      
      return statusMap[data.status] || data.status;
    } catch (error) {
      console.error('eSignatures status check error:', error);
      return null;
    }
  }

  async checkDocuSignStatus(documentId) {
    // TODO: Implement DocuSign status check
    return null;
  }

  async checkHelloSignStatus(documentId) {
    // TODO: Implement HelloSign status check
    return null;
  }

  // Placeholder methods for other platforms
  async sendToDocuSign({ title, contractId, signers, templateVariables, webhookUrl }) {
    return { success: false, error: 'DocuSign integration not implemented yet' };
  }

  async sendToHelloSign({ title, contractId, signers, templateVariables, webhookUrl }) {
    return { success: false, error: 'HelloSign integration not implemented yet' };
  }
}