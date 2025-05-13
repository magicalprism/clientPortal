export const resource = {
    name: 'resource',
    label: 'Resources',
    singularLabel: 'Resource',
    editPathPrefix: '/dashboard/resource',
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
          descriptionField: 'description',
          extraFields: ['goal', 'parent_id']
        }, 
    fields: [   
      // Overview
      { 
        name: 'title', 
        label: 'Title', 
        group: 'Company Info', 
        clickable: true, 
        openMode: 'full', 
        tab: 'Overview', 
        showInTable: true,
        description: 'Please use a unique name so it can be easily recognized when a client has multiple sites.'
      },
        //Meta
    {
      name: 'status',
      label: 'Status',
      group: 'General',
      type: 'select',
      tab: 'Meta',
      showInTable: true,
      
      options:  [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Private', value: 'private' },
        { label: 'Archived', value: 'default' },
      ]
    },

    {
      name: 'type',
      label: 'Page Type',
      type: 'select',
      group: 'General', 
      tab: 'Meta',
      showInTable: true,
      options: [
        { label: 'Website Element', value: 'element' },
        { label: 'SOP', value: 'sop' },
        { label: 'Article', value: 'article' },
        { label: 'Tutorial', value: 'tutorial' },
        { label: 'Other', value: 'other' }
      ]
    },  

    
    {
      name: 'parent_id',
      label: 'Parent Page',
      group: 'General', 
      tab: 'Meta',
      type: 'relationship',
      relation: {
        table: 'element', //usually current collection or pivot table
        labelField: 'title',
        linkTo: '/dashboard/element', // or dynamically derive from config
        filter: { project_id: '{{record.project_id}}' }
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
        sourceKey: 'resource_id',
        targetKey: 'category_id'
      }
    },

  
  ],
  filters: [
    {
      name: 'status',
      label: 'Status',
      group: 'General',
      type: 'select',
      tab: 'Meta',
      showInTable: true,
      
      options:  [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Private', value: 'private' },
        { label: 'Archived', value: 'default' },
      ]
    },
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
    {
      name: 'project_id',
      type: 'relationship',
      label: 'Project',
      relation: {
        table: 'project',
        labelField: 'title',

      }
    }
    
  ]
};
  