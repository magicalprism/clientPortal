 export const proposal = {
  name: 'proposal',
  label: 'Proposals',
  table:'proposal',
  singularLabel: 'Proposal',
  editPathPrefix: '/dashboard/proposal',
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
      label: 'Proposal Name', 
      group: 'Primary', 
      tab: 'Details',
      clickable: true, 
      openMode: 'modal',  
      showInTable: true,
      description: 'Please use a unique name so it can be easily recognized when a client has multiple sites.'
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
        { value: 'archive', label: 'Archived' },
      ]
    },
    {
      name: 'parent_id',
      label: 'Parent',
      group: 'General', 
      tab: 'Meta',
      type: 'relationship',
      relation: {
        table: 'proposal', //usually current collection or pivot table
        labelField: 'title',
        linkTo: '/dashboard/proposal', // or dynamically derive from config
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
        junctionTable: 'proposal_project',
        sourceKey: 'project_id',
        targetKey: 'category_id',
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

