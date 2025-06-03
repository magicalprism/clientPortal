export const product = {
  name: 'product',
  label: 'Products',
  table: 'product',
  singularLabel: 'Product',
  editPathPrefix: '/dashboard/product',
  showEditButton: true,
  subtitleField: 'title',
  defaultView: 'table',
  views: {
    table: {
      label: 'Table View',
      component: 'PrimaryTableView'
    },
    page: { 
      label: 'Page View', 
      component: 'PageView' 
    },
  },
  quickView: {
    enabled: true,
    imageField: 'thumbnail_id',
    titleField: 'title',
    subtitleField: 'type',
  }, 

  fields: [   
    { 
      name: 'title', 
      label: 'Product Name', 
      group: 'Primary', 
      tab: 'Details',
      clickable: true, 
      openMode: 'modal',  
      showInTable: true,
      description: 'Product title for display and contracts'
    },
    {
      name: 'type',
      type: 'select',
      group: 'Primary', 
      tab: 'Details',
      label: 'Type',
      showInTable: true,
      options: [
        { value: 'website', label: 'Website' },
        { value: 'maintenance', label: 'Maintenance Plans' },
        { value: 'app', label: 'App' },
        { value: 'addon', label: 'Add-on Service' },
        { value: 'consulting', label: 'Consulting' },
      ]
    },
    { 
      name: 'price', 
      label: 'Monthly Price', 
      group: 'Pricing', 
      tab: 'Details',
      type: 'number',
      showInTable: true,
      description: 'Base monthly price for this product'
    },
    { 
      name: 'yearly_price', 
      label: 'Yearly Price', 
      group: 'Pricing', 
      tab: 'Details',
      type: 'number',
      description: 'Optional yearly pricing (usually discounted)'
    },
    { 
      name: 'payment_split_count', 
      label: 'Payment Split Count', 
      group: 'Pricing', 
      tab: 'Details',
      type: 'number',
      description: 'Number of payments for one-time purchases (e.g., 3 for quarterly payments)'
    },
    { 
      name: 'description', 
      label: 'Description', 
      group: 'Primary', 
      tab: 'Details',
      type: 'richText',
      description: 'Detailed description for proposals and contracts'
    },
    {
      name: 'category_id',
      label: 'Category',
      group: 'Classification',
      tab: 'Details',
      type: 'relationship',
      relation: {
        table: 'category',
        labelField: 'title',
        linkTo: '/dashboard/category',
        filter: {}
      }
    },
    {
      name: 'deliverables',
      label: 'Deliverables',
      type: 'multiRelationship',
      group: 'Content', 
      tab: 'Details',
      displayMode: 'tags',
      relation: {
        table: 'deliverable',
        labelField: 'title',
        linkTo: '/dashboard/deliverable',
        junctionTable: 'deliverable_product',
        sourceKey: 'product_id',
        targetKey: 'deliverable_id',
        tableFields: ['title'],
        filter: {}
      }
    },
    {
      name: 'features',
      label: 'Features',
      type: 'multiRelationship',
      group: 'Content', 
      tab: 'Details',
      displayMode: 'tags',
      relation: {
        table: 'feature',
        labelField: 'title',
        linkTo: '/dashboard/feature',
        junctionTable: 'feature_product',
        sourceKey: 'product_id',
        targetKey: 'feature_id',
        tableFields: ['title'],
        filter: {}
      }
    },
    {
      name: 'proposals',
      label: 'Proposals Using This Product',
      type: 'multiRelationship',
      group: 'Usage',
      tab: 'Usage',
      displayMode: 'table',
      relation: {
        table: 'proposal',
        labelField: 'title',
        linkTo: '/dashboard/proposal',
        junctionTable: 'product_proposal',
        sourceKey: 'product_id',
        targetKey: 'proposal_id',
        tableFields: ['title', 'status', 'tier'],
        filter: {}
      }
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      group: 'Meta', 
      tab: 'Meta',
      defaultValue: 'active',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'deprecated', label: 'Deprecated' },
        { value: 'draft', label: 'Draft' },
        { value: 'archived', label: 'Archived' },
      ]
    },
    {
      name: 'parent_id',
      label: 'Parent Product',
      group: 'Hierarchy', 
      tab: 'Meta',
      type: 'relationship',
      relation: {
        table: 'product',
        labelField: 'title',
        linkTo: '/dashboard/product',
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
      type: 'timestamp' , 
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
        junctionTable: 'category_product',
        sourceKey: 'product_id',
        targetKey: 'category_id',
        tableFields: ['title'],
        filter: {}
      }
    },
  ],
  
  filters: [
    {
      name: 'type',
      type: 'select',
      label: 'Type',
      options: [
        { value: 'website', label: 'Website' },
        { value: 'maintenance', label: 'Maintenance Plans' },
        { value: 'app', label: 'App' },
        { value: 'addon', label: 'Add-on Service' },
        { value: 'consulting', label: 'Consulting' },
      ]
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: [],
      options: [
        { value: 'active', label: 'Active' },
        { value: 'deprecated', label: 'Deprecated' },
        { value: 'draft', label: 'Draft' },
        { value: 'archived', label: 'Archived' },
      ]
    },
    {
      name: 'category_id',
      type: 'relationship',
      label: 'Category',
      relation: {
        table: 'category',
        labelField: 'title'
      }
    },
    {
      name: 'sort',
      type: 'select',
      label: 'Sort',
      defaultValue: 'title:asc',
      options: [
        { value: 'title:asc', label: 'Title (A–Z)' },
        { value: 'title:desc', label: 'Title (Z–A)' },
        { value: 'price:asc', label: 'Price (Low to High)' },
        { value: 'price:desc', label: 'Price (High to Low)' },
        { value: 'created_at:desc', label: 'Newest Created' },
        { value: 'created_at:asc', label: 'Oldest Created' }
      ]
    }
  ]
};