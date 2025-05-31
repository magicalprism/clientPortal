import { createClient } from '@/lib/supabase/browser';

export const fetchContractRelatedData = async (record, config) => {
  const supabase = createClient();
  const relatedData = {};

if (record.selectedMilestones?.length) {
  const { data } = await supabase
    .from('milestone')
    .select('id, title, description, sort_order') // ✅ added
    .in('id', record.selectedMilestones);

  relatedData.selectedMilestones = data || [];
}

  if (record.products?.length) {
    const { data: products } = await supabase
      .from('product')
      .select('id, title, description, price')
      .in('id', record.products);

    const productsWithDeliverables = await Promise.all(
      products.map(async product => {
        const { data: rel } = await supabase
          .from('deliverable_product')
          .select('deliverable_id')
          .eq('product_id', product.id);
        const deliverableIds = rel.map(d => d.deliverable_id);
        const { data: deliverables } = await supabase
          .from('deliverable')
          .select('id, title')
          .in('id', deliverableIds);
        return { ...product, deliverables };
      })
    );

    relatedData.products = productsWithDeliverables;
  }

  // FIXED: Fetch payments through pivot table like PaymentThread does
  if (record.id) {
    console.log('[fetchContractRelatedData] Fetching payments for contract:', record.id);
    
    const { data: paymentPivotData, error: paymentError } = await supabase
      .from('contract_payment') // Use the pivot table
      .select(`
        payment(
          id,
          title,
          amount,
          due_date,
          alt_due_date,
          order_index,
          created_at
        )
      `)
      .eq('contract_id', record.id);

    if (paymentError) {
      console.error('[fetchContractRelatedData] Payment fetch error:', paymentError);
      relatedData.payments = [];
    } else {
      // Extract payments from pivot data and sort them
      const payments = paymentPivotData
        ?.map(row => row.payment)
        .filter(Boolean) || [];
      
      // Sort by order_index, fallback to created_at
      payments.sort((a, b) => {
        if (a.order_index !== undefined && b.order_index !== undefined) {
          return a.order_index - b.order_index;
        }
        return new Date(a.created_at) - new Date(b.created_at);
      });
      
      console.log('[fetchContractRelatedData] Fetched payments:', payments);
      relatedData.payments = payments;
    }
  } else {
    relatedData.payments = [];
  }

  return relatedData;
};