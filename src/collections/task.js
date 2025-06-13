export const task = {
  name: 'task',
  label: 'Tasks',
  singularLabel: 'Task',
  table: 'task',
  editPathPrefix: '/dashboard/task',
  showEditButton: true, // ✅ just a UI toggle
  subtitleField: 'title',
  defaultView: 'checklist',
  views: {
    table: {
      label: 'Table View',
      component: 'TaskTableView'
    },
         kanban: {
         label: 'Kanban View', 
         component: 'UniversalKanbanView' ,
         hideFilters: true 

        },
        templateTree: { label: 'Task Templates', component: 'TaskTemplateTree' },
        checklist: {
          label: 'Checklist View',
          component: 'ChecklistView',
          hideFilters: true 
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
      name: 'content',
      label: 'Description',
      type: 'richText',
      group: 'Task', 
      tab: 'Details',
      fullWidth: true,

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
        { value: 'not_started', label: 'Not Started' },
        { value: 'todo', label: 'To do' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'complete', label: 'Complete' },
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
      name: 'ref_link',
      label: 'Reference Link (email)',
      type: 'link',
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

        //Meta
         {
      name: 'contacts',
      label: 'Contact',
      type: 'multiRelationship',     
      group: 'General',
      tab: 'Meta',
      displayMode: 'tags',
      relation: {
        table: 'contact',
        labelField: 'title',
        linkTo: '/dashboard/contact',
        junctionTable: 'contact_task',
        sourceKey: 'task_id',
        targetKey: 'contact_id',
        filterFrom: 'contact',
        filter: { company_id: '{{record.company_id}}' },

      }
    },
          {
        name: 'is_template',
        label: 'Is Template',
         type: 'boolean',
         defaultValue: false,
      

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
        name: 'search',
        label: 'Search',
        type: 'text',
        multiple: false,
         excludeFromViews: ['templateTree', 'calendar', , 'kanban'],
      },
      {
        name: 'is_template',
        label: 'Is Template',
         type: 'boolean',
         multiple: false,
          excludeFromViews: ['templateTree', , 'kanban'],

      },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      multiple: true,
      options: [
        { value: 'not_started', label: 'Not Started' },
        { value: 'todo', label: 'To do' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'complete', label: 'Complete' },
        { value: 'archived', label: 'Archived' },    
      ],
      excludeFromViews: ['calendar','templateTree', , 'kanban'],
      defaultValue: ['todo', 'not_started'],
    },
    {
      name: 'task_type',
      type: 'select',
      label: 'Event Type',
      multiple: true,
      options: [
        { value: 'task', label: 'Task' },
        { value: 'vacation', label: 'Vacation' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'archived', label: 'Archived' },       
      ],
      defaultValue: [],
      excludeFromViews: ['table', 'checklist', 'templateTree', 'projectkanban', 'kanban']
    },
     {
      name: 'task_type',
      type: 'select',
      label: 'Event Type',
      multiple: true,
      options: [
        { value: 'task', label: 'Task' },
        { value: 'vacation', label: 'Vacation' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'archived', label: 'Archived' },       
      ],
      excludeFromViews: ['calendar', 'templateTree', 'projectkanban', 'kanban'],
      defaultValue: ['task'],
    },
     {
    name: 'assigned_id',
    label: 'Assigned to',
    type: 'relationship',
    multiple: false, // ✅ Single-select for assignment (typically one person)
    excludeFromViews: ['templateTree', 'projectkanban', 'kanban'],
    relation: {
      table: 'contact',
      labelField: 'title', // ✅ This should show names, not IDs
      filter: { is_assignable: true }
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
      excludeFromViews: ['calendar', 'checklist', 'templateTree', 'projectkanban', 'kanban' ]
    }
  ]
};
