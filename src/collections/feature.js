export const feature = {
  name: 'feature',
  label: 'Features',
  table: 'feature',
  singularLabel: 'Feature',
  editPathPrefix: '/dashboard/feature',
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
    subtitleField: 'feature_type',
  }, 

  fields: [   
    { 
      name: 'title', 
      label: 'Feature Name', 
      group: 'Primary', 
      tab: 'Details',
      clickable: true, 
      openMode: 'modal',  
      showInTable: true,
      description: 'Clear, descriptive feature name'
    },
    { 
      name: 'description', 
      label: 'Description', 
      group: 'Primary', 
      tab: 'Details',
      type: 'richText',
      description: 'Detailed description of what this feature provides'
    },
    {
      name: 'feature_type',
      type: 'select',
      label: 'Feature Type',
      group: 'Classification', 
      tab: 'Details',
      defaultValue: 'standard',
      showInTable: true,
      options: [
        { value: 'standard', label: 'Standard' },
        { value: 'premium', label: 'Premium' },
        { value: 'addon', label: 'Add-on' },
        { value: 'enterprise', label: 'Enterprise' },
      ]
    },
    {
      name: 'is_active',
      label: 'Is Active',
      type: 'boolean',
      group: 'Status',
      tab: 'Details',
      defaultValue: true,
      showInTable: true,
      description: 'Whether this feature is currently available'
    },
    {
      name: 'products',
      label: 'Products Using This Feature',
      type: 'multiRelationship',
      tab: 'Products',
      group: 'Products',
      displayMode: 'table',
      relation: {
        table: 'product',
        labelField: 'title',
        linkTo: '/dashboard/product',
        junctionTable: 'feature_product',
        sourceKey: 'feature_id',
        targetKey: 'product_id',
        tableFields: ['title', 'type', 'price'],
        filter: {}
      }
    },
    {
      name: 'technical_specs',
      label: 'Technical Specifications',
      type: 'richText',
      group: 'Technical',
      tab: 'Technical',
      description: 'Technical details and requirements for this feature'
    },
    {
      name: 'user_benefits',
      label: 'User Benefits',
      type: 'richText',
      group: 'Marketing',
      tab: 'Marketing',
      description: 'Benefits and value proposition for end users'
    },
    {
      name: 'implementation_notes',
      label: 'Implementation Notes',
      type: 'richText',
      group: 'Technical',
      tab: 'Technical',
      description: 'Development and implementation considerations'
    },
    {
      name: 'parent_id',
      label: 'Parent Feature',
      group: 'Hierarchy', 
      tab: 'Meta',
      type: 'relationship',
      relation: {
        table: 'feature',
        labelField: 'title',
        linkTo: '/dashboard/feature',
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
        junctionTable: 'category_feature',
        sourceKey: 'feature_id',
        targetKey: 'category_id',
        tableFields: ['title'],
        filter: {}
      }
    },
  ],
  
  filters: [
    {
      name: 'feature_type',
      type: 'select',
      label: 'Feature Type',
      multiple: true,
      options: [
        { value: 'standard', label: 'Standard' },
        { value: 'premium', label: 'Premium' },
        { value: 'addon', label: 'Add-on' },
        { value: 'enterprise', label: 'Enterprise' },
      ]
    },
    {
      name: 'is_active',
      type: 'select',
      label: 'Status',
      options: [
        { value: true, label: 'Active' },
        { value: false, label: 'Inactive' },
      ]
    },
    {
      name: 'sort',
      type: 'select',
      label: 'Sort',
      defaultValue: 'title:asc',
      options: [
        { value: 'title:asc', label: 'Title (A–Z)' },
        { value: 'title:desc', label: 'Title (Z–A)' },
        { value: 'feature_type:asc', label: 'Type (Standard First)' },
        { value: 'created_at:desc', label: 'Newest Created' },
        { value: 'created_at:asc', label: 'Oldest Created' }
      ]
    }
  ]
};