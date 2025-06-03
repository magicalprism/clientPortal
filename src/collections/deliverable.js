 export const deliverable = {
  name: 'deliverable',
  label: 'Deliverables',
  table:'deliverable',
  singularLabel: 'Deliverable',
  editPathPrefix: '/dashboard/deliverable',
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
        subtitleField: 'type',
      }, 

  fields: [   
     { 
      name: 'title', 
      label: 'Deliverable Name', 
      group: 'Primary', 
      tab: 'Details',
      clickable: true, 
      openMode: 'modal',  
      showInTable: true,
      description: 'Please use a unique name so it can be easily recognized when a client has multiple sites.'
    },
      {
      name: 'type',
      type: 'select',
      label: 'Type',
      options: [
        { value: 'page', label: 'Page' },
        { value: 'feature', label: 'Feature' },
        { value: 'strategy', label: 'Strategy' },
      ]
    },
     
    {
      name: 'parent_id',
      label: 'Parent',
      group: 'General', 
      tab: 'Meta',
      type: 'relationship',
      relation: {
        table: 'deliverable', //usually current collection or pivot table
        labelField: 'title',
        linkTo: '/dashboard/deliverable', // or dynamically derive from config
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
      name: 'project_id',
      type: 'relationship',
      label: 'Project',
      group: 'Details',
      tab: 'Overview', 
      relation: {
        table: 'project',
        labelField: 'title',

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
        junctionTable: 'category_deliverable',
        sourceKey: 'deliverable_id',
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
      defaultValue: [],
      options: [
        { value: 'page', label: 'Page' },
        { value: 'feature', label: 'Feature' },
        { value: 'strategy', label: 'Strategy' },
      ]
    },

  ]
};

