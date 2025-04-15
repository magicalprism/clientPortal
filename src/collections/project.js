// src/collections/project.js
export const project = {
  name: 'project',
  label: 'Projects',
  editPathPrefix: '/dashboard/project',
  fields: [
    {
      name: 'title',
      label: 'Title',
      width: '250px',
      clickable: true,
      openMode: 'modal'
    },
    {
      name: 'start_date',
      label: 'Start Date',
      width: '150px',
      type: 'date',
      includeInViews: ['modal']
    },
    {
      name: 'status',
      label: 'Status',
      width: '150px',
      type: 'status'
    },
    {
        name: 'edit',
        label: 'Edit',
        width: '100px',
        align: 'right',
        type: 'editButton',
        exclude: true,
        openMode: 'page' // 👈 override, optional
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
