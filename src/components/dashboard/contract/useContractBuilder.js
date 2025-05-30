import { useState, useEffect, useMemo } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { createClient } from '@/lib/supabase/browser';
import { getPostgresTimestamp } from '@/lib/utils/getPostgresTimestamp';

export const useContractBuilder = () => {
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
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const { data: parts, error } = await supabase
        .from('contractpart')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setAvailableParts(parts || []);
      
      // Auto-include required parts in their sort order
      const requiredParts = (parts || [])
        .filter(part => part.is_required)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        
      setContractParts(requiredParts.map((part, index) => ({
        ...part,
        order_index: index
      })));

    } catch (error) {
      console.error('Error loading contract parts:', error);
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

  // New function to compile content with template variables
  const compileContentWithData = (contractData, relatedData = {}) => {
    if (!contractParts.length) return '';
    
    const sortedParts = [...contractParts].sort((a, b) => a.order_index - b.order_index);
    
    return sortedParts
      .map(part => {
        let processedContent = part.content;
        
        // FIRST: Handle {{#each array}} loops to avoid conflicts with simple replacements
        processedContent = processEachBlocks(processedContent, relatedData);
        
        // SECOND: Handle {{payments}} template
        processedContent = processPaymentsTemplate(processedContent, relatedData);
        
        // THEN: Replace simple field variables like {{projected_length}}, {{platform}}
        // But skip if we're inside an {{#each}} block that hasn't been processed yet
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
          <div style="margin-top: 2rem; padding: 1rem; background-color: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px;">
            <h4 style="margin: 0 0 0.5rem 0; font-weight: 600; color: #0c4a6e;">Total Project Cost</h4>
            <p style="margin: 0; font-size: 1.5rem; font-weight: bold; color: #0ea5e9;">${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        `;
        
        return productsHtml;
      });
    }
    
    return content;
  };

  // Process {{payments}} template variable
  const processPaymentsTemplate = (content, relatedData) => {
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
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">
                ${payment.title}
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #059669;">
                ${formatCurrency(payment.amount)}
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                ${dueDateDisplay}
              </td>
              ${altDueDate && dueDate ? `
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-style: italic; color: #6b7280;">
                  ${altDueDate}
                </td>
              ` : '<td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">—</td>'}
            </tr>
          `;
        }).join('');

        return `
          <div style="margin: 2rem 0;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 16px 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">
                    Payment
                  </th>
                  <th style="padding: 16px 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">
                    Amount
                  </th>
                  <th style="padding: 16px 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">
                    Due Date
                  </th>
                  <th style="padding: 16px 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">
                    Alternative Due Date
                  </th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
                <tr style="background-color: #f0f9ff; border-top: 2px solid #0ea5e9;">
                  <td style="padding: 16px 12px; font-weight: bold; color: #0c4a6e;">
                    Total Project Cost
                  </td>
                  <td style="padding: 16px 12px; text-align: right; font-weight: bold; color: #0ea5e9; font-size: 1.125rem;">
                    ${formatCurrency(total)}
                  </td>
                  <td style="padding: 16px 12px;"></td>
                  <td style="padding: 16px 12px;"></td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
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
    compileContentWithData
  };
};