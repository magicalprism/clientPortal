export const company = {
    name: 'company',
    label: 'Companies',
    singularLabel: 'Company',
    editPathPrefix: '/dashboard/company',
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
      name: 'thumbnail_id',
      label: 'Logo Mark',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
        group: 'Details',
        tab: 'Overview', 
    },
    
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      group: 'Primary', 
      tab: 'Meta', 
      defaultValue: 'in_progress',
      options: [
        { value: 'maintained', label: 'Maintained' },
        { value: 'active', label: 'Active' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'external', label: 'External' },
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
        table: 'company', //usually current collection or pivot table
        labelField: 'title',
        linkTo: '/dashboard/company', // or dynamically derive from config

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
      name: 'chip_color', 
      label: 'Label Background (Chip)', 
      type: 'color',
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
        junctionTable: 'category_company',
        sourceKey: 'company_id',
        targetKey: 'category_id'
      }
    },
],

    filters: [
      {
        name: 'status',
        type: 'select',
        label: 'Status',
        defaultValue: '',
        options: [
           { value: 'maintained', label: 'Maintained' },
        { value: 'active', label: 'Active' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'external', label: 'External' },
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
      