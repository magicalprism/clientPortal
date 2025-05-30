// src/components/fields/custom/payments/usePayments.js
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/browser';

const usePayments = ({ pivotTable, entityField, entityId }) => {
  const supabase = useMemo(() => createClient(), []);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      console.log('[Payments] Pivot Table:', pivotTable);
      console.log('[Payments] Entity Field:', entityField);
      console.log('[Payments] Entity ID:', entityId);

      try {
        const { data, error } = await supabase
          .from(pivotTable)
          .select(`
            payment(*, author:author_id(id, title)),
            id
          `)
          .eq(entityField, entityId);

        console.log('[Payments] Query:', { pivotTable, entityField, entityId });
        
        if (error) {
          console.error('[Payments] Error fetching:', error);
          setPayments([]);
        } else {
          console.log('[Payments] Raw data:', data);
          const processedPayments = data?.map(row => row.payment).filter(Boolean) || [];
          
          // Sort by order_index after processing, fallback to created_at
          processedPayments.sort((a, b) => {
            if (a.order_index !== undefined && b.order_index !== undefined) {
              return a.order_index - b.order_index;
            }
            return new Date(a.created_at) - new Date(b.created_at);
          });
          
          console.log('[Payments] Processed payments:', processedPayments);
          setPayments(processedPayments);
        }
      } catch (err) {
        console.error('[Payments] Fetch error:', err);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    if (entityId && pivotTable && entityField) {
      setLoading(true);
      fetchPayments();
    } else {
      setLoading(false);
      setPayments([]);
    }
  }, [entityId, pivotTable, entityField]);

  const addPayment = async (title, amount, dueDate = null, altDueDate = '') => {
    try {
      // Get current contact using your existing utility
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        console.error('Failed to get user:', userError);
        return null;
      }

      // Get contact ID from user
      const { data: contact, error: contactError } = await supabase
        .from('contact')
        .select('id')
        .eq('email', userData.user.email)
        .single();

      if (contactError || !contact) {
        console.error('Failed to get contact:', contactError);
        return null;
      }

      const contactId = contact.id;

      // Insert new payment with order_index
      const maxOrderIndex = payments.length > 0 ? Math.max(...payments.map(p => p.order_index || 0)) : 0;
      
      const { data: newPayments, error: insertError } = await supabase
        .from('payment')
        .insert([{ 
          title: title,
          amount: amount,
          due_date: dueDate,
          alt_due_date: altDueDate,
          author_id: contactId,
          order_index: maxOrderIndex + 1
        }])
        .select();

      if (insertError || !newPayments || newPayments.length === 0) {
        console.error('Error adding payment:', insertError);
        return null;
      }

      const newPayment = newPayments[0];
      const paymentId = newPayment.id;

      // Create link between payment and entity
      const linkData = {};
      linkData[entityField] = entityId;
      linkData.payment_id = paymentId;
      
      console.log('[Payments] Creating link with data:', linkData);
      console.log('[Payments] Pivot table:', pivotTable);
      
      const { error: linkError } = await supabase
        .from(pivotTable)
        .insert([linkData]);

      if (linkError) {
        console.error('Error creating link:', linkError);
        return null;
      }

      // Update local state
      setPayments(prev => [...prev, newPayment]);
      
      // Return the created payment so caller can use its ID
      return newPayment;
      
    } catch (error) {
      console.error('Error in addPayment:', error);
      return null;
    }
  };

  const updatePayment = async (paymentId, title, amount, dueDate = null, altDueDate = '') => {
    try {
      const { data: updatedPayments, error: updateError } = await supabase
        .from('payment')
        .update({ 
          title: title,
          amount: amount,
          due_date: dueDate,
          alt_due_date: altDueDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select();

      if (updateError) {
        console.error('Error updating payment:', updateError);
        return;
      }

      if (updatedPayments && updatedPayments.length > 0) {
        // Update local state
        setPayments(prev => prev.map(payment => 
          payment.id === paymentId ? updatedPayments[0] : payment
        ));
      }
    } catch (error) {
      console.error('Error in updatePayment:', error);
    }
  };

  const deletePayment = async (paymentId) => {
    try {
      // Delete the link first
      const { error: linkError } = await supabase
        .from(pivotTable)
        .delete()
        .eq('payment_id', paymentId);

      if (linkError) {
        console.error('Error deleting payment link:', linkError);
        return;
      }

      // Delete the payment
      const { error: paymentError } = await supabase
        .from('payment')
        .delete()
        .eq('id', paymentId);

      if (paymentError) {
        console.error('Error deleting payment:', paymentError);
        return;
      }

      // Update local state
      setPayments(prev => prev.filter(payment => payment.id !== paymentId));
    } catch (error) {
      console.error('Error in deletePayment:', error);
    }
  };

  const reorderPayments = async (newOrderPayments) => {
    try {
      // Update local state immediately for smooth UX
      setPayments(newOrderPayments);
      
      // Create updates with new order_index values
      const updates = newOrderPayments.map((payment, index) => ({
        id: payment.id,
        order_index: index
      }));

      const { error } = await supabase
        .from('payment')
        .upsert(updates, { onConflict: ['id'] });

      if (error) {
        console.error('Error reordering payments:', error);
        // Optionally revert local state on error
        return;
      }

      console.log('[Payments] Reordered successfully');
    } catch (error) {
      console.error('Error in reorderPayments:', error);
    }
  };

  const calculateTotal = () => {
    return payments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
  };

  return { 
    payments, 
    addPayment, 
    updatePayment, 
    deletePayment, 
    reorderPayments, 
    calculateTotal,
    loading 
  };
};

export default usePayments;
export { usePayments };