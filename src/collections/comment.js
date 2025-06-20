 export const comment = {
  name: 'comment',
  label: 'Comments',
   table:'comment',
  singularLabel: 'Comment',
  editPathPrefix: '/dashboard/comment',
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
        titleField: 'title',
        subtitleField: 'status',
      }, 

  fields: [   
     { 
      name: 'title', 
      label: 'Comment Title', 
      group: 'Primary', 
      tab: 'Details',
      clickable: true, 
      openMode: 'modal',  
      showInTable: true,
      description: 'Please use a unique name so it can be easily recognized when a client has multiple sites.'
    },
        {
      name: 'content',
      label: 'General Description',
      type: 'richText',
      tab: 'Overview',
      fullWidth: true,

    },
     {
      name: 'status',
      type: 'select',
      label: 'Status',
      group: 'Primary', 
      tab: 'Meta', 
      defaultValue: 'published',
      options: [
        { value: 'published', label: 'Published' },
      ]
    },
    {
      name: 'parent_id',
      label: 'Parent',
      group: 'General', 
      tab: 'Meta',
      type: 'relationship',
      relation: {
        table: 'comment', //usually current collection or pivot table
        labelField: 'title',
        linkTo: '/dashboard/comment', // or dynamically derive from config
        filter: { company_id: '{{record.company_id}}' }
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
        junctionTable: 'category_comment',
        sourceKey: 'comment_id',
        targetKey: 'category_id',
        tableFields: ['title'],
        filter: {}
      }
    },
    {
      name: 'is_deleted',
      type: 'boolean',
      label: 'Show Deleted',
      tab: 'Meta',
      group: 'General',
      defaultValue: false
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
      defaultValue: 'published',
      options: [
        { value: 'published', label: 'Published' },
      ]
    },
    {
      name: 'sort',
      type: 'select',
      label: 'Sort',
      options: [
        { value: 'created_at:desc', label: 'Newest Created' },
        { value: 'created_at:asc', label: 'Oldest Created' },
        { value: 'title:asc', label: 'Title (A–Z)' },
        { value: 'title:desc', label: 'Title (Z–A)' }
      ],
      defaultValue: 'created_at:desc'
    },
    {
      name: 'is_deleted',
      type: 'boolean',
      label: 'Show Deleted',
      defaultValue: false
    }
  ]
};

