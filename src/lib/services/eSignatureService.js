// /lib/services/eSignatureService.js - Complete version with all template processing
import { fetchContractRelatedData } from '@/lib/utils/fetchContractRelatedData';
import { createClient } from '@/lib/supabase/browser';

export class ESignatureService {
  constructor(platform = 'esignatures') {
    this.platform = platform;
    this.supabase = createClient();
  }

  async sendContract(contractRecord, config, signers = []) {
    try {
      // Use your existing fetchContractRelatedData function
      const relatedData = await fetchContractRelatedData(contractRecord, config);
      
      // Get contract parts
      const { data: contractPartsData } = await this.supabase
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

      // Generate HTML content using the same logic as your useContractBuilder
      const htmlContent = this.generateHTMLContent(contractRecord, contractParts, relatedData);
      
      // Send to the configured platform
      const platformResult = await this.sendToPlatform({
        title: contractRecord.title,
        content: htmlContent,
        contractId: contractRecord.id,
        signers: signers,
        webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/signature/webhook`
      });

      if (platformResult.success) {
        // Update contract with signature info
        await this.supabase
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
      const { data: contract, error } = await this.supabase
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
            updateData.status = 'signed'; // Update main contract status too
          }

          await this.supabase
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

  generateHTMLContent(contractRecord, contractParts, relatedData) {
    const sortedParts = contractParts.sort((a, b) => a.order_index - b.order_index);
    
    let contentSections = '';
    
    for (const part of sortedParts) {
      let processedContent = part.content;
      
      // FIRST: Handle {{#each array}} loops to avoid conflicts with simple replacements
      processedContent = this.processEachBlocks(processedContent, relatedData);
      
      // SECOND: Handle {{payments}} template
      processedContent = this.processPaymentsTemplate(processedContent, relatedData);
      
      // THEN: Replace simple field variables like {{projected_length}}, {{platform}}
      Object.keys(contractRecord).forEach(fieldName => {
        const value = contractRecord[fieldName];
        if (value !== null && value !== undefined) {
          const regex = new RegExp(`{{${fieldName}}}`, 'g');
          processedContent = processedContent.replace(regex, String(value));
        }
      });
      
      contentSections += `
        <div class="contract-section">
          <h3>${part.title}</h3>
          <div>${processedContent}</div>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${contractRecord.title || 'Contract'}</title>
        <style>${this.getContractCSS()}</style>
      </head>
      <body>
        <h1>${contractRecord.title || 'Contract'}</h1>
        ${contentSections}
        ${this.getSignatureSection()}
      </body>
      </html>
    `;
  }

  // Process {{#each array}} blocks - exact copy from useContractBuilder
  processEachBlocks(content, relatedData) {
    // Handle selectedMilestones
    if (relatedData.selectedMilestones && Array.isArray(relatedData.selectedMilestones)) {
      const milestonesRegex = /{{#each selectedMilestones}}([\s\S]*?){{\/each}}/g;
      content = content.replace(milestonesRegex, (match, template) => {
        return relatedData.selectedMilestones
          .map(milestone => {
            let itemContent = template;
            // Use specific field references to avoid conflicts
            itemContent = itemContent.replace(/{{title}}/g, milestone.title || '');
            itemContent = itemContent.replace(/{{description}}/g, milestone.description || '');
            return itemContent;
          })
          .join('');
      });
    }
    
    // Handle products with deliverables and pricing
    if (relatedData.products && Array.isArray(relatedData.products)) {
      const productsRegex = /{{#each products}}([\s\S]*?){{\/each}}/g;
      content = content.replace(productsRegex, (match, template) => {
        // Generate the products HTML
        let productsHtml = relatedData.products
          .map(product => {
            let itemContent = template;
            // Replace product fields (but NOT price in individual items)
            itemContent = itemContent.replace(/{{title}}/g, product.title || product.name || '');
            itemContent = itemContent.replace(/{{description}}/g, product.description || '');
            // Remove individual price references - don't replace {{price}} here
            
            // Handle deliverables list
            if (product.deliverables && Array.isArray(product.deliverables)) {
              const deliverablesList = product.deliverables
                .map(deliverable => `<li>${deliverable.title || deliverable.name || deliverable}</li>`)
                .join('');
              itemContent = itemContent.replace(/{{deliverables}}/g, 
                deliverablesList ? `<ul>${deliverablesList}</ul>` : '');
            } else {
              itemContent = itemContent.replace(/{{deliverables}}/g, '');
            }
            
            // Remove any remaining {{price}} references in individual items
            itemContent = itemContent.replace(/{{price}}/g, '');
            
            return itemContent;
          })
          .join('');
        
        // Calculate total price of all products
        const totalPrice = relatedData.products
          .reduce((sum, product) => sum + (parseFloat(product.price) || 0), 0);
        
        // Add total price section AFTER all products
        productsHtml += `
          <div class="project-total">
            <h4>Total Project Cost</h4>
            <p class="total-price">$${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        `;
        
        return productsHtml;
      });
    }
    
    return content;
  }

  // Process {{payments}} template variable - exact copy from useContractBuilder
  processPaymentsTemplate(content, relatedData) {
    // Handle {{payments}} template variable
    if (relatedData.payments && Array.isArray(relatedData.payments)) {
      const paymentsRegex = /{{payments}}/g;
      
      content = content.replace(paymentsRegex, () => {
        if (relatedData.payments.length === 0) {
          return '<p><em>No payment schedule defined.</em></p>';
        }

        // Calculate total
        const total = relatedData.payments.reduce((sum, payment) => 
          sum + (parseFloat(payment.amount) || 0), 0
        );

        // Format currency
        const formatCurrency = (amount) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(amount || 0);
        };

        // Format date
        const formatDate = (dateString) => {
          if (!dateString) return '';
          return new Date(dateString).toLocaleDateString();
        };

        // Generate table HTML
        const tableRows = relatedData.payments.map(payment => {
          const dueDate = payment.due_date ? formatDate(payment.due_date) : '';
          const altDueDate = payment.alt_due_date || '';
          
          // Use either actual due date or alternative text
          const dueDateDisplay = dueDate || altDueDate || 'TBD';
          
          return `
            <tr>
              <td>${payment.title}</td>
              <td class="amount">${formatCurrency(payment.amount)}</td>
              <td>${dueDateDisplay}</td>
              <td>${altDueDate && dueDate ? altDueDate : '—'}</td>
            </tr>
          `;
        }).join('');

        return `
          <table class="payments-table">
            <thead>
              <tr>
                <th>Payment</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Alternative Due Date</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr class="total-row">
                <td><strong>Total Project Cost</strong></td>
                <td class="amount"><strong>${formatCurrency(total)}</strong></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        `;
      });
    }
    
    return content;
  }

  async sendToPlatform({ title, content, contractId, signers, webhookUrl }) {
    switch (this.platform) {
      case 'esignatures':
        return this.sendToESignatures({ title, content, contractId, signers, webhookUrl });
      case 'docusign':
        return this.sendToDocuSign({ title, content, contractId, signers, webhookUrl });
      case 'hellosign':
        return this.sendToHelloSign({ title, content, contractId, signers, webhookUrl });
      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
    }
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

  // Platform-specific implementations
  async sendToESignatures({ title, content, contractId, signers, webhookUrl }) {
    try {
      const response = await fetch('https://api.esignatures.com/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.ESIGNATURES_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          metadata: { contractId },
          webhook: { url: webhookUrl, events: ['document.signed', 'document.declined'] },
          signers
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.statusText}`);
      
      const data = await response.json();
      return {
        success: true,
        documentId: data.id,
        signUrl: data.signUrl,
        metadata: { platformData: data }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendToDocuSign({ title, content, contractId, signers, webhookUrl }) {
    // TODO: Implement DocuSign API integration
    return { success: false, error: 'DocuSign integration not implemented yet' };
  }

  async sendToHelloSign({ title, content, contractId, signers, webhookUrl }) {
    // TODO: Implement HelloSign/Dropbox Sign API integration
    return { success: false, error: 'HelloSign integration not implemented yet' };
  }

  async checkESignaturesStatus(documentId) {
    try {
      const response = await fetch(`https://api.esignatures.com/documents/${documentId}`, {
        headers: { 'Authorization': `Bearer ${process.env.ESIGNATURES_API_KEY}` }
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      const statusMap = {
        'pending': 'sent',
        'completed': 'signed',
        'declined': 'declined',
        'expired': 'expired'
      };
      
      return statusMap[data.status] || data.status;
    } catch (error) {
      console.error('Status check error:', error);
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

  getContractCSS() {
    return `
      body { 
        font-family: Arial, sans-serif; 
        max-width: 800px; 
        margin: 0 auto; 
        padding: 20px; 
        line-height: 1.6; 
        color: #333; 
      }
      h1 { 
        font-size: 2rem; 
        text-align: center; 
        border-bottom: 2px solid #0ea5e9; 
        padding-bottom: 1rem; 
        color: #1f2937; 
      }
      h3 { 
        font-size: 1.25rem; 
        font-weight: 600; 
        color: #1f2937; 
        margin-top: 2rem; 
        margin-bottom: 1rem; 
      }
      .contract-section { 
        margin-bottom: 2rem; 
      }
      .payments-table { 
        border-collapse: collapse; 
        margin: 2rem 0; 
        width: 100%; 
        border: 2px solid #d1d5db; 
      }
      .payments-table td, 
      .payments-table th { 
        border: 1px solid #e5e7eb; 
        padding: 12px; 
        text-align: left; 
        vertical-align: top; 
      }
      .payments-table th { 
        background-color: #f9fafb; 
        font-weight: 600; 
        border-bottom: 2px solid #e5e7eb; 
      }
      .payments-table .amount { 
        text-align: right; 
        font-weight: 600; 
        color: #059669; 
      }
      .payments-table .total-row { 
        background-color: #f0f9ff; 
        border-top: 2px solid #0ea5e9; 
      }
      .payments-table .total-row .amount { 
        color: #0ea5e9; 
        font-size: 1.125rem; 
      }
      .project-total {
        margin-top: 2rem;
        padding: 1rem;
        background-color: #f0f9ff;
        border: 2px solid #0ea5e9;
        border-radius: 8px;
      }
      .project-total h4 {
        margin: 0 0 0.5rem 0;
        font-weight: 600;
        color: #0c4a6e;
      }
      .total-price {
        margin: 0;
        font-size: 1.5rem;
        font-weight: bold;
        color: #0ea5e9;
      }
      .signature-section { 
        margin-top: 4rem; 
        border-top: 2px solid #e5e7eb; 
        padding-top: 2rem; 
      }
      .signature-block { 
        display: inline-block; 
        width: 300px; 
        margin: 2rem 2rem 2rem 0; 
        vertical-align: top; 
      }
      .signature-line { 
        border-bottom: 1px solid #333; 
        height: 50px; 
        margin-bottom: 0.5rem; 
      }
      .signature-label { 
        font-size: 0.9rem; 
        color: #666; 
      }
    `;
  }

  getSignatureSection() {
    return `
      <div class="signature-section">
        <h3>Signatures</h3>
        <p>By signing below, all parties agree to the terms and conditions outlined in this contract.</p>
        <div class="signature-block">
          <div class="signature-line"></div>
          <div class="signature-label">Client Signature</div>
          <br>
          <div class="signature-line"></div>
          <div class="signature-label">Date</div>
        </div>
        <div class="signature-block">
          <div class="signature-line"></div>
          <div class="signature-label">Company Representative</div>
          <br>
          <div class="signature-line"></div>
          <div class="signature-label">Date</div>
        </div>
      </div>
    `;
  }
}