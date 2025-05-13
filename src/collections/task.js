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
      component: 'TaskTableView'
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
      group: 'Task', 
      tab: 'Details',
      clickable: true, 
      openMode: 'modal',  
      showInTable: true,
    },
        
        { name: 'assigned_id', 
          label: 'Assigned To', 
          type: 'relationship',
          group: 'Task', 
          tab: 'Details',
          relation: {
            table: 'contact',
            labelField: 'title',
            linkTo: '/dashboard/contact',
        }},
         {
      name: 'status',
      label: 'Status', 
      tab: 'Details',
      group: 'Task', 
      type: 'status', 
      defaultValue: 'todo',
      options: [
        { value: 'todo', label: 'To do' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'complete', label: 'Complete' },
        { value: 'archived', label: 'Archived' },
      ]
    },
        { 
      name: 'due_date', 
          label: 'Due Date', 
      group: 'Task', 
      tab: 'Details',
      type: 'date', 
      showInTable: true 
    },
    

        {
          name: 'time_tracker',
          type: 'custom',
          component: 'TimeTrackerField',
          label: 'Time Tracker',
          includeInViews: ['edit'], 
        },
        
  
    {
      name: 'content',
      label: 'Description',
      type: 'richText',
      group: 'Task', 
      tab: 'Details',
      fullWidth: true,

    },
    
    //Meta
    {
      name: 'company_id',
      label: 'Company',
      group: 'Reference',
      tab: 'Details', 
      showInTable: true,
      type: 'relationship',
      relation: {
        table: 'company',
        labelField: 'title',
        linkTo: '/dashboard/company', // or dynamically derive from config
        filter: { is_client: 'true' }
      }
    },
    {
      name: 'project_id',
      label: 'Project',
      group: 'Reference',
      tab: 'Details', 
      type: 'relationship',
      relation: {
        table: 'project',
        labelField: 'title',
        linkTo: '/dashboard/project',
      }
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
        junctionTable: 'category_task',
        sourceKey: 'task_id',
        targetKey: 'category_id'
      }
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
      defaultValue: 'todo',
      options: [
        { value: 'todo', label: 'To do' },
        { value: 'complete', label: 'Complete' },
        { value: 'in_progress', label: 'In Progress' },
      ]
    },
    {
      name: 'sort',
      type: 'select',
      label: 'Sort',
      options: [
        { value: 'due_date:asc', label: 'Due date (oldest first)' },
        { value: 'due_date:desc', label: 'Due date (newest first)' },
      ],
      defaultValue: 'due_date:asc'
    }
  ]
};
