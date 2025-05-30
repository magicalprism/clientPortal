// /lib/services/eSignatureService.js - Complete clean version
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
      const supabase = await this.getSupabase();
      
      // Use your existing fetchContractRelatedData function
      const relatedData = await fetchContractRelatedData(contractRecord, config);
      
      // Get contract parts
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

      // Prepare template variables
      const templateVariables = this.prepareTemplateVariables(contractRecord, contractParts, relatedData);
      
      // Send to the configured platform
      const platformResult = await this.sendToPlatform({
        title: contractRecord.title,
        contractId: contractRecord.id,
        signers: signers,
        templateVariables: templateVariables,
        webhookUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/esignature-webhook`
      });

      if (platformResult.success) {
        // Update contract with signature info
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
      console.error('E-signature service error:', error);
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

    console.log('[ESignatureService] Template variables prepared for existing template');
    console.log('[ESignatureService] Content processed with initials placeholders');
    return variables;
  }

  // Process {{#each array}} blocks
  processEachBlocks(content, relatedData) {
    // Handle selectedMilestones
    if (relatedData.selectedMilestones && Array.isArray(relatedData.selectedMilestones)) {
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

  // Updated eSignatures.com API call with dynamic template creation
  async sendToESignatures({ title, contractId, signers, templateVariables, webhookUrl }) {
    try {
      console.log('[eSignatures] Creating dynamic template with tables and initials');
      
      const content = templateVariables.content || '';
      
      // Create document elements by parsing HTML content and handling initials
      const documentElements = this.parseContentWithInitials(title, content);
      
      console.log(`[eSignatures] Created ${documentElements.length} document elements`);

      // Create temporary template
      const templateResponse = await fetch(`https://esignatures.com/api/templates?token=${process.env.ESIGNATURES_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: "Contract Template", // Same title for all since we delete them
          labels: ["Temporary"],
          document_elements: documentElements
        })
      });

      if (!templateResponse.ok) {
        const errorText = await templateResponse.text();
        throw new Error(`Template creation failed (${templateResponse.status}): ${errorText}`);
      }

      const templateData = await templateResponse.json();
      const tempTemplateId = templateData.data[0].template_id;

      console.log(`[eSignatures] Created temporary template: ${tempTemplateId}`);

      try {
        // Create contract using temporary template
        const contractResponse = await fetch(`https://esignatures.com/api/contracts?token=${process.env.ESIGNATURES_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
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
          })
        });

        if (!contractResponse.ok) {
          const errorText = await contractResponse.text();
          throw new Error(`Contract creation failed (${contractResponse.status}): ${errorText}`);
        }
        
        const contractData = await contractResponse.json();
        console.log('[eSignatures] Contract created successfully');

        // Delete temporary template
        await this.deleteTemplate(tempTemplateId);
        
        return {
          success: true,
          documentId: contractData.contract_id || contractData.id,
          signUrl: contractData.signing_url || contractData.sign_url,
          metadata: { platformData: contractData }
        };

      } catch (contractError) {
        // If contract creation fails, still try to delete the template
        await this.deleteTemplate(tempTemplateId);
        throw contractError;
      }

    } catch (error) {
      console.error('[eSignatures] Error:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete temporary template
  async deleteTemplate(templateId) {
    try {
      await fetch(`https://esignatures.com/api/templates/${templateId}?token=${process.env.ESIGNATURES_API_KEY}`, {
        method: 'DELETE'
      });
      console.log(`[eSignatures] Deleted temporary template: ${templateId}`);
    } catch (error) {
      console.error(`[eSignatures] Failed to delete template ${templateId}:`, error);
      // Don't throw - template cleanup failure shouldn't break the main flow
    }
  }

  // Parse HTML content and create document elements with initial fields
  parseContentWithInitials(title, content) {
    const elements = [];
    
    // Add title
    elements.push({
      "type": "text_header_one",
      "text": title
    });

    // Split content by {{initials}} placeholders
    const contentChunks = content.split('{{initials}}');
    let initialCounter = 1;

    for (let i = 0; i < contentChunks.length; i++) {
      const chunk = contentChunks[i].trim();
      
      if (chunk) {
        // Parse this content chunk and add elements
        const chunkElements = this.parseHTMLContent(chunk);
        elements.push(...chunkElements);
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
      }
    }

    return elements;
  }

  // Parse HTML content and convert to eSignatures document elements
  parseHTMLContent(htmlContent) {
    const elements = [];
    
    // Remove outer div wrappers and extract the main content
    let content = htmlContent;
    
    // Extract content from contract-section divs
    const sectionRegex = /<div class="contract-section"[^>]*>([\s\S]*?)<\/div>\s*(?=<div class="contract-section"|$)/g;
    let match;
    
    while ((match = sectionRegex.exec(content)) !== null) {
      const sectionContent = match[1];
      
      // Extract section title (h3)
      const titleMatch = sectionContent.match(/<h3[^>]*>(.*?)<\/h3>/);
      if (titleMatch) {
        elements.push({
          "type": "text_header_two",
          "text": this.stripHTML(titleMatch[1])
        });
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
          }
        } else {
          // Parse other content (paragraphs, lists, etc.)
          const contentElements = this.parseTextContent(sectionBody);
          elements.push(...contentElements);
        }
      }
    }
    
    // If no sections found, try to parse the content directly
    if (elements.length === 0) {
      const contentElements = this.parseTextContent(content);
      elements.push(...contentElements);
    }
    
    return elements;
  }

  // Parse HTML table and convert to eSignatures table format
  parseHTMLTable(tableHTML) {
    try {
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
        return {
          "type": "table",
          "table_cells": rows
        };
      }
    } catch (error) {
      console.error('Error parsing table:', error);
    }
    
    return null;
  }

  // Parse text content (paragraphs, lists, etc.)
  parseTextContent(htmlContent) {
    const elements = [];
    
    // Split by major HTML elements and process each
    let content = htmlContent.trim();
    
    // Handle paragraphs
    const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
    let lastIndex = 0;
    let match;
    
    while ((match = paragraphRegex.exec(content)) !== null) {
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
    
    return elements;
  }

  // Parse HTML list and convert to eSignatures list items
  parseList(listHTML) {
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