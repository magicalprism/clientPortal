 export const category = {
  name: 'category',
  label: 'Categories',
  table:'category',
  singularLabel: 'Category',
  editPathPrefix: '/dashboard/category',
  showEditButton: true, // ✅ just a UI toggle
  subtitleField: 'title',
  defaultView: 'table',
  views: {
    table: {
      label: 'Table View',
      component: 'PrimaryTableView'
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
      label: 'Category Name', 
      group: 'Primary', 
      tab: 'Details',
      clickable: true, 
      showInTable: true,
    },
     {
      name: 'status',
      type: 'select',
      label: 'Status',
      group: 'Primary', 
      tab: 'Meta', 
      defaultValue: [],
      options: [
        { value: 'todo', label: 'To do' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'complete', label: 'Complete' },
        { value: 'archived', label: 'Archived' },
      ]
    },
      {
      name: 'is_deleted',
      type: 'boolean',
      label: 'Show Deleted',
      tab: 'Meta',
      group: 'General',
      defaultValue: false
    },

    {
      name: 'parent_id',
      label: 'Parent',
      group: 'General', 
      tab: 'Meta',
      type: 'relationship',
      relation: {
        table: 'category', //usually current collection or pivot table
        labelField: 'title',
        linkTo: '/dashboard/category', // or dynamically derive from config
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
        junctionTable: 'category_category',
        sourceKey: 'category_id',
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
      defaultValue: 'todo',
      options: [
        { value: 'todo', label: 'To do' },
        { value: 'complete', label: 'Complete' },
        { value: 'in_progress', label: 'In Progress' },
      ]
    },
    {
      name: 'sort',
      type: 'select',
      label: 'Sort',
      options: [
        { value: 'title:asc', label: 'Title (A–Z)' },
        { value: 'title:desc', label: 'Title (Z–A)' },
        { value: 'created_at:desc', label: 'Newest Created' },
        { value: 'created_at:asc', label: 'Oldest Created' }
      ],
      defaultValue: 'title:asc'
    },
        {
      name: 'is_deleted',
      type: 'boolean',
      label: 'Show Deleted',
      defaultValue: false
    }
  ]
};

