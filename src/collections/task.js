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

     { 
      name: 'task_type', 
      label: 'What kind of task/event is this?', 
      group: 'Task', 
      tab: 'Details', 
      type: 'select',
      defaultValue: 'task',
      options: [
        { value: 'task', label: 'Task' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'unavailable', label: 'Unavailable' },
      ]
    },
        
        { name: 'assigned_id', 
          label: 'Assigned To', 
          showInTable: true,
          type: 'relationship',
          group: 'Task', 
          tab: 'Details',
          relation: {
            table: 'contact',
            labelField: 'title',
            linkTo: '/dashboard/contact',
            filter: { is_assignable: true }
        }},
         {
      name: 'status',
      label: 'Status', 
      tab: 'Details',
      group: 'Task', 
      type: 'select', 
      defaultValue: 'todo',
      options: [
        { value: 'not started', label: 'Not Started' },
        { value: 'todo', label: 'To do' },
        { value: 'complete', label: 'Complete' },
        { value: 'unavailable', label: 'Unavailable' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'archived', label: 'Archived' },
      ]
    },
            { 
      name: 'start_date', 
          label: 'Start Date', 
      group: 'Task', 
      tab: 'Details',
      type: 'date', 
      showInTable: true 
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
      name: 'is_launch', 
          label: 'This task contains the project launch date', 
      group: 'Task', 
      tab: 'Details',
      type: 'boolean', 
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
      name: 'parent_id', 
      label: 'Parent', 
      type: 'relationship',
      group: 'General',
      tab: 'Meta',
      relation: {
        table: 'task',
        labelField: 'title',
        linkTo: '/dashboard/task' // or dynamically derive from config
      }, 
    },
    { 
      name: 'elements', 
      label: 'Elements', 
      type: 'multiRelationship',
      displayMode: 'tags',
      group: 'General',
      tab: 'Meta',
      relation: {
        table: 'element',
        labelField: 'title',
        linkTo: '/dashboard/element',
        junctionTable: 'element_task',
        sourceKey: 'task_id',
        targetKey: 'element_id',
       filter: { project_id: '{{record.project_id}}' },
       filterFrom: 'task'


      }
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
      options: [
        { value: 'not started', label: 'Not Started' },
        { value: 'todo', label: 'To do' },
        { value: 'complete', label: 'Complete' },
        { value: 'unavailable', label: 'Unavailable' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'archived', label: 'Archived' },       
      ],
      excludeFromViews: ['calendar'],
      defaultValue: 'todo',
    },
    {
      name: 'task_type',
      type: 'select',
      label: 'Event Type',
      options: [
        { value: 'task', label: 'Task' },
        { value: 'vacation', label: 'Vacation' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'archived', label: 'Archived' },       
      ],
      defaultValue: 'task',
      excludeFromViews: ['table', 'checklist']
    },
     {
      name: 'task_type',
      type: 'select',
      label: 'Event Type',
      options: [
        { value: 'task', label: 'Task' },
        { value: 'vacation', label: 'Vacation' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'archived', label: 'Archived' },       
      ],
      excludeFromViews: ['calendar'],
      defaultValue: '',
    },
    {
      name: 'assigned_id',
      label: 'Assigned to',
      type: 'relationship',
      relation: {
        table: 'contact', //usually current collection or pivot table
        labelField: 'title',
        filter: { is_assignable: true } //temporary until I add all clients & contractors as users 
      }
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
    }
  ]
};
