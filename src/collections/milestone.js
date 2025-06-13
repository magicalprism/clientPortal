export const milestone = {
  name: 'milestone',
  label: 'Milestones',
  table: 'milestone',
  singularLabel: 'Milestone',
  editPathPrefix: '/dashboard/milestone',
  showEditButton: true,
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
    calendar: {
      label: 'Calendar',
      component: 'CalendarView',
    },
  },
  quickView: {
    enabled: true,
    imageField: 'thumbnail_id',
    titleField: 'title',
    subtitleField: 'status',
  }, 

  fields: [   
    { 
      name: 'title', 
      label: 'Milestone Title', 
      group: 'Primary', 
      tab: 'Details',
      clickable: true, 
      openMode: 'modal',  
      showInTable: true,
      description: 'Clear, descriptive milestone name'
    },
    { 
      name: 'description', 
      label: 'Description', 
      group: 'Primary', 
      tab: 'Details',
      type: 'richText',
      description: 'Detailed description of what this milestone entails'
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      group: 'Status', 
      tab: 'Details',
      defaultValue: 'pending',
      showInTable: true,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ]
    },

    { 
      name: 'order_index', 
      label: 'Sort Order', 
      group: 'Organization', 
      tab: 'Details',
      type: 'number',
      defaultValue: 1,
      description: 'Order for milestone sequencing'
    },

    /*
    { 
      name: 'due_date', 
      label: 'Due Date', 
      group: 'Schedule', 
      tab: 'Details',
      type: 'date',
      showInTable: true,
    },
    {
      name: 'completed_at',
      label: 'Completed At',
      type: 'timestamp',
      group: 'Schedule',
      tab: 'Details',
      editable: false,
      description: 'Automatically set when status changes to completed'
    },
    {
      name: 'company_id',
      label: 'Company',
      group: 'Reference',
      tab: 'Reference', 
      type: 'relationship',
      showInTable: true,
      relation: {
        table: 'company',
        labelField: 'title',
        linkTo: '/dashboard/company',
        filter: { is_client: 'true' }
      }
    },
    {
      name: 'project_id',
      type: 'relationship',
      label: 'Project',
      group: 'Reference',
      tab: 'Reference', 
      relation: {
        table: 'project',
        labelField: 'title',
        linkTo: '/dashboard/project',
      }
    },
    */
    {
      name: 'contracts',
      label: 'Related Contracts',
      type: 'multiRelationship',
      tab: 'Usage',
      group: 'Usage',
      displayMode: 'table',
      relation: {
        table: 'contract',
        labelField: 'title',
        linkTo: '/dashboard/contract',
        junctionTable: 'contract_milestone',
        sourceKey: 'milestone_id',
        targetKey: 'contract_id',
        tableFields: ['title', 'status'],
        filter: {}
      }
    },
    {
      name: 'tasks',
      label: 'Related Tasks',
      type: 'multiRelationship',
      tab: 'Tasks',
      group: 'Tasks',
      displayMode: 'table',
      relation: {
        table: 'task',
        labelField: 'title',
        linkTo: '/dashboard/task',
        junctionTable: 'milestone_task',
        sourceKey: 'milestone_id',
        targetKey: 'task_id',
        tableFields: ['title', 'status', 'due_date'],
        filter: {}
      }
    },
    {
      name: 'parent_id',
      label: 'Parent Milestone',
      group: 'Hierarchy', 
      tab: 'Meta',
      type: 'relationship',
      relation: {
        table: 'milestone',
        labelField: 'title',
        linkTo: '/dashboard/milestone',
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
      type: 'timestamp', 
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
        linkTo: '/dashboard/contact'
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
        junctionTable: 'category_milestone',
        sourceKey: 'milestone_id',
        targetKey: 'category_id',
        tableFields: ['title'],
        filter: {}
      }
    },
  ],
  
  filters: [
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      multiple: true,
      defaultValue: ['pending', 'in_progress'],
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ]
    },
    {
      name: 'company_id',
      type: 'relationship',
      label: 'Company',
      relation: {
        table: 'company',
        labelField: 'title',
        filter: { is_client: true }
      }
    },
    {
      name: 'project_id',
      type: 'relationship',
      label: 'Project',
      relation: {
        table: 'project',
        labelField: 'title'
      }
    },
    {
      name: 'sort',
      type: 'select',
      label: 'Sort',
      options: [
        { value: 'order_index:asc', label: 'Sort Order (1-9)' },
        { value: 'due_date:asc', label: 'Due Date (Oldest First)' },
        { value: 'due_date:desc', label: 'Due Date (Newest First)' },
        { value: 'created_at:desc', label: 'Newest Created' },
        { value: 'created_at:asc', label: 'Oldest Created' },
        { value: 'title:asc', label: 'Title (A–Z)' },
        { value: 'title:desc', label: 'Title (Z–A)' },
      ],
      defaultValue: 'order_index:asc',
      excludeFromViews: ['calendar']
    }
  ]
};