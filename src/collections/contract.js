export const contract = {
  name: 'contract',
  label: 'Contracts',
  table: 'contract',
  singularLabel: 'Contract',
  editPathPrefix: '/dashboard/contract',
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
    subtitleField: 'signature_status',
  }, 

  fields: [   
    { 
      name: 'title', 
      label: 'Contract Name', 
      group: 'Primary', 
      tab: 'Details',
      clickable: true, 
      openMode: 'modal',  
      showInTable: true,
      description: 'Contract title for identification'
    },
    {
      name: 'proposal_id',
      label: 'Source Proposal',
      group: 'Primary',
      tab: 'Details',
      type: 'relationship',
      showInTable: true,
      relation: {
        table: 'proposal',
        labelField: 'title',
        linkTo: '/dashboard/proposal',
        filter: {}
      }
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
      name: 'start_date', 
      label: 'Start Date', 
      group: 'Timeline', 
      tab: 'Details',
      type: 'date',
      showInTable: true,
    },
    { 
      name: 'due_date', 
      label: 'Due Date', 
      group: 'Timeline', 
      tab: 'Details',
      type: 'date',
    },
    { 
      name: 'projected_length', 
      label: 'Projected Project Length', 
      group: 'Timeline', 
      tab: 'Details',
      type: 'text',
      description: 'e.g., "3-6 months", "Ongoing"'
    },
    {
      name: 'platform',
      type: 'select',
      label: 'Platform',
      group: 'Technical', 
      tab: 'Details',
      defaultValue: 'wordpress',
      options: [
        { value: 'wordpress', label: 'WordPress' },
        { value: 'webstudio', label: 'WebStudio' },
        { value: 'custom', label: 'Custom Platform' },
        { value: 'shopify', label: 'Shopify' },
        { value: 'other', label: 'Other' },
      ]
    },
    { 
      name: 'content', 
      label: 'Contract Content', 
      tab: 'Content',
      type: 'richText',
      fullWidth: true,
      description: 'Full assembled contract content'
    },
    {
      name: 'status',
      type: 'select',
      label: 'Contract Status',
      group: 'Status', 
      tab: 'Status', 
      defaultValue: 'draft',
      showInTable: true,
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'pending_signature', label: 'Pending Signature' },
        { value: 'signed', label: 'Signed' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'expired', label: 'Expired' },
      ]
    },
    {
      name: 'signature_status',
      type: 'select',
      label: 'Signature Status',
      group: 'Status', 
      tab: 'Status', 
      editable: false,
      showInTable: true,
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'sent', label: 'Sent for Signature' },
        { value: 'signed', label: 'Signed' },
        { value: 'declined', label: 'Declined' },
        { value: 'expired', label: 'Expired' },
      ]
    },
    {
      name: 'signature_document_id',
      label: 'E-Signature Document ID',
      group: 'Signature',
      tab: 'Status',
      editable: false,
      description: 'External platform document ID'
    },
    {
      name: 'signature_platform',
      label: 'Signature Platform',
      group: 'Signature',
      tab: 'Status',
      editable: false,
      description: 'Platform used for e-signatures'
    },
    {
      name: 'signature_sent_at',
      label: 'Sent for Signature At',
      type: 'timestamp',
      group: 'Signature',
      tab: 'Status',
      editable: false,
    },
    {
      name: 'signature_signed_at',
      label: 'Signed At',
      type: 'timestamp',
      group: 'Signature',
      tab: 'Status',
      editable: false,
    },
    {
      name: 'payments',
      label: 'Payment Schedule',
      type: 'payments',
      tab: 'Payments',
      props: {
        pivotTable: 'contract_payment',
        entityField: 'contract_id',
        showInvoiceButton: true
      }
    },
    {
      name: 'products',
      label: 'Contract Products',
      type: 'multiRelationship',
      tab: 'Products',
      group: 'Products',
      displayMode: 'table',
      relation: {
        table: 'product',
        labelField: 'title',
        linkTo: '/dashboard/product',
        junctionTable: 'contract_product',
        sourceKey: 'contract_id',
        targetKey: 'product_id',
        tableFields: ['title', 'price', 'yearly_price'],
        filter: {}
      }
    },
    {
      name: 'selectedMilestones',
      label: 'Project Milestones',
      type: 'multiRelationship',
      tab: 'Milestones',
      group: 'Milestones',
      displayMode: 'tags',
      relation: {
        table: 'milestone',
        labelField: 'title',
        linkTo: '/dashboard/milestone',
        junctionTable: 'contract_milestone',
        sourceKey: 'contract_id',
        targetKey: 'milestone_id',
        tableFields: ['title', 'description'],
        filter: {}
      }
    },
    {
      name: 'projects',
      label: 'Related Projects',
      type: 'multiRelationship',
      tab: 'Projects',
      group: 'Projects',
      displayMode: 'tags',
      relation: {
        table: 'project',
        labelField: 'title',
        linkTo: '/dashboard/project',
        junctionTable: 'contract_project',
        sourceKey: 'contract_id',
        targetKey: 'project_id',
        tableFields: ['title', 'status'],
        filter: {}
      }
    },
    {
      name: 'parent_id',
      label: 'Parent Contract',
      group: 'Hierarchy', 
      tab: 'Meta',
      type: 'relationship',
      relation: {
        table: 'contract',
        labelField: 'title',
        linkTo: '/dashboard/contract',
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
        junctionTable: 'category_contract',
        sourceKey: 'contract_id',
        targetKey: 'category_id',
        tableFields: ['title'],
        filter: {}
      }
    },
  ],
  
  filters: [
    {
      name: 'status',
      type: 'select',
      label: 'Contract Status',
      defaultValue: [],
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'pending_signature', label: 'Pending Signature' },
        { value: 'signed', label: 'Signed' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'expired', label: 'Expired' },
      ]
    },
    {
      name: 'signature_status',
      type: 'select',
      label: 'Signature Status',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'sent', label: 'Sent for Signature' },
        { value: 'signed', label: 'Signed' },
        { value: 'declined', label: 'Declined' },
        { value: 'expired', label: 'Expired' },
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
      name: 'proposal_id',
      type: 'relationship',
      label: 'Proposal',
      relation: {
        table: 'proposal',
        labelField: 'title'
      }
    },
    {
      name: 'sort',
      type: 'select',
      label: 'Sort',
      defaultValue: 'created_at:desc',
      options: [
        { value: 'created_at:desc', label: 'Newest Created' },
        { value: 'created_at:asc', label: 'Oldest Created' },
        { value: 'title:asc', label: 'Title (A–Z)' },
        { value: 'title:desc', label: 'Title (Z–A)' },
        { value: 'start_date:desc', label: 'Start Date (Newest)' },
        { value: 'start_date:asc', label: 'Start Date (Oldest)' },
      ]
    }
  ]
};