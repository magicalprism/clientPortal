export const checklist = {
    name: 'checklist',
    label: 'Checklists',
    singularLabel: 'Checklist',
    editPathPrefix: '/dashboard/checklist',
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
        clickable: true, 
        openMode: 'full', 
        tab: 'Overview', 
        showInTable: true,
        description: 'Please use a unique name so it can be easily recognized when a client has multiple sites.'
      },
    ],

    filters: [
      {
        name: 'status',
        type: 'select',
        label: 'Status',
        options: ['draft', 'published', 'archived']
      },
      
    ]
}
      