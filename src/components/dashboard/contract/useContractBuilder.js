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

  // Compile contract content
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
    saveContract
  };
};