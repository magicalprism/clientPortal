export const resource = {
    name: 'resource',
  label: 'Resources',
  singularLabel: 'Resource',
  table: 'resource',
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
        group: 'Oerview', 
        tab: 'Details',
        clickable: true, 
        openMode: 'full', 
         
        showInTable: true,
        description: 'Please use a unique name so it can be easily recognized when a client has multiple sites.'
      },
       { 
        name: 'content', 
        label: 'Content', 
        group: 'Content', 
        tab: 'Details',
        type:'richText',
      },
      {
  name: 'media_items',
  label: 'Downloads & Files',
  type: 'galleryRelationship',
  group: 'Content', 
        tab: 'Details',
  database: false,
  filters: [
    { name: 'mime_type', label: 'File Type' },

], // 👈 multiple fields used in dropdowns
  sortOptions: [ // ✅ Add this here
      { value: 'title:asc', label: 'Title (A–Z)' },
      { value: 'title:desc', label: 'Title (Z–A)' },
      { value: 'created_at:desc', label: 'Newest Created' },
      { value: 'created_at:asc', label: 'Oldest Created' }
    ],
  relation: {
    table: 'media',
    labelField: 'title',
    junctionTable: 'media_resource',
    sourceKey: 'resource_id',
    targetKey: 'media_id',
    foreignKey: 'resource_id',
    filter: {
      resource_id: 'record.id'
    }
  },
  
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
        table: 'resource', //usually current collection or pivot table
        labelField: 'title',
        linkTo: '/dashboard/resource', // or dynamically derive from config

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
  