export const proposal = {
  name: 'proposal',
  label: 'Proposals',
  table: 'proposal',
  singularLabel: 'Proposal',
  editPathPrefix: '/dashboard/proposal',
  showEditButton: true,
  subtitleField: 'title',
  defaultView: 'table',
  views: {
    table: {
      label: 'Table View',
      component: 'PrimaryTableView'
    },
  },
  quickView: {
    enabled: true,
    imageField: 'thumbnail_id',
    titleField: 'title',
    subtitleField: 'status',
  }, 

  fields: [   
    { 
      name: 'title', 
      label: 'Proposal Name', 
      group: 'Primary', 
      tab: 'Details',
      clickable: true, 
      showInTable: true,
      description: 'A descriptive name for this proposal'
    },
    {
      name: 'company_id',
      label: 'Company',
      group: 'Primary',
      tab: 'Details', 
      type: 'relationship',
      showInTable: true,
      relation: {
        table: 'company',
        labelField: 'title',
        linkTo: '/dashboard/company',
        filter: { is_client: 'true' }
      }
    },
    {
      name: 'products',
      label: 'Products',
      type: 'multiRelationship',
      group: 'Primary',
      tab: 'Details', 
      displayMode: 'tags',
      relation: {
        table: 'product',
        labelField: 'title',
        linkTo: '/dashboard/product',
        junctionTable: 'product_proposal',
        sourceKey: 'proposal_id',
        targetKey: 'product_id',
        tableFields: ['title', 'price', 'yearly_price'],
        junctionFilter: { type: 'core' }
      }
    },
        {
      name: 'addOns',
      label: 'Add Ons',
      type: 'multiRelationship',
      group: 'Primary',
      tab: 'Details', 
      displayMode: 'tags',
      relation: {
        table: 'product',
        labelField: 'title',
        linkTo: '/dashboard/product',
        junctionTable: 'product_proposal',
        sourceKey: 'proposal_id',
        targetKey: 'product_id',
        tableFields: ['title', 'price', 'yearly_price'],
        junctionFilter: { type: 'addon' }
      }
    },
    {
      name: 'contracts',
      label: 'Contracts',
      type: 'multiRelationship',
      group: 'Primary',
      tab: 'Details', 
      displayMode: 'tags',
      relation: {
        table: 'contract',
        labelField: 'title',
        linkTo: '/dashboard/contract',
        junctionTable: 'contract_proposal',
        sourceKey: 'proposal_id',
        targetKey: 'contract_id',
        tableFields: ['title'],
        filter: {}
      }
    },
    {
      name: 'tier',
      type: 'select',
      label: 'Selected Tier',
      group: 'Primary', 
      tab: 'Details',
      showInTable: true,
      options: [
        { value: 'basic', label: 'Basic' },
        { value: 'premium', label: 'Premium' },
        { value: 'enterprise', label: 'Enterprise' },
        { value: 'custom', label: 'Custom' },
      ]
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      group: 'Primary', 
      tab: 'Details',
      showInTable: true,
      defaultValue: 'draft',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'sent', label: 'Sent' },
        { value: 'accepted', label: 'Accepted' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'expired', label: 'Expired' },
      ]
    },
    {
      name: 'deliverables',
      label: 'Deliverables',
      type: 'multiRelationship',
      group: 'Primary', 
      tab: 'Details',
      displayMode: 'tags',
      relation: {
        table: 'deliverable',
        labelField: 'title',
        linkTo: '/dashboard/deliverable',
        junctionTable: 'deliverable_proposal',
        sourceKey: 'proposal_id',
        targetKey: 'deliverable_id',
        tableFields: ['title',],
        filter: {}
      }
    },

    {
      name: 'features',
      label: 'Features',
      type: 'multiRelationship',
      group: 'Primary', 
      tab: 'Details',
      displayMode: 'tags',
      relation: {
        table: 'feature',
        labelField: 'title',
        linkTo: '/dashboard/feature',
        junctionTable: 'feature_proposal',
        sourceKey: 'proposal_id',
        targetKey: 'feature_id',
        tableFields: ['title',],
        filter: {}
      }
    },
        {
      name: 'problems',
      label: 'Problems',
      type: 'multiRelationship',
      group: 'Primary',
      tab: 'Details', 
      displayMode: 'tags',
      relation: {
        table: 'problem',
        labelField: 'title',
        linkTo: '/dashboard/problem',
        junctionTable: 'problem_proposal',
        sourceKey: 'proposal_id',
        targetKey: 'problem_id',
        tableFields: ['title', ],
        filter: {}
      }
    },
    {
      name: 'proposal_content',
      label: 'Proposal Content',
      type: 'richText',
      tab: 'Content',
      group: 'Content',
      fullWidth: true,
      description: 'Custom content for this proposal'
    },
    {
      name: 'total_monthly',
      label: 'Monthly Total',
      type: 'number',
      group: 'Pricing',
      tab: 'Details',
      editable: false,
      description: 'Calculated monthly total'
    },
    {
      name: 'total_yearly',
      label: 'Yearly Total', 
      type: 'number',
      group: 'Pricing',
      tab: 'Details',
      editable: false,
      description: 'Calculated yearly total'
    },
    {
      name: 'headline',
      label: 'Headline', 
      group: 'content',
      tab: 'Details',
    },
    {
      name: 'subheadline',
      label: 'Subheadline', 
      group: 'content',
      tab: 'Details',
    },

        {
      name: 'note_from_me',
      label: 'Note from Founder', 
      type: 'richText',
      group: 'content',
      tab: 'Details',
    },

            {
      name: 'signature',
      label: 'Signature', 
      type: 'media',
      group: 'content',
      tab: 'Details',
    },

    {
      name: 'pricing_headline',
      label: 'Pricing Headline', 
      group: 'content',
      tab: 'Details',
    },

    {
      name: 'parent_id',
      label: 'Parent Proposal',
      group: 'General', 
      tab: 'Meta',
      type: 'relationship',
      relation: {
        table: 'proposal',
        labelField: 'title',
        linkTo: '/dashboard/proposal',
      }
    },
    { 
      name: 'created_at', 
      label: 'Created', 
      type: 'timestamp',
      group: 'General', 
      tab: 'Meta'
    },
    { 
      name: 'updated_at', 
      label: 'Updated At', 
      type: 'timestamp', 
      group: 'General', 
      tab: 'Meta'
    },
    { 
      name: 'author_id', 
      label: 'Author', 
      type: 'relationship',
      group: 'General',
      tab: 'Meta',
      relation: {
        table: 'contact',
        labelField: 'title',
        linkTo: '/dashboard/contact'
      }, 
    },
    {
      name: 'tags',
      label: 'Tags',
      type: 'multiRelationship',
      tab: 'Meta',
      group: 'General',
      displayMode: 'tags',
      relation: {
        table: 'category',
        labelField: 'title',
        linkTo: '/dashboard/category',
        junctionTable: 'category_proposal',
        sourceKey: 'proposal_id',
        targetKey: 'category_id',
        tableFields: ['title'],
        filter: {}
      }
    },
  ],
  
  filters: [
          {
        name: 'search',
        label: 'Search',
        type: 'text',
        multiple: false
      },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: [],
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'sent', label: 'Sent' },
        { value: 'accepted', label: 'Accepted' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'expired', label: 'Expired' },
      ]
    },
    {
      name: 'tier',
      type: 'select',
      label: 'Tier',
      options: [
        { value: 'basic', label: 'Basic' },
        { value: 'premium', label: 'Premium' },
        { value: 'enterprise', label: 'Enterprise' },
        { value: 'custom', label: 'Custom' },
      ]
    },
    {
      name: 'company_id',
      type: 'relationship',
      label: 'Company',
      relation: {
        table: 'company',
        labelField: 'title',
        filter: { is_client: true }
      }
    },
    {
      name: 'sort',
      type: 'select',
      label: 'Sort',
      options: [
        { value: 'created_at:desc', label: 'Newest Created' },
        { value: 'created_at:asc', label: 'Oldest Created' },
        { value: 'title:asc', label: 'Title (A–Z)' },
        { value: 'title:desc', label: 'Title (Z–A)' },
      ],
      defaultValue: 'created_at:desc'
    }
  ]
};