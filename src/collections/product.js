 export const product = {
  name: 'product',
  label: 'Products',
  table:'product',
  singularLabel: 'Product',
  editPathPrefix: '/dashboard/product',
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
        imageField: 'thumbnail_id',
        titleField: 'title',
        subtitleField: 'type',
      }, 

  fields: [   
     { 
      name: 'title', 
      label: 'Product Name', 
      group: 'Primary', 
      tab: 'Details',
      clickable: true, 
      openMode: 'modal',  
      showInTable: true,
      description: 'Please use a unique name so it can be easily recognized when a client has multiple sites.'
    },
    {
      name: 'type',
      type: 'select',
      group: 'Primary', 
      tab: 'Details',
      label: 'Type',
      options: [
        { value: 'website', label: 'Website' },
        { value: 'maintenance', label: 'Maintenance Plans' },
        { value: 'app', label: 'App' },
      ]
    },
    { 
      name: 'price', 
      label: 'Price', 
      group: 'Primary', 
      tab: 'Details',
    },
        { 
      name: 'description', 
      label: 'Description', 
      group: 'Primary', 
      tab: 'Details',
      type: 'richText',
    },
          {
      name: 'pages',
      label: 'Pages',
      type: 'multiRelationship',
      group: 'Primary', 
      tab: 'Details',
      displayMode: 'tags',
      relation: {
        table: 'deliverable',
        labelField: 'title',
        linkTo: '/dashboard/deliverable',
        junctionTable: 'deliverable_product',
        sourceKey: 'product_id',
        targetKey: 'deliverable_id',
        tableFields: ['title'],
        filter: {

        }
      }
    },
     {
      name: 'features',
      label: 'Features',
      type: 'multiRelationship',
      group: 'Primary', 
      tab: 'Details',
      displayMode: 'tags',
      relation: {
        table: 'feature',
        labelField: 'title',
        linkTo: '/dashboard/feature',
        junctionTable: 'feature_product',
        sourceKey: 'product_id',
        targetKey: 'features_id',
        tableFields: ['title'],
        filter: {

        }
      }
    },
     {
      name: 'status',
      type: 'select',
      label: 'Status',
      group: 'Primary', 
      tab: 'Meta', 

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
        table: 'product', //usually current collection or pivot table
        labelField: 'title',
        linkTo: '/dashboard/product', // or dynamically derive from config
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
        junctionTable: 'category_product',
        sourceKey: 'product_id',
        targetKey: 'category_id',
        tableFields: ['title'],
        filter: {}
      }
    },
],
  filters: [
    {
      name: 'type',
      type: 'select',
      label: 'Status',
      options: [
        { value: 'website', label: 'Website' },
        { value: 'maintenance', label: 'Maintenance Plans' },
        { value: 'app', label: 'App' },
      ]
    },

  ]
};

