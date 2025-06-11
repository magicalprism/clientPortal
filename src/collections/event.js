export const event = {
  name: 'event',
  label: 'Events',
  singularLabel: 'Event',
  table: 'event',
  editPathPrefix: '/dashboard/event',
  showEditButton: true,
  defaultView: 'table',
  subtitleField: 'title',

  views: {
    table: {
      label: 'Table View',
      component: 'PrimaryTableView'
    },
    page: {
      label: 'Page View',
      component: 'PageView'
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
      name: 'description',
      label: 'Description',
      type: 'richText',
      tab: 'Overview',
      group: 'Details',
      fullWidth: true
    },
    {
      name: 'location',
      label: 'Location',
      type: 'text',
      tab: 'Overview',
      group: 'Details'
    },
    {
      name: 'start_time',
      label: 'Start Time',
      type: 'timestamp',
      tab: 'Overview',
      group: 'Timing',
      showInTable: true
    },
    {
      name: 'end_time',
      label: 'End Time',
      type: 'timestamp',
      tab: 'Overview',
      group: 'Timing',
      showInTable: true
    },
    {
      name: 'all_day',
      label: 'All Day',
      type: 'boolean',
      tab: 'Overview',
      group: 'Timing'
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
      label: 'Parent Event',
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
{
  name: 'zoom_join_url',
  label: 'Zoom Join URL',
  type: 'link',
  tab: 'Overview',
  group: 'Details',
  editable: false,
  showInTable: true
}

  ],

  filters: [
    {
      name: 'search',
      label: 'Search',
      type: 'text'
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
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
