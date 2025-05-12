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
      