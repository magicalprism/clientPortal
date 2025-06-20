export const color = {
  name: 'color',
  label: 'Color',
  singularLabel: 'Color',
   table:'color',
  editPathPrefix: '/dashboard/color',
  subtitleField: 'token',
  showEditButton: true,
  defaultView: 'table',

  quickView: {
    enabled: true,
    titleField: 'token',
    subtitleField: 'mode',
    imageField: null
  },

  views: {
    table: {
      label: 'Table View',
      component: 'TaskTableView'
    }
  },

  fields: [
    { name: 'title', label: 'Title', type: 'text', showInTable: true, tab: 'General', group: 'Details' },
    { name: 'token', label: 'Token', type: 'text', showInTable: true, tab: 'General', group: 'Details' },
    { name: 'description', label: 'Description', type: 'textarea', tab: 'General', group: 'Details' },
    { name: 'value', label: 'Value', type: 'text', tab: 'Color Values', group: 'Resolved' },
    { name: 'resolved', label: 'Resolved Hex', type: 'color', tab: 'Color Values', group: 'Resolved' },
    { name: 'mode', label: 'Mode', type: 'select', options: [
        { value: 'lightmode', label: 'Light Mode' },
        { value: 'darkmode', label: 'Dark Mode' },
        { value: 'base', label: 'Base' }
      ], tab: 'General', group: 'Details'
    },
    { name: 'group', label: 'Group', type: 'text', tab: 'General', group: 'Details' },
    { name: 'type', label: 'Type', type: 'select', options: [
        { value: 'base', label: 'Base' },
        { value: 'alias', label: 'Alias' }
      ], tab: 'General', group: 'Details'
    },

    // Relationships
    {
      name: 'brand_id',
      label: 'Brand',
      type: 'relationship',
      relation: {
        table: 'brand',
        labelField: 'title',
        linkTo: '/dashboard/brand'
      },
      tab: 'Meta',
      group: 'Relations'
    },
    {
      name: 'author_id',
      label: 'Author',
      type: 'relationship',
      relation: {
        table: 'contact',
        labelField: 'title',
        linkTo: '/dashboard/contact'
      },
      tab: 'Meta',
      group: 'Relations'
    },
    {
      name: 'parent_id',
      label: 'Parent Color',
      type: 'relationship',
      relation: {
        table: 'color',
        labelField: 'token',
        linkTo: '/dashboard/color'
      },
      tab: 'Meta',
      group: 'Relations'
    },

    // Timestamps
    { name: 'created_at', label: 'Created At', type: 'timestamp', tab: 'Meta', group: 'System', showInTable: true },
    { name: 'updated_at', label: 'Updated At', type: 'timestamp', tab: 'Meta', group: 'System' },
    { name: 'is_deleted', label: 'Show Deleted', type: 'boolean', tab: 'Meta', group: 'System', defaultValue: false }
  ],

  filters: [
    {
      name: 'search',
      label: 'Search',
      type: 'text',
      multiple: false
    },
    {
      name: 'mode',
      label: 'Mode',
      type: 'select',
      options: [
        { value: 'lightmode', label: 'Light Mode' },
        { value: 'darkmode', label: 'Dark Mode' },
        { value: 'base', label: 'Base' }
      ]
    },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'base', label: 'Base' },
        { value: 'alias', label: 'Alias' }
      ]
    },
    {
      name: 'brand_id',
      label: 'Brand',
      type: 'relationship',
      relation: {
        table: 'brand',
        labelField: 'title'
      }
    },
    {
      name: 'sort',
      label: 'Sort',
      type: 'select',
      options: [
        { value: 'token:asc', label: 'Token (A–Z)' },
        { value: 'token:desc', label: 'Token (Z–A)' },
        { value: 'created_at:desc', label: 'Newest' },
        { value: 'created_at:asc', label: 'Oldest' }
      ]
    },
    {
      name: 'is_deleted',
      type: 'boolean',
      label: 'Show Deleted',
      defaultValue: false
    }
  ]
};
