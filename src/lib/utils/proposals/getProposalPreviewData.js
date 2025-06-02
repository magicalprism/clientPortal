import { createClient } from '@/lib/supabase/browser';

export async function getProposalPreviewData(proposalId) {
  const supabase = createClient();

  // 1. Proposal
  const { data: proposal } = await supabase
    .from('proposal')
    .select('*')
    .eq('id', proposalId)
    .single();

  // 2. Contact
  const { data: contact } = proposal?.contact_id
    ? await supabase
        .from('contact')
        .select('*')
        .eq('id', proposal.contact_id)
        .single()
    : { data: null };

  // 3. Features
  const { data: features } = await supabase
    .from('feature_proposal')
    .select('feature(*)')
    .eq('proposal_id', proposalId);

const { data: productRaw } = await supabase
  .from('product_proposal')
  .select(`
    type,
    order,
    product (
      *,
      deliverable_product (
        deliverable_id,
        deliverable(*)
      ),
      feature_product (
        feature_id,
        feature(*)
      )
    )
  `)
  .eq('proposal_id', proposalId)
  .order('order', { ascending: true });




  // 5. FAQs
  const { data: faqs } = await supabase
    .from('faq_proposal')
    .select('faq(*)')
    .eq('proposal_id', proposalId)
    .order('faq.order', { ascending: true });

  // 6. Testimonials
  const { data: testimonials } = await supabase
    .from('proposal_testimonial')
    .select('testimonial(*)')
    .eq('proposal_id', proposalId)
    .order('testimonial.order', { ascending: true });

  // 7. Problems with nested solution
const { data: problemsRaw } = await supabase
  .from('problem_proposal')
  .select(`
    problem(
    *,
      problem_solution (
        solution_id,
        solution (
        *,
        feature_solution(
        feature_id,
        feature(*)
        )
        )
      )
    )
  `)
  .eq('proposal_id', proposalId);


  //parsing logic for products
const products = [];

if (Array.isArray(productRaw)) {
  productRaw
    .filter(p => p?.product && p.type !== 'addon')
    .forEach((p) => {
      const product = p.product;

      const deliverables = Array.isArray(product.deliverable_product)
        ? product.deliverable_product
            .map(dp => dp?.deliverable)
            .filter(Boolean)
            .sort((a, b) => (a.type || '').localeCompare(b.type || ''))
        : [];

      const features = Array.isArray(product.feature_product)
        ? product.feature_product.map(fp => fp?.feature).filter(Boolean)
        : [];

      const parsed = {
        ...product,
        deliverables,
        features,
        order: p.order,
      };

      products.push(parsed);
    });
}







const addOns = productRaw
  .filter(p => p.type === 'addon')
  .map(p => {
    const product = p.product;

    const deliverables = Array.isArray(product.deliverable_product)
      ? product.deliverable_product
          .map(dp => dp?.deliverable)
          .filter(Boolean)
          .sort((a, b) => (a.type || '').localeCompare(b.type || ''))
      : [];

    const features = Array.isArray(product.feature_product)
      ? product.feature_product.map(fp => fp?.feature).filter(Boolean)
      : [];

    return {
      ...product,
      deliverables,
      features,
      order: p.order,
    };
  });





  return {
    proposal,
    contact,
    features: features?.map(f => f.feature) ?? [],
    products,
    addOns,
    faqs: faqs?.map(f => f.faq) ?? [],
    testimonials: testimonials?.map(t => t.testimonial) ?? [],
    problems: Array.isArray(problemsRaw)
  ? problemsRaw
      .filter(p => p?.problem)
      .map((p, idx) => {
        const problem = p.problem;

        const solutions = Array.isArray(problem.problem_solution)
          ? problem.problem_solution.map((ps, psIdx) => {
              const solution = ps?.solution ?? {
                id: `missing-solution-${psIdx}`,
                title: '[Missing Solution]',
                description: ''
              };

              // Attach features from feature_solution
              const features = Array.isArray(solution.feature_solution)
                ? solution.feature_solution.map(fs => fs?.feature).filter(Boolean)
                : [];

              return {
                ...solution,
                features,
              };
            })
          : [];

        return {
          ...problem,
          solutions,
        };
      })
  : []
}
}
