export const task = {
  name: 'task',
  label: 'Tasks',
  singularLabel: 'Task',
  editPathPrefix: '/dashboard/task',
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
        },
        checklist: {
          label: 'Checklist View',
          component: 'ChecklistView'
        },
        calendar: {
          label: 'Calendar',
          component: 'CalendarView', // Make sure this matches the export name of your dynamic calendar view
        },
        
  },
      //Quickview
      quickView: {
        enabled: true,
        imageField: 'thumbnail',
        titleField: 'title',
        subtitleField: 'status',
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
          defaultToCurrentUser: true,
          relation: {
            table: 'contact',
            labelField: 'title',
            linkTo: '/dashboard/contact',
        }},

        {
          name: 'time_tracker',
          type: 'custom',
          component: 'TimeTrackerField',
          label: 'Time Tracker',
          includeInViews: ['default', 'edit'], // <== Ensure edit is included
        },
        
        {
          name: 'parent_id',
          label: 'Parent Project',
          group: 'Project Info',
          tab: 'Overview', 
          type: 'relationship',
          relation: {
            table: 'task',
            labelField: 'title',
            linkTo: '/dashboard/task', // or dynamically derive from config
            filter: { company_id: '{{record.company_id}}' }
          }
        },

        {
          name: 'company_id',
          label: 'Company',
          group: 'Project Info',
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
        
        //Meta
  
    {
      name: 'content',
      label: 'Description',
      type: 'richText',
      group: 'Primary', 
      tab: 'Details',

    },
    {
      name: 'task_type',
      label: 'Type',
      type: 'select',
      group: 'Primary', 
      tab: 'Details',
        options: [
          { value: 'task', label: 'Task' },
          { value: 'meeting', label: 'Meeting' },
          { value: 'error', label: 'Error' },
          { value: 'unavailable', label: 'Unavailable' },
        ],

    },
    
    //Meta
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
      name: 'checklist_id', 
      label: 'Checklist', 
      type: 'relationship',
      group: 'General',
      tab: 'Meta',
      relation: {
        table: 'checklist',
        labelField: 'title',
        linkTo: '/dashboard/checklist' // or dynamically derive from config
      }, 
    },
    { 
      name: 'due_date', 
      group: 'Primary', 
      tab: 'Meta', 
      label: 'Due Date', 
      group: 'General', 
      type: 'date', 
      showInTable: true 
    },
   
    { 
      name: 'author_id', 
      label: 'Author', 
      type: 'relationship',
      group: 'General',
      tab: 'Meta',
      defaultToCurrentUser: true,
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
      defaultValue: 'todo',
      options: [
        { value: 'todo', label: 'To do' },
        { value: 'complete', label: 'Complete' },
        { value: 'in_progress', label: 'In Progress' },
      ]
    },
    {
      name: 'task_type',
      type: 'select',
      label: 'Type',
      defaultValueByView: {
        table: 'task',
        calendar: 'record',
        checklist: 'meeting'
      },
      options: [
        { value: 'task', label: 'Task' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'error', label: 'Error' },
        { value: 'unavailable', label: 'Unavailable' },
      ],
      excludeFromViews: ['checklist']
    },

    {
      name: 'sort',
      type: 'select',
      label: 'Sort',
      options: [
        { value: 'due_date:asc', label: 'Due date (oldest first)' },
        { value: 'due_date:desc', label: 'Due date (newest first)' },
      ],
      defaultValue: 'due_date:asc',
      excludeFromViews: ['calendar', 'checklist']
    },
    {
      name: 'assigned_id',
      type: 'relationship',
      label: 'Assigned To',
      defaultToCurrentUser: true,
      relation: {
        table: 'contact',
        labelField: 'title',

      }
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
  ]
};
