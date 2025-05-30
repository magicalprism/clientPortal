// /lib/utils/contractContentCompiler.js
import { createClient } from '@/lib/supabase/browser';

export const compileContractContent = async (contractRecord, relatedData = {}) => {
  const supabase = createClient();
  
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

  if (!contractParts.length) return '';
  
  const sortedParts = contractParts.sort((a, b) => a.order_index - b.order_index);
  
  return sortedParts
    .map(part => {
      let processedContent = part.content;
      
      // FIRST: Handle {{#each array}} loops
      processedContent = processEachBlocks(processedContent, relatedData);
      
      // SECOND: Handle {{payments}} template
      processedContent = processPaymentsTemplate(processedContent, relatedData);
      
      // THEN: Replace simple field variables
      Object.keys(contractRecord).forEach(fieldName => {
        const value = contractRecord[fieldName];
        if (value !== null && value !== undefined) {
          const regex = new RegExp(`{{${fieldName}}}`, 'g');
          processedContent = processedContent.replace(regex, String(value));
        }
      });
      
      return `
        <div class="contract-section" style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: #1f2937;">${part.title}</h3>
          <div class="section-content" style="color: #374151; line-height: 1.6;">${processedContent}</div>
        </div>
      `;
    })
    .join('\n');
};

// Process {{#each array}} blocks
const processEachBlocks = (content, relatedData) => {
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
  
  // Handle products with deliverables and pricing
  if (relatedData.products && Array.isArray(relatedData.products)) {
    const productsRegex = /{{#each products}}([\s\S]*?){{\/each}}/g;
    content = content.replace(productsRegex, (match, template) => {
      let productsHtml = relatedData.products
        .map(product => {
          let itemContent = template;
          itemContent = itemContent.replace(/{{title}}/g, product.title || product.name || '');
          itemContent = itemContent.replace(/{{description}}/g, product.description || '');
          
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
          
          itemContent = itemContent.replace(/{{price}}/g, '');
          return itemContent;
        })
        .join('');
      
      // Calculate total price of all products
      const totalPrice = relatedData.products
        .reduce((sum, product) => sum + (parseFloat(product.price) || 0), 0);
      
      // Add total price section AFTER all products
      productsHtml += `
        <div style="margin-top: 2rem; padding: 1rem; background-color: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px;">
          <h4 style="margin: 0 0 0.5rem 0; font-weight: 600; color: #0c4a6e;">Total Project Cost</h4>
          <p style="margin: 0; font-size: 1.5rem; font-weight: bold; color: #0ea5e9;">$${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      `;
      
      return productsHtml;
    });
  }
  
  return content;
};

// Process {{payments}} template variable
const processPaymentsTemplate = (content, relatedData) => {
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
        const dueDateDisplay = dueDate || altDueDate || 'TBD';
        
        return `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 12px;">${payment.title}</td>
            <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right; font-weight: 600; color: #059669;">${formatCurrency(payment.amount)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 12px;">${dueDateDisplay}</td>
            <td style="border: 1px solid #e5e7eb; padding: 12px;">${altDueDate && dueDate ? altDueDate : '—'}</td>
          </tr>
        `;
      }).join('');

      return `
        <table style="border-collapse: collapse; margin: 2rem 0; width: 100%; border: 2px solid #d1d5db;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="border: 1px solid #e5e7eb; padding: 12px; font-weight: 600; text-align: left;">Payment</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; font-weight: 600; text-align: left;">Amount</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; font-weight: 600; text-align: left;">Due Date</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; font-weight: 600; text-align: left;">Alternative Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr style="background-color: #f0f9ff; border-top: 2px solid #0ea5e9;">
              <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #0c4a6e;">Total Project Cost</td>
              <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right; font-weight: bold; color: #0ea5e9; font-size: 1.125rem;">${formatCurrency(total)}</td>
              <td style="border: 1px solid #e5e7eb; padding: 12px;"></td>
              <td style="border: 1px solid #e5e7eb; padding: 12px;"></td>
            </tr>
          </tbody>
        </table>
      `;
    });
  }
  
  return content;
};