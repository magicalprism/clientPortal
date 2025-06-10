import { createClient } from '@/lib/supabase/browser';

/**
 * Fetches all related data for a given contract.
 * Requires full collection config to dynamically resolve fields.
 */
export const fetchContractRelatedData = async (record, config) => {
  const supabase = createClient();
  const relatedData = {};

  // ✅ Use config.fields if needed to dynamically parse field names
  const milestoneField = config.fields.find(f => f.name === 'selectedMilestones');
  const productField = config.fields.find(f => f.name === 'products');

  if (record[milestoneField?.name]?.length) {
    const { data } = await supabase
      .from('milestone')
      .select('id, title, description, sort_order')
      .in('id', record[milestoneField.name]);
    relatedData.selectedMilestones = data || [];
  }

  if (record[productField?.name]?.length) {
    const { data: products } = await supabase
      .from('product')
      .select('id, title, description, price')
      .in('id', record[productField.name]);

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

  if (record.id) {
    const { data: paymentPivotData, error: paymentError } = await supabase
      .from('contract_payment')
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
      const payments = paymentPivotData
        ?.map(row => row.payment)
        .filter(Boolean) || [];

      payments.sort((a, b) => {
        if (a.order_index !== undefined && b.order_index !== undefined) {
          return a.order_index - b.order_index;
        }
        return new Date(a.created_at) - new Date(b.created_at);
      });

      relatedData.payments = payments;
    }
  } else {
    relatedData.payments = [];
  }

  return relatedData;
};
