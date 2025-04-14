// src/collections/project.js
export const project = {
  name: 'project',
  label: 'Projects',
  editRoute: (id) => `/dashboard/projects/${id}/edit`,
  fields: [
    {
      name: 'title',
      label: 'Title',
      width: '250px',
      clickable: true
    },
    {
      name: 'start_date',
      label: 'Start Date',
      width: '150px',
      type: 'date'
    },
    {
      name: 'status',
      label: 'Status',
      width: '150px',
      type: 'status'
    },
    {
      name: 'status_toggle',
      label: 'Done',
      width: '75px',
      type: 'toggle'
    },
    {
      name: 'edit',
      label: 'Edit',
      width: '100px',
      align: 'right',
      type: 'iconLink'
    }
  ],
  filters: [
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      options: ['todo', 'in_progress', 'complete']
    }
  ]
};
