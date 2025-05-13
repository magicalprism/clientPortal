export const section = {
    name: 'section',
    label: 'Sections',
    singularLabel: 'Section',
    editPathPrefix: '/dashboard/section',
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
        description: 'Please use a unique name so it can be easily recognized when a client has multiple sites.'
      },
      { 
        name: 'content', 
        label: 'Content', 
        group: 'Details',
        type: 'richText',
        tab: 'Overview', 
       
      },
      {
        name: 'parent_id',
        label: 'Parent ',
        group: 'Info',
        tab: 'Overview', 
        type: 'relationship',
        relation: {
          table: 'project',
          labelField: 'title',
          linkTo: '/dashboard/section', // or dynamically derive from config
          filter: { company_id: '{{record.company_id}}' }
        }
      },
      {
        name: 'company_id',
        label: 'Company',
        group: 'Info',
        tab: 'Overview', 
        type: 'relationship',
        relation: {
          table: 'company',
          labelField: 'title',
          linkTo: '/dashboard/company', // or dynamically derive from config
          filter: { company_id: '{{record.company_id}}' }
        }
      },
      {
        name: 'element_id',
        label: 'Eelement',
        group: 'Info',
        tab: 'Overview', 
        type: 'relationship',
        relation: {
          table: 'element',
          labelField: 'title',
          linkTo: '/dashboard/element', // or dynamically derive from config
          filter: { company_id: '{{record.element_id}}' }
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
        name: 'is_client',
        type: 'select',
        label: 'Is Client',
        defaultValue: true,
        options: [
          { value: true, label: 'Yes' },
          { value: false, label: 'No' },
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
      