export const task = {
  name: 'task',
  label: 'Tasks',
  editPathPrefix: '/dashboard/task',
  subtitleField: 'title',
  showEditButton: true, // ✅ just a UI toggle
      //Quickview
      quickView: {
        enabled: true,
        imageField: 'thumbnail',
        titleField: 'title',
        subtitleField: 'status',
      }, 
      // Add default filters to apply when the table loads
   // Add default filters - this will be applied when the table is loaded
   defaultFilters: {
    status: 'todo'  // Set initial status filter to 'todo'
  },
  fields: [   
    // Overview
    { 
      name: 'title', 
      label: 'Task Name', 
      group: 'Primary', 
      tab: 'Details',
      clickable: true, 
      openMode: 'modal',  
      showInTable: true,
      description: 'Please use a unique name so it can be easily recognized when a client has multiple sites.'
    },
        
        { name: 'assigned_id', 
          label: 'Assigned To', 
          type: 'relationship',
          group: 'Primary', 
          tab: 'Details',
          relation: {
            table: 'contact',
            labelField: 'title',
            linkTo: '/dashboard/contact',
        }},
        
        //Meta
  
    {
      name: 'content',
      label: 'Description',
      type: 'richText',
      group: 'Primary', 
      tab: 'Details',

    },
    
    //Meta
    { 
      name: 'status', 
      group: 'Primary', 
      tab: 'Details',
      label: 'Status', 
      group: 'General', 
      type: 'status', 
      tab: 'Meta', 
      showInTable: true 
    },
    { 
      name: 'due_date', 
      group: 'Primary', 
      tab: 'Details',
      label: 'Due Date', 
      group: 'General', 
      type: 'date', 
      tab: 'Meta', 
      showInTable: true 
    },
    { 
      name: 'created', 
      label: 'Created', 
      type: 'date',
      group: 'General', 
      tab: 'Meta'
    },
    { 
      name: 'updated_at', label: 'Updated At', type: 'date' , 
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
  
  ],
  filters: [
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      options: ['todo', 'complete', 'in_progress']
    },
    {
      name: 'sort',
      type: 'select',
      label: 'Sort',
      options: [
        { value: 'due_date:asc', label: 'Due date (oldest first)' },
        { value: 'due_date:desc', label: 'Due date (newest first)' },
      ]
    }
  ]
};
