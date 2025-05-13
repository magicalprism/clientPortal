export const contact = {
    name: 'contact',
    label: 'Contacts',
    singularLabel: 'Contact',
    editPathPrefix: '/dashboard/contact',
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
          descriptionField: 'site_tagline',
          extraFields: ['url', 'cloudflare_url']
        }, 
    fields: [   
      // Overview
      { 
        name: 'title', 
        label: 'Title', 
        group: 'Details',
        tab: 'Overview', 
        clickable: true, 
        openMode: 'full',  
        showInTable: true,
      },
      { 
        name: 'email', 
        label: 'Email', 
        group: 'Details',
        tab: 'Overview', 
        openMode: 'full',  
        showInTable: true,
      },
      { 
        name: 'role', 
        label: 'Role', 
        group: 'Details',
        tab: 'Overview', 
        openMode: 'full',  
        showInTable: true,
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
        table: 'contact', //usually current collection or pivot table
        labelField: 'title',
        linkTo: '/dashboard/contact', // or dynamically derive from config
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
      displayMode: 'tags',
      group: 'General',
      tab: 'Meta',
      relation: {
        table: 'category',
        labelField: 'title',
        linkTo: '/dashboard/category',
        junctionTable: 'category_contact',
        sourceKey: 'contact_id',
        targetKey: 'category_id'
      }
    },
],

    filters: [
      {
        name: 'status',
        type: 'select',
        label: 'Status',
        options: [  
          { value: 'active', label: 'Active' },
          { value: 'archived', label: 'Archived' },
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
          { value: 'created_at:desc', label: 'Newest Created' },
          { value: 'created_at:asc', label: 'Oldest Created' }
        ]
      }
      
      
    ]
}
      