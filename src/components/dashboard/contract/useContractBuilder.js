// useContractBuilder.js - Updated with better form field handling
import { useState, useEffect, useMemo } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { createClient } from '@/lib/supabase/browser';
import { getPostgresTimestamp } from '@/lib/utils/getPostgresTimestamp';

export const useContractBuilder = (contractId = null) => {
  const supabase = createClient();
  
  const [contractTitle, setContractTitle] = useState('');
  const [contractParts, setContractParts] = useState([]);
  const [availableParts, setAvailableParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [contractId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const { data: parts, error } = await supabase
        .from('contractpart')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      setAvailableParts(parts || []);
      
      // IMPORTANT: Only auto-include required parts for NEW contracts (when contractId is null)
      if (!contractId) {

        const requiredParts = (parts || [])
          .filter(part => part.is_required)
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
          
        setContractParts(requiredParts.map((part, index) => ({
          ...part,
          order_index: index
        })));
      } else {

        setContractParts([]);
      }

    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  // Compile contract content with template replacement
  const compiledContent = useMemo(() => {
    if (!contractParts.length) return '';
    
    const sortedParts = [...contractParts].sort((a, b) => a.order_index - b.order_index);
    
    return sortedParts
      .map(part => `
        <div class="contract-section" style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: #1f2937;">${part.title}</h3>
          <div class="section-content" style="color: #374151; line-height: 1.6;">${part.content}</div>
        </div>
      `)
      .join('\n');
  }, [contractParts]);

  // New function to compile content with template variables - includes header and footer
  const compileContentWithData = (contractData, relatedData = {}) => {
    if (!contractParts.length) return '';
    
    const sortedParts = [...contractParts].sort((a, b) => a.order_index - b.order_index);
    
    // Create header with client form fields
    const headerContent = createContractHeader(contractData);
    
    // Process main content sections
    const mainContent = sortedParts
      .map(part => {
        let processedContent = part.content;
        
        // FIRST: Handle {{#each array}} loops to avoid conflicts with simple replacements
        processedContent = processEachBlocks(processedContent, relatedData);
        
        // SECOND: Handle {{payments}} template
        processedContent = processPaymentsTemplate(processedContent, relatedData);
        
        // THEN: Replace simple field variables like {{projected_length}}, {{platform}}
        Object.keys(contractData).forEach(fieldName => {
          const value = contractData[fieldName];
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
    
    // Create footer with signature fields
    const footerContent = createContractFooter();
    
    // Combine all parts
    return headerContent + '\n\n' + mainContent + '\n\n' + footerContent;
  };

  // Create contract header with form field template variables
  const createContractHeader = (contractData) => {
    const formattedStartDate = contractData.start_date ? 
      new Date(contractData.start_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }) : '';
    
    return `
<div class="contract-header">
  <h2>Agreement/Contract Details</h2>
  
  <div class="contract-date-section">
    <p><strong>This agreement is made as of:</strong></p>
    <p><strong>Today's Date:</strong></p>
    <p>{{today}}</p>
    ${formattedStartDate ? `<p><strong>Project Start Date:</strong> ${formattedStartDate}</p>` : ''}
  </div>

  <div class="parties-section">
    <p><strong>This agreement is made between:</strong></p>
    
    <div class="client-details">
      <h3><strong>Client Details</strong></h3>
      <p><strong>Full Name (First and Last):</strong></p>
      <p>{{client_name}}</p>
      <p><strong>Business or Company Name:</strong></p>
      <p>{{client_business}}</p>
      <p><strong>Company or Personal Address:</strong></p>
      <p>{{company_address}}</p>
      <p><strong>Email Address:</strong></p>
      <p>{{company_email}}</p>
      <p>(hereinafter "Client" or "I")</p>
    </div>

    <div class="business-owner-details">
      <h3><strong>Business Owner</strong></h3>
      <p><strong>Name:</strong> Lena Forrey</p>
      <p><strong>Business:</strong> Lena Forrey, Inc.</p>
      <p><strong>Address:</strong> 10 Kings Hill Terrace, Wallkill, NY 12589</p>
      <p>(hereinafter "Business owner" or "We")</p>
    </div>
  </div>
</div>`;
  };

  // Create contract footer with signature fields and template variables
  const createContractFooter = () => {
    return `
<div class="contract-footer">
  <div class="signature-section">
    <h3>Agreement Acknowledgment</h3>
    <p>By signing below, both parties acknowledge that they have read, understood, and agree to be bound by the terms and conditions outlined in this contract.</p>
    
    <div class="signature-block">
      <p><strong>Client Signature:</strong> _________________________ <strong>Date:</strong> _____________</p>
      <p><strong>Print Name:</strong> _________________________</p>
    </div>
    
    <div class="signature-block">
      <p><strong>Business Owner Signature:</strong> _________________________ <strong>Date:</strong> _____________</p>
      <p><strong>Print Name:</strong> Lena Forrey</p>
    </div>
  </div>

  <div class="terms-section">
    <h3>Additional Terms</h3>
    <p>This contract represents the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements relating to the subject matter herein. Any modifications to this contract must be made in writing and signed by both parties.</p>
    
    <p>If any provision of this contract is deemed invalid or unenforceable, the remaining provisions shall continue to be valid and enforceable.</p>
    
    <p>This contract shall be governed by the laws of New York State.</p>
  </div>
</div>`;
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
        // Generate the products HTML
        let productsHtml = relatedData.products
          .map(product => {
            let itemContent = template;
            // Replace product fields
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
            
            // Remove any remaining {{price}} references in individual items
            itemContent = itemContent.replace(/{{price}}/g, '');
            
            return itemContent;
          })
      
        
       
      });
    }
    
    return content;
  };

  // Process {{payments}} template variable with proper table formatting
  const processPaymentsTemplate = (content, relatedData) => {
    console.log('Processing payments template...', relatedData?.payments);
    
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

        // Generate table rows
        const tableRows = relatedData.payments.map(payment => {
          const dueDate = payment.due_date ? formatDate(payment.due_date) : '';
          const altDueDate = payment.alt_due_date || '';
          const dueDateDisplay = dueDate || altDueDate || 'TBD';
          
          return `
            <tr>
              <td style="padding: 12px; border: 1px solid #e0e0e0;">${payment.title}</td>
              <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;"><strong>${formatCurrency(payment.amount)}</strong></td>
              <td style="padding: 12px; border: 1px solid #e0e0e0;">${dueDateDisplay}</td>
            </tr>
          `;
        }).join('');

        // Create complete table with proper styling
        const tableHTML = `
          <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px; border: 1px solid #e0e0e0; text-align: left;"><strong>Payment</strong></th>
                <th style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;"><strong>Amount</strong></th>
                <th style="padding: 12px; border: 1px solid #e0e0e0; text-align: left;"><strong>Due Date</strong></th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr style="background-color: #f0f9ff;">
                <td style="padding: 12px; border: 1px solid #e0e0e0;"><strong>Total Project Cost</strong></td>
                <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right;"><strong>${formatCurrency(total)}</strong></td>
                <td style="padding: 12px; border: 1px solid #e0e0e0;"></td>
              </tr>
            </tbody>
          </table>
        `;
        
        console.log('Generated payment table HTML');
        return tableHTML;
      });
    }
    
    return content;
  };

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const activeIndex = contractParts.findIndex(
      part => `part-${part.id}` === active.id
    );
    const overIndex = contractParts.findIndex(
      part => `part-${part.id}` === over.id
    );

    if (activeIndex !== -1 && overIndex !== -1) {
      const newParts = arrayMove(contractParts, activeIndex, overIndex);
      const updatedParts = newParts.map((part, index) => ({
        ...part,
        order_index: index
      }));
      setContractParts(updatedParts);
    }
  };

  // Handle content changes
  const handleContentChange = (partId, newContent) => {
    setContractParts(prev => prev.map(part =>
      part.id === partId ? { ...part, content: newContent } : part
    ));
  };

  const handleTitleChange = (partId, newTitle) => {
    setContractParts(prev => prev.map(part =>
      part.id === partId ? { ...part, title: newTitle } : part
    ));
  };

  // Add existing part
  const handleAddExistingPart = (partToAdd) => {
    if (contractParts.find(p => p.id === partToAdd.id)) return;
    
    const newPart = {
      ...partToAdd,
      order_index: contractParts.length
    };
    setContractParts(prev => [...prev, newPart]);
  };

  // Add new custom part
  const handleAddCustomPart = async () => {
    try {
      const newPart = {
        title: 'New Section',
        content: '<p>Enter your custom content here...</p>',
        is_required: false,
        created_at: getPostgresTimestamp(),
        updated_at: getPostgresTimestamp()
      };

      const { data: insertedPart, error } = await supabase
        .from('contractpart')
        .insert(newPart)
        .select()
        .single();

      if (error) throw error;

      const partWithOrder = {
        ...insertedPart,
        order_index: contractParts.length
      };

      setContractParts(prev => [...prev, partWithOrder]);
      setAvailableParts(prev => [...prev, insertedPart]);

    } catch (error) {
      console.error('Error creating custom part:', error);
    }
  };

  // Remove part
  const handleRemovePart = (partId) => {
    setContractParts(prev => prev.filter(part => part.id !== partId));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!contractTitle.trim()) {
      newErrors.title = 'Contract title is required';
    }
    
    if (contractParts.length === 0) {
      newErrors.parts = 'At least one contract section is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save contract
  const saveContract = async (contractTitle, contractParts, contractId = null) => {
    try {
      setSaving(true);

      let contract;
      
      // If we have a contract ID, update it, otherwise this should be handled by the main form
      if (contractId) {
        const contractData = {
          content: compiledContent,
          updated_at: getPostgresTimestamp()
        };

        const { data: updatedContract, error: contractError } = await supabase
          .from('contract')
          .update(contractData)
          .eq('id', contractId)
          .select()
          .single();

        if (contractError) throw contractError;
        contract = updatedContract;
      } else {
        // This shouldn't happen in the new flow, but keeping for safety
        return false;
      }

      // Create/update pivot relationships
      // First, delete existing relationships
      await supabase
        .from('contract_contractpart')
        .delete()
        .eq('contract_id', contract.id);

      // Then create new ones
      const pivotData = contractParts.map(part => ({
        contract_id: contract.id,
        contractpart_id: part.id,
        order_index: part.order_index
      }));

      const { error: pivotError } = await supabase
        .from('contract_contractpart')
        .insert(pivotData);

      if (pivotError) throw pivotError;

      return contract;
      
    } catch (error) {
      console.error('Error saving contract:', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Add all required parts that aren't already in the contract
  const handleAddAllRequired = () => {

    
    // Get IDs of parts already in the contract
    const usedPartIds = contractParts.map(p => p.id);

    
    // Find required parts that aren't already added
    const requiredParts = availableParts.filter(part => 
      part.is_required && !usedPartIds.includes(part.id)
    );
    

    
    if (requiredParts.length === 0) {

      return;
    }
    
    // Sort required parts by their original order_index
    const sortedRequiredParts = requiredParts.sort((a, b) => 
      (a.order_index || 0) - (b.order_index || 0)
    );
    
    // Add them to the contract with appropriate order_index
    const newParts = sortedRequiredParts.map((part, index) => ({
      ...part,
      order_index: contractParts.length + index
    }));
    

    
    setContractParts(prev => {
      const updated = [...prev, ...newParts];

      return updated;
    });
    

  };

  return {
    // State
    contractTitle,
    contractParts,
    availableParts,
    loading,
    saving,
    errors,
    compiledContent,
    
    // Actions
    setContractTitle,
    handleDragEnd,
    handleContentChange,
    handleTitleChange,
    handleAddExistingPart,
    handleAddCustomPart,
    handleRemovePart,
    saveContract,
    compileContentWithData,
    handleAddAllRequired,
  };
};