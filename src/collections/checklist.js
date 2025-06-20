export const checklist = {
    name: 'checklist',
    label: 'Checklists',
    editPathPrefix: '/dashboard/checklist',
    table: 'checklist',
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
            kanban: {
               label: 'Kanban View', 
               component: 'KanbanView' 
              }
        },
        //Quickview
        quickView: {
          enabled: true,
          imageField: 'thumbnail_id',
          titleField: 'title',
          subtitleField: 'status',
        }, 
    fields: [   
      // Overview
      { 
        name: 'title', 
        label: 'Title', 
        group: 'Details', 
        clickable: true, 
        openMode: 'full', 
        tab: 'Overview', 
        showInTable: true,
        description: 'Please use a unique name so it can be easily recognized when a client has multiple sites.'
      },
     {
      name: 'status',
      type: 'select',
      label: 'Status',
      group: 'Primary', 
      tab: 'Meta', 
      defaultValue: 'todo',
      options: [
        { value: 'todo', label: 'To do' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'complete', label: 'Complete' },
        { value: 'archived', label: 'Archived' },
      ]
    },
    {
      name: 'parent_id',
      label: 'Parent',
      group: 'General', 
      tab: 'Meta',
      type: 'relationship',
      relation: {
        table: 'checklist', //usually current collection or pivot table
        labelField: 'title',
        linkTo: '/dashboard/checklist', // or dynamically derive from config
      }
    },
     { name: 'task', table: 'task' } ,

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
      displayMode: 'tags',
      group: 'General',
      tab: 'Meta',
      relation: {
        table: 'category',
        labelField: 'title',
        linkTo: '/dashboard/category',
        junctionTable: 'category_resource',
        sourceKey: 'checklist_id',
        targetKey: 'category_id'
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
      defaultValue: ['todo'],
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
}
      