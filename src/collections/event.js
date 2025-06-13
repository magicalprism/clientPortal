// collections/event.js
export const event = {
  name: 'event',
  label: 'Events',
  singularLabel: 'Event',
  table: 'event',
  editPathPrefix: '/dashboard/event',
  showEditButton: true,
  defaultView: 'calendar',
  subtitleField: 'title',

  views: {
    table: {
      label: 'Table View',
      component: 'PrimaryTableView'
    },
    calendar: {
      label: 'Calendar View',
      component: 'CalendarView'
    }
  },

  quickView: {
    enabled: true,
    titleField: 'title',
    subtitleField: 'start_time',
    descriptionField: 'description',
    extraFields: ['location', 'status', 'author_id'],
    relatedFields: [],
  },

  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      tab: 'Overview',
      group: 'Details',
      showInTable: true
    },
        {
      name: 'type',
      label: 'Event Type',
      type: 'select',
      tab: 'Overview',
      group: 'Details',
      options: [
        { label: 'Meeting', value: 'meeting' },
        { label: 'Vacation', value: 'vacation' },
        { label: 'Appointment', value: 'appointment' },
        { label: 'Other', value: 'other' }
      ],
      showInTable: true
    },
    {
      name: 'start_time',
      label: 'Start Time',
      type: 'date',
      config: {
        datetime: true
      },
      tab: 'Overview',
      group: 'Details',
      showInTable: true
    },
    {
      name: 'end_time',
      label: 'End Time',
      config: {
        datetime: true
      },
      type: 'date',
      tab: 'Overview',
      group: 'Details',
      showInTable: true
    },
        {
      name: 'zoom_join_url',
      label: 'Zoom Join URL',
      type: 'link',
      tab: 'Overview',
      group: 'Details',
      editable: false,
      showInTable: true
    },
         {
      name: 'description',
      label: 'Description',
      tab: 'Overview',
      group: 'Details',
      fullWidth: true
    },
    {
      name: 'content',
      label: 'Notes',
      type: 'richText',
      tab: 'Overview',
      group: 'Details',
      fullWidth: true
    },

    {
      name: 'action_items',
      label: 'Action Items',
      type: 'custom',
      component: 'ChecklistField',
      tab: 'Overview',
      group: 'Details',
      fullWidth: true,
      props: {
        entityType: 'event',
        variant: 'embedded',
        allowCreate: true,
        allowReorder: true,
        defaultChecklistName: 'Action Items',
        showProgress: true,
        maxChecklists: 10 // Optional limit
      },

    },


    
    {
      name: 'location',
      label: 'Location',
      type: 'text',
      tab: 'Overview',
      group: 'Meta',
    },
    
    {
      name: 'all_day',
      label: 'All Day',
      type: 'boolean',
      tab: 'Overview',
      group: 'Meta',
    },

    {
      name: 'contacts',
      label: 'People Attending',
      type: 'multiRelationship',
      tab: 'Overview',
      group: 'Meta',
      displayMode: 'tags',
      relation: {
        table: 'contact',
        labelField: 'title',
        linkTo: '/dashboard/contact',
        junctionTable: 'contact_event',
        sourceKey: 'event_id',
        targetKey: 'contact_id',
        tableFields: ['title'],
        filter: {}
      }
    },
    {
      name: 'companies',
      label: 'Companies Attending',
      type: 'multiRelationship',
      tab: 'Overview',
      group: 'Meta',
      displayMode: 'tags',
      relation: {
        table: 'company',
        labelField: 'title',
        linkTo: '/dashboard/company',
        junctionTable: 'company_event',
        sourceKey: 'event_id',
        targetKey: 'company_id',
        tableFields: ['title'],
        filter: {}
      }
    },
    {
      name: 'projects',
      label: 'Projects Involved',
      type: 'multiRelationship',
      tab: 'Overview',
      group: 'Meta',
      displayMode: 'tags',
      relation: {
        table: 'project',
        labelField: 'title',
        linkTo: '/dashboard/project',
        junctionTable: 'event_project',
        sourceKey: 'event_id',
        targetKey: 'project_id',
        tableFields: ['title'],
        filter: {},
      }
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      tab: 'Overview',
      group: 'Meta',
      options: [
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' }
      ],
      showInTable: true
    },

    // ✅ NEW: Action Items Tab with ChecklistField
    

    // System fields
    {
      name: 'author_id',
      label: 'Author',
      type: 'relationship',
      tab: 'Meta',
      group: 'System',
      relation: {
        table: 'contact',
        labelField: 'title',
        linkTo: '/dashboard/contact'
      }
    },
    {
      name: 'created_at',
      label: 'Created',
      type: 'timestamp',
      tab: 'Meta',
      group: 'System'
    },
    {
      name: 'updated_at',
      label: 'Updated',
      type: 'timestamp',
      tab: 'Meta',
      group: 'System'
    },
    {
      name: 'deleted_at',
      label: 'Deleted At',
      type: 'timestamp',
      tab: 'Meta',
      group: 'System'
    },
    {
      name: 'is_deleted',
      label: 'Deleted',
      type: 'boolean',
      tab: 'Meta',
      group: 'System'
    },
    {
      name: 'parent_id',
      label: 'Parent Item',
      type: 'relationship',
      tab: 'Meta',
      group: 'Structure',
      relation: {
        table: 'event',
        labelField: 'title',
        linkTo: '/dashboard/event'
      }
    },
    {
      name: 'google_event_id',
      label: 'Google Calendar Event ID',
      type: 'text',
      tab: 'Meta',
      group: 'Integration',
      database: true,
      editable: false,
      includeInViews: ['none']
    },
    {
      name: 'zoom_meeting_id',
      label: 'Zoom Meeting ID',
      type: 'text',
      tab: 'Meta',
      group: 'Integration',
      database: true,
      editable: false,
      includeInViews: ['none']
    },
  ],

  filters: [
    {
      name: 'search',
      label: 'Search',
      type: 'text',
      multiple: false, 
    },
    {
      name: 'type',
      label: 'Event Type',
      type: 'select',
      multiple: false, 
      options: [
        { label: 'Meeting', value: 'meeting' },
        { label: 'Vacation', value: 'vacation' },
        { label: 'Appointment', value: 'appointment' },
        { label: 'Other', value: 'other' }
      ],
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      multiple: false, 
      defaultValue: '',
      options: [
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' }
      ]
    },
    {
      name: 'sort',
      type: 'select',
      label: 'Sort',
      defaultValue: 'start_time:asc',
      options: [
        { value: 'title:asc', label: 'Title (A–Z)' },
        { value: 'start_time:asc', label: 'Start Time (Upcoming)' },
        { value: 'created_at:desc', label: 'Newest Created' }
      ]
    }
  ]
};