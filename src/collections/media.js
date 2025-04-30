// /collections/media.js (or wherever your media config is)
export const media = {
  name: 'media',
  label: 'Media',
  fields: [
    {
      name: 'url',
      label: 'URL',
      type: 'text'
    },
    {
      name: 'alt_text',
      label: 'Alt Text',
      type: 'text'
    },
    {
      name: 'copyright',
      label: 'Copyright',
      type: 'text'
    },
    {
      name: 'company_id',
      label: 'Company',
      type: 'relationship',
      relation: {
        table: 'company',
        labelField: 'title'
      }
    },
    {
      name: 'project_id',
      label: 'Project',
      type: 'relationship',
      relation: {
        table: 'project',
        labelField: 'title'
      }
    },
    {
      name: 'created_at',
      label: 'Created At',
      type: 'date'
    }
  ]
};