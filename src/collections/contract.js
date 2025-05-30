 export const contract = {
  name: 'contract',
  label: 'Contracts',
  table:'contract',
  singularLabel: 'Contract',
  editPathPrefix: '/dashboard/contract',
  showEditButton: true, // ✅ just a UI toggle
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
      //Quickview
      quickView: {
        enabled: true,
        imageField: 'thumbnail_id',
        titleField: 'title',
        subtitleField: 'status',
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
      description: 'Please use a unique name so it can be easily recognized when a client has multiple sites.'
    },
         { 
      name: 'start_date', 
      label: 'Start Date', 
      group: 'Primary', 
      tab: 'Details',
      type:'date',
    },
             { 
      name: 'due_date', 
      label: 'Due Date', 
      group: 'Primary', 
      tab: 'Details',
      type:'date',
    },
     {
      name: 'products',
      label: 'Products',
      type: 'multiRelationship',
      tab: 'Meta',
      group: 'General',
      displayMode: 'tags',
      relation: {
        table: 'product',
        labelField: 'title',
        linkTo: '/dashboard/product',
        junctionTable: 'contract_product',
        sourceKey: 'contract_id',
        targetKey: 'product_id',
        foreignKey: 'product_id', 
        fields: ['title', 'price', 'description'],
        filter: {}
      }
    },
    {
      name: 'payments',
      label: 'Payment Schedule',
      type: 'payments',
      props: {
        pivotTable: 'contract_payment',    // Your pivot table
        entityField: 'contract_id',        // Foreign key field
        showInvoiceButton: true            // Show/hide invoice button
      }
    },
         {
      name: 'selectedMilestones',
      label: 'Milestones',
      type: 'multiRelationship',
      tab: 'Meta',
      group: 'General',
      displayMode: 'tags',
      relation: {
        table: 'milestone',
        labelField: 'title',
        linkTo: '/dashboard/milestone',
        junctionTable: 'contract_milestone',
        sourceKey: 'contract_id',
        targetKey: 'milestone_id',
        tableFields: ['title'],
        filter: {}
      }
    },
    { 
      name: 'content', 
      label: 'Contract Content', 
      tab: 'Content',
      type: 'richText',
    },
        { 
      name: 'projected_length', 
      label: 'Projected Project Length', 
      group: 'Primary', 
      tab: 'Details',
      type: 'text',
    },
    {
      name: 'platform',
      type: 'select',
      label: 'Platform',
      group: 'Primary', 
      tab: 'Details',
      defaultValue: 'Wordpress',
      options: [
        { value: 'wordpress', label: 'WordPress' },
        { value: 'webStudio', label: 'WebStudio' },
        { value: 'custom', label: 'Custom Platform' },
        { value: 'platform', label: 'Platform' },
      ]
    },
     {
      name: 'status',
      type: 'select',
      label: 'Status',
      group: 'Primary', 
      tab: 'Meta', 
      defaultValue: 'draft',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'approved', label: 'Approved' },
        { value: 'sent', label: 'Sent' },
        { value: 'signed', label: 'Signed' },
      ]
    },
    {
      name: 'parent_id',
      label: 'Parent',
      group: 'General', 
      tab: 'Meta',
      type: 'relationship',
      relation: {
        table: 'contract', //usually current collection or pivot table
        labelField: 'title',
        linkTo: '/dashboard/contract', // or dynamically derive from config
      }
    },

     {
      name: 'company_id',
      label: 'Company',
      group: 'Details',
      tab: 'Overview', 
      type: 'relationship',
      showInTable: true,
  
      relation: {
        table: 'company',
        labelField: 'title',
        linkTo: '/dashboard/company', // or dynamically derive from config
        filter: { is_client: 'true' }
      }
    },
     {
      name: 'proposal_id',
      type: 'relationship',
      label: 'Proposal',
      group: 'Details',
      tab: 'Overview', 
      relation: {
        table: 'proposal',
        labelField: 'title',

      }
    },
      {
      name: 'projects',
      label: 'Projects',
      type: 'multiRelationship',
      tab: 'Meta',
      group: 'General',
      displayMode: 'tags',
      relation: {
        table: 'project',
        labelField: 'title',
        linkTo: '/dashboard/project',
        junctionTable: 'contract_project',
        sourceKey: 'contract_id',
        targetKey: 'project_id',
        tableFields: ['title'],
        filter: {}
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
        linkTo: '/dashboard/contact' // or dynamically derive from config
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
      name: 'company_id',
      type: 'relationship',
      label: 'Company',
      relation: {
        table: 'company',
        labelField: 'title',
        filter: { is_client: true } // optional: filters options
      }
    },
   
  
  ]
};

